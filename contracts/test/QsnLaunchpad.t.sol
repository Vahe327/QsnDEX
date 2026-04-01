// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/launchpad/QsnLaunchpad.sol";
import "../src/core/QsnFactory.sol";
import "../src/periphery/QsnRouter.sol";
import "../src/utils/WETH9.sol";
import "./mocks/MockERC20.sol";

contract QsnLaunchpadTest is Test {
    QsnLaunchpad public launchpad;
    QsnFactory public factory;
    QsnRouter public router;
    WETH9 public weth;
    MockERC20 public saleToken;

    address public platformOwner;
    address public creator;
    address public alice;
    address public bob;

    uint256 constant TOKENS_FOR_SALE = 500_000 * 1e18;
    uint256 constant TOKENS_FOR_LP = 500_000 * 1e18;
    uint256 constant SOFT_CAP = 5 ether;
    uint256 constant HARD_CAP = 10 ether;
    uint256 constant LP_PCT = 5000; // 50 %
    uint256 constant LP_LOCK = 30 days;

    function setUp() public {
        platformOwner = makeAddr("platformOwner");
        creator = makeAddr("creator");
        alice = makeAddr("alice");
        bob = makeAddr("bob");

        // Fund accounts
        vm.deal(creator, 100 ether);
        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(platformOwner, 1 ether);

        // Deploy DEX infrastructure
        factory = new QsnFactory(address(this));
        weth = new WETH9();
        router = new QsnRouter(address(factory), address(weth));

        // Deploy launchpad
        launchpad = new QsnLaunchpad(
            address(router),
            address(factory),
            address(weth),
            platformOwner,
            platformOwner
        );

        // Create sale token and give to creator
        saleToken = new MockERC20("LaunchToken", "LTK", 18);
        saleToken.mint(creator, 1_000_000 * 1e18);

        // Creator approves launchpad
        vm.prank(creator);
        saleToken.approve(address(launchpad), type(uint256).max);
    }

    // ───── Helpers ─────

    function _createDefaultSale() internal returns (uint256 saleId) {
        vm.prank(creator);
        saleId = launchpad.createSale{value: 0.05 ether}(
            address(saleToken),
            TOKENS_FOR_SALE,
            TOKENS_FOR_LP,
            SOFT_CAP,
            HARD_CAP,
            block.timestamp + 1,
            block.timestamp + 1 days,
            LP_PCT,
            LP_LOCK,
            "LaunchToken",
            "A cool token launch",
            "https://example.com/logo.png",
            "https://example.com",
            "https://twitter.com/example"
        );
    }

    function _contributeFull(uint256 saleId) internal {
        vm.warp(block.timestamp + 2); // after start
        vm.prank(alice);
        launchpad.contribute{value: 6 ether}(saleId);
        vm.prank(bob);
        launchpad.contribute{value: 4 ether}(saleId);
    }

    // ───── Create sale ─────

    function test_createSale() public {
        uint256 saleId = _createDefaultSale();
        assertEq(saleId, 0);
        assertEq(launchpad.saleCount(), 1);

        QsnLaunchpad.Sale memory sale = launchpad.getSale(saleId);
        assertEq(sale.creator, creator);
        assertEq(sale.token, address(saleToken));
        assertEq(sale.tokensForSale, TOKENS_FOR_SALE);
        assertEq(sale.tokensForLiquidity, TOKENS_FOR_LP);
        assertEq(sale.softCap, SOFT_CAP);
        assertEq(sale.hardCap, HARD_CAP);
        assertEq(uint256(sale.status), uint256(QsnLaunchpad.SaleStatus.Active));

        // Tokens pulled from creator
        assertEq(saleToken.balanceOf(address(launchpad)), TOKENS_FOR_SALE + TOKENS_FOR_LP);
    }

    function test_revert_createSaleInvalidTime() public {
        vm.prank(creator);
        vm.expectRevert(QsnLaunchpad.InvalidTimeRange.selector);
        launchpad.createSale{value: 0.05 ether}(
            address(saleToken),
            TOKENS_FOR_SALE,
            TOKENS_FOR_LP,
            SOFT_CAP,
            HARD_CAP,
            block.timestamp + 1 days,
            block.timestamp, // end before start
            LP_PCT,
            LP_LOCK,
            "LaunchToken",
            "desc",
            "logo",
            "web",
            "social"
        );
    }

    function test_revert_createSaleInvalidCaps() public {
        vm.prank(creator);
        vm.expectRevert(QsnLaunchpad.InvalidCaps.selector);
        launchpad.createSale{value: 0.05 ether}(
            address(saleToken),
            TOKENS_FOR_SALE,
            TOKENS_FOR_LP,
            11 ether, // soft > hard
            10 ether,
            block.timestamp + 1,
            block.timestamp + 1 days,
            LP_PCT,
            LP_LOCK,
            "LaunchToken",
            "desc",
            "logo",
            "web",
            "social"
        );
    }

    // ───── Contribute ─────

    function test_contribute() public {
        uint256 saleId = _createDefaultSale();
        vm.warp(block.timestamp + 2);

        vm.prank(alice);
        launchpad.contribute{value: 3 ether}(saleId);

        assertEq(launchpad.contributions(saleId, alice), 3 ether);
        QsnLaunchpad.Sale memory sale = launchpad.getSale(saleId);
        assertEq(sale.totalRaised, 3 ether);
    }

    function test_revert_contributeAboveHardCap() public {
        uint256 saleId = _createDefaultSale();
        vm.warp(block.timestamp + 2);

        vm.prank(alice);
        vm.expectRevert(QsnLaunchpad.AboveHardCap.selector);
        launchpad.contribute{value: 11 ether}(saleId);
    }

    function test_revert_contributeBeforeStart() public {
        uint256 saleId = _createDefaultSale();
        // Don't warp — still before startTime

        vm.prank(alice);
        vm.expectRevert(QsnLaunchpad.SaleNotActive.selector);
        launchpad.contribute{value: 1 ether}(saleId);
    }

    function test_revert_contributeZero() public {
        uint256 saleId = _createDefaultSale();
        vm.warp(block.timestamp + 2);

        vm.prank(alice);
        vm.expectRevert(QsnLaunchpad.ZeroContribution.selector);
        launchpad.contribute{value: 0}(saleId);
    }

    // ───── Finalize with LP ─────

    function test_finalizeCreatesLP() public {
        uint256 saleId = _createDefaultSale();
        _contributeFull(saleId);

        // Warp past endTime
        vm.warp(block.timestamp + 2 days);

        uint256 platformBalBefore = platformOwner.balance;
        uint256 creatorBalBefore = creator.balance;

        launchpad.finalize(saleId);

        QsnLaunchpad.Sale memory sale = launchpad.getSale(saleId);
        assertEq(uint256(sale.status), uint256(QsnLaunchpad.SaleStatus.Finalized));
        assertTrue(sale.lpToken != address(0), "LP pair should be created");
        assertTrue(sale.lpUnlockTime > block.timestamp, "LP should be locked");

        // Platform fee = 2 % of 10 ETH = 0.2 ETH
        uint256 platformFee = (10 ether * 200) / 10_000;
        assertEq(platformOwner.balance - platformBalBefore, platformFee);

        // Creator gets (10 ETH - 0.2 fee) * 50% non-LP = 4.9 ETH
        uint256 netRaised = 10 ether - platformFee;
        uint256 ethForCreator = netRaised - (netRaised * LP_PCT / 10_000);
        assertEq(creator.balance - creatorBalBefore, ethForCreator);

        // LP tokens held by launchpad
        uint256 lpBal = IERC20(sale.lpToken).balanceOf(address(launchpad));
        assertTrue(lpBal > 0, "Launchpad should hold LP tokens");
    }

    function test_revert_finalizeBeforeEnd() public {
        uint256 saleId = _createDefaultSale();
        _contributeFull(saleId);

        vm.expectRevert(QsnLaunchpad.SaleStillActive.selector);
        launchpad.finalize(saleId);
    }

    function test_revert_finalizeBelowSoftCap() public {
        uint256 saleId = _createDefaultSale();
        vm.warp(block.timestamp + 2);

        vm.prank(alice);
        launchpad.contribute{value: 1 ether}(saleId); // below 5 ETH soft cap

        vm.warp(block.timestamp + 2 days);

        vm.expectRevert(QsnLaunchpad.BelowSoftCap.selector);
        launchpad.finalize(saleId);
    }

    // ───── Claim tokens ─────

    function test_claimTokens() public {
        uint256 saleId = _createDefaultSale();
        _contributeFull(saleId);
        vm.warp(block.timestamp + 2 days);
        launchpad.finalize(saleId);

        // Alice contributed 6 of 10 ETH → 60 % of tokensForSale
        vm.prank(alice);
        launchpad.claimTokens(saleId);

        uint256 expectedAlice = (TOKENS_FOR_SALE * 6 ether) / 10 ether;
        assertEq(saleToken.balanceOf(alice), expectedAlice);

        // Bob contributed 4 of 10 ETH → 40 %
        vm.prank(bob);
        launchpad.claimTokens(saleId);

        uint256 expectedBob = (TOKENS_FOR_SALE * 4 ether) / 10 ether;
        assertEq(saleToken.balanceOf(bob), expectedBob);
    }

    function test_revert_doubleClaim() public {
        uint256 saleId = _createDefaultSale();
        _contributeFull(saleId);
        vm.warp(block.timestamp + 2 days);
        launchpad.finalize(saleId);

        vm.prank(alice);
        launchpad.claimTokens(saleId);

        vm.prank(alice);
        vm.expectRevert(QsnLaunchpad.AlreadyClaimed.selector);
        launchpad.claimTokens(saleId);
    }

    function test_getClaimable() public {
        uint256 saleId = _createDefaultSale();
        _contributeFull(saleId);
        vm.warp(block.timestamp + 2 days);
        launchpad.finalize(saleId);

        uint256 claimable = launchpad.getClaimable(saleId, alice);
        assertEq(claimable, (TOKENS_FOR_SALE * 6 ether) / 10 ether);
    }

    // ───── Cancel & Refund ─────

    function test_cancelByCreator() public {
        uint256 saleId = _createDefaultSale();
        vm.warp(block.timestamp + 2);

        vm.prank(alice);
        launchpad.contribute{value: 3 ether}(saleId);

        vm.prank(creator);
        launchpad.cancelSale(saleId);

        QsnLaunchpad.Sale memory sale = launchpad.getSale(saleId);
        assertEq(uint256(sale.status), uint256(QsnLaunchpad.SaleStatus.Cancelled));

        // Tokens returned to creator
        assertEq(saleToken.balanceOf(creator), 1_000_000 * 1e18);
    }

    function test_cancelByAnyoneAfterEndBelowSoftCap() public {
        uint256 saleId = _createDefaultSale();
        vm.warp(block.timestamp + 2);

        vm.prank(alice);
        launchpad.contribute{value: 1 ether}(saleId);

        vm.warp(block.timestamp + 2 days);

        // Anyone can cancel if expired + below soft cap
        vm.prank(bob);
        launchpad.cancelSale(saleId);

        QsnLaunchpad.Sale memory sale = launchpad.getSale(saleId);
        assertEq(uint256(sale.status), uint256(QsnLaunchpad.SaleStatus.Cancelled));
    }

    function test_revert_cancelByNonCreatorBeforeEnd() public {
        uint256 saleId = _createDefaultSale();
        vm.warp(block.timestamp + 2);

        vm.prank(bob);
        vm.expectRevert(QsnLaunchpad.NotCreator.selector);
        launchpad.cancelSale(saleId);
    }

    function test_refund() public {
        uint256 saleId = _createDefaultSale();
        vm.warp(block.timestamp + 2);

        vm.prank(alice);
        launchpad.contribute{value: 5 ether}(saleId);

        vm.prank(creator);
        launchpad.cancelSale(saleId);

        uint256 balBefore = alice.balance;
        vm.prank(alice);
        launchpad.refund(saleId);

        assertEq(alice.balance - balBefore, 5 ether);
        assertEq(launchpad.contributions(saleId, alice), 0);
    }

    function test_revert_refundNotCancelled() public {
        uint256 saleId = _createDefaultSale();
        vm.warp(block.timestamp + 2);
        vm.prank(alice);
        launchpad.contribute{value: 5 ether}(saleId);

        vm.prank(alice);
        vm.expectRevert(QsnLaunchpad.SaleNotCancelled.selector);
        launchpad.refund(saleId);
    }

    function test_revert_doubleRefund() public {
        uint256 saleId = _createDefaultSale();
        vm.warp(block.timestamp + 2);
        vm.prank(alice);
        launchpad.contribute{value: 5 ether}(saleId);

        vm.prank(creator);
        launchpad.cancelSale(saleId);

        vm.prank(alice);
        launchpad.refund(saleId);

        vm.prank(alice);
        vm.expectRevert(QsnLaunchpad.ZeroContribution.selector);
        launchpad.refund(saleId);
    }

    // ───── LP Withdrawal ─────

    function test_withdrawLPAfterLock() public {
        uint256 saleId = _createDefaultSale();
        _contributeFull(saleId);
        vm.warp(block.timestamp + 2 days);
        launchpad.finalize(saleId);

        QsnLaunchpad.Sale memory sale = launchpad.getSale(saleId);

        // Try before lock expires
        vm.prank(creator);
        vm.expectRevert(QsnLaunchpad.LPStillLocked.selector);
        launchpad.withdrawLP(saleId);

        // Warp past lock
        vm.warp(sale.lpUnlockTime + 1);

        uint256 lpBalBefore = IERC20(sale.lpToken).balanceOf(creator);
        vm.prank(creator);
        launchpad.withdrawLP(saleId);

        uint256 lpBalAfter = IERC20(sale.lpToken).balanceOf(creator);
        assertTrue(lpBalAfter > lpBalBefore, "Creator should receive LP tokens");
        assertEq(IERC20(sale.lpToken).balanceOf(address(launchpad)), 0);
    }

    function test_revert_withdrawLPNotCreator() public {
        uint256 saleId = _createDefaultSale();
        _contributeFull(saleId);
        vm.warp(block.timestamp + 2 days);
        launchpad.finalize(saleId);

        QsnLaunchpad.Sale memory sale = launchpad.getSale(saleId);
        vm.warp(sale.lpUnlockTime + 1);

        vm.prank(alice);
        vm.expectRevert(QsnLaunchpad.NotCreator.selector);
        launchpad.withdrawLP(saleId);
    }
}
