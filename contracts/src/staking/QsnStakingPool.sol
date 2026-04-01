// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title QsnStakingPool — Synthetix-style open staking pool (stake tokenA, earn tokenB)
/// @notice Created by QsnStakingFactory. Rewards are streamed over a configurable duration.
contract QsnStakingPool is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ───── State ─────

    IERC20 public immutable stakeToken;
    IERC20 public immutable rewardToken;
    address public immutable factory;
    address public immutable creator;

    uint256 public rewardRate;
    uint256 public rewardPerTokenStored;
    uint256 public lastUpdateTime;
    uint256 public periodFinish;
    uint256 public duration; // seconds

    uint256 public minStake;
    uint256 public maxStakePerUser;

    uint256 public totalStaked;
    uint256 public stakerCount;

    struct UserInfo {
        uint256 amount;
        uint256 rewardPerTokenPaid;
        uint256 rewardsOwed;
    }

    mapping(address => UserInfo) public users;

    // ───── Events ─────

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);
    event RewardAdded(uint256 reward);

    // ───── Errors ─────

    error ZeroAmount();
    error BelowMinStake(uint256 amount, uint256 minRequired);
    error ExceedsMaxStake(uint256 newTotal, uint256 maxAllowed);
    error InsufficientStake(uint256 requested, uint256 available);
    error OnlyFactory();

    // ───── Constructor ─────

    /// @param _stakeToken     Token users stake
    /// @param _rewardToken    Token distributed as rewards
    /// @param _factory        Factory address (only caller for notifyRewardAmount)
    /// @param _creator        Address that created this pool
    /// @param _duration       Reward distribution duration in seconds
    /// @param _minStake       Minimum stake amount per deposit
    /// @param _maxStakePerUser Maximum total stake per user (0 = unlimited)
    constructor(
        address _stakeToken,
        address _rewardToken,
        address _factory,
        address _creator,
        uint256 _duration,
        uint256 _minStake,
        uint256 _maxStakePerUser
    ) {
        stakeToken = IERC20(_stakeToken);
        rewardToken = IERC20(_rewardToken);
        factory = _factory;
        creator = _creator;
        duration = _duration;
        minStake = _minStake;
        maxStakePerUser = _maxStakePerUser;
    }

    // ───── Modifiers ─────

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            UserInfo storage info = users[account];
            info.rewardsOwed = earned(account);
            info.rewardPerTokenPaid = rewardPerTokenStored;
        }
        _;
    }

    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
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
        UserInfo storage info = users[account];
        return (info.amount * (rewardPerToken() - info.rewardPerTokenPaid)) / 1e18
            + info.rewardsOwed;
    }

    /// @notice Returns pool summary for UI rendering
    function getPoolInfo()
        external
        view
        returns (
            address _stakeToken,
            address _rewardToken,
            uint256 _totalStaked,
            uint256 _rewardRate,
            uint256 _periodFinish,
            uint256 _duration,
            uint256 _minStake,
            uint256 _maxStakePerUser,
            address _creator,
            uint256 _stakerCount
        )
    {
        _stakeToken = address(stakeToken);
        _rewardToken = address(rewardToken);
        _totalStaked = totalStaked;
        _rewardRate = rewardRate;
        _periodFinish = periodFinish;
        _duration = duration;
        _minStake = minStake;
        _maxStakePerUser = maxStakePerUser;
        _creator = creator;
        _stakerCount = stakerCount;
    }

    /// @notice Returns a user's staking snapshot
    function getUserInfo(address account)
        external
        view
        returns (
            uint256 stakedAmount,
            uint256 pendingReward,
            uint256 totalStakedGlobal
        )
    {
        stakedAmount = users[account].amount;
        pendingReward = earned(account);
        totalStakedGlobal = totalStaked;
    }

    /// @notice Remaining undistributed rewards still held by this contract
    function remainingRewards() external view returns (uint256) {
        if (block.timestamp >= periodFinish) return 0;
        uint256 remaining = periodFinish - block.timestamp;
        return remaining * rewardRate;
    }

    /// @notice Estimated APR in basis points (annualized raw token ratio, NOT USD-denominated)
    /// @dev Returns the annualized ratio of reward tokens to staked tokens in basis points.
    ///      Example: 5000 = the pool distributes 50% of the staked amount per year in reward tokens.
    ///      WARNING: This does NOT account for differing token decimals or token prices.
    ///      If stakeToken has 6 decimals and rewardToken has 18 decimals, the result is NOT
    ///      directly comparable. Off-chain price feeds are needed for accurate USD APR.
    ///      Returns 0 when no tokens are staked or the reward period has ended.
    function estimatedAPRBps() external view returns (uint256) {
        if (totalStaked == 0 || block.timestamp >= periodFinish) return 0;
        uint256 annualReward = rewardRate * 365 days;
        return (annualReward * 10_000) / totalStaked;
    }

    // ───── Mutative functions ─────

    /// @notice Stake tokens into the pool
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        if (amount < minStake) revert BelowMinStake(amount, minStake);

        UserInfo storage info = users[msg.sender];
        uint256 newUserTotal = info.amount + amount;
        if (maxStakePerUser > 0 && newUserTotal > maxStakePerUser) {
            revert ExceedsMaxStake(newUserTotal, maxStakePerUser);
        }

        // Track unique stakers
        if (info.amount == 0) {
            stakerCount++;
        }

        totalStaked += amount;
        info.amount = newUserTotal;
        stakeToken.safeTransferFrom(msg.sender, address(this), amount);

        emit Staked(msg.sender, amount);
    }

    /// @notice Withdraw staked tokens
    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        _withdraw(amount);
    }

    /// @notice Claim accumulated rewards
    function claimReward() public nonReentrant updateReward(msg.sender) {
        _claimReward();
    }

    /// @notice Withdraw all staked tokens and claim pending rewards in one tx
    function exit() external nonReentrant updateReward(msg.sender) {
        _withdraw(users[msg.sender].amount);
        _claimReward();
    }

    function _withdraw(uint256 amount) internal {
        if (amount == 0) revert ZeroAmount();
        UserInfo storage info = users[msg.sender];
        if (amount > info.amount) {
            revert InsufficientStake(amount, info.amount);
        }
        totalStaked -= amount;
        info.amount -= amount;

        // Track unique stakers
        if (info.amount == 0) {
            stakerCount--;
        }

        stakeToken.safeTransfer(msg.sender, amount);

        emit Withdrawn(msg.sender, amount);
    }

    function _claimReward() internal {
        uint256 reward = users[msg.sender].rewardsOwed;
        if (reward > 0) {
            users[msg.sender].rewardsOwed = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    // ───── Factory-only ─────

    /// @notice Seed pool with reward tokens — callable only by factory
    /// @param amount Total reward tokens to distribute over `duration`
    /// @dev Note: notifyRewardAmount does not require totalStaked > 0 because the factory
    ///      calls this at pool creation time before any stakers exist. Any rewards emitted
    ///      while totalStaked == 0 are unallocated and can be recovered via rescueUnallocatedRewards().
    function notifyRewardAmount(uint256 amount) external onlyFactory updateReward(address(0)) {
        if (amount == 0) revert ZeroAmount();

        rewardToken.safeTransferFrom(msg.sender, address(this), amount);

        if (block.timestamp >= periodFinish) {
            rewardRate = amount / duration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (amount + leftover) / duration;
        }

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + duration;

        emit RewardAdded(amount);
    }

    /// @notice Rescue unallocated reward tokens (rounding dust or rewards emitted while totalStaked was 0)
    /// @dev Only callable by the pool creator after the current reward period has ended.
    function rescueUnallocatedRewards(address to) external {
        require(msg.sender == creator, "QsnStakingPool: ONLY_CREATOR");
        require(block.timestamp >= periodFinish, "QsnStakingPool: PERIOD_NOT_FINISHED");
        require(to != address(0), "QsnStakingPool: ZERO_ADDRESS");

        uint256 rewardBalance = rewardToken.balanceOf(address(this));
        uint256 rescuable;
        if (address(stakeToken) == address(rewardToken)) {
            uint256 stakedTokenBalance = totalStaked;
            rescuable = rewardBalance > stakedTokenBalance ? rewardBalance - stakedTokenBalance : 0;
        } else {
            rescuable = rewardBalance;
        }
        require(rescuable > 0, "QsnStakingPool: NOTHING_TO_RESCUE");
        rewardToken.safeTransfer(to, rescuable);
    }
}
