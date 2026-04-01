// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/token/QsnTokenTaiko.sol";

contract DeployQsnTokenTaiko is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address owner = vm.envAddress("TOKEN_OWNER");

        vm.startBroadcast(deployerKey);

        QsnTokenTaiko token = new QsnTokenTaiko(owner);
        token.mint(owner, 1_000_000_000 * 1e18);

        console.log("QSN Token deployed at:", address(token));
        console.log("Name:", token.name());
        console.log("Symbol:", token.symbol());
        console.log("Total Supply: 1,000,000,000 QSN");
        console.log("Owner:", owner);

        vm.stopBroadcast();
    }
}
