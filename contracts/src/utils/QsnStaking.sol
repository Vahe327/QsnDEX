// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";

/// @title Qsn Staking — Liquidity mining / farming
/// @notice Users stake LP tokens to earn reward tokens over time
/// @dev Based on Synthetix StakingRewards pattern
contract QsnStaking {
    address public owner;
    address public pendingOwner;
    address public immutable stakingToken; // LP token
    address public immutable rewardToken;

    uint256 public rewardRate;           // Rewards distributed per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public periodFinish;
    uint256 public totalStaked;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public balances;

    // Reentrancy lock
    uint256 private _locked = 1;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardAdded(uint256 reward, uint256 duration);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "QsnStaking: NOT_OWNER");
        _;
    }

    modifier nonReentrant() {
        require(_locked == 1, "QsnStaking: REENTRANT");
        _locked = 2;
        _;
        _locked = 1;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    constructor(address _stakingToken, address _rewardToken) {
        require(_stakingToken != _rewardToken, "QsnStaking: SAME_TOKEN");
        owner = msg.sender;
        stakingToken = _stakingToken;
        rewardToken = _rewardToken;
    }

    /// @notice Returns the last time rewards are applicable (current time or period end)
    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    /// @notice Calculates accumulated reward per token staked
    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored + (
            (lastTimeRewardApplicable() - lastUpdateTime) * rewardRate * 1e18 / totalStaked
        );
    }

    /// @notice Calculates pending reward for an account
    function earned(address account) public view returns (uint256) {
        return (
            balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18
        ) + rewards[account];
    }

    /// @notice Stake LP tokens to start earning rewards
    /// @param amount Amount of LP tokens to stake
    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "QsnStaking: ZERO_AMOUNT");
        totalStaked += amount;
        balances[msg.sender] += amount;
        _safeTransferFrom(stakingToken, msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    /// @notice Withdraw staked LP tokens
    /// @param amount Amount to withdraw
    function withdraw(uint256 amount) public nonReentrant updateReward(msg.sender) {
        _withdraw(amount);
    }

    function _withdraw(uint256 amount) internal {
        require(amount > 0, "QsnStaking: ZERO_AMOUNT");
        require(balances[msg.sender] >= amount, "QsnStaking: INSUFFICIENT_BALANCE");
        totalStaked -= amount;
        balances[msg.sender] -= amount;
        _safeTransfer(stakingToken, msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function getReward() public nonReentrant updateReward(msg.sender) {
        _getReward();
    }

    function _getReward() internal {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            _safeTransfer(rewardToken, msg.sender, reward);
            emit RewardPaid(msg.sender, reward);
        }
    }

    function exit() external nonReentrant updateReward(msg.sender) {
        _withdraw(balances[msg.sender]);
        _getReward();
    }

    /// @notice Set the reward amount and duration (owner only)
    /// @param reward Total reward tokens for the period
    /// @param duration Duration in seconds
    function notifyRewardAmount(uint256 reward, uint256 duration) external onlyOwner updateReward(address(0)) {
        require(duration > 0, "QsnStaking: ZERO_DURATION");
        require(reward > 0, "QsnStaking: ZERO_REWARD");
        require(totalStaked > 0, "QsnStaking: NO_STAKERS");

        // Transfer reward tokens from owner to contract
        _safeTransferFrom(rewardToken, msg.sender, address(this), reward);

        if (block.timestamp >= periodFinish) {
            rewardRate = reward / duration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / duration;
        }

        require(rewardRate > 0, "QsnStaking: REWARD_RATE_ZERO");

        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + duration;

        emit RewardAdded(reward, duration);
    }

    /// @notice Rescue unallocated reward tokens (rounding dust or rewards emitted while totalStaked was 0)
    /// @dev Only callable by the owner after the current reward period has ended.
    function rescueUnallocatedRewards(address to) external onlyOwner nonReentrant {
        require(block.timestamp >= periodFinish, "QsnStaking: PERIOD_NOT_FINISHED");
        require(to != address(0), "QsnStaking: ZERO_ADDRESS");

        uint256 rewardBalance = IERC20(rewardToken).balanceOf(address(this));
        uint256 rescuable;
        if (stakingToken == rewardToken) {
            rescuable = rewardBalance > totalStaked ? rewardBalance - totalStaked : 0;
        } else {
            rescuable = rewardBalance;
        }
        require(rescuable > 0, "QsnStaking: NOTHING_TO_RESCUE");
        _safeTransfer(rewardToken, to, rescuable);
    }

    /// @notice Get remaining reward tokens in this contract
    function rewardsRemaining() external view returns (uint256) {
        if (block.timestamp >= periodFinish) return 0;
        return (periodFinish - block.timestamp) * rewardRate;
    }

    /// @notice Get staking info for a user
    function userInfo(address account) external view returns (
        uint256 staked,
        uint256 pendingReward,
        uint256 _totalStaked,
        uint256 _rewardRate,
        uint256 _periodFinish
    ) {
        staked = balances[account];
        pendingReward = earned(account);
        _totalStaked = totalStaked;
        _rewardRate = rewardRate;
        _periodFinish = periodFinish;
    }

    /// @notice Begin two-step ownership transfer
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "QsnStaking: ZERO_ADDRESS");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Accept ownership transfer (must be called by pendingOwner)
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "QsnStaking: NOT_PENDING_OWNER");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    // --- Internal helpers ---

    function _safeTransfer(address token, address to, uint256 value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "QsnStaking: TRANSFER_FAILED");
    }

    function _safeTransferFrom(address token, address from, address to, uint256 value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "QsnStaking: TRANSFER_FROM_FAILED");
    }
}
