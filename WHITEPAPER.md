# QsnDEX Whitepaper

## AI-Powered Decentralized Exchange on Taiko L2 & Arbitrum

**Version 1.0 | April 2026**

---

## Abstract

QsnDEX is a next-generation decentralized exchange (DEX) that combines the proven mechanics of automated market making (AMM) with advanced artificial intelligence capabilities. Built on Taiko (Type-1 zkEVM) and Arbitrum L2 networks, QsnDEX provides traders and liquidity providers with a comprehensive DeFi ecosystem featuring multi-tier fee pools, AI-powered portfolio analysis, on-chain limit orders, permissionless staking, a fair launch platform, and real-time safety checks. The platform supports both Constant Product (x*y=k) and StableSwap pool models, enabling efficient trading across all asset types.

---

## 1. Introduction

### 1.1 Problem Statement

Current DEX platforms face several challenges:

- **Information Asymmetry**: Retail traders lack access to real-time risk assessment and market intelligence tools
- **Capital Inefficiency**: Single fee-tier pools force liquidity providers into suboptimal configurations
- **Fragmented Experience**: Users must navigate multiple protocols for trading, staking, token launches, and portfolio management
- **Safety Risks**: The proliferation of scam tokens (honeypots, rug pulls) puts users at constant risk
- **Limited Automation**: Most DEXes lack intelligent portfolio rebalancing and price alert systems

### 1.2 Solution

QsnDEX addresses these challenges through an integrated platform that provides:

- **AI-Powered Analytics**: Groq-accelerated LLM analysis for tokens, pools, market entry signals, and portfolio optimization
- **Multi-Tier Fee System**: Four fee tiers (0.01%, 0.05%, 0.30%, 1.00%) enabling optimal liquidity provision for different asset volatility profiles
- **Anti-Rug Shield**: Eight real on-chain safety checks with AI-generated risk summaries
- **Unified DeFi Hub**: Trading, liquidity, staking, token launches, and analytics in a single interface
- **Intelligent Automation**: Autopilot portfolio advisor, price alerts with background monitoring, and keeper-executed limit orders

---

## 2. Architecture

### 2.1 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Smart Contracts** | Solidity 0.8.20+, Foundry, OpenZeppelin |
| **Backend** | Rust, Axum, SQLx (PostgreSQL), Redis |
| **Frontend** | Next.js 16, React 19, TypeScript, wagmi v2, viem, RainbowKit |
| **AI Engine** | Groq API (Llama 3.3 70B, Llama 3.1 8B, DeepSeek R1 70B) |
| **Infrastructure** | Docker, Nginx, PostgreSQL 16, Redis 7 |

### 2.2 Supported Networks

| Network | Chain ID | Type | Gas Token |
|---------|----------|------|-----------|
| Taiko Mainnet | 167000 | Production | ETH |
| Arbitrum One | 42161 | Production | ETH |
| Taiko Hekla | 167009 | Testnet | ETH |
| Arbitrum Sepolia | 421614 | Testnet | ETH |

### 2.3 System Overview

```
Users (Wallets: MetaMask, Rabby, WalletConnect)
         |
    [Frontend: Next.js 16 + React 19]
         |
    [Backend: Rust/Axum API Server]
    /    |    |    \
Redis  PostgreSQL  Groq AI  Blockchain RPCs
                              |
                    [Smart Contracts on L2]
                    Factory | Router | Pairs
                    Staking | Launchpad | LimitOrder
```

---

## 3. Core AMM Protocol

### 3.1 Factory Contract (QsnFactory)

The Factory manages pool creation and fee tier configuration using CREATE2 for deterministic pair addresses.

**Supported Fee Tiers:**
- **0.01% (100)** - Stablecoin pairs with minimal spread
- **0.05% (500)** - Correlated assets (LSDs, wrapped tokens)
- **0.30% (3000)** - Standard volatile pairs (default)
- **1.00% (10000)** - Exotic or low-liquidity pairs

### 3.2 Pair Contract (QsnPair)

Each pool is an ERC20 LP token contract implementing two AMM models:

**Constant Product (Type 0):** Standard x*y=k invariant for volatile asset pairs. Fee is deducted from input before the invariant check.

**StableSwap (Type 1):** Curve-style invariant with amplification coefficient A=85, optimized for assets that trade near 1:1 (stablecoins, wrapped/synthetic versions). Uses Newton's method convergence (max 255 iterations).

**Security Features:**
- Reentrancy lock (state variable based, checked after all callbacks)
- MINIMUM_LIQUIDITY of 1000 wei locked permanently to prevent donation attacks
- TWAP oracle data via cumulative price accumulators
- Flash swap support with invariant verification post-callback

