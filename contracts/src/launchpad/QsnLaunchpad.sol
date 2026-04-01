// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IQsnFactory} from "../interfaces/IQsnFactory.sol";
import {IQsnRouter} from "../interfaces/IQsnRouter.sol";
import {IQsnERC20} from "../interfaces/IQsnERC20.sol";

/// @title QsnLaunchpad — Fair token launch platform on QsnDEX
/// @notice Creators deposit tokens, contributors send ETH.
///         On finalization the contract auto-creates a QsnDEX liquidity pool,
///         locks the LP tokens, and distributes sale tokens to contributors.
contract QsnLaunchpad is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ───── Constants ─────

    /// @notice Platform fee: 2 % of ETH raised
    uint256 public constant PLATFORM_FEE_BPS = 200;
    uint256 private constant BPS_DENOMINATOR = 10_000;
    /// @notice Standard fee tier for auto-created liquidity
    uint24 public constant LP_FEE_TIER = 3000;
    /// @notice ETH fee required to create a new sale
    uint256 public createSaleFeeETH = 0.05 ether;

    // ───── Immutables ─────

    IQsnRouter public immutable router;
    IQsnFactory public immutable factory;
    address public immutable weth;
    address public feeRecipient;

    // ───── Types ─────

    enum SaleStatus { Active, Finalized, Cancelled }

    struct Sale {
        address creator;
        address token;
        uint256 tokenAmount;        // total tokens deposited for sale
        uint256 tokensForSale;      // tokens allocated to contributors
        uint256 tokensForLiquidity; // tokens allocated to initial LP
        uint256 softCap;            // minimum ETH to succeed
        uint256 hardCap;            // maximum ETH accepted
        uint256 startTime;
        uint256 endTime;
        uint256 liquidityPct;       // % of raised ETH going to LP (in BPS, e.g. 5000 = 50%)
        uint256 lpLockDuration;     // seconds the LP tokens are locked after finalization
        uint256 totalRaised;
        SaleStatus status;
        address lpToken;            // pair address once created
        uint256 lpUnlockTime;       // timestamp when creator can withdraw LP
        string name;                // project name
        string description;         // project description
        string logoUrl;             // project logo URL
        string websiteUrl;          // project website
        string socialUrl;           // project social link
    }

    // ───── Storage ─────

    uint256 public saleCount;
    mapping(uint256 => Sale) public sales;
    /// saleId => contributor => ETH contributed
    mapping(uint256 => mapping(address => uint256)) public contributions;
    /// saleId => contributor => tokens claimed?
    mapping(uint256 => mapping(address => bool)) public claimed;
    /// saleId => number of unique contributors
    mapping(uint256 => uint256) public participantCount;

    // ───── Events ─────

    event SaleCreated(
        uint256 indexed saleId,
        address indexed creator,
        address indexed token,
        uint256 tokensForSale,
        uint256 softCap,
        uint256 hardCap,
        uint256 startTime,
        uint256 endTime
    );
    event Contributed(uint256 indexed saleId, address indexed contributor, uint256 amount);
    event SaleFinalized(uint256 indexed saleId, uint256 totalRaised, address lpToken);
    event TokensClaimed(uint256 indexed saleId, address indexed contributor, uint256 amount);
    event SaleCancelled(uint256 indexed saleId);
    event Refunded(uint256 indexed saleId, address indexed contributor, uint256 amount);
    event LPWithdrawn(uint256 indexed saleId, address indexed creator, uint256 lpAmount);

    // ───── Errors ─────

    error InvalidTimeRange();
    error InvalidCaps();
    error InvalidLiquidityPct();
    error InvalidTokenAmounts();
    error SaleNotActive();
    error SaleNotEnded();
    error SaleStillActive();
    error SaleNotCancelled();
    error SaleNotFinalized();
    error BelowSoftCap();
    error AboveHardCap();
    error AlreadyClaimed();
    error LPStillLocked();
    error NotCreator();
    error ZeroContribution();
    error TransferFailed();
    error InsufficientCreationFee(uint256 sent, uint256 required);
    error ZeroFeeRecipient();
    error GracePeriodNotOver();
    error InsufficientTokensReceived();

    // ───── Constructor ─────

    constructor(
        address _router,
        address _factory,
        address _weth,
        address _owner,
        address _feeRecipient
    ) Ownable(_owner) {
        router = IQsnRouter(_router);
        factory = IQsnFactory(_factory);
        weth = _weth;
        feeRecipient = _feeRecipient;
    }

    // ───── Sale lifecycle ─────

    /// @notice Create a new token sale
    /// @param token            ERC20 token being launched
    /// @param tokensForSale    Tokens allocated to contributors
    /// @param tokensForLiquidity Tokens reserved for auto-LP creation
    /// @param softCap          Minimum ETH (wei) for sale to succeed
    /// @param hardCap          Maximum ETH (wei) accepted
    /// @param startTime        Unix timestamp when sale begins
    /// @param endTime          Unix timestamp when sale ends
    /// @param liquidityPct     BPS of raised ETH that goes to LP (e.g. 5000 = 50 %)
    /// @param lpLockDuration   Seconds LP tokens are locked after finalization
    /// @param _name            Project name
    /// @param _description     Project description
    /// @param _logoUrl         Logo URL
    /// @param _websiteUrl      Website URL
    /// @param _socialUrl       Social media URL
    function createSale(
        address token,
        uint256 tokensForSale,
        uint256 tokensForLiquidity,
        uint256 softCap,
        uint256 hardCap,
        uint256 startTime,
        uint256 endTime,
        uint256 liquidityPct,
        uint256 lpLockDuration,
        string calldata _name,
        string calldata _description,
        string calldata _logoUrl,
        string calldata _websiteUrl,
        string calldata _socialUrl
    ) external payable nonReentrant returns (uint256 saleId) {
        if (msg.value < createSaleFeeETH) revert InsufficientCreationFee(msg.value, createSaleFeeETH);
        if (startTime >= endTime || startTime < block.timestamp) revert InvalidTimeRange();
        if (softCap == 0 || softCap > hardCap) revert InvalidCaps();
        if (liquidityPct == 0 || liquidityPct > BPS_DENOMINATOR) revert InvalidLiquidityPct();
        if (tokensForSale == 0 || tokensForLiquidity == 0) revert InvalidTokenAmounts();
        require(lpLockDuration >= 30 days, "QsnLaunchpad: MIN_LP_LOCK_30_DAYS");

        uint256 totalTokens = tokensForSale + tokensForLiquidity;

        saleId = saleCount;
        saleCount++;

        sales[saleId] = Sale({
            creator: msg.sender,
            token: token,
            tokenAmount: totalTokens,
            tokensForSale: tokensForSale,
            tokensForLiquidity: tokensForLiquidity,
            softCap: softCap,
            hardCap: hardCap,
            startTime: startTime,
            endTime: endTime,
            liquidityPct: liquidityPct,
            lpLockDuration: lpLockDuration,
            totalRaised: 0,
            status: SaleStatus.Active,
            lpToken: address(0),
            lpUnlockTime: 0,
            name: _name,
            description: _description,
            logoUrl: _logoUrl,
            websiteUrl: _websiteUrl,
            socialUrl: _socialUrl
        });

        // Pull tokens from creator — measure actual received for fee-on-transfer safety (F13)
        uint256 balBefore = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalTokens);
        uint256 received = IERC20(token).balanceOf(address(this)) - balBefore;
        if (received < totalTokens) revert InsufficientTokensReceived();

        // Forward creation fee to feeRecipient, refund excess ETH (F14)
        if (createSaleFeeETH > 0 && feeRecipient != address(0)) {
            (bool feeOk,) = feeRecipient.call{value: createSaleFeeETH}("");
            if (!feeOk) revert TransferFailed();
        }
        uint256 excessETH = msg.value - createSaleFeeETH;
        if (excessETH > 0) {
            (bool refundOk,) = msg.sender.call{value: excessETH}("");
            if (!refundOk) revert TransferFailed();
        }

        emit SaleCreated(saleId, msg.sender, token, tokensForSale, softCap, hardCap, startTime, endTime);
    }

    /// @notice Update the sale creation fee (owner only)
    function setCreateSaleFee(uint256 newFee) external onlyOwner {
        createSaleFeeETH = newFee;
    }

    /// @notice Update the fee recipient (owner only)
    function setFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert ZeroFeeRecipient();
        feeRecipient = newRecipient;
    }

    /// @notice Contribute ETH to an active sale
    function contribute(uint256 saleId) external payable nonReentrant {
        Sale storage sale = sales[saleId];
        if (sale.status != SaleStatus.Active) revert SaleNotActive();
        if (block.timestamp < sale.startTime || block.timestamp > sale.endTime) revert SaleNotActive();
        if (msg.value == 0) revert ZeroContribution();
        if (sale.totalRaised + msg.value > sale.hardCap) revert AboveHardCap();

        // Track unique participants
        if (contributions[saleId][msg.sender] == 0) {
            participantCount[saleId]++;
        }

        sale.totalRaised += msg.value;
        contributions[saleId][msg.sender] += msg.value;

        emit Contributed(saleId, msg.sender, msg.value);
    }

    /// @notice Finalize a successful sale: take fee, create LP, record LP lock
    function finalize(uint256 saleId) external nonReentrant {
        Sale storage sale = sales[saleId];
        if (sale.status != SaleStatus.Active) revert SaleNotActive();
        if (block.timestamp <= sale.endTime) revert SaleStillActive();
        if (sale.totalRaised < sale.softCap) revert BelowSoftCap();

        sale.status = SaleStatus.Finalized;

        // --- Platform fee (2 %) ---
        uint256 platformFee = (sale.totalRaised * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netRaised = sale.totalRaised - platformFee;

        // Send platform fee to feeRecipient (F12)
        if (platformFee > 0) {
            (bool feeOk,) = feeRecipient.call{value: platformFee}("");
            if (!feeOk) revert TransferFailed();
        }

        // --- Auto-liquidity on QsnDEX ---
        uint256 ethForLP = (netRaised * sale.liquidityPct) / BPS_DENOMINATOR;
        uint256 ethForCreator = netRaised - ethForLP;

        // Send creator share
        if (ethForCreator > 0) {
            (bool creatorOk,) = sale.creator.call{value: ethForCreator}("");
            if (!creatorOk) revert TransferFailed();
        }

        // Approve tokens for router, then add liquidity
        if (ethForLP > 0 && sale.tokensForLiquidity > 0) {
            IERC20(sale.token).approve(address(router), sale.tokensForLiquidity);

            // Determine minimum amounts to prevent front-running price manipulation
            uint256 amountTokenMin;
            uint256 amountETHMin;
            address existingPair = factory.getPair(sale.token, weth, LP_FEE_TIER);
            if (existingPair == address(0)) {
                // Pair doesn't exist yet — first deposit, so desired amounts are exact
                amountTokenMin = sale.tokensForLiquidity;
                amountETHMin = ethForLP;
            } else {
                // Pair already exists — enforce 5% slippage tolerance based on our intended ratio
                amountTokenMin = (sale.tokensForLiquidity * 95) / 100;
                amountETHMin = (ethForLP * 95) / 100;
            }

            (,, uint256 liquidity) = router.addLiquidityETH{value: ethForLP}(
                sale.token,
                LP_FEE_TIER,
                sale.tokensForLiquidity,
                amountTokenMin,
                amountETHMin,
                address(this),
                block.timestamp + 300
            );

            // Record LP pair address
            address pair = factory.getPair(sale.token, weth, LP_FEE_TIER);
            sale.lpToken = pair;
            sale.lpUnlockTime = block.timestamp + sale.lpLockDuration;

            // LP tokens now held by this contract until lpUnlockTime
            require(liquidity > 0, "QsnLaunchpad: NO_LIQUIDITY_MINTED");
        }

        emit SaleFinalized(saleId, sale.totalRaised, sale.lpToken);
    }

    /// @notice Contributors claim their proportional token allocation after finalization
    function claimTokens(uint256 saleId) external nonReentrant {
        Sale storage sale = sales[saleId];
        if (sale.status != SaleStatus.Finalized) revert SaleNotFinalized();
        if (claimed[saleId][msg.sender]) revert AlreadyClaimed();

        uint256 contrib = contributions[saleId][msg.sender];
        if (contrib == 0) revert ZeroContribution();

        claimed[saleId][msg.sender] = true;

        uint256 tokenAmount = (sale.tokensForSale * contrib) / sale.totalRaised;
        IERC20(sale.token).safeTransfer(msg.sender, tokenAmount);

        emit TokensClaimed(saleId, msg.sender, tokenAmount);
    }

    /// @notice Cancel a sale that did not reach soft cap (or by creator before end)
    function cancelSale(uint256 saleId) external nonReentrant {
        Sale storage sale = sales[saleId];
        if (sale.status != SaleStatus.Active) revert SaleNotActive();

        // Creator can cancel any time; anyone can cancel after endTime if below softCap
        bool isCreator = msg.sender == sale.creator;
        bool isExpiredBelowSoftCap = block.timestamp > sale.endTime && sale.totalRaised < sale.softCap;

        if (!isCreator && !isExpiredBelowSoftCap) revert NotCreator();

        sale.status = SaleStatus.Cancelled;

        // Return tokens to creator
        uint256 totalTokens = sale.tokensForSale + sale.tokensForLiquidity;
        IERC20(sale.token).safeTransfer(sale.creator, totalTokens);

        emit SaleCancelled(saleId);
    }

    /// @notice Refund ETH to a contributor after a cancelled sale
    function refund(uint256 saleId) external nonReentrant {
        Sale storage sale = sales[saleId];
        if (sale.status != SaleStatus.Cancelled) revert SaleNotCancelled();

        uint256 contrib = contributions[saleId][msg.sender];
        if (contrib == 0) revert ZeroContribution();

        contributions[saleId][msg.sender] = 0;

        (bool ok,) = msg.sender.call{value: contrib}("");
        if (!ok) revert TransferFailed();

        emit Refunded(saleId, msg.sender, contrib);
    }

    /// @notice Creator withdraws LP tokens after lock period expires
    function withdrawLP(uint256 saleId) external nonReentrant {
        Sale storage sale = sales[saleId];
        if (sale.status != SaleStatus.Finalized) revert SaleNotFinalized();
        if (msg.sender != sale.creator) revert NotCreator();
        if (block.timestamp < sale.lpUnlockTime) revert LPStillLocked();
        if (sale.lpToken == address(0)) revert TransferFailed();

        uint256 lpBalance = IERC20(sale.lpToken).balanceOf(address(this));
        if (lpBalance == 0) revert ZeroContribution();

        IERC20(sale.lpToken).safeTransfer(sale.creator, lpBalance);

        emit LPWithdrawn(saleId, sale.creator, lpBalance);
    }

    /// @notice Emergency cancel if finalize hasn't succeeded within 7 days after endTime (F11)
    /// @dev Callable by ANYONE to prevent permanent fund lock when addLiquidityETH reverts
    function emergencyCancel(uint256 saleId) external nonReentrant {
        Sale storage sale = sales[saleId];
        if (sale.status != SaleStatus.Active) revert SaleNotActive();
        if (block.timestamp <= sale.endTime + 7 days) revert GracePeriodNotOver();

        sale.status = SaleStatus.Cancelled;

        // Return tokens to creator
        uint256 totalTokens = sale.tokensForSale + sale.tokensForLiquidity;
        IERC20(sale.token).safeTransfer(sale.creator, totalTokens);

        emit SaleCancelled(saleId);
    }

    // ───── View helpers ─────

    /// @notice Get full sale details
    function getSale(uint256 saleId) external view returns (Sale memory) {
        return sales[saleId];
    }

    /// @notice How many tokens a contributor will receive
    function getClaimable(uint256 saleId, address contributor) external view returns (uint256) {
        Sale storage sale = sales[saleId];
        if (sale.status != SaleStatus.Finalized || sale.totalRaised == 0) return 0;
        if (claimed[saleId][contributor]) return 0;
        uint256 contrib = contributions[saleId][contributor];
        return (sale.tokensForSale * contrib) / sale.totalRaised;
    }

    /// @notice Accept ETH (needed for router refunds during addLiquidityETH)
    receive() external payable {}
}
