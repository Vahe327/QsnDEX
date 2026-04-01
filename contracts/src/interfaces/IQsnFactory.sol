// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IQsnFactory {
    event PairCreated(
        address indexed token0,
        address indexed token1,
        address pair,
        uint24 fee,
        uint256 pairIndex
    );
    event FeeToUpdated(address indexed previousFeeTo, address indexed newFeeTo);
    event FeeToSetterUpdated(address indexed previousSetter, address indexed newSetter);
    event FeeAmountEnabled(uint24 indexed fee);
    event FeeAmountDisabled(uint24 indexed fee);

    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);
    function getPair(address tokenA, address tokenB, uint24 fee) external view returns (address pair);
    function allPairs(uint256) external view returns (address pair);
    function allPairsLength() external view returns (uint256);
    function feeAmountEnabled(uint24 fee) external view returns (bool);

    function createPair(address tokenA, address tokenB, uint24 fee) external returns (address pair);
    function setFeeTo(address) external;
    function setFeeToSetter(address) external;
    function enableFeeAmount(uint24 fee) external;
    function disableFeeAmount(uint24 fee) external;
}
