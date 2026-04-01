// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/core/QsnFactory.sol";
import "../src/periphery/QsnRouter.sol";
import "../src/utils/WETH9.sol";
import "../src/utils/FeeCollector.sol";
import "../src/utils/Multicall.sol";
import "../src/utils/QsnLimitOrder.sol";
import "../src/utils/QsnStaking.sol";

/// @title Qsn Deploy Script
/// @notice Deploys all contracts to Taiko L2
contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy WETH9
        WETH9 weth = new WETH9();
        console.log("WETH9 deployed at:", address(weth));

        // 2. Deploy Factory
        QsnFactory factory = new QsnFactory(deployer);
        console.log("Factory deployed at:", address(factory));

        // 3. Deploy Router
        QsnRouter router = new QsnRouter(address(factory), address(weth));
        console.log("Router deployed at:", address(router));

        // 4. Deploy FeeCollector
        FeeCollector feeCollector = new FeeCollector(address(factory), address(weth));
        console.log("FeeCollector deployed at:", address(feeCollector));

        // 5. Set feeTo to FeeCollector
        factory.setFeeTo(address(feeCollector));
        console.log("Factory feeTo set to FeeCollector");

        // 6. Deploy Multicall
        Multicall multicall = new Multicall();
        console.log("Multicall deployed at:", address(multicall));

        // 7. Deploy LimitOrder
        QsnLimitOrder limitOrder = new QsnLimitOrder(address(router), address(factory));
        console.log("LimitOrder deployed at:", address(limitOrder));

        vm.stopBroadcast();

        // Output summary for .env
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("WETH_ADDRESS=", address(weth));
        console.log("FACTORY_ADDRESS=", address(factory));
        console.log("ROUTER_ADDRESS=", address(router));
        console.log("FEE_COLLECTOR_ADDRESS=", address(feeCollector));
        console.log("MULTICALL_ADDRESS=", address(multicall));
        console.log("LIMIT_ORDER_ADDRESS=", address(limitOrder));
        console.log("PAIR_CODE_HASH=");
        console.logBytes32(factory.pairCodeHash());
        console.log("========================\n");
    }
}
