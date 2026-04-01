// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IQsnPair.sol";
import "../interfaces/IQsnFactory.sol";
import "../core/QsnPair.sol";

/// @title Qsn Library — Pure calculation functions for AMM math
library QsnLibrary {
    /// @notice Sort two token addresses
    function sortTokens(address tokenA, address tokenB) internal pure returns (address token0, address token1) {
        require(tokenA != tokenB, "QsnLibrary: IDENTICAL_ADDRESSES");
        (token0, token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "QsnLibrary: ZERO_ADDRESS");
    }

    /// @notice Calculate the CREATE2 address for a pair without external calls
    function pairFor(
        address factory,
        address tokenA,
        address tokenB,
        uint24 fee
    ) internal pure returns (address pair) {
        (address token0, address token1) = sortTokens(tokenA, tokenB);
        pair = address(uint160(uint256(keccak256(abi.encodePacked(
            hex"ff",
            factory,
            keccak256(abi.encodePacked(token0, token1, fee)),
            keccak256(type(QsnPair).creationCode)
        )))));
    }

    /// @notice Get reserves for a pair, ordered by tokenA/tokenB
    function getReserves(
        address factory,
        address tokenA,
        address tokenB,
        uint24 fee
    ) internal view returns (uint256 reserveA, uint256 reserveB) {
        (address token0,) = sortTokens(tokenA, tokenB);
        address pair = IQsnFactory(factory).getPair(tokenA, tokenB, fee);
        require(pair != address(0), "QsnLibrary: PAIR_NOT_FOUND");
        (uint112 reserve0, uint112 reserve1,) = IQsnPair(pair).getReserves();
        (reserveA, reserveB) = tokenA == token0 ? (uint256(reserve0), uint256(reserve1)) : (uint256(reserve1), uint256(reserve0));
    }

    /// @notice Proportional quote: given amountA and reserves, return equivalent amountB
    function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) internal pure returns (uint256 amountB) {
        require(amountA > 0, "QsnLibrary: INSUFFICIENT_AMOUNT");
        require(reserveA > 0 && reserveB > 0, "QsnLibrary: INSUFFICIENT_LIQUIDITY");
        amountB = (amountA * reserveB) / reserveA;
    }

    /// @notice Calculate output amount given an input amount and reserves (constant product)
    /// @dev amountOut = (amountIn * feeMultiplier * reserveOut) / (reserveIn * feeDenom + amountIn * feeMultiplier)
    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut,
        uint24 fee
    ) internal pure returns (uint256 amountOut) {
        require(amountIn > 0, "QsnLibrary: INSUFFICIENT_INPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "QsnLibrary: INSUFFICIENT_LIQUIDITY");
        uint256 feeDenom = 1_000_000;
        uint256 feeMultiplier = feeDenom - fee;
        uint256 amountInWithFee = amountIn * feeMultiplier;
        uint256 numerator = amountInWithFee * reserveOut;
        uint256 denominator = reserveIn * feeDenom + amountInWithFee;
        amountOut = numerator / denominator;
    }

    /// @notice Calculate input amount for a desired output amount (constant product)
    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut,
        uint24 fee
    ) internal pure returns (uint256 amountIn) {
        require(amountOut > 0, "QsnLibrary: INSUFFICIENT_OUTPUT_AMOUNT");
        require(reserveIn > 0 && reserveOut > 0, "QsnLibrary: INSUFFICIENT_LIQUIDITY");
        require(amountOut < reserveOut, "QsnLibrary: EXCESSIVE_OUTPUT_AMOUNT");
        uint256 feeDenom = 1_000_000;
        uint256 feeMultiplier = feeDenom - fee;
        uint256 numerator = reserveIn * amountOut * feeDenom;
        uint256 denominator = (reserveOut - amountOut) * feeMultiplier;
        amountIn = (numerator / denominator) + 1;
    }

    /// @notice Calculate output amounts for a multi-hop swap path
    function getAmountsOut(
        address factory,
        uint256 amountIn,
        address[] memory path,
        uint24[] memory fees
    ) internal view returns (uint256[] memory amounts) {
        require(path.length >= 2, "QsnLibrary: INVALID_PATH");
        require(path.length - 1 == fees.length, "QsnLibrary: PATH_FEE_MISMATCH");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i = 0; i < path.length - 1; i++) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(factory, path[i], path[i + 1], fees[i]);
            amounts[i + 1] = getAmountOut(amounts[i], reserveIn, reserveOut, fees[i]);
        }
    }

    /// @notice Calculate input amounts for a multi-hop swap (reverse)
    function getAmountsIn(
        address factory,
        uint256 amountOut,
        address[] memory path,
        uint24[] memory fees
    ) internal view returns (uint256[] memory amounts) {
        require(path.length >= 2, "QsnLibrary: INVALID_PATH");
        require(path.length - 1 == fees.length, "QsnLibrary: PATH_FEE_MISMATCH");
        amounts = new uint256[](path.length);
        amounts[amounts.length - 1] = amountOut;
        for (uint256 i = path.length - 1; i > 0; i--) {
            (uint256 reserveIn, uint256 reserveOut) = getReserves(factory, path[i - 1], path[i], fees[i - 1]);
            amounts[i - 1] = getAmountIn(amounts[i], reserveIn, reserveOut, fees[i - 1]);
        }
    }
}
