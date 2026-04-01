// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/core/QsnFactory.sol";
import "../src/core/QsnPair.sol";
import "./mocks/MockERC20.sol";

contract FactoryTest is Test {
    QsnFactory public factory;
    MockERC20 public tokenA;
    MockERC20 public tokenB;
    MockERC20 public tokenC;
    address public feeToSetter = address(this);

    function setUp() public {
        factory = new QsnFactory(feeToSetter);
        tokenA = new MockERC20("Token A", "TKA", 18);
        tokenB = new MockERC20("Token B", "TKB", 18);
        tokenC = new MockERC20("Token C", "TKC", 18);
    }

    function test_createPair() public {
        address pair = factory.createPair(address(tokenA), address(tokenB), 3000);
        assertNotEq(pair, address(0), "Pair should be created");
        assertEq(factory.allPairsLength(), 1, "Should have 1 pair");

        address storedPair = factory.getPair(address(tokenA), address(tokenB), 3000);
        assertEq(pair, storedPair, "Stored pair should match");

        // Reverse order should return same pair
        address reversePair = factory.getPair(address(tokenB), address(tokenA), 3000);
        assertEq(pair, reversePair, "Reverse lookup should match");
    }

    function test_createPairDifferentFeeTiers() public {
        address pair1 = factory.createPair(address(tokenA), address(tokenB), 3000);
        address pair2 = factory.createPair(address(tokenA), address(tokenB), 500);
        address pair3 = factory.createPair(address(tokenA), address(tokenB), 100);

        assertNotEq(pair1, pair2, "Different fee pairs should have different addresses");
        assertNotEq(pair2, pair3, "Different fee pairs should have different addresses");
        assertEq(factory.allPairsLength(), 3, "Should have 3 pairs");
    }

    function test_revert_duplicatePair() public {
        factory.createPair(address(tokenA), address(tokenB), 3000);
        vm.expectRevert("QsnFactory: PAIR_EXISTS");
        factory.createPair(address(tokenA), address(tokenB), 3000);
    }

    function test_revert_identicalAddresses() public {
        vm.expectRevert("QsnFactory: IDENTICAL_ADDRESSES");
        factory.createPair(address(tokenA), address(tokenA), 3000);
    }

    function test_revert_zeroAddress() public {
        vm.expectRevert("QsnFactory: ZERO_ADDRESS");
        factory.createPair(address(0), address(tokenB), 3000);
    }

    function test_revert_invalidFee() public {
        vm.expectRevert("QsnFactory: FEE_NOT_ENABLED");
        factory.createPair(address(tokenA), address(tokenB), 999);
    }

    function test_setFeeTo() public {
        address feeRecipient = address(0xBEEF);
        factory.setFeeTo(feeRecipient);
        assertEq(factory.feeTo(), feeRecipient);
    }

    function test_revert_setFeeTo_notSetter() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert("QsnFactory: FORBIDDEN");
        factory.setFeeTo(address(0xBEEF));
    }

    function test_enableFeeAmount() public {
        assertFalse(factory.feeAmountEnabled(2000));
        factory.enableFeeAmount(2000);
        assertTrue(factory.feeAmountEnabled(2000));
    }

    function test_pairInitialization() public {
        address pair = factory.createPair(address(tokenA), address(tokenB), 3000);
        QsnPair pairContract = QsnPair(pair);

        (address token0, address token1) = address(tokenA) < address(tokenB)
            ? (address(tokenA), address(tokenB))
            : (address(tokenB), address(tokenA));

        assertEq(pairContract.token0(), token0);
        assertEq(pairContract.token1(), token1);
        assertEq(pairContract.fee(), 3000);
        assertEq(pairContract.factory(), address(factory));
    }

    function test_stableSwapPoolType() public {
        // 100 fee (0.01%) should create StableSwap pool
        address pair = factory.createPair(address(tokenA), address(tokenB), 100);
        QsnPair pairContract = QsnPair(pair);
        assertEq(pairContract.poolType(), 1, "0.01% fee should be StableSwap");

        // 3000 fee should be ConstantProduct
        address pair2 = factory.createPair(address(tokenA), address(tokenC), 3000);
        QsnPair pairContract2 = QsnPair(pair2);
        assertEq(pairContract2.poolType(), 0, "0.3% fee should be ConstantProduct");
    }

    function test_allPairsGetter() public {
        address pair1 = factory.createPair(address(tokenA), address(tokenB), 3000);
        address pair2 = factory.createPair(address(tokenA), address(tokenC), 3000);

        assertEq(factory.allPairs(0), pair1);
        assertEq(factory.allPairs(1), pair2);
    }
}
