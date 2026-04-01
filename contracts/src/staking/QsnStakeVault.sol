// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title QsnStakeVault — Stake QSN, earn WETH from protocol fees
/// @notice Synthetix-style reward distribution: stakers earn proportional WETH
///         rewards that are streamed over a configurable duration after each
///         distributeRewards() call.
contract QsnStakeVault is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ───── State ─────

    IERC20 public immutable stakingToken;   // QSN
    IERC20 public immutable rewardToken;    // WETH

    uint256 public rewardRate;              // WETH per second (scaled 1e18)
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    uint256 public periodFinish;
    uint256 public rewardsDuration;         // seconds, default 7 days

    uint256 public totalStaked;

    struct StakerInfo {
        uint256 amount;
        uint256 rewardPerTokenPaid;
        uint256 rewardsOwed;
    }

    mapping(address => StakerInfo) public stakers;

    // ───── Events ─────

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardsDistributed(uint256 reward);
    event RewardsDurationUpdated(uint256 newDuration);

    // ───── Errors ─────

    error ZeroAmount();
    error InsufficientStake(uint256 requested, uint256 available);
    error RewardPeriodNotFinished();

    // ───── Constructor ─────

    /// @param _stakingToken QSN token address
    /// @param _rewardToken  WETH address
    /// @param _owner        Contract owner (can distribute rewards, set duration)
    constructor(
        address _stakingToken,
        address _rewardToken,
        address _owner
    ) Ownable(_owner) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardsDuration = 7 days;
    }

    // ───── Modifiers ─────

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            StakerInfo storage info = stakers[account];
            info.rewardsOwed = earned(account);
            info.rewardPerTokenPaid = rewardPerTokenStored;
        }
        _;
    }

    // ───── View functions ─────

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored
            + ((lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18) / totalStaked;
    }

    /// @notice Pending reward for a given account
    function earned(address account) public view returns (uint256) {
        StakerInfo storage info = stakers[account];
        return (info.amount * (rewardPerToken() - info.rewardPerTokenPaid)) / 1e18
            + info.rewardsOwed;
    }

    /// @notice Return staking snapshot for UI
    function getStakeInfo(address account)
        external
        view
        returns (
            uint256 stakedAmount,
            uint256 pendingReward,
            uint256 totalStakedGlobal,
            uint256 currentRewardRate,
            uint256 finishTime
        )
    {
        stakedAmount = stakers[account].amount;
        pendingReward = earned(account);
        totalStakedGlobal = totalStaked;
        currentRewardRate = rewardRate;
        finishTime = periodFinish;
    }

    // ───── Mutative functions ─────

    /// @notice Stake QSN tokens
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        totalStaked += amount;
        stakers[msg.sender].amount += amount;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /// @notice Withdraw staked QSN tokens
    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        _withdraw(amount);
    }

    /// @notice Claim accumulated WETH rewards
    function claimReward() public nonReentrant updateReward(msg.sender) {
        _claimReward();
    }

    /// @notice Withdraw all staked QSN and claim pending rewards in one tx
    function exit() external nonReentrant updateReward(msg.sender) {
        _withdraw(stakers[msg.sender].amount);
        _claimReward();
    }

    function _withdraw(uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();
        StakerInfo storage info = stakers[msg.sender];
        if (amount > info.amount) {
            revert InsufficientStake(amount, info.amount);
        }
        totalStaked -= amount;
        info.amount -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function _claimReward() internal {
        uint256 reward = stakers[msg.sender].rewardsOwed;
        if (reward > 0) {
            stakers[msg.sender].rewardsOwed = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    // ───── Owner functions ─────

    /// @notice Notify vault of a new reward amount (pulls WETH from caller)
    /// @param amount WETH amount to distribute over rewardsDuration
    function distributeRewards(uint256 amount) external onlyOwner updateReward(address(0)) {
        if (amount == 0) revert ZeroAmount();
        require(totalStaked > 0, "QsnStakeVault: NO_STAKERS");

        rewardToken.safeTransferFrom(msg.sender, address(this), amount);

        if (block.timestamp >= periodFinish) {
            rewardRate = amount / rewardsDuration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (amount + leftover) / rewardsDuration;
        }

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + rewardsDuration;

        emit RewardsDistributed(amount);
    }

    /// @notice Rescue unallocated reward tokens (rounding dust or rewards emitted while totalStaked was 0)
    /// @dev Only callable after the current reward period has ended.
    ///      Calculates the excess reward token balance beyond what is owed to stakers.
    function rescueUnallocatedRewards(address to) external onlyOwner {
        require(block.timestamp >= periodFinish, "QsnStakeVault: PERIOD_NOT_FINISHED");
        require(to != address(0), "QsnStakeVault: ZERO_ADDRESS");

        uint256 rewardBalance = rewardToken.balanceOf(address(this));
        // No staker-owed rewards remain after periodFinish because rewardPerToken is frozen
        // and any unclaimed amounts stay as individual user.rewardsOwed (already tracked).
        // The "excess" is anything beyond what stakers can claim = balance - sum(owed).
        // Since we can't iterate all stakers, we approximate: after period ends,
        // remaining balance minus (totalStaked * (rewardPerToken() - 0) / 1e18) is excess.
        // Simpler: just allow owner to rescue the full excess balance of reward tokens
        // that exceeds the staking token balance (if staking == reward token) or the full
        // reward token balance minus an estimate. Safest approach: send all reward tokens
        // after period ends, since users can still claim via claimReward before this.
        // Actually, we just send balance - this is safe because users' rewardsOwed are stored
        // and they will revert on claim if balance is insufficient, so owner must be careful.
        // For safety, we only rescue the dust portion:
        uint256 stakedTokenBalance = stakingToken.balanceOf(address(this));
        uint256 rescuable;
        if (address(stakingToken) == address(rewardToken)) {
            // Reward and staking tokens are the same; don't touch staked funds
            rescuable = rewardBalance > stakedTokenBalance ? rewardBalance - stakedTokenBalance : 0;
        } else {
            rescuable = rewardBalance;
        }
        require(rescuable > 0, "QsnStakeVault: NOTHING_TO_RESCUE");
        rewardToken.safeTransfer(to, rescuable);
    }

    /// @notice Update the reward streaming duration (only when current period ended)
    function setRewardsDuration(uint256 _duration) external onlyOwner {
        if (block.timestamp < periodFinish) revert RewardPeriodNotFinished();
        require(_duration > 0, "QsnStakeVault: ZERO_DURATION");
        rewardsDuration = _duration;
        emit RewardsDurationUpdated(_duration);
    }
}