### 3.3 Router Contract (QsnRouter)

The Router provides the user-facing interface for all trading and liquidity operations:

**Swap Functions:**
- Exact input swaps (token-to-token, ETH-to-token, token-to-ETH)
- Exact output swaps (reverse calculation)
- Fee-on-transfer token support (measures actual received balances)
- Multi-hop routing through intermediate pools

**Liquidity Functions:**
- Add/remove liquidity for token pairs and ETH pairs
- EIP-2612 permit support for gasless LP token approvals
- Automatic pool creation when adding liquidity to non-existent pairs

### 3.4 Library (QsnLibrary)

Pure calculation functions for AMM math:
- Token sorting and CREATE2 pair address computation
- Quote calculations respecting fee tiers
- Multi-hop amount computation (getAmountsOut/getAmountsIn)

---

## 4. Advanced Trading Features

### 4.1 Batch Swap (QsnBatchSwap)

Execute up to 10 swap orders in a single transaction, splitting one input token across multiple outputs by percentage allocation.

**Gas Savings:** Batch base cost (100k) + per-swap (200k) vs individual swap cost (150k each). A 5-way split saves approximately 35% in gas.

### 4.2 Limit Orders (QsnLimitOrder)

On-chain limit order book where users place orders and keepers execute them when price conditions are met.

**Mechanism:**
1. User deposits tokenIn and specifies minAmountOut + deadline
2. Backend keeper checks prices every 15 seconds
3. When router `getAmountsOut()` returns sufficient output, keeper executes
4. Keeper receives 0.1% reward (KEEPER_REWARD_BPS = 10) for execution
5. Expired orders can be reclaimed by anyone

### 4.3 Multi-Hop Routing

The backend routing engine discovers optimal paths through multiple pools. For example: QSN -> WETH -> USDC traverses two pools to find the best rate when no direct QSN/USDC pool exists.

---

## 5. AI Intelligence Layer

### 5.1 AI Models

QsnDEX integrates three Groq-hosted LLM models:

| Model | Use Case | Temperature |
|-------|----------|-------------|
| Llama 3.3 70B Versatile | Deep analysis (tokens, pools, autopilot) | 0.3-0.4 |
| Llama 3.1 8B Instant | Quick insights (swap sentiment) | 0.3 |
| DeepSeek R1 70B | Complex reasoning (multi-factor risk) | 0.2 |

### 5.2 Anti-Rug Shield (Safety Check)

Eight comprehensive on-chain safety checks:

1. **Contract Verification** - Source code published on block explorer
2. **Honeypot Detection** - Simulated swap to verify sellability
3. **Owner Privileges** - Analysis of dangerous admin functions (pause, mint, blacklist)
4. **Liquidity Lock** - Verification of LP token lock duration
5. **Holder Concentration** - Whale analysis (flag if top holders > 50%)
6. **Contract Age** - Time since deployment (new contracts are riskier)
7. **Sell Tax** - Simulated buy+sell to detect hidden transfer taxes
8. **Liquidity Depth** - Price impact analysis at 1% trade size

**Output:** Safety score 0-10, risk level classification, per-check severity ratings, and AI-generated risk summary in user's language (EN/RU).

### 5.3 Smart Entry Signal

Technical analysis engine combining:
- **Price vs 7-day average** - Trend direction
- **Price vs 30-day average** - Longer-term momentum
- **RSI(14)** - Overbought/oversold detection
- **4-hour volume change** - Activity surge detection
- **Distance from 7-day high/low** - Range position

Signal output: FAVORABLE / NEUTRAL / UNFAVORABLE with AI explanation of reasoning.

### 5.4 Autopilot Portfolio Advisor

AI-powered portfolio analysis generating actionable suggestions:

**Health Score (0-100)** based on:
- Concentration risk (single token > 80% = -30 points)
- Diversification (< 3 tokens = -20 points)
- Idle stablecoins not in LP (> 20% = -15 points)
- No LP positions at all (= -10 points)

**Suggestion Types:**
- **Diversify** - Reduce concentration in dominant holdings
- **Earn Yield** - Deploy idle assets into highest-APR pools
- **Take Profit** - Realize gains from appreciated positions
- **Cut Loss** - Reduce exposure to underperforming tokens
- **Set Alert** - Monitor important price levels

Each suggestion includes structured action parameters (token addresses, amounts, pool APR, estimated monthly earnings).

### 5.5 AI Chat Assistant

