// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/core/QsnFactory.sol";
import "../src/periphery/QsnRouter.sol";
import "../src/utils/WETH9.sol";
import "./mocks/MockERC20.sol";

contract RouterTest is Test {
    QsnFactory public factory;
    QsnRouter public router;
    WETH9 public weth;
    MockERC20 public tokenA;
    MockERC20 public tokenB;
    MockERC20 public tokenC;

    address public user = address(0xBEEF);
    uint256 public constant INITIAL_BALANCE = 100 ether;
    uint24 public constant FEE = 3000;

    function setUp() public {
        factory = new QsnFactory(address(this));
        weth = new WETH9();
        router = new QsnRouter(address(factory), address(weth));

        tokenA = new MockERC20("Token A", "TKA", 18);
        tokenB = new MockERC20("Token B", "TKB", 18);
        tokenC = new MockERC20("Token C", "TKC", 18);

        // Mint tokens to user
        tokenA.mint(user, INITIAL_BALANCE);
        tokenB.mint(user, INITIAL_BALANCE);
        tokenC.mint(user, INITIAL_BALANCE);
        vm.deal(user, INITIAL_BALANCE);

        // Approve router
        vm.startPrank(user);
        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);
        tokenC.approve(address(router), type(uint256).max);
        vm.stopPrank();
    }

    function test_addLiquidity() public {
        vm.prank(user);
        (uint256 amountA, uint256 amountB, uint256 liquidity) = router.addLiquidity(
            address(tokenA), address(tokenB), FEE,
            5 ether, 10 ether, 5 ether, 10 ether,
            user, block.timestamp + 1000
        );

        assertEq(amountA, 5 ether);
        assertEq(amountB, 10 ether);
        assertGt(liquidity, 0);
    }

    function test_addLiquidityETH() public {
        vm.prank(user);
        (uint256 amountToken, uint256 amountETH, uint256 liquidity) = router.addLiquidityETH{value: 5 ether}(
            address(tokenA), FEE,
            10 ether, 10 ether, 5 ether,
            user, block.timestamp + 1000
        );

        assertEq(amountToken, 10 ether);
        assertEq(amountETH, 5 ether);
        assertGt(liquidity, 0);
    }

    function test_removeLiquidity() public {
        // First add liquidity
        vm.startPrank(user);
        (,, uint256 liquidity) = router.addLiquidity(
            address(tokenA), address(tokenB), FEE,
            5 ether, 10 ether, 0, 0,
            user, block.timestamp + 1000
        );

        // Approve LP token
        address pair = factory.getPair(address(tokenA), address(tokenB), FEE);
        QsnERC20(pair).approve(address(router), liquidity);

        uint256 balABefore = tokenA.balanceOf(user);
        uint256 balBBefore = tokenB.balanceOf(user);

        (uint256 amountA, uint256 amountB) = router.removeLiquidity(
            address(tokenA), address(tokenB), FEE,
            liquidity, 0, 0,
            user, block.timestamp + 1000
        );
        vm.stopPrank();

        assertGt(amountA, 0);
        assertGt(amountB, 0);
        assertEq(tokenA.balanceOf(user), balABefore + amountA);
        assertEq(tokenB.balanceOf(user), balBBefore + amountB);
    }

    function test_swapExactTokensForTokens() public {
        // Add liquidity first
        vm.startPrank(user);
        router.addLiquidity(
            address(tokenA), address(tokenB), FEE,
            10 ether, 10 ether, 0, 0,
            user, block.timestamp + 1000
        );

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        uint24[] memory fees = new uint24[](1);
        fees[0] = FEE;

        uint256 balBBefore = tokenB.balanceOf(user);

        uint256[] memory amounts = router.swapExactTokensForTokens(
            1 ether, 0,
            path, fees,
            user, block.timestamp + 1000
        );
        vm.stopPrank();

        assertEq(amounts[0], 1 ether);
        assertGt(amounts[1], 0);
        assertEq(tokenB.balanceOf(user) - balBBefore, amounts[1]);
    }

    function test_swapTokensForExactTokens() public {
        vm.startPrank(user);
        router.addLiquidity(
            address(tokenA), address(tokenB), FEE,
            10 ether, 10 ether, 0, 0,
            user, block.timestamp + 1000
        );

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        uint24[] memory fees = new uint24[](1);
        fees[0] = FEE;

        uint256[] memory amounts = router.swapTokensForExactTokens(
            0.5 ether, 10 ether,
            path, fees,
            user, block.timestamp + 1000
        );
        vm.stopPrank();

        assertEq(amounts[amounts.length - 1], 0.5 ether);
    }

    function test_swapExactETHForTokens() public {
        // Create WETH/tokenA pool
        vm.startPrank(user);
        router.addLiquidityETH{value: 10 ether}(
            address(tokenA), FEE,
            10 ether, 0, 0,
            user, block.timestamp + 1000
        );

        address[] memory path = new address[](2);
        path[0] = address(weth);
        path[1] = address(tokenA);
        uint24[] memory fees = new uint24[](1);
        fees[0] = FEE;

        uint256 balBefore = tokenA.balanceOf(user);

        uint256[] memory amounts = router.swapExactETHForTokens{value: 1 ether}(
            0,
            path, fees,
            user, block.timestamp + 1000
        );
        vm.stopPrank();

        assertGt(amounts[1], 0);
        assertEq(tokenA.balanceOf(user) - balBefore, amounts[1]);
    }

    function test_swapExactTokensForETH() public {
        vm.startPrank(user);
        router.addLiquidityETH{value: 10 ether}(
            address(tokenA), FEE,
            10 ether, 0, 0,
            user, block.timestamp + 1000
        );

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(weth);
        uint24[] memory fees = new uint24[](1);
        fees[0] = FEE;

        uint256 ethBefore = user.balance;

        uint256[] memory amounts = router.swapExactTokensForETH(
            1 ether, 0,
            path, fees,
            user, block.timestamp + 1000
        );
        vm.stopPrank();

        assertGt(amounts[1], 0);
        assertEq(user.balance - ethBefore, amounts[1]);
    }

    function test_multiHopSwap() public {
        vm.startPrank(user);
        // Create A/B and B/C pools
        router.addLiquidity(
            address(tokenA), address(tokenB), FEE,
            10 ether, 10 ether, 0, 0,
            user, block.timestamp + 1000
        );
        router.addLiquidity(
            address(tokenB), address(tokenC), FEE,
            10 ether, 10 ether, 0, 0,
            user, block.timestamp + 1000
        );

        // Swap A → B → C
        address[] memory path = new address[](3);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        path[2] = address(tokenC);
        uint24[] memory fees = new uint24[](2);
        fees[0] = FEE;
        fees[1] = FEE;

        uint256 balCBefore = tokenC.balanceOf(user);

        uint256[] memory amounts = router.swapExactTokensForTokens(
            1 ether, 0,
            path, fees,
            user, block.timestamp + 1000
        );
        vm.stopPrank();

        assertEq(amounts.length, 3);
        assertGt(amounts[2], 0);
        assertEq(tokenC.balanceOf(user) - balCBefore, amounts[2]);
    }

    function test_revert_expired() public {
        vm.prank(user);
        vm.expectRevert("QsnRouter: EXPIRED");
        router.addLiquidity(
            address(tokenA), address(tokenB), FEE,
            5 ether, 10 ether, 0, 0,
            user, block.timestamp - 1
        );
    }
}
