// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/core/QsnFactory.sol";
import "../src/periphery/QsnRouter.sol";
import "../src/utils/QsnLimitOrder.sol";
import "../src/utils/WETH9.sol";
import "./mocks/MockERC20.sol";

contract LimitOrderTest is Test {
    QsnFactory public factory;
    QsnRouter public router;
    QsnLimitOrder public limitOrder;
    WETH9 public weth;
    MockERC20 public tokenA;
    MockERC20 public tokenB;

    address public user = address(0xBEEF);
    address public keeper = address(0xCAFE);

    function setUp() public {
        factory = new QsnFactory(address(this));
        weth = new WETH9();
        router = new QsnRouter(address(factory), address(weth));
        limitOrder = new QsnLimitOrder(address(router), address(factory));

        tokenA = new MockERC20("Token A", "TKA", 18);
        tokenB = new MockERC20("Token B", "TKB", 18);

        // Setup pool with liquidity
        tokenA.mint(address(this), 100 ether);
        tokenB.mint(address(this), 100 ether);
        tokenA.approve(address(router), 100 ether);
        tokenB.approve(address(router), 100 ether);
        router.addLiquidity(
            address(tokenA), address(tokenB), 3000,
            50 ether, 50 ether, 0, 0,
            address(this), block.timestamp + 1000
        );

        // Setup user
        tokenA.mint(user, 10 ether);
        tokenB.mint(user, 10 ether);
        vm.startPrank(user);
        tokenA.approve(address(limitOrder), type(uint256).max);
        tokenB.approve(address(limitOrder), type(uint256).max);
        vm.stopPrank();
    }

    function test_placeOrder() public {
        vm.prank(user);
        uint256 orderId = limitOrder.placeOrder(
            address(tokenA), address(tokenB),
            1 ether, 0.5 ether,
            block.timestamp + 3600
        );

        assertEq(orderId, 0);
        assertEq(limitOrder.ordersLength(), 1);

        (address owner,,, uint256 amountIn,,, bool executed, bool cancelled) = limitOrder.orders(0);
        assertEq(owner, user);
        assertEq(amountIn, 1 ether);
        assertFalse(executed);
        assertFalse(cancelled);
    }

    function test_executeOrder() public {
        vm.prank(user);
        limitOrder.placeOrder(
            address(tokenA), address(tokenB),
            1 ether, 0.5 ether,
            block.timestamp + 3600
        );

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        uint24[] memory fees = new uint24[](1);
        fees[0] = 3000;

        uint256 userBalBefore = tokenB.balanceOf(user);

        vm.prank(keeper);
        limitOrder.executeOrder(0, path, fees);

        (,,,,,, bool executed,) = limitOrder.orders(0);
        assertTrue(executed, "Order should be marked executed");

        uint256 userBalAfter = tokenB.balanceOf(user);
        assertGt(userBalAfter, userBalBefore, "User should receive output tokens");
    }

    function test_cancelOrder() public {
        vm.prank(user);
        limitOrder.placeOrder(
            address(tokenA), address(tokenB),
            1 ether, 0.5 ether,
            block.timestamp + 3600
        );

        uint256 balBefore = tokenA.balanceOf(user);

        vm.prank(user);
        limitOrder.cancelOrder(0);

        (,,,,,,, bool cancelled) = limitOrder.orders(0);
        assertTrue(cancelled, "Order should be cancelled");
        assertEq(tokenA.balanceOf(user), balBefore + 1 ether, "Tokens should be refunded");
    }

    function test_revert_cancelNotOwner() public {
        vm.prank(user);
        limitOrder.placeOrder(
            address(tokenA), address(tokenB),
            1 ether, 0.5 ether,
            block.timestamp + 3600
        );

        vm.prank(keeper);
        vm.expectRevert("QsnLimitOrder: NOT_OWNER");
        limitOrder.cancelOrder(0);
    }

    function test_revert_executeExpired() public {
        vm.prank(user);
        limitOrder.placeOrder(
            address(tokenA), address(tokenB),
            1 ether, 0.5 ether,
            block.timestamp + 100
        );

        vm.warp(block.timestamp + 200);

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        uint24[] memory fees = new uint24[](1);
        fees[0] = 3000;

        vm.prank(keeper);
        vm.expectRevert("QsnLimitOrder: EXPIRED");
        limitOrder.executeOrder(0, path, fees);
    }

    function test_getActiveOrders() public {
        vm.startPrank(user);
        limitOrder.placeOrder(address(tokenA), address(tokenB), 1 ether, 0.5 ether, block.timestamp + 3600);
        limitOrder.placeOrder(address(tokenA), address(tokenB), 2 ether, 1 ether, block.timestamp + 3600);
        limitOrder.cancelOrder(0);
        vm.stopPrank();

        uint256[] memory active = limitOrder.getActiveOrders(user);
        assertEq(active.length, 1);
        assertEq(active[0], 1);
    }

    function test_canExecute() public {
        vm.prank(user);
        limitOrder.placeOrder(
            address(tokenA), address(tokenB),
            1 ether, 0.5 ether,
            block.timestamp + 3600
        );

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        uint24[] memory fees = new uint24[](1);
        fees[0] = 3000;

        bool executable = limitOrder.canExecute(0, path, fees);
        assertTrue(executable, "Order should be executable");
    }
}
