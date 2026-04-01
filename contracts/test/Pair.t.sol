// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/core/QsnFactory.sol";
import "../src/core/QsnPair.sol";
import "./mocks/MockERC20.sol";

contract PairTest is Test {
    QsnFactory public factory;
    QsnPair public pair;
    MockERC20 public token0;
    MockERC20 public token1;

    address public user = address(0xBEEF);
    address public lp = address(0xCAFE);

    function setUp() public {
        factory = new QsnFactory(address(this));

        MockERC20 tA = new MockERC20("Token A", "TKA", 18);
        MockERC20 tB = new MockERC20("Token B", "TKB", 18);

        address pairAddr = factory.createPair(address(tA), address(tB), 3000);
        pair = QsnPair(pairAddr);

        // Sort tokens to match pair ordering
        if (pair.token0() == address(tA)) {
            token0 = tA;
            token1 = tB;
        } else {
            token0 = tB;
            token1 = tA;
        }
    }

    function _addLiquidity(uint256 amount0, uint256 amount1) internal {
        token0.mint(address(pair), amount0);
        token1.mint(address(pair), amount1);
        pair.mint(lp);
    }

    function test_mint_initialLiquidity() public {
        uint256 amount0 = 1 ether;
        uint256 amount1 = 4 ether;

        token0.mint(address(pair), amount0);
        token1.mint(address(pair), amount1);

        uint256 liquidity = pair.mint(lp);

        // sqrt(1e18 * 4e18) - 1000 = 2e18 - 1000
        assertEq(liquidity, 2 ether - 1000);
        assertEq(pair.totalSupply(), 2 ether);
        assertEq(pair.balanceOf(lp), 2 ether - 1000);
        assertEq(pair.balanceOf(address(0)), 1000); // MINIMUM_LIQUIDITY locked
    }

    function test_mint_subsequentLiquidity() public {
        _addLiquidity(1 ether, 4 ether);

        uint256 lpBalanceBefore = pair.balanceOf(lp);
        token0.mint(address(pair), 1 ether);
        token1.mint(address(pair), 4 ether);
        pair.mint(lp);

        assertGt(pair.balanceOf(lp), lpBalanceBefore, "LP balance should increase");
    }

    function test_burn() public {
        _addLiquidity(1 ether, 4 ether);

        uint256 lpBalance = pair.balanceOf(lp);

        // Transfer LP tokens to pair for burning
        vm.prank(lp);
        pair.transfer(address(pair), lpBalance);

        uint256 bal0Before = token0.balanceOf(user);
        uint256 bal1Before = token1.balanceOf(user);

        (uint256 amount0, uint256 amount1) = pair.burn(user);

        assertGt(amount0, 0, "Should receive token0");
        assertGt(amount1, 0, "Should receive token1");
        assertEq(token0.balanceOf(user) - bal0Before, amount0);
        assertEq(token1.balanceOf(user) - bal1Before, amount1);
    }

    function test_swap() public {
        _addLiquidity(5 ether, 10 ether);

        uint256 swapAmount = 1 ether;
        token0.mint(address(pair), swapAmount);

        // Calculate expected output (0.3% fee with fee=3000)
        // amountOut = (1e18 * 997000 * 10e18) / (5e18 * 1000000 + 1e18 * 997000)
        uint256 expectedOut = (swapAmount * 997000 * 10 ether) / (5 ether * 1_000_000 + swapAmount * 997000);

        uint256 balBefore = token1.balanceOf(user);
        pair.swap(0, expectedOut, user, "");

        assertEq(token1.balanceOf(user) - balBefore, expectedOut, "Should receive expected output");
    }

    function test_swap_reverseDirection() public {
        _addLiquidity(5 ether, 10 ether);

        uint256 swapAmount = 2 ether;
        token1.mint(address(pair), swapAmount);

        uint256 expectedOut = (swapAmount * 997000 * 5 ether) / (10 ether * 1_000_000 + swapAmount * 997000);

        uint256 balBefore = token0.balanceOf(user);
        pair.swap(expectedOut, 0, user, "");

        assertEq(token0.balanceOf(user) - balBefore, expectedOut);
    }

    function test_revert_swap_insufficientLiquidity() public {
        _addLiquidity(5 ether, 10 ether);
        token0.mint(address(pair), 1 ether);

        vm.expectRevert("QsnPair: INSUFFICIENT_LIQUIDITY");
        pair.swap(0, 11 ether, user, "");
    }

    function test_revert_swap_zeroOutput() public {
        _addLiquidity(5 ether, 10 ether);
        vm.expectRevert("QsnPair: INSUFFICIENT_OUTPUT_AMOUNT");
        pair.swap(0, 0, user, "");
    }

    function test_getReserves() public {
        _addLiquidity(5 ether, 10 ether);
        (uint112 r0, uint112 r1, uint32 ts) = pair.getReserves();
        assertEq(r0, 5 ether);
        assertEq(r1, 10 ether);
        assertGt(ts, 0);
    }

    function test_skim() public {
        // Set feeTo so skim is allowed to that address
        factory.setFeeTo(user);

        _addLiquidity(5 ether, 10 ether);

        // Send extra tokens directly
        token0.mint(address(pair), 1 ether);
        token1.mint(address(pair), 2 ether);

        uint256 bal0Before = token0.balanceOf(user);
        uint256 bal1Before = token1.balanceOf(user);

        pair.skim(user);

        assertEq(token0.balanceOf(user) - bal0Before, 1 ether, "Should skim excess token0");
        assertEq(token1.balanceOf(user) - bal1Before, 2 ether, "Should skim excess token1");
    }

    function test_skim_revert_forbidden() public {
        _addLiquidity(5 ether, 10 ether);

        // Send extra tokens directly
        token0.mint(address(pair), 1 ether);

        // Without feeTo set (address(0)), skim to arbitrary address should revert
        vm.expectRevert("QsnPair: FORBIDDEN_SKIM");
        pair.skim(user);
    }

    function test_sync() public {
        _addLiquidity(5 ether, 10 ether);

        // Send extra tokens directly
        token0.mint(address(pair), 1 ether);

        (uint112 r0Before,,) = pair.getReserves();
        pair.sync();
        (uint112 r0After,,) = pair.getReserves();

        assertEq(r0After, r0Before + 1 ether, "Reserve should include extra tokens");
    }

    function test_priceAccumulator() public {
        _addLiquidity(5 ether, 10 ether);

        uint256 p0Before = pair.price0CumulativeLast();

        // Advance time
        vm.warp(block.timestamp + 100);

        // Trigger update
        token0.mint(address(pair), 0.1 ether);
        token1.mint(address(pair), 0.2 ether);
        pair.mint(lp);

        assertGt(pair.price0CumulativeLast(), p0Before, "Price accumulator should increase");
    }

    function test_feeCollection() public {
        address feeRecipient = address(0xFEE);
        factory.setFeeTo(feeRecipient);

        _addLiquidity(5 ether, 10 ether);

        // Do a swap to generate fees
        token0.mint(address(pair), 1 ether);
        uint256 out = (uint256(1 ether) * 997000 * uint256(10 ether)) / (uint256(5 ether) * 1_000_000 + uint256(1 ether) * 997000);
        pair.swap(0, out, user, "");

        // Add more liquidity to trigger fee minting
        token0.mint(address(pair), 1 ether);
        token1.mint(address(pair), 2 ether);
        pair.mint(lp);

        // Fee recipient should have received LP tokens
        uint256 feeBalance = pair.balanceOf(feeRecipient);
        assertGt(feeBalance, 0, "Fee recipient should have LP tokens");
    }
}
