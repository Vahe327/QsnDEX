// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/staking/QsnStakingFactory.sol";
import "../src/staking/QsnStakingPool.sol";
import "./mocks/MockERC20.sol";

contract QsnStakingFactoryTest is Test {
    QsnStakingFactory public factory;
    MockERC20 public stakeToken;
    MockERC20 public rewardToken;
    MockERC20 public altRewardToken;

    address public owner;
    address public feeRecipient;
    address public alice;
    address public bob;
    address public carol;

    uint256 constant REWARD_AMOUNT = 10_000 * 1e18;
    uint256 constant STAKE_AMOUNT = 1_000 * 1e18;
    uint256 constant DURATION_DAYS = 7;
    uint256 constant MIN_STAKE = 100 * 1e18;
    uint256 constant MAX_STAKE_PER_USER = 5_000 * 1e18;
    uint256 constant CREATE_FEE = 0.01 ether;

    function setUp() public {
        owner = address(this);
        feeRecipient = makeAddr("feeRecipient");
        alice = makeAddr("alice");
        bob = makeAddr("bob");
        carol = makeAddr("carol");

        vm.deal(alice, 100 ether);
        vm.deal(bob, 100 ether);
        vm.deal(carol, 100 ether);

        stakeToken = new MockERC20("Stake Token", "STK", 18);
        rewardToken = new MockERC20("Reward Token", "RWD", 18);
        altRewardToken = new MockERC20("Alt Reward", "ALT", 18);

        factory = new QsnStakingFactory(owner, feeRecipient);

        // Fund alice with reward tokens for pool creation
        rewardToken.mint(alice, 100_000 * 1e18);
        altRewardToken.mint(alice, 100_000 * 1e18);
        rewardToken.mint(bob, 100_000 * 1e18);

        // Fund users with stake tokens
        stakeToken.mint(alice, 100_000 * 1e18);
        stakeToken.mint(bob, 100_000 * 1e18);
        stakeToken.mint(carol, 100_000 * 1e18);
    }

    // ───── Helpers ─────

    function _createDefaultPool() internal returns (address pool) {
        vm.startPrank(alice);
        rewardToken.approve(address(factory), REWARD_AMOUNT);
        pool = factory.createPool{value: CREATE_FEE}(
            address(stakeToken),
            address(rewardToken),
            REWARD_AMOUNT,
            DURATION_DAYS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
    }

    // ───── testCreatePool ─────

    function testCreatePool() public {
        address pool = _createDefaultPool();

        assertTrue(pool != address(0), "Pool should be deployed");
        assertTrue(factory.isPool(pool), "Pool should be registered");
        assertEq(factory.allPoolsLength(), 1);
        assertEq(factory.getPoolsLength(address(stakeToken), address(rewardToken)), 1);
        assertEq(factory.creatorPoolsLength(alice), 1);
        assertEq(factory.allPools(0), pool);

        QsnStakingPool p = QsnStakingPool(pool);
        assertEq(address(p.stakeToken()), address(stakeToken));
        assertEq(address(p.rewardToken()), address(rewardToken));
        assertEq(p.creator(), alice);
        assertEq(p.factory(), address(factory));
        assertEq(p.duration(), DURATION_DAYS * 1 days);
        assertEq(p.minStake(), MIN_STAKE);
        assertEq(p.maxStakePerUser(), MAX_STAKE_PER_USER);
        assertTrue(p.rewardRate() > 0, "Reward rate should be set");
        assertEq(p.periodFinish(), block.timestamp + DURATION_DAYS * 1 days);
    }

    // ───── testCreatePoolFee ─────

    function testCreatePoolFee() public {
        uint256 feeRecipientBalBefore = feeRecipient.balance;

        _createDefaultPool();

        uint256 feeRecipientBalAfter = feeRecipient.balance;
        assertEq(feeRecipientBalAfter - feeRecipientBalBefore, CREATE_FEE);
    }

    function testCreatePoolFeeReverts() public {
        vm.startPrank(alice);
        rewardToken.approve(address(factory), REWARD_AMOUNT);
        vm.expectRevert(
            abi.encodeWithSelector(
                QsnStakingFactory.InsufficientETHFee.selector,
                0.005 ether,
                CREATE_FEE
            )
        );
        factory.createPool{value: 0.005 ether}(
            address(stakeToken),
            address(rewardToken),
            REWARD_AMOUNT,
            DURATION_DAYS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
    }

    // ───── testPlatformRewardCut ─────

    function testPlatformRewardCut() public {
        uint256 feeRecipientRewardBefore = rewardToken.balanceOf(feeRecipient);

        address pool = _createDefaultPool();

        uint256 feeRecipientRewardAfter = rewardToken.balanceOf(feeRecipient);
        uint256 expectedCut = (REWARD_AMOUNT * 200) / 10_000; // 2%
        assertEq(feeRecipientRewardAfter - feeRecipientRewardBefore, expectedCut);

        // Pool should have received net reward
        uint256 netReward = REWARD_AMOUNT - expectedCut;
        assertEq(rewardToken.balanceOf(pool), netReward);
    }

    // ───── testStakeAndEarn ─────

    function testStakeAndEarn() public {
        address pool = _createDefaultPool();
        QsnStakingPool p = QsnStakingPool(pool);

        vm.startPrank(bob);
        stakeToken.approve(pool, STAKE_AMOUNT);
        p.stake(STAKE_AMOUNT);
        vm.stopPrank();

        // Warp 1 day
        vm.warp(block.timestamp + 1 days);

        uint256 pendingReward = p.earned(bob);
        assertTrue(pendingReward > 0, "Should have earned rewards after 1 day");

        // Warp to end
        vm.warp(block.timestamp + 6 days + 1);

        uint256 netReward = REWARD_AMOUNT - (REWARD_AMOUNT * 200) / 10_000;
        uint256 finalEarned = p.earned(bob);
        assertApproxEqAbs(finalEarned, netReward, 1e15);
    }

    // ───── testWithdraw ─────

    function testWithdraw() public {
        address pool = _createDefaultPool();
        QsnStakingPool p = QsnStakingPool(pool);

        vm.startPrank(bob);
        stakeToken.approve(pool, STAKE_AMOUNT);
        p.stake(STAKE_AMOUNT);

        uint256 balBefore = stakeToken.balanceOf(bob);
        p.withdraw(STAKE_AMOUNT / 2);
        uint256 balAfter = stakeToken.balanceOf(bob);
        vm.stopPrank();

        assertEq(balAfter - balBefore, STAKE_AMOUNT / 2);
        (uint256 stakedAmount,,) = p.getUserInfo(bob);
        assertEq(stakedAmount, STAKE_AMOUNT / 2);
    }

    // ───── testClaimReward ─────

    function testClaimReward() public {
        address pool = _createDefaultPool();
        QsnStakingPool p = QsnStakingPool(pool);

        vm.startPrank(bob);
        stakeToken.approve(pool, STAKE_AMOUNT);
        p.stake(STAKE_AMOUNT);
        vm.stopPrank();

        vm.warp(block.timestamp + 7 days + 1);

        uint256 rewardBalBefore = rewardToken.balanceOf(bob);
        vm.prank(bob);
        p.claimReward();
        uint256 rewardBalAfter = rewardToken.balanceOf(bob);

        uint256 netReward = REWARD_AMOUNT - (REWARD_AMOUNT * 200) / 10_000;
        assertApproxEqAbs(rewardBalAfter - rewardBalBefore, netReward, 1e15);
    }

    // ───── testExit ─────

    function testExit() public {
        address pool = _createDefaultPool();
        QsnStakingPool p = QsnStakingPool(pool);

        vm.startPrank(bob);
        stakeToken.approve(pool, STAKE_AMOUNT);
        p.stake(STAKE_AMOUNT);
        vm.stopPrank();

        vm.warp(block.timestamp + 7 days + 1);

        uint256 stakeBalBefore = stakeToken.balanceOf(bob);
        uint256 rewardBalBefore = rewardToken.balanceOf(bob);

        vm.prank(bob);
        p.exit();

        uint256 stakeBalAfter = stakeToken.balanceOf(bob);
        uint256 rewardBalAfter = rewardToken.balanceOf(bob);

        assertEq(stakeBalAfter - stakeBalBefore, STAKE_AMOUNT);
        uint256 netReward = REWARD_AMOUNT - (REWARD_AMOUNT * 200) / 10_000;
        assertApproxEqAbs(rewardBalAfter - rewardBalBefore, netReward, 1e15);

        (uint256 stakedAmount,,) = p.getUserInfo(bob);
        assertEq(stakedAmount, 0);
        assertEq(p.totalStaked(), 0);
    }

    // ───── testMinStake ─────

    function testMinStake() public {
        address pool = _createDefaultPool();
        QsnStakingPool p = QsnStakingPool(pool);

        vm.startPrank(bob);
        stakeToken.approve(pool, MIN_STAKE - 1);
        vm.expectRevert(
            abi.encodeWithSelector(
                QsnStakingPool.BelowMinStake.selector,
                MIN_STAKE - 1,
                MIN_STAKE
            )
        );
        p.stake(MIN_STAKE - 1);
        vm.stopPrank();

        // Exactly minStake should work
        vm.startPrank(bob);
        stakeToken.approve(pool, MIN_STAKE);
        p.stake(MIN_STAKE);
        vm.stopPrank();

        (uint256 stakedAmount,,) = p.getUserInfo(bob);
        assertEq(stakedAmount, MIN_STAKE);
    }

    // ───── testMaxStakePerUser ─────

    function testMaxStakePerUser() public {
        address pool = _createDefaultPool();
        QsnStakingPool p = QsnStakingPool(pool);

        vm.startPrank(bob);
        stakeToken.approve(pool, MAX_STAKE_PER_USER + MIN_STAKE);

        // Stake up to max
        p.stake(MAX_STAKE_PER_USER);

        // Try to stake more
        vm.expectRevert(
            abi.encodeWithSelector(
                QsnStakingPool.ExceedsMaxStake.selector,
                MAX_STAKE_PER_USER + MIN_STAKE,
                MAX_STAKE_PER_USER
            )
        );
        p.stake(MIN_STAKE);
        vm.stopPrank();
    }

    // ───── testMultiplePools ─────

    function testMultiplePools() public {
        address pool1 = _createDefaultPool();

        // Create second pool with different reward token
        vm.startPrank(alice);
        altRewardToken.approve(address(factory), REWARD_AMOUNT);
        address pool2 = factory.createPool{value: CREATE_FEE}(
            address(stakeToken),
            address(altRewardToken),
            REWARD_AMOUNT,
            DURATION_DAYS,
            0, // no minStake
            0  // no maxStakePerUser
        );
        vm.stopPrank();

        assertEq(factory.allPoolsLength(), 2);
        assertTrue(pool1 != pool2);
        assertTrue(factory.isPool(pool1));
        assertTrue(factory.isPool(pool2));
        assertEq(factory.creatorPoolsLength(alice), 2);
        assertEq(factory.getPoolsLength(address(stakeToken), address(rewardToken)), 1);
        assertEq(factory.getPoolsLength(address(stakeToken), address(altRewardToken)), 1);
    }

    // ───── testPoolEnds ─────

    function testPoolEnds() public {
        address pool = _createDefaultPool();
        QsnStakingPool p = QsnStakingPool(pool);

        vm.startPrank(bob);
        stakeToken.approve(pool, STAKE_AMOUNT);
        p.stake(STAKE_AMOUNT);
        vm.stopPrank();

        // Warp past end
        vm.warp(block.timestamp + 8 days);

        // No more rewards accrue after period ends
        uint256 earnedAtEnd = p.earned(bob);

        vm.warp(block.timestamp + 30 days);
        uint256 earnedLater = p.earned(bob);

        assertEq(earnedAtEnd, earnedLater, "No additional rewards after period ends");

        // remainingRewards should be 0
        assertEq(p.remainingRewards(), 0);

        // estimatedAPR should be 0
        assertEq(p.estimatedAPRBps(), 0);
    }

    // ───── testOnlyFactoryCanNotify ─────

    function testOnlyFactoryCanNotify() public {
        address pool = _createDefaultPool();
        QsnStakingPool p = QsnStakingPool(pool);

        rewardToken.mint(bob, REWARD_AMOUNT);
        vm.startPrank(bob);
        rewardToken.approve(pool, REWARD_AMOUNT);
        vm.expectRevert(QsnStakingPool.OnlyFactory.selector);
        p.notifyRewardAmount(REWARD_AMOUNT);
        vm.stopPrank();
    }

    // ───── View function tests ─────

    function testGetPoolInfo() public {
        address pool = _createDefaultPool();
        QsnStakingPool p = QsnStakingPool(pool);

        (
            address _stakeToken,
            address _rewardToken,
            uint256 _totalStaked,
            uint256 _rewardRate,
            uint256 _periodFinish,
            uint256 _duration,
            uint256 _minStake,
            uint256 _maxStakePerUser,
            address _creator
        ) = p.getPoolInfo();

        assertEq(_stakeToken, address(stakeToken));
        assertEq(_rewardToken, address(rewardToken));
        assertEq(_totalStaked, 0);
        assertTrue(_rewardRate > 0);
        assertEq(_periodFinish, block.timestamp + DURATION_DAYS * 1 days);
        assertEq(_duration, DURATION_DAYS * 1 days);
        assertEq(_minStake, MIN_STAKE);
        assertEq(_maxStakePerUser, MAX_STAKE_PER_USER);
        assertEq(_creator, alice);
    }

    function testEstimatedAPR() public {
        address pool = _createDefaultPool();
        QsnStakingPool p = QsnStakingPool(pool);

        vm.startPrank(bob);
        stakeToken.approve(pool, STAKE_AMOUNT);
        p.stake(STAKE_AMOUNT);
        vm.stopPrank();

        uint256 apr = p.estimatedAPRBps();
        assertTrue(apr > 0, "APR should be positive when staked");
    }

    // ───── Admin tests ─────

    function testSetCreatePoolFee() public {
        factory.setCreatePoolFee(0.05 ether);
        assertEq(factory.createPoolFeeETH(), 0.05 ether);
    }

    function testSetPlatformRewardFee() public {
        factory.setPlatformRewardFee(500); // 5%
        assertEq(factory.platformRewardFeeBps(), 500);
    }

    function testSetPlatformRewardFeeMaxCap() public {
        vm.expectRevert(
            abi.encodeWithSelector(QsnStakingFactory.InvalidFeeBps.selector, 1001)
        );
        factory.setPlatformRewardFee(1001);
    }

    function testSetFeeRecipient() public {
        address newRecipient = makeAddr("newRecipient");
        factory.setFeeRecipient(newRecipient);
        assertEq(factory.feeRecipient(), newRecipient);
    }

    function testSetFeeRecipientZeroReverts() public {
        vm.expectRevert(QsnStakingFactory.ZeroAddress.selector);
        factory.setFeeRecipient(address(0));
    }

    function testSameTokenReverts() public {
        vm.startPrank(alice);
        rewardToken.approve(address(factory), REWARD_AMOUNT);
        vm.expectRevert(QsnStakingFactory.SameToken.selector);
        factory.createPool{value: CREATE_FEE}(
            address(stakeToken),
            address(stakeToken),
            REWARD_AMOUNT,
            DURATION_DAYS,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
    }

    function testZeroDurationReverts() public {
        vm.startPrank(alice);
        rewardToken.approve(address(factory), REWARD_AMOUNT);
        vm.expectRevert(QsnStakingFactory.ZeroDuration.selector);
        factory.createPool{value: CREATE_FEE}(
            address(stakeToken),
            address(rewardToken),
            REWARD_AMOUNT,
            0,
            MIN_STAKE,
            MAX_STAKE_PER_USER
        );
        vm.stopPrank();
    }

    // ───── Multiple stakers proportional reward ─────

    function testMultipleStakersProportional() public {
        address pool = _createDefaultPool();
        QsnStakingPool p = QsnStakingPool(pool);

        uint256 bobBefore = rewardToken.balanceOf(bob);
        uint256 carolBefore = rewardToken.balanceOf(carol);

        // Bob stakes 1x, carol stakes 2x
        vm.startPrank(bob);
        stakeToken.approve(pool, STAKE_AMOUNT);
        p.stake(STAKE_AMOUNT);
        vm.stopPrank();

        vm.startPrank(carol);
        stakeToken.approve(pool, STAKE_AMOUNT * 2);
        p.stake(STAKE_AMOUNT * 2);
        vm.stopPrank();

        vm.warp(block.timestamp + 7 days + 1);

        vm.prank(bob);
        p.claimReward();
        vm.prank(carol);
        p.claimReward();

        uint256 netReward = REWARD_AMOUNT - (REWARD_AMOUNT * 200) / 10_000;
        uint256 bobReward = rewardToken.balanceOf(bob) - bobBefore;
        uint256 carolReward = rewardToken.balanceOf(carol) - carolBefore;

        // Bob should get ~1/3, Carol ~2/3 (5% tolerance for rounding)
        assertApproxEqRel(bobReward, netReward / 3, 0.05e18);
        assertApproxEqRel(carolReward, (netReward * 2) / 3, 0.05e18);
    }
}
