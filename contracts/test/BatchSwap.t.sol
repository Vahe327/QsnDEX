// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/periphery/QsnBatchSwap.sol";
import "../src/periphery/QsnRouter.sol";
import "../src/core/QsnFactory.sol";
import "../src/core/QsnPair.sol";
import "../src/utils/WETH9.sol";
import "./mocks/MockERC20.sol";

contract BatchSwapTest is Test {
    QsnBatchSwap public batchSwap;
    QsnRouter public router;
    QsnFactory public factory;
    WETH9 public weth;
    MockERC20 public tokenA;
    MockERC20 public tokenB;
    MockERC20 public tokenC;

    address public user = address(0xBEEF);
    uint256 public constant INITIAL_LIQUIDITY_ETH = 100 ether;
    uint256 public constant INITIAL_LIQUIDITY_TOKEN = 200_000e18;
    uint24 public constant FEE = 3000;

    function _makeFees() internal pure returns (uint24[] memory) {
        uint24[] memory f = new uint24[](1);
        f[0] = FEE;
        return f;
    }

    function _makeFeesMulti() internal pure returns (uint24[] memory) {
        uint24[] memory f = new uint24[](2);
        f[0] = FEE;
        f[1] = FEE;
        return f;
    }

    function setUp() public {
        weth = new WETH9();
        factory = new QsnFactory(address(this));
        router = new QsnRouter(address(factory), address(weth));
        batchSwap = new QsnBatchSwap(address(router));

        tokenA = new MockERC20("Token A", "TKNA", 18);
        tokenB = new MockERC20("Token B", "TKNB", 18);
        tokenC = new MockERC20("Token C", "TKNC", 18);

        tokenA.mint(address(this), INITIAL_LIQUIDITY_TOKEN * 3);
        tokenB.mint(address(this), INITIAL_LIQUIDITY_TOKEN * 3);
        tokenC.mint(address(this), INITIAL_LIQUIDITY_TOKEN * 3);

        tokenA.approve(address(router), type(uint256).max);
        tokenB.approve(address(router), type(uint256).max);
        tokenC.approve(address(router), type(uint256).max);

        router.addLiquidityETH{value: INITIAL_LIQUIDITY_ETH}(
            address(tokenA), FEE, INITIAL_LIQUIDITY_TOKEN, 0, 0, address(this), block.timestamp + 1 hours
        );
        router.addLiquidityETH{value: INITIAL_LIQUIDITY_ETH}(
            address(tokenB), FEE, INITIAL_LIQUIDITY_TOKEN, 0, 0, address(this), block.timestamp + 1 hours
        );
        router.addLiquidityETH{value: INITIAL_LIQUIDITY_ETH}(
            address(tokenC), FEE, INITIAL_LIQUIDITY_TOKEN, 0, 0, address(this), block.timestamp + 1 hours
        );

        vm.deal(user, 10 ether);
        tokenA.mint(user, 100_000e18);
    }

    function _ethPath(address token) internal view returns (address[] memory) {
        address[] memory p = new address[](2);
        p[0] = address(weth);
        p[1] = token;
        return p;
    }

    function _tokenPath(address from, address to) internal view returns (address[] memory) {
        address[] memory p = new address[](3);
        p[0] = from;
        p[1] = address(weth);
        p[2] = to;
        return p;
    }

    function test_BatchSwapFromETH_ThreeOrders() public {
        QsnBatchSwap.SwapOrder[] memory orders = new QsnBatchSwap.SwapOrder[](3);
        orders[0] = QsnBatchSwap.SwapOrder(address(tokenA), 5000, 0, _ethPath(address(tokenA)), _makeFees());
        orders[1] = QsnBatchSwap.SwapOrder(address(tokenB), 3000, 0, _ethPath(address(tokenB)), _makeFees());
        orders[2] = QsnBatchSwap.SwapOrder(address(tokenC), 2000, 0, _ethPath(address(tokenC)), _makeFees());

        uint256 balA = tokenA.balanceOf(user);
        uint256 balB = tokenB.balanceOf(user);
        uint256 balC = tokenC.balanceOf(user);

        vm.prank(user);
        batchSwap.batchSwapFromETH{value: 1 ether}(orders, block.timestamp + 1 hours);

        assertGt(tokenA.balanceOf(user) - balA, 0, "Should receive tokenA");
        assertGt(tokenB.balanceOf(user) - balB, 0, "Should receive tokenB");
        assertGt(tokenC.balanceOf(user) - balC, 0, "Should receive tokenC");
    }

    function test_BatchSwapFromETH_RevertOnBadPercentages() public {
        QsnBatchSwap.SwapOrder[] memory orders = new QsnBatchSwap.SwapOrder[](2);
        orders[0] = QsnBatchSwap.SwapOrder(address(tokenA), 5000, 0, _ethPath(address(tokenA)), _makeFees());
        orders[1] = QsnBatchSwap.SwapOrder(address(tokenB), 3000, 0, _ethPath(address(tokenB)), _makeFees());

        vm.prank(user);
        vm.expectRevert("QsnBatchSwap: percentages must sum to 100%");
        batchSwap.batchSwapFromETH{value: 1 ether}(orders, block.timestamp + 1 hours);
    }

    function test_BatchSwapFromETH_RevertOnZeroValue() public {
        QsnBatchSwap.SwapOrder[] memory orders = new QsnBatchSwap.SwapOrder[](1);
        orders[0] = QsnBatchSwap.SwapOrder(address(tokenA), 10000, 0, _ethPath(address(tokenA)), _makeFees());

        vm.prank(user);
        vm.expectRevert("QsnBatchSwap: no ETH sent");
        batchSwap.batchSwapFromETH{value: 0}(orders, block.timestamp + 1 hours);
    }

    function test_BatchSwapFromETH_RevertOnExpired() public {
        QsnBatchSwap.SwapOrder[] memory orders = new QsnBatchSwap.SwapOrder[](1);
        orders[0] = QsnBatchSwap.SwapOrder(address(tokenA), 10000, 0, _ethPath(address(tokenA)), _makeFees());

        vm.prank(user);
        vm.expectRevert("QsnBatchSwap: expired");
        batchSwap.batchSwapFromETH{value: 1 ether}(orders, block.timestamp - 1);
    }

    function test_BatchSwapFromETH_RevertOnTooManyOrders() public {
        QsnBatchSwap.SwapOrder[] memory orders = new QsnBatchSwap.SwapOrder[](11);
        for (uint256 i = 0; i < 11; i++) {
            orders[i] = QsnBatchSwap.SwapOrder(address(tokenA), 909, 0, _ethPath(address(tokenA)), _makeFees());
        }

        vm.prank(user);
        vm.expectRevert("QsnBatchSwap: invalid orders count");
        batchSwap.batchSwapFromETH{value: 1 ether}(orders, block.timestamp + 1 hours);
    }

    function test_BatchSwapFromToken() public {
        QsnBatchSwap.SwapOrder[] memory orders = new QsnBatchSwap.SwapOrder[](2);
        orders[0] = QsnBatchSwap.SwapOrder(address(tokenB), 6000, 0, _tokenPath(address(tokenA), address(tokenB)), _makeFeesMulti());
        orders[1] = QsnBatchSwap.SwapOrder(address(tokenC), 4000, 0, _tokenPath(address(tokenA), address(tokenC)), _makeFeesMulti());

        uint256 amountIn = 1000e18;
        vm.startPrank(user);
        tokenA.approve(address(batchSwap), amountIn);
        batchSwap.batchSwapFromToken(address(tokenA), amountIn, orders, block.timestamp + 1 hours);
        vm.stopPrank();

        assertGt(tokenB.balanceOf(user), 0, "Should receive tokenB");
        assertGt(tokenC.balanceOf(user), 0, "Should receive tokenC");
    }

    function test_GetBatchQuoteFromETH() public view {
        QsnBatchSwap.SwapOrder[] memory orders = new QsnBatchSwap.SwapOrder[](2);
        orders[0] = QsnBatchSwap.SwapOrder(address(tokenA), 5000, 0, _ethPath(address(tokenA)), _makeFees());
        orders[1] = QsnBatchSwap.SwapOrder(address(tokenB), 5000, 0, _ethPath(address(tokenB)), _makeFees());

        uint256[] memory amountsOut = batchSwap.getBatchQuoteFromETH(1 ether, orders);
        assertEq(amountsOut.length, 2);
        assertGt(amountsOut[0], 0);
        assertGt(amountsOut[1], 0);
    }

    function test_DustRefundETH() public {
        QsnBatchSwap.SwapOrder[] memory orders = new QsnBatchSwap.SwapOrder[](3);
        orders[0] = QsnBatchSwap.SwapOrder(address(tokenA), 3333, 0, _ethPath(address(tokenA)), _makeFees());
        orders[1] = QsnBatchSwap.SwapOrder(address(tokenB), 3334, 0, _ethPath(address(tokenB)), _makeFees());
        orders[2] = QsnBatchSwap.SwapOrder(address(tokenC), 3333, 0, _ethPath(address(tokenC)), _makeFees());

        vm.prank(user);
        batchSwap.batchSwapFromETH{value: 1 ether}(orders, block.timestamp + 1 hours);

        assertEq(address(batchSwap).balance, 0, "No ETH dust in contract");
    }

    receive() external payable {}
}
