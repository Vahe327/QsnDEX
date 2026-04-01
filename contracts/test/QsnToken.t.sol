// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/token/QsnToken.sol";

contract QsnTokenTest is Test {
    QsnToken public token;
    address public owner;
    address public alice;
    address public bob;

    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        token = new QsnToken(owner);
    }

    // ───── Metadata ─────

    function test_name() public view {
        assertEq(token.name(), "QsnDEX");
    }

    function test_symbol() public view {
        assertEq(token.symbol(), "QSN");
    }

    function test_decimals() public view {
        assertEq(token.decimals(), 18);
    }

    function test_maxSupply() public view {
        assertEq(token.MAX_SUPPLY(), 100_000_000 * 1e18);
    }

    // ───── Minting ─────

    function test_mintByOwner() public {
        uint256 amount = 1_000_000 * 1e18;
        token.mint(alice, amount);
        assertEq(token.balanceOf(alice), amount);
        assertEq(token.totalSupply(), amount);
    }

    function test_mintMultipleTimes() public {
        token.mint(alice, 50_000_000 * 1e18);
        token.mint(bob, 50_000_000 * 1e18);
        assertEq(token.totalSupply(), 100_000_000 * 1e18);
    }

    function test_revert_mintExceedsMaxSupply() public {
        token.mint(alice, 100_000_000 * 1e18);
        vm.expectRevert(
            abi.encodeWithSelector(QsnToken.ExceedsMaxSupply.selector, 1, 0)
        );
        token.mint(alice, 1);
    }

    function test_revert_mintByNonOwner() public {
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        token.mint(alice, 1_000 * 1e18);
    }

    // ───── Burning ─────

    function test_burn() public {
        uint256 amount = 1_000_000 * 1e18;
        token.mint(alice, amount);

        vm.prank(alice);
        token.burn(400_000 * 1e18);

        assertEq(token.balanceOf(alice), 600_000 * 1e18);
        assertEq(token.totalSupply(), 600_000 * 1e18);
    }

    function test_burnFrom() public {
        uint256 amount = 1_000_000 * 1e18;
        token.mint(alice, amount);

        vm.prank(alice);
        token.approve(bob, 500_000 * 1e18);

        vm.prank(bob);
        token.burnFrom(alice, 500_000 * 1e18);

        assertEq(token.balanceOf(alice), 500_000 * 1e18);
    }

    function test_burnFreesSupplyForNewMint() public {
        token.mint(alice, 100_000_000 * 1e18);

        vm.prank(alice);
        token.burn(10_000_000 * 1e18);

        // Can now mint 10 M more
        token.mint(bob, 10_000_000 * 1e18);
        assertEq(token.totalSupply(), 100_000_000 * 1e18);
    }

    // ───── Permit (EIP-2612) ─────

    function test_permit() public {
        uint256 privateKey = 0xBEEF;
        address signer = vm.addr(privateKey);

        token.mint(signer, 1_000 * 1e18);

        uint256 nonce = token.nonces(signer);
        uint256 deadline = block.timestamp + 1 hours;
        uint256 value = 500 * 1e18;

        bytes32 domainSeparator = token.DOMAIN_SEPARATOR();
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"),
                signer,
                bob,
                value,
                nonce,
                deadline
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", domainSeparator, structHash));

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);

        token.permit(signer, bob, value, deadline, v, r, s);
        assertEq(token.allowance(signer, bob), value);
        assertEq(token.nonces(signer), nonce + 1);
    }

    // ───── Votes (delegation) ─────

    function test_votingPowerAfterDelegate() public {
        token.mint(alice, 1_000 * 1e18);

        // No voting power until delegation
        assertEq(token.getVotes(alice), 0);

        vm.prank(alice);
        token.delegate(alice);

        assertEq(token.getVotes(alice), 1_000 * 1e18);
    }

    function test_delegateToAnother() public {
        token.mint(alice, 1_000 * 1e18);

        vm.prank(alice);
        token.delegate(bob);

        assertEq(token.getVotes(alice), 0);
        assertEq(token.getVotes(bob), 1_000 * 1e18);
    }

    function test_votingPowerTracksTransfers() public {
        token.mint(alice, 1_000 * 1e18);

        vm.prank(alice);
        token.delegate(alice);

        vm.prank(alice);
        token.transfer(bob, 400 * 1e18);

        assertEq(token.getVotes(alice), 600 * 1e18);
        // bob has no votes yet (not delegated)
        assertEq(token.getVotes(bob), 0);

        vm.prank(bob);
        token.delegate(bob);
        assertEq(token.getVotes(bob), 400 * 1e18);
    }

    // ───── Ownership ─────

    function test_transferOwnership() public {
        token.transferOwnership(alice);
        assertEq(token.owner(), alice);

        vm.prank(alice);
        token.mint(bob, 1_000 * 1e18);
        assertEq(token.balanceOf(bob), 1_000 * 1e18);
    }
}
