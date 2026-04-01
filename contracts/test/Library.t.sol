// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/periphery/QsnRouter.sol";
import "../src/core/QsnFactory.sol";
import "../src/utils/WETH9.sol";
import "./mocks/MockERC20.sol";

contract LibraryTest is Test {
    QsnFactory public factory;
    QsnRouter public router;
    WETH9 public weth;
    MockERC20 public tokenA;
    MockERC20 public tokenB;

    function setUp() public {
        factory = new QsnFactory(address(this));
        weth = new WETH9();
        router = new QsnRouter(address(factory), address(weth));
        tokenA = new MockERC20("Token A", "TKA", 18);
        tokenB = new MockERC20("Token B", "TKB", 18);
    }

    function test_quote() public view {
        uint256 result = router.quote(1 ether, 5 ether, 10 ether);
        assertEq(result, 2 ether, "1 TKA should quote to 2 TKB at 1:2 ratio");
    }

    function test_quote_symmetry() public view {
        uint256 amountB = router.quote(1 ether, 5 ether, 10 ether);
        uint256 amountA = router.quote(amountB, 10 ether, 5 ether);
        assertEq(amountA, 1 ether, "Round-trip quote should return original amount");
    }

    function test_getAmountOut_standardFee() public view {
        // 0.3% fee (3000 hundredths of a bip)
        uint256 amountOut = router.getAmountOut(1 ether, 10 ether, 10 ether, 3000);
        // Expected: (1e18 * 997000 * 10e18) / (10e18 * 1000000 + 1e18 * 997000)
        uint256 numerator = uint256(1 ether) * 997000 * uint256(10 ether);
        uint256 denominator = uint256(10 ether) * 1_000_000 + uint256(1 ether) * 997000;
        uint256 expected = numerator / denominator;
        assertEq(amountOut, expected, "getAmountOut should match manual calculation");
        assertGt(amountOut, 0);
        assertLt(amountOut, 1 ether, "Output should be less than input at 1:1 ratio");
    }

    function test_getAmountOut_lowFee() public view {
        // 0.01% fee (100 hundredths of a bip)
        uint256 amountOutLow = router.getAmountOut(1 ether, 10 ether, 10 ether, 100);
        // 0.3% fee
        uint256 amountOutStd = router.getAmountOut(1 ether, 10 ether, 10 ether, 3000);
        assertGt(amountOutLow, amountOutStd, "Lower fee should give more output");
    }

    function test_getAmountIn() public view {
        uint256 amountIn = router.getAmountIn(1 ether, 10 ether, 10 ether, 3000);
        assertGt(amountIn, 1 ether, "AmountIn should exceed output at 1:1 reserves");
    }

    function test_getAmountsOut_multiHop() public {
        // Setup pools
        tokenA.mint(address(this), 100 ether);
        tokenB.mint(address(this), 100 ether);
        tokenA.approve(address(router), 100 ether);
        tokenB.approve(address(router), 100 ether);

        router.addLiquidity(
            address(tokenA), address(tokenB), 3000,
            10 ether, 10 ether, 0, 0,
            address(this), block.timestamp + 1000
        );

        address[] memory path = new address[](2);
        path[0] = address(tokenA);
        path[1] = address(tokenB);
        uint24[] memory fees = new uint24[](1);
        fees[0] = 3000;

        uint256[] memory amounts = router.getAmountsOut(1 ether, path, fees);
        assertEq(amounts.length, 2);
        assertEq(amounts[0], 1 ether);
        assertGt(amounts[1], 0);
    }

    function test_getAmountOut_fuzz(uint256 amountIn) public view {
        amountIn = bound(amountIn, 1000, 100 ether);
        uint256 reserveIn = 1000 ether;
        uint256 reserveOut = 1000 ether;

        uint256 amountOut = router.getAmountOut(amountIn, reserveIn, reserveOut, 3000);
        assertGt(amountOut, 0, "Output must be > 0");
        assertLt(amountOut, reserveOut, "Output must be < reserve");
    }
}