Multi-turn conversational AI for DeFi guidance with access to real-time market data, pool analytics, and portfolio context. Rate limited to 10 requests/hour per user.

---

## 6. Staking Infrastructure

### 6.1 QSN Protocol Staking (QsnStakeVault)

Synthetix-style reward streaming for the native QSN token:

- **Stake QSN** to earn WETH from protocol trading fees
- **Reward Distribution:** Protocol fees collected via FeeCollector are wrapped to WETH and streamed over 7-day periods
- **Reward Calculation:** `earned = (stakedAmount * (rewardPerToken - userPaid)) / 1e18 + rewardsOwed`
- **Exit:** Users can withdraw + claim in a single transaction

### 6.2 Open Staking Factory (QsnStakingFactory)

Permissionless staking pool creation:

- **Anyone** can create a staking pool with any ERC20 pair (stake tokenA, earn tokenB)
- **Creation Fee:** 0.01 ETH + 2% of reward tokens (platform fee)
- **Pool Parameters:** Min/max stake limits, configurable duration
- **APR Calculation:** Based on rewardRate and totalStaked

### 6.3 Fee Collection (FeeCollector)

Centralized fee aggregation:
- Skims excess tokens from all trading pairs
- Wraps ETH to WETH
- Distributes to QSN StakeVault for staker rewards
- Supports batch collection across multiple pairs

---

## 7. Launchpad (QsnLaunchpad)

Fair token launch platform with automatic liquidity creation:

### 7.1 Sale Lifecycle

1. **Creation** - Creator deposits sale tokens + liquidity tokens, sets soft/hard cap, timeline, and liquidity parameters
2. **Contribution** - Users contribute ETH during the sale window
3. **Finalization** - If soft cap reached: 2% platform fee deducted, remainder goes to creator, automatic LP creation via Router
4. **Claiming** - Contributors claim proportional token allocation
5. **Cancellation** - Automatic if below soft cap after end time; emergency cancel after 7-day grace period

### 7.2 Liquidity Protection

- **Auto-LP:** Configurable percentage of raised ETH automatically paired with tokens and added as liquidity
- **LP Lock:** Minimum 30-day lock period for creator's LP tokens
- **Fee Tier:** LP created at 0.30% fee tier (standard)

### 7.3 Fee Structure

| Fee | Amount | Recipient |
|-----|--------|-----------|
| Sale Creation | 0.05 ETH | Platform |
| ETH Raised | 2% | Platform |

---

## 8. Price Alert System

Real-time price monitoring with background checking:

- **Conditions:** Price above or below target threshold
- **Checking Frequency:** Every 30 seconds via backend service
- **Notifications:** Bell icon in header with badge count, dropdown list of triggered alerts
- **Limits:** Maximum 20 active alerts per wallet per chain
- **Management:** Create, pause, resume, dismiss, delete alerts

---

## 9. QSN Token

### 9.1 Token Specifications

| Property | Value |
|----------|-------|
| Name | Quantum Security Network |
| Symbol | QSN |
| Standard | ERC20 + ERC20Votes + ERC20Permit |
| Max Supply | 100,000,000 QSN |
| Decimals | 18 |
| Burnable | Yes (by holders) |
| Governance | On-chain voting via ERC20Votes |

### 9.2 Utility

- **Staking:** Stake QSN in StakeVault to earn WETH from protocol fees
- **Governance:** On-chain voting power proportional to holdings
- **Fee Sharing:** Protocol fee revenue distributed to QSN stakers
- **Launchpad:** Required for certain launchpad participation tiers

---

## 10. Fee Architecture

### 10.1 Trading Fees

| Tier | Fee | Best For |
|------|-----|----------|
| Ultra-Low | 0.01% | Stablecoin pairs |
| Low | 0.05% | Correlated assets |
| Standard | 0.30% | Volatile pairs |
| High | 1.00% | Exotic/low-liquidity |

### 10.2 Protocol Fees

- **LP Fee Share:** 1/6 of the 0.30% tier (~0.05%) goes to protocol (configurable via feeTo)
- **Limit Order Keeper:** 0.1% of output to executor
- **Staking Pool Creation:** 0.01 ETH + 2% of rewards
- **Launchpad:** 0.05 ETH creation + 2% of ETH raised

### 10.3 Fee Flow

```
Swap Fees (0.01-1.00%)
    |
    +--> 5/6 to Liquidity Providers
    +--> 1/6 to FeeCollector
              |
              +--> Wrap to WETH
              +--> Distribute to QSN StakeVault
                        |
                        +--> Stream to QSN Stakers over 7 days
```

---

## 11. Security

