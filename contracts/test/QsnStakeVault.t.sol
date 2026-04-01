// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/staking/QsnStakeVault.sol";
import "./mocks/MockERC20.sol";

contract QsnStakeVaultTest is Test {
    QsnStakeVault public vault;
    MockERC20 public qsn;
    MockERC20 public weth;

    address public owner;
    address public alice;
    address public bob;
    address public carol;

    uint256 constant STAKE_AMOUNT = 1_000 * 1e18;
    uint256 constant REWARD_AMOUNT = 10 * 1e18;

    function setUp() public {
        owner = address(this);
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        carol = makeAddr("carol");

        qsn = new MockERC20("QsnDEX", "QSN", 18);
        weth = new MockERC20("Wrapped ETH", "WETH", 18);

        vault = new QsnStakeVault(address(qsn), address(weth), owner);

        // Fund users with QSN
        qsn.mint(alice, 10_000 * 1e18);
        qsn.mint(bob, 10_000 * 1e18);
        qsn.mint(carol, 10_000 * 1e18);

        // Fund owner with WETH for rewards
        weth.mint(owner, 1_000 * 1e18);
        weth.approve(address(vault), type(uint256).max);

        // Approve vault for users
        vm.prank(alice);
        qsn.approve(address(vault), type(uint256).max);
        vm.prank(bob);
        qsn.approve(address(vault), type(uint256).max);
        vm.prank(carol);
        qsn.approve(address(vault), type(uint256).max);
    }

    // ───── Staking ─────

    function test_stake() public {
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);

        (uint256 stakedAmount,,,,) = vault.getStakeInfo(alice);
        assertEq(stakedAmount, STAKE_AMOUNT);
        assertEq(vault.totalStaked(), STAKE_AMOUNT);
        assertEq(qsn.balanceOf(address(vault)), STAKE_AMOUNT);
    }

    function test_stakeMultipleUsers() public {
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);

        vm.prank(bob);
        vault.stake(STAKE_AMOUNT * 2);

        assertEq(vault.totalStaked(), STAKE_AMOUNT * 3);
    }

    function test_revert_stakeZero() public {
        vm.prank(alice);
        vm.expectRevert(QsnStakeVault.ZeroAmount.selector);
        vault.stake(0);
    }

    // ───── Withdraw ─────

    function test_withdraw() public {
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);

        vm.prank(alice);
        vault.withdraw(STAKE_AMOUNT / 2);

        (uint256 stakedAmount,,,,) = vault.getStakeInfo(alice);
        assertEq(stakedAmount, STAKE_AMOUNT / 2);
        assertEq(qsn.balanceOf(alice), 10_000 * 1e18 - STAKE_AMOUNT / 2);
    }

    function test_revert_withdrawMoreThanStaked() public {
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(QsnStakeVault.InsufficientStake.selector, STAKE_AMOUNT * 2, STAKE_AMOUNT)
        );
        vault.withdraw(STAKE_AMOUNT * 2);
    }

    function test_revert_withdrawZero() public {
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);

        vm.prank(alice);
        vm.expectRevert(QsnStakeVault.ZeroAmount.selector);
        vault.withdraw(0);
    }

    // ───── Distribute & Claim Rewards ─────

    function test_distributeRewards() public {
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);

        vault.distributeRewards(REWARD_AMOUNT);

        assertEq(weth.balanceOf(address(vault)), REWARD_AMOUNT);
        assertTrue(vault.rewardRate() > 0);
        assertEq(vault.periodFinish(), block.timestamp + 7 days);
    }

    function test_claimRewardAfterFullPeriod() public {
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);

        vault.distributeRewards(REWARD_AMOUNT);

        // Warp to end of reward period
        vm.warp(block.timestamp + 7 days + 1);

        vm.prank(alice);
        vault.claimReward();

        // Alice should receive close to full reward (rounding may lose a dust amount)
        uint256 aliceWeth = weth.balanceOf(alice);
        assertApproxEqAbs(aliceWeth, REWARD_AMOUNT, 1e15); // within 0.001 WETH
    }

    function test_claimRewardPartialPeriod() public {
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);

        vault.distributeRewards(REWARD_AMOUNT);

        // Warp 50 % through
        vm.warp(block.timestamp + 3.5 days);

        vm.prank(alice);
        vault.claimReward();

        uint256 aliceWeth = weth.balanceOf(alice);
        assertApproxEqAbs(aliceWeth, REWARD_AMOUNT / 2, 1e15);
    }

    function test_multipleStakersProportionalReward() public {
        // Alice stakes 1x, Bob stakes 2x
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);

        vm.prank(bob);
        vault.stake(STAKE_AMOUNT * 2);

        vault.distributeRewards(REWARD_AMOUNT);

        vm.warp(block.timestamp + 7 days + 1);

        vm.prank(alice);
        vault.claimReward();
        vm.prank(bob);
        vault.claimReward();

        uint256 aliceWeth = weth.balanceOf(alice);
        uint256 bobWeth = weth.balanceOf(bob);

        // Alice should get ~1/3, Bob ~2/3
        assertApproxEqAbs(aliceWeth, REWARD_AMOUNT / 3, 1e15);
        assertApproxEqAbs(bobWeth, (REWARD_AMOUNT * 2) / 3, 1e15);
    }

    function test_lateStakerGetsProportionalReward() public {
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);

        vault.distributeRewards(REWARD_AMOUNT);

        // Bob stakes halfway through
        vm.warp(block.timestamp + 3.5 days);
        vm.prank(bob);
        vault.stake(STAKE_AMOUNT);

        // Finish period
        vm.warp(block.timestamp + 3.5 days + 1);

        vm.prank(alice);
        vault.claimReward();
        vm.prank(bob);
        vault.claimReward();

        uint256 aliceWeth = weth.balanceOf(alice);
        uint256 bobWeth = weth.balanceOf(bob);

        // Alice earns all rewards for first half, then 50 % for second half
        // = 50% + 25% = 75%
        // Bob earns 50% of second half = 25%
        assertApproxEqAbs(aliceWeth, (REWARD_AMOUNT * 75) / 100, 1e15);
        assertApproxEqAbs(bobWeth, (REWARD_AMOUNT * 25) / 100, 1e15);
    }

    // ───── Exit ─────

    function test_exit() public {
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);

        vault.distributeRewards(REWARD_AMOUNT);
        vm.warp(block.timestamp + 7 days + 1);

        vm.prank(alice);
        vault.exit();

        assertEq(qsn.balanceOf(alice), 10_000 * 1e18);
        assertApproxEqAbs(weth.balanceOf(alice), REWARD_AMOUNT, 1e15);
        assertEq(vault.totalStaked(), 0);
    }

    // ───── Duration ─────

    function test_setRewardsDuration() public {
        vault.setRewardsDuration(14 days);
        assertEq(vault.rewardsDuration(), 14 days);
    }

    function test_revert_setDurationDuringActivePeriod() public {
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);
        vault.distributeRewards(REWARD_AMOUNT);

        vm.expectRevert(QsnStakeVault.RewardPeriodNotFinished.selector);
        vault.setRewardsDuration(14 days);
    }

    // ───── Edge cases ─────

    function test_distributeRewardsStacking() public {
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);

        vault.distributeRewards(REWARD_AMOUNT);

        // Halfway through, distribute more
        vm.warp(block.timestamp + 3.5 days);
        vault.distributeRewards(REWARD_AMOUNT);

        // Full period from second distribution
        vm.warp(block.timestamp + 7 days + 1);

        vm.prank(alice);
        vault.claimReward();

        uint256 aliceWeth = weth.balanceOf(alice);
        // Should receive close to 2x REWARD_AMOUNT (first half + remaining from first + second)
        assertApproxEqAbs(aliceWeth, REWARD_AMOUNT * 2, 1e15);
    }

    function test_revert_distributeZero() public {
        vm.expectRevert(QsnStakeVault.ZeroAmount.selector);
        vault.distributeRewards(0);
    }

    function test_revert_distributeNoStakers() public {
        vm.expectRevert("QsnStakeVault: NO_STAKERS");
        vault.distributeRewards(REWARD_AMOUNT);
    }

    function test_noRewardWhenStakingAfterPeriod() public {
        // Stake first so distributeRewards succeeds
        vm.prank(alice);
        vault.stake(STAKE_AMOUNT);
        vault.distributeRewards(REWARD_AMOUNT);

        // Alice exits, period still running
        vm.prank(alice);
        vault.exit();

        vm.warp(block.timestamp + 7 days + 1);

        // Bob stakes after period — should have zero earned
        vm.prank(bob);
        vault.stake(STAKE_AMOUNT);
        assertEq(vault.earned(bob), 0);
    }
}
