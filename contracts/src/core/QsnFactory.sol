// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./QsnPair.sol";
import "../interfaces/IQsnFactory.sol";

/// @title Qsn Factory — Creates and manages trading pairs
/// @notice Supports multiple fee tiers (0.01%, 0.05%, 0.30%, 1.00%)
contract QsnFactory is IQsnFactory {
    address public feeTo;
    address public feeToSetter;

    // fee => enabled
    mapping(uint24 => bool) public feeAmountEnabled;

    // tokenA => tokenB => fee => pair
    mapping(address => mapping(address => mapping(uint24 => address))) public getPair;
    address[] public allPairs;

    constructor(address _feeToSetter) {
        feeToSetter = _feeToSetter;

        // Enable default fee tiers (in hundredths of a bip)
        feeAmountEnabled[100] = true;    // 0.01% — stablecoins
        feeAmountEnabled[500] = true;    // 0.05% — correlated pairs
        feeAmountEnabled[3000] = true;   // 0.30% — standard
        feeAmountEnabled[10000] = true;  // 1.00% — exotic/volatile
    }

    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }

    /// @notice Create a new trading pair with specified fee tier
    /// @param tokenA First token address
    /// @param tokenB Second token address
    /// @param fee Fee tier in hundredths of a bip
    /// @return pair Address of the created pair contract
    function createPair(address tokenA, address tokenB, uint24 fee) external returns (address pair) {
        require(tokenA != tokenB, "QsnFactory: IDENTICAL_ADDRESSES");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "QsnFactory: ZERO_ADDRESS");
        require(feeAmountEnabled[fee], "QsnFactory: FEE_NOT_ENABLED");
        require(getPair[token0][token1][fee] == address(0), "QsnFactory: PAIR_EXISTS");

        // Determine pool type: auto-detect stablecoin pairs for StableSwap
        uint8 poolTypeValue = fee == 100 ? 1 : 0; // 0.01% fee => StableSwap

        bytes memory bytecode = type(QsnPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1, fee));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        require(pair != address(0), "QsnFactory: CREATE2_FAILED");

        QsnPair(pair).initialize(token0, token1, fee, poolTypeValue);
        getPair[token0][token1][fee] = pair;
        getPair[token1][token0][fee] = pair;
        allPairs.push(pair);

        emit PairCreated(token0, token1, pair, fee, allPairs.length - 1);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter, "QsnFactory: FORBIDDEN");
        emit FeeToUpdated(feeTo, _feeTo);
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter, "QsnFactory: FORBIDDEN");
        require(_feeToSetter != address(0), "QsnFactory: ZERO_ADDRESS");
        emit FeeToSetterUpdated(feeToSetter, _feeToSetter);
        feeToSetter = _feeToSetter;
    }

    function enableFeeAmount(uint24 _fee) external {
        require(msg.sender == feeToSetter, "QsnFactory: FORBIDDEN");
        require(_fee > 0 && _fee <= 100000, "QsnFactory: INVALID_FEE");
        feeAmountEnabled[_fee] = true;
        emit FeeAmountEnabled(_fee);
    }

    function disableFeeAmount(uint24 _fee) external {
        require(msg.sender == feeToSetter, "QsnFactory: FORBIDDEN");
        require(feeAmountEnabled[_fee], "QsnFactory: FEE_NOT_ENABLED");
        feeAmountEnabled[_fee] = false;
        emit FeeAmountDisabled(_fee);
    }

    /// @notice Get the CREATE2 init code hash for pair address calculation
    function pairCodeHash() external pure returns (bytes32) {
        return keccak256(type(QsnPair).creationCode);
    }
}
