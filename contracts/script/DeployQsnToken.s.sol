// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/token/QsnTokenDeploy.sol";

contract DeployQsnToken is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address owner = vm.envAddress("TOKEN_OWNER");

        vm.startBroadcast(deployerKey);

        QsnTokenDeploy token = new QsnTokenDeploy(owner);

        console.log("QSN Token deployed at:", address(token));
        console.log("Name:", token.name());
        console.log("Symbol:", token.symbol());
        console.log("Decimals:", token.decimals());
        console.log("Max Supply: 1,000,000,000 QSN");
        console.log("Owner:", owner);

        vm.stopBroadcast();
    }
}
