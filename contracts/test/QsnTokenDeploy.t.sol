// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/token/QsnTokenDeploy.sol";

contract QsnTokenDeployTest is Test {
    QsnTokenDeploy public token;
    address public owner = address(1);
    address public user = address(2);

    function setUp() public {
        token = new QsnTokenDeploy(owner);
    }

    function testName() public view {
        assertEq(token.name(), "Quantum Security Network");
    }

    function testSymbol() public view {
        assertEq(token.symbol(), "QSN");
    }

    function testDecimals() public view {
        assertEq(token.decimals(), 18);
    }

    function testMaxSupply() public view {
        assertEq(token.MAX_SUPPLY(), 1_000_000_000 * 1e18);
    }

    function testOwner() public view {
        assertEq(token.owner(), owner);
    }

    function testInitialSupplyZero() public view {
        assertEq(token.totalSupply(), 0);
    }

    function testMint() public {
        vm.prank(owner);
        token.mint(user, 1000 * 1e18);
        assertEq(token.balanceOf(user), 1000 * 1e18);
        assertEq(token.totalSupply(), 1000 * 1e18);
    }

    function testMintExceedsMaxSupply() public {
        vm.prank(owner);
        vm.expectRevert("QSN: exceeds max supply");
        token.mint(user, 1_000_000_001 * 1e18);
    }

    function testNonOwnerCannotMint() public {
        vm.prank(user);
        vm.expectRevert();
        token.mint(user, 1000 * 1e18);
    }

    function testBurn() public {
        vm.prank(owner);
        token.mint(user, 1000 * 1e18);

        vm.prank(user);
        token.burn(500 * 1e18);

        assertEq(token.balanceOf(user), 500 * 1e18);
        assertEq(token.totalSupply(), 500 * 1e18);
    }

    function testMintMaxSupply() public {
        vm.prank(owner);
        token.mint(user, 1_000_000_000 * 1e18);
        assertEq(token.totalSupply(), 1_000_000_000 * 1e18);

        vm.prank(owner);
        vm.expectRevert("QSN: exceeds max supply");
        token.mint(user, 1);
    }

    function testTransfer() public {
        vm.prank(owner);
        token.mint(user, 1000 * 1e18);

        vm.prank(user);
        token.transfer(address(3), 300 * 1e18);

        assertEq(token.balanceOf(user), 700 * 1e18);
        assertEq(token.balanceOf(address(3)), 300 * 1e18);
    }
}
