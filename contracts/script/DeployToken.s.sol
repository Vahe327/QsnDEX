// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/token/QsnToken.sol";
import "../src/staking/QsnStakeVault.sol";
import "../src/launchpad/QsnLaunchpad.sol";

/// @title DeployToken — Deploys QsnToken, QsnStakeVault, and QsnLaunchpad
/// @notice Requires DEPLOYER_PRIVATE_KEY, ROUTER_ADDRESS, FACTORY_ADDRESS, WETH_ADDRESS env vars
contract DeployTokenScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address routerAddr = vm.envAddress("ROUTER_ADDRESS");
        address factoryAddr = vm.envAddress("FACTORY_ADDRESS");
        address wethAddr = vm.envAddress("WETH_ADDRESS");

        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy QSN Token
        QsnToken qsn = new QsnToken(deployer);
        console.log("QsnToken deployed at:", address(qsn));

        // 2. Deploy StakeVault (QSN staked, WETH rewarded)
        QsnStakeVault vault = new QsnStakeVault(address(qsn), wethAddr, deployer);
        console.log("QsnStakeVault deployed at:", address(vault));

        // 3. Deploy Launchpad
        QsnLaunchpad launchpad = new QsnLaunchpad(routerAddr, factoryAddr, wethAddr, deployer, deployer);
        console.log("QsnLaunchpad deployed at:", address(launchpad));

        // 4. Mint initial supply to deployer (e.g. 10 % for team/treasury)
        uint256 initialMint = 10_000_000 * 1e18; // 10 M QSN
        qsn.mint(deployer, initialMint);
        console.log("Minted initial QSN:", initialMint / 1e18);

        vm.stopBroadcast();

        console.log("\n=== TOKEN DEPLOYMENT SUMMARY ===");
        console.log("QSN_TOKEN_ADDRESS=", address(qsn));
        console.log("STAKE_VAULT_ADDRESS=", address(vault));
        console.log("LAUNCHPAD_ADDRESS=", address(launchpad));
        console.log("================================\n");
    }
}
