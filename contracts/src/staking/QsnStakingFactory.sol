// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {QsnStakingPool} from "./QsnStakingPool.sol";

/// @title QsnStakingFactory — Deploys open staking pools for any token pair
/// @notice Anyone can create a pool by paying a creation fee in ETH.
///         The factory takes a percentage cut of reward tokens as a platform fee.
contract QsnStakingFactory is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ───── Fee configuration ─────

    /// @notice ETH fee required to create a new pool
    uint256 public createPoolFeeETH;

    /// @notice Platform cut of reward tokens in basis points (e.g. 200 = 2 %)
    uint256 public platformRewardFeeBps;

    uint256 private constant BPS_DENOMINATOR = 10_000;

    /// @notice Recipient of collected fees
    address public feeRecipient;

    // ───── Pool tracking ─────

    /// @notice All pools ever created, in order
    address[] public allPools;

    /// @notice stakeToken => rewardToken => pool addresses
    mapping(address => mapping(address => address[])) public getPools;

    /// @notice creator => pool addresses
    mapping(address => address[]) public creatorPools;

    /// @notice Quick membership check
    mapping(address => bool) public isPool;

    // ───── Events ─────

    event PoolCreated(
        address indexed pool,
        address indexed stakeToken,
        address indexed rewardToken,
        address creator,
        uint256 rewardAmount,
        uint256 durationDays
    );
    event CreatePoolFeeUpdated(uint256 newFee);
    event PlatformRewardFeeUpdated(uint256 newFeeBps);
    event FeeRecipientUpdated(address newRecipient);

    // ───── Errors ─────

    error InsufficientETHFee(uint256 sent, uint256 required);
    error ZeroAddress();
    error ZeroAmount();
    error ZeroDuration();
    error InvalidFeeBps(uint256 bps);
    error SameToken();
    error ETHTransferFailed();

    // ───── Constructor ─────

    /// @param _owner        Contract owner (manages fees)
    /// @param _feeRecipient Address that receives ETH and reward-token fees
    constructor(address _owner, address _feeRecipient) Ownable(_owner) {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        feeRecipient = _feeRecipient;
        createPoolFeeETH = 0.01 ether;
        platformRewardFeeBps = 200; // 2 %
    }

    // ───── Pool creation ─────

    /// @notice Deploy a new staking pool and seed it with reward tokens
    /// @param stakeToken      Token users will stake
    /// @param rewardToken     Token distributed as rewards
    /// @param rewardAmount    Total reward tokens to distribute
    /// @param durationDays    Reward distribution duration in days
    /// @param minStake        Minimum stake amount per deposit (0 = no minimum)
    /// @param maxStakePerUser Maximum total stake per user (0 = unlimited)
    /// @return pool           Address of the newly created QsnStakingPool
    function createPool(
        address stakeToken,
        address rewardToken,
        uint256 rewardAmount,
        uint256 durationDays,
        uint256 minStake,
        uint256 maxStakePerUser
    ) external payable nonReentrant returns (address pool) {
        // ── Validation ──
        if (stakeToken == address(0) || rewardToken == address(0)) revert ZeroAddress();
        if (rewardAmount == 0) revert ZeroAmount();
        if (durationDays == 0) revert ZeroDuration();
        if (msg.value < createPoolFeeETH) revert InsufficientETHFee(msg.value, createPoolFeeETH);

        uint256 durationSeconds = durationDays * 1 days;

        // ── Platform reward cut ──
        uint256 platformCut = (rewardAmount * platformRewardFeeBps) / BPS_DENOMINATOR;
        uint256 netReward = rewardAmount - platformCut;

        // ── Deploy pool ──
        QsnStakingPool newPool = new QsnStakingPool(
            stakeToken,
            rewardToken,
            address(this), // factory
            msg.sender,    // creator
            durationSeconds,
            minStake,
            maxStakePerUser
        );
        pool = address(newPool);

        // ── Register ──
        allPools.push(pool);
        getPools[stakeToken][rewardToken].push(pool);
        creatorPools[msg.sender].push(pool);
        isPool[pool] = true;

        // ── Transfer reward tokens: platform cut to feeRecipient, rest to pool ──
        IERC20(rewardToken).safeTransferFrom(msg.sender, address(this), rewardAmount);

        if (platformCut > 0) {
            IERC20(rewardToken).safeTransfer(feeRecipient, platformCut);
        }

        // Approve pool to pull net reward via notifyRewardAmount
        IERC20(rewardToken).approve(pool, netReward);
        newPool.notifyRewardAmount(netReward);

        // ── Forward ETH creation fee ──
        if (createPoolFeeETH > 0) {
            (bool ok,) = feeRecipient.call{value: createPoolFeeETH}("");
            if (!ok) revert ETHTransferFailed();
        }

        // ── Refund excess ETH (F5) ──
        uint256 excess = msg.value - createPoolFeeETH;
        if (excess > 0) {
            (bool refundOk,) = msg.sender.call{value: excess}("");
            if (!refundOk) revert ETHTransferFailed();
        }

        emit PoolCreated(pool, stakeToken, rewardToken, msg.sender, netReward, durationDays);
    }

    // ───── View helpers ─────

    /// @notice Total number of pools created
    function allPoolsLength() external view returns (uint256) {
        return allPools.length;
    }

    /// @notice Number of pools for a specific stakeToken/rewardToken pair
    function getPoolsLength(address stakeToken, address rewardToken) external view returns (uint256) {
        return getPools[stakeToken][rewardToken].length;
    }

    /// @notice Number of pools created by a specific address
    function creatorPoolsLength(address _creator) external view returns (uint256) {
        return creatorPools[_creator].length;
    }

    // ───── Owner admin ─────

    /// @notice Update the ETH creation fee
    function setCreatePoolFee(uint256 newFee) external onlyOwner {
        createPoolFeeETH = newFee;
        emit CreatePoolFeeUpdated(newFee);
    }

    /// @notice Update the platform reward fee (in bps, max 1000 = 10 %)
    function setPlatformRewardFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > 1_000) revert InvalidFeeBps(newFeeBps);
        platformRewardFeeBps = newFeeBps;
        emit PlatformRewardFeeUpdated(newFeeBps);
    }

    /// @notice Update the fee recipient address
    function setFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert ZeroAddress();
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }
}
