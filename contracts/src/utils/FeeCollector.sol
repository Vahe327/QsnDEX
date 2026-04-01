// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";
import "../interfaces/IQsnPair.sol";
import "../interfaces/IQsnFactory.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Qsn Fee Collector — Protocol fee collection and distribution
/// @notice Collects protocol fees from pairs and allows owner to withdraw
contract FeeCollector is ReentrancyGuard {
    address public owner;
    address public pendingOwner;
    address public immutable factory;
    address public stakeVault;
    address public weth;

    event FeesCollected(address indexed pair, uint256 amount0, uint256 amount1);
    event FeesWithdrawn(address indexed token, address indexed to, uint256 amount);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event StakeVaultUpdated(address indexed newVault);
    event WETHUpdated(address indexed newWeth);
    event DistributedAll(uint256 ethWrapped, uint256 wethSent);

    modifier onlyOwner() {
        require(msg.sender == owner, "FeeCollector: NOT_OWNER");
        _;
    }

    constructor(address _factory, address _weth) {
        owner = msg.sender;
        factory = _factory;
        weth = _weth;
    }

    /// @notice Collect accumulated protocol fees from a pair
    /// @param pair Address of the pair contract to collect fees from
    function collectFees(address pair) external nonReentrant {
        require(pair != address(0), "FeeCollector: ZERO_ADDRESS");

        address token0 = IQsnPair(pair).token0();
        address token1 = IQsnPair(pair).token1();

        uint256 balance0Before = IERC20(token0).balanceOf(address(this));
        uint256 balance1Before = IERC20(token1).balanceOf(address(this));

        // Skim excess tokens from the pair (difference between balance and reserves)
        IQsnPair(pair).skim(address(this));

        uint256 amount0 = IERC20(token0).balanceOf(address(this)) - balance0Before;
        uint256 amount1 = IERC20(token1).balanceOf(address(this)) - balance1Before;

        if (amount0 > 0 || amount1 > 0) {
            emit FeesCollected(pair, amount0, amount1);
        }
    }

    /// @notice Batch collect fees from multiple pairs
    /// @param pairs Array of pair addresses
    function collectFeesMultiple(address[] calldata pairs) external nonReentrant {
        for (uint256 i = 0; i < pairs.length; i++) {
            address pair = pairs[i];
            if (pair == address(0)) continue;

            address token0 = IQsnPair(pair).token0();
            address token1 = IQsnPair(pair).token1();

            uint256 balance0Before = IERC20(token0).balanceOf(address(this));
            uint256 balance1Before = IERC20(token1).balanceOf(address(this));

            IQsnPair(pair).skim(address(this));

            uint256 amount0 = IERC20(token0).balanceOf(address(this)) - balance0Before;
            uint256 amount1 = IERC20(token1).balanceOf(address(this)) - balance1Before;

            if (amount0 > 0 || amount1 > 0) {
                emit FeesCollected(pair, amount0, amount1);
            }
        }
    }

    /// @notice Withdraw collected fees
    /// @param token Token address to withdraw
    /// @param to Recipient address
    /// @param amount Amount to withdraw
    function withdraw(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "FeeCollector: ZERO_ADDRESS");
        require(amount > 0, "FeeCollector: ZERO_AMOUNT");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "FeeCollector: INSUFFICIENT_BALANCE");

        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "FeeCollector: TRANSFER_FAILED");
        emit FeesWithdrawn(token, to, amount);
    }

    /// @notice Withdraw all of a specific token
    /// @param token Token address
    /// @param to Recipient address
    function withdrawAll(address token, address to) external onlyOwner {
        require(to != address(0), "FeeCollector: ZERO_ADDRESS");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "FeeCollector: NO_BALANCE");

        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20.transfer.selector, to, balance)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "FeeCollector: TRANSFER_FAILED");
        emit FeesWithdrawn(token, to, balance);
    }

    /// @notice Withdraw ETH (in case any is sent directly)
    function withdrawETH(address to) external onlyOwner {
        require(to != address(0), "FeeCollector: ZERO_ADDRESS");
        uint256 balance = address(this).balance;
        require(balance > 0, "FeeCollector: NO_ETH_BALANCE");
        (bool success,) = to.call{value: balance}("");
        require(success, "FeeCollector: ETH_TRANSFER_FAILED");
    }

    /// @notice Send a specific token balance to a QsnStakeVault for staker rewards
    /// @param token      The reward token (e.g. WETH) to forward
    /// @param _vault Address of the QsnStakeVault contract
    /// @param amount     Amount to distribute (must be <= balance)
    function distributeToStakers(address token, address _vault, uint256 amount) external onlyOwner nonReentrant {
        require(_vault != address(0), "FeeCollector: ZERO_ADDRESS");
        require(amount > 0, "FeeCollector: ZERO_AMOUNT");
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance >= amount, "FeeCollector: INSUFFICIENT_BALANCE");

        // Approve the vault so it can pull via distributeRewards
        (bool approveSuccess, bytes memory approveData) = token.call(
            abi.encodeWithSelector(IERC20.approve.selector, _vault, amount)
        );
        require(
            approveSuccess && (approveData.length == 0 || abi.decode(approveData, (bool))),
            "FeeCollector: APPROVE_FAILED"
        );

        // Call distributeRewards on the vault (it will transferFrom)
        (bool distSuccess,) = _vault.call(
            abi.encodeWithSignature("distributeRewards(uint256)", amount)
        );
        require(distSuccess, "FeeCollector: DISTRIBUTE_FAILED");

        emit FeesWithdrawn(token, _vault, amount);
    }

    /// @notice Set the stakeVault address for distributeAll
    function setStakeVault(address _stakeVault) external onlyOwner {
        require(_stakeVault != address(0), "FeeCollector: ZERO_ADDRESS");
        stakeVault = _stakeVault;
        emit StakeVaultUpdated(_stakeVault);
    }

    /// @notice Set the WETH address
    function setWETH(address _weth) external onlyOwner {
        require(_weth != address(0), "FeeCollector: ZERO_ADDRESS");
        weth = _weth;
        emit WETHUpdated(_weth);
    }

    /// @notice Wrap all ETH balance to WETH and send entire WETH balance to stakeVault
    ///         via distributeRewards (the vault pulls tokens through transferFrom).
    function distributeAll() external onlyOwner nonReentrant {
        require(stakeVault != address(0), "FeeCollector: STAKE_VAULT_NOT_SET");
        require(weth != address(0), "FeeCollector: WETH_NOT_SET");

        // Wrap any raw ETH held by this contract
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            (bool depositOk,) = weth.call{value: ethBalance}(
                abi.encodeWithSignature("deposit()")
            );
            require(depositOk, "FeeCollector: WETH_DEPOSIT_FAILED");
        }

        // Send all WETH to stakeVault via distributeRewards
        uint256 wethBalance = IERC20(weth).balanceOf(address(this));
        require(wethBalance > 0, "FeeCollector: NO_WETH_BALANCE");

        // Approve the vault so it can pull via distributeRewards
        (bool approveSuccess, bytes memory approveData) = weth.call(
            abi.encodeWithSelector(IERC20.approve.selector, stakeVault, wethBalance)
        );
        require(
            approveSuccess && (approveData.length == 0 || abi.decode(approveData, (bool))),
            "FeeCollector: APPROVE_FAILED"
        );

        // Call distributeRewards on the vault (it will transferFrom)
        (bool distSuccess,) = stakeVault.call(
            abi.encodeWithSignature("distributeRewards(uint256)", wethBalance)
        );
        require(distSuccess, "FeeCollector: DISTRIBUTE_FAILED");

        emit DistributedAll(ethBalance, wethBalance);
    }

    /// @notice Begin two-step ownership transfer
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "FeeCollector: ZERO_ADDRESS");
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Accept ownership transfer (must be called by pendingOwner)
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "FeeCollector: NOT_PENDING_OWNER");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    receive() external payable {}
}
