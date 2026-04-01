// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IERC20.sol";
import "../interfaces/IQsnRouter.sol";
import "../interfaces/IQsnFactory.sol";

/// @title Qsn Limit Orders — On-chain limit order book
/// @notice Users place limit orders; keepers execute them when price conditions are met
contract QsnLimitOrder {
    struct Order {
        address owner;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 minAmountOut;
        uint256 deadline;
        bool executed;
        bool cancelled;
    }

    address public immutable router;
    address public immutable factory;

    Order[] public orders;
    mapping(address => uint256[]) public userOrders;

    // Keeper rewards: small % of the trade goes to executor
    uint256 public constant KEEPER_REWARD_BPS = 10; // 0.1%

    event OrderPlaced(
        uint256 indexed orderId,
        address indexed owner,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    );
    event OrderExecuted(uint256 indexed orderId, address indexed executor, uint256 amountOut);
    event OrderCancelled(uint256 indexed orderId);

    // Reentrancy lock
    uint256 private _locked = 1;
    modifier nonReentrant() {
        require(_locked == 1, "QsnLimitOrder: REENTRANT");
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor(address _router, address _factory) {
        router = _router;
        factory = _factory;
    }

    /// @notice Place a new limit order
    /// @param tokenIn Token to sell
    /// @param tokenOut Token to buy
    /// @param amountIn Amount of tokenIn to sell
    /// @param minAmountOut Minimum amount of tokenOut to receive
    /// @param deadline Expiration timestamp
    function placeOrder(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    ) external nonReentrant returns (uint256 orderId) {
        require(tokenIn != address(0) && tokenOut != address(0), "QsnLimitOrder: ZERO_ADDRESS");
        require(tokenIn != tokenOut, "QsnLimitOrder: SAME_TOKEN");
        require(amountIn > 0, "QsnLimitOrder: ZERO_AMOUNT");
        require(minAmountOut > 0, "QsnLimitOrder: ZERO_MIN_OUT");
        require(deadline > block.timestamp, "QsnLimitOrder: EXPIRED_DEADLINE");

        // Transfer tokens from user to this contract
        _safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);

        orderId = orders.length;
        orders.push(Order({
            owner: msg.sender,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            minAmountOut: minAmountOut,
            deadline: deadline,
            executed: false,
            cancelled: false
        }));
        userOrders[msg.sender].push(orderId);

        emit OrderPlaced(orderId, msg.sender, tokenIn, tokenOut, amountIn, minAmountOut, deadline);
    }

    /// @notice Execute a limit order (can be called by anyone — keepers)
    /// @param orderId ID of the order to execute
    /// @param path Swap path
    /// @param fees Fee tiers for each hop
    function executeOrder(
        uint256 orderId,
        address[] calldata path,
        uint24[] calldata fees
    ) external nonReentrant {
        require(orderId < orders.length, "QsnLimitOrder: INVALID_ORDER");
        Order storage order = orders[orderId];
        require(!order.executed, "QsnLimitOrder: ALREADY_EXECUTED");
        require(!order.cancelled, "QsnLimitOrder: CANCELLED");
        require(block.timestamp <= order.deadline, "QsnLimitOrder: EXPIRED");
        require(path.length >= 2, "QsnLimitOrder: INVALID_PATH");
        require(path[0] == order.tokenIn, "QsnLimitOrder: PATH_TOKEN_IN_MISMATCH");
        require(path[path.length - 1] == order.tokenOut, "QsnLimitOrder: PATH_TOKEN_OUT_MISMATCH");

        // Approve router to spend our tokens
        _safeApprove(order.tokenIn, router, order.amountIn);

        // Execute swap via router
        uint256 balanceBefore = IERC20(order.tokenOut).balanceOf(address(this));

        IQsnRouter(router).swapExactTokensForTokens(
            order.amountIn,
            order.minAmountOut,
            path,
            fees,
            address(this),
            block.timestamp
        );

        uint256 amountOut = IERC20(order.tokenOut).balanceOf(address(this)) - balanceBefore;
        require(amountOut >= order.minAmountOut, "QsnLimitOrder: INSUFFICIENT_OUTPUT");

        order.executed = true;

        // Calculate keeper reward
        uint256 keeperReward = (amountOut * KEEPER_REWARD_BPS) / 10000;
        uint256 userAmount = amountOut - keeperReward;

        // Ensure user still receives at least their minimum after keeper fee
        require(userAmount >= order.minAmountOut, "QsnLimitOrder: INSUFFICIENT_OUTPUT_AFTER_KEEPER_FEE");

        // Transfer output to order owner
        _safeTransfer(order.tokenOut, order.owner, userAmount);

        // Transfer keeper reward
        if (keeperReward > 0) {
            _safeTransfer(order.tokenOut, msg.sender, keeperReward);
        }

        emit OrderExecuted(orderId, msg.sender, amountOut);
    }

    /// @notice Cancel an order and refund tokens
    /// @param orderId ID of the order to cancel
    function cancelOrder(uint256 orderId) external nonReentrant {
        require(orderId < orders.length, "QsnLimitOrder: INVALID_ORDER");
        Order storage order = orders[orderId];
        require(msg.sender == order.owner, "QsnLimitOrder: NOT_OWNER");
        require(!order.executed, "QsnLimitOrder: ALREADY_EXECUTED");
        require(!order.cancelled, "QsnLimitOrder: ALREADY_CANCELLED");

        order.cancelled = true;

        // Refund tokens
        _safeTransfer(order.tokenIn, order.owner, order.amountIn);

        emit OrderCancelled(orderId);
    }

    /// @notice Reclaim tokens from an expired order (callable by anyone, tokens go to owner) (F22)
    /// @param orderId ID of the expired order
    function reclaimExpiredOrder(uint256 orderId) external nonReentrant {
        require(orderId < orders.length, "QsnLimitOrder: INVALID_ORDER");
        Order storage order = orders[orderId];
        require(!order.executed, "QsnLimitOrder: ALREADY_EXECUTED");
        require(!order.cancelled, "QsnLimitOrder: ALREADY_CANCELLED");
        require(block.timestamp > order.deadline, "QsnLimitOrder: NOT_EXPIRED");

        order.cancelled = true;
        _safeTransfer(order.tokenIn, order.owner, order.amountIn);

        emit OrderCancelled(orderId);
    }

    /// @notice Get all active orders for a user
    function getActiveOrders(address user) external view returns (uint256[] memory activeOrderIds) {
        uint256[] memory allIds = userOrders[user];
        uint256 count = 0;

        // Count active orders
        for (uint256 i = 0; i < allIds.length; i++) {
            Order storage o = orders[allIds[i]];
            if (!o.executed && !o.cancelled && o.deadline >= block.timestamp) {
                count++;
            }
        }

        activeOrderIds = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allIds.length; i++) {
            Order storage o = orders[allIds[i]];
            if (!o.executed && !o.cancelled && o.deadline >= block.timestamp) {
                activeOrderIds[idx++] = allIds[i];
            }
        }
    }

    /// @notice Get total number of orders
    function ordersLength() external view returns (uint256) {
        return orders.length;
    }

    /// @notice Check if an order can be executed at current prices
    function canExecute(uint256 orderId, address[] calldata path, uint24[] calldata fees) external view returns (bool) {
        if (orderId >= orders.length) return false;
        Order storage order = orders[orderId];
        if (order.executed || order.cancelled || block.timestamp > order.deadline) return false;

        try IQsnRouter(router).getAmountsOut(order.amountIn, path, fees) returns (uint256[] memory amounts) {
            return amounts[amounts.length - 1] >= order.minAmountOut;
        } catch {
            return false;
        }
    }

    // --- Internal helpers ---

    function _safeTransfer(address token, address to, uint256 value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "QsnLimitOrder: TRANSFER_FAILED");
    }

    function _safeTransferFrom(address token, address from, address to, uint256 value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "QsnLimitOrder: TRANSFER_FROM_FAILED");
    }

    function _safeApprove(address token, address spender, uint256 value) private {
        (bool success, bytes memory data) = token.call(abi.encodeWithSelector(IERC20.approve.selector, spender, value));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "QsnLimitOrder: APPROVE_FAILED");
    }
}
