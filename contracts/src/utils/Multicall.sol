// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Multicall — Batch multiple calls into a single transaction
/// @notice Enables gas-efficient batching of read and write calls
contract Multicall {
    struct Call {
        address target;
        bytes callData;
    }

    struct CallWithValue {
        address target;
        uint256 value;
        bytes callData;
    }

    struct Result {
        bool success;
        bytes returnData;
    }

    /// @notice Execute multiple calls, revert if any fails
    function aggregate(Call[] calldata calls) external returns (uint256 blockNumber, bytes[] memory returnData) {
        blockNumber = block.number;
        returnData = new bytes[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory ret) = calls[i].target.call(calls[i].callData);
            require(success, "Multicall: CALL_FAILED");
            returnData[i] = ret;
        }
    }

    /// @notice Execute multiple calls, allow individual failures
    function tryAggregate(bool requireSuccess, Call[] calldata calls) external returns (Result[] memory results) {
        results = new Result[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory ret) = calls[i].target.call(calls[i].callData);
            if (requireSuccess) {
                require(success, "Multicall: CALL_FAILED");
            }
            results[i] = Result(success, ret);
        }
    }

    /// @notice Execute multiple calls with ETH values
    function aggregateWithValue(CallWithValue[] calldata calls) external payable returns (Result[] memory results) {
        results = new Result[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory ret) = calls[i].target.call{value: calls[i].value}(calls[i].callData);
            results[i] = Result(success, ret);
        }
        // Refund unused ETH
        uint256 remaining = address(this).balance;
        if (remaining > 0) {
            (bool success,) = msg.sender.call{value: remaining}("");
            require(success, "Multicall: ETH_REFUND_FAILED");
        }
    }

    /// @notice Get current block number
    function getBlockNumber() external view returns (uint256) {
        return block.number;
    }

    /// @notice Get current block timestamp
    function getCurrentBlockTimestamp() external view returns (uint256) {
        return block.timestamp;
    }

    /// @notice Get ETH balance of an address
    function getEthBalance(address addr) external view returns (uint256) {
        return addr.balance;
    }
}
