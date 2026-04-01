// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IQsnRouter {
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        uint24[] calldata fees,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        uint24[] calldata fees,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function WETH() external view returns (address);

    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path,
        uint24[] calldata fees
    ) external view returns (uint256[] memory amounts);
}

/// @title QsnBatchSwap
/// @notice Execute multiple swaps in a single transaction to save gas
/// @dev Uses the QsnDEX Router for each individual swap within the batch
contract QsnBatchSwap is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IQsnRouter public immutable router;
    address public immutable WETH;

    /// @notice Order structure for batch swaps
    /// @param tokenOut Target token address
    /// @param percentage Percentage of input amount in basis points (10000 = 100%)
    /// @param amountOutMin Minimum output amount for slippage protection
    /// @param path Swap path through pools
    struct SwapOrder {
        address tokenOut;
        uint256 percentage;
        uint256 amountOutMin;
        address[] path;
        uint24[] fees;
    }

    /// @notice Emitted when a batch swap is executed
    event BatchSwapExecuted(
        address indexed user,
        address tokenIn,
        uint256 totalAmountIn,
        uint256 ordersCount
    );

    /// @notice Emitted for each individual swap within a batch
    event SingleSwapExecuted(
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    /// @param _router Address of the QsnDEX Router contract
    constructor(address _router) {
        require(_router != address(0), "QsnBatchSwap: zero router");
        router = IQsnRouter(_router);
        WETH = router.WETH();
    }

    /// @notice Execute multiple swaps from ETH in one transaction
    /// @param orders Array of swap orders with percentages and minimum outputs
    /// @param deadline Transaction deadline timestamp
    function batchSwapFromETH(
        SwapOrder[] calldata orders,
        uint256 deadline
    ) external payable nonReentrant {
        require(msg.value > 0, "QsnBatchSwap: no ETH sent");
        require(orders.length > 0 && orders.length <= 10, "QsnBatchSwap: invalid orders count");
        require(block.timestamp <= deadline, "QsnBatchSwap: expired");

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].tokenOut != address(0), "QsnBatchSwap: zero tokenOut");
            require(orders[i].path.length >= 2, "QsnBatchSwap: invalid path");
            require(orders[i].path[0] == WETH, "QsnBatchSwap: path must start with WETH");
            require(
                orders[i].path[orders[i].path.length - 1] == orders[i].tokenOut,
                "QsnBatchSwap: path must end with tokenOut"
            );
            totalPercentage += orders[i].percentage;
        }
        require(totalPercentage == 10000, "QsnBatchSwap: percentages must sum to 100%");

        uint256 totalSpent = 0;

        for (uint256 i = 0; i < orders.length; i++) {
            uint256 amountIn;
            if (i == orders.length - 1) {
                amountIn = msg.value - totalSpent;
            } else {
                amountIn = (msg.value * orders[i].percentage) / 10000;
                totalSpent += amountIn;
            }

            if (amountIn > 0) {
                uint256[] memory amounts = router.swapExactETHForTokens{value: amountIn}(
                    orders[i].amountOutMin,
                    orders[i].path,
                    orders[i].fees,
                    msg.sender,
                    deadline
                );

                emit SingleSwapExecuted(
                    msg.sender,
                    WETH,
                    orders[i].tokenOut,
                    amountIn,
                    amounts[amounts.length - 1]
                );
            }
        }

        // Refund any dust ETH remaining
        uint256 remaining = address(this).balance;
        if (remaining > 0) {
            (bool success, ) = msg.sender.call{value: remaining}("");
            require(success, "QsnBatchSwap: ETH refund failed");
        }

        emit BatchSwapExecuted(msg.sender, WETH, msg.value, orders.length);
    }

    /// @notice Execute multiple swaps from an ERC20 token in one transaction
    /// @param tokenIn Input token address
    /// @param totalAmountIn Total amount of input token
    /// @param orders Array of swap orders with percentages and minimum outputs
    /// @param deadline Transaction deadline timestamp
    function batchSwapFromToken(
        address tokenIn,
        uint256 totalAmountIn,
        SwapOrder[] calldata orders,
        uint256 deadline
    ) external nonReentrant {
        require(tokenIn != address(0), "QsnBatchSwap: zero tokenIn");
        require(totalAmountIn > 0, "QsnBatchSwap: zero amount");
        require(orders.length > 0 && orders.length <= 10, "QsnBatchSwap: invalid orders count");
        require(block.timestamp <= deadline, "QsnBatchSwap: expired");

        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].tokenOut != address(0), "QsnBatchSwap: zero tokenOut");
            require(orders[i].path.length >= 2, "QsnBatchSwap: invalid path");
            require(orders[i].path[0] == tokenIn, "QsnBatchSwap: path must start with tokenIn");
            require(
                orders[i].path[orders[i].path.length - 1] == orders[i].tokenOut,
                "QsnBatchSwap: path must end with tokenOut"
            );
            totalPercentage += orders[i].percentage;
        }
        require(totalPercentage == 10000, "QsnBatchSwap: percentages must sum to 100%");

        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), totalAmountIn);
        IERC20(tokenIn).forceApprove(address(router), totalAmountIn);

        uint256 totalSpent = 0;

        for (uint256 i = 0; i < orders.length; i++) {
            uint256 amountIn;
            if (i == orders.length - 1) {
                amountIn = totalAmountIn - totalSpent;
            } else {
                amountIn = (totalAmountIn * orders[i].percentage) / 10000;
                totalSpent += amountIn;
            }

            if (amountIn > 0) {
                uint256[] memory amounts = router.swapExactTokensForTokens(
                    amountIn,
                    orders[i].amountOutMin,
                    orders[i].path,
                    orders[i].fees,
                    msg.sender,
                    deadline
                );

                emit SingleSwapExecuted(
                    msg.sender,
                    tokenIn,
                    orders[i].tokenOut,
                    amountIn,
                    amounts[amounts.length - 1]
                );
            }
        }

        // Refund any dust tokenIn remaining
        uint256 remaining = IERC20(tokenIn).balanceOf(address(this));
        if (remaining > 0) {
            IERC20(tokenIn).safeTransfer(msg.sender, remaining);
        }

        emit BatchSwapExecuted(msg.sender, tokenIn, totalAmountIn, orders.length);
    }

    /// @notice Get estimated outputs for a batch of swap orders from ETH
    /// @param ethAmount Total ETH amount
    /// @param orders Array of swap orders
    /// @return amountsOut Estimated output amounts for each order
    function getBatchQuoteFromETH(
        uint256 ethAmount,
        SwapOrder[] calldata orders
    ) external view returns (uint256[] memory amountsOut) {
        amountsOut = new uint256[](orders.length);
        uint256 totalSpent = 0;

        for (uint256 i = 0; i < orders.length; i++) {
            uint256 amountIn;
            if (i == orders.length - 1) {
                amountIn = ethAmount - totalSpent;
            } else {
                amountIn = (ethAmount * orders[i].percentage) / 10000;
                totalSpent += amountIn;
            }

            if (amountIn > 0) {
                uint256[] memory amounts = router.getAmountsOut(amountIn, orders[i].path, orders[i].fees);
                amountsOut[i] = amounts[amounts.length - 1];
            }
        }
    }

    /// @notice Get estimated outputs for a batch of swap orders from ERC20
    /// @param totalAmountIn Total input token amount
    /// @param orders Array of swap orders
    /// @return amountsOut Estimated output amounts for each order
    function getBatchQuoteFromToken(
        uint256 totalAmountIn,
        SwapOrder[] calldata orders
    ) external view returns (uint256[] memory amountsOut) {
        amountsOut = new uint256[](orders.length);
        uint256 totalSpent = 0;

        for (uint256 i = 0; i < orders.length; i++) {
            uint256 amountIn;
            if (i == orders.length - 1) {
                amountIn = totalAmountIn - totalSpent;
            } else {
                amountIn = (totalAmountIn * orders[i].percentage) / 10000;
                totalSpent += amountIn;
            }

            if (amountIn > 0) {
                uint256[] memory amounts = router.getAmountsOut(amountIn, orders[i].path, orders[i].fees);
                amountsOut[i] = amounts[amounts.length - 1];
            }
        }
    }

    /// @notice Accept ETH sent directly to the contract
    receive() external payable {}
}