### 11.1 Smart Contract Security

- **ReentrancyGuard:** Applied to Router, all Staking contracts, Launchpad, BatchSwap, FeeCollector, and LimitOrder
- **Access Control:** OpenZeppelin Ownable with two-step ownership transfer (FeeCollector)
- **Overflow Protection:** Solidity 0.8+ with explicit unchecked blocks only where mathematically safe
- **EIP-2612 Permit:** Gasless approvals reducing transaction count
- **Minimum Liquidity:** 1000 wei permanently locked to prevent first-depositor attacks
- **Deadline Validation:** All time-sensitive operations require user-specified deadlines
- **Slippage Protection:** Minimum output amounts on all swap and liquidity operations

### 11.2 Backend Security

- **Rate Limiting:** Redis-based per-endpoint rate limiting (AI: 10/hr, Autopilot: 5/hr, Safety: 20/hr)
- **Input Validation:** Address format, amount bounds, chain ID verification
- **CORS:** Configurable cross-origin resource sharing
- **No Private Keys Stored:** Keeper private key only in environment variables, never in code or database

### 11.3 Frontend Security

- **No Secret Storage:** All sensitive operations happen on-chain via wallet signing
- **Transaction Simulation:** Gas estimation before submission to detect reverts
- **Safety Warnings:** Integrated Anti-Rug Shield warnings in swap interface

---

## 12. Multi-Language Support

Full internationalization with English and Russian translations covering all UI elements, error messages, AI prompts, and notifications. The AI engine generates responses in the user's selected language.

---

## 13. User Experience

### 13.1 Desktop

- Premium dark theme with gold accent ("Obsidian Gold")
- Optional light theme
- Glass morphism effects with backdrop blur
- 3D card styling with layered shadows and glow effects
- Smooth Framer Motion animations throughout
- Responsive grid layouts from 768px to 2560px+

### 13.2 Mobile

- Dedicated mobile components for every feature (27 mobile-specific components)
- Bottom navigation bar with main sections
- Touch-optimized with 44px minimum tap targets
- Bottom sheet modals adapted for mobile interaction
- Safe area handling for notched devices

---

## 14. Indexing & Real-Time Data

### 14.1 Blockchain Indexer

Per-chain background indexer polling every 2 seconds:
- **PairCreated** events for new pool discovery
- **Swap** events for trade history and volume
- **Mint/Burn** events for liquidity tracking
- **Sync** events for reserve updates

### 14.2 Specialized Indexers

- **Launchpad Indexer:** Syncs all token sales every 15 seconds
- **Staking Indexer:** Syncs open staking pools every 15 seconds
- **Limit Order Keeper:** Checks and executes orders every 15 seconds
- **Price Alert Checker:** Monitors all active alerts every 30 seconds

### 14.3 Caching Strategy

Redis caching with TTL-based invalidation:
- Token prices: 15 seconds
- ETH/USD price: 60 seconds
- AI analysis: 1 hour
- Safety checks: 5 minutes
- Autopilot: 3 minutes

---

## 15. Roadmap

### Phase 1 (Current)
- Core AMM with multi-tier fees
- AI-powered analytics and safety checks
- QSN staking with fee sharing
- Permissionless staking factory
- Fair launch platform
- Limit orders with keeper execution
- Price alert system
- Multi-chain support (Taiko + Arbitrum)

### Phase 2 (Planned)
- Concentrated liquidity positions
- Cross-chain bridge integration
- DAO governance with QSN voting
- Advanced order types (stop-loss, trailing stop)
- Mobile native app

### Phase 3 (Future)
- Layer 3 deployment
- Perpetual futures
- Lending/borrowing integration
- NFT marketplace for LP positions

---

## 16. Conclusion

QsnDEX represents a comprehensive approach to decentralized exchange design, combining battle-tested AMM mechanics with cutting-edge AI capabilities. By integrating safety checks, intelligent portfolio management, and permissionless DeFi primitives into a single platform, QsnDEX aims to make DeFi accessible, safe, and efficient for all users.

The multi-chain architecture ensures scalability, while the AI layer provides institutional-grade analytics to retail users. The QSN token aligns platform incentives through fee sharing, governance, and ecosystem participation.

---

**Disclaimer:** This whitepaper is for informational purposes only. It does not constitute financial advice, an offer of securities, or a guarantee of future performance. Users should conduct their own research and assessment before interacting with any DeFi protocol. Smart contract risk, market risk, and impermanent loss are inherent to decentralized finance.

---

*QsnDEX Team | 2026*
*Website: qsndex.com | GitHub: github.com/qsndex*
