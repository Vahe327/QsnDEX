# QsnDEX — Project Structure

## Overview

```
QsnDEX/
├── 📜 README.md                    Global documentation
├── 📜 WHITEPAPER.md                Protocol whitepaper
├── 📜 STRUCTURE.md                 This file
├── 🔧 backend.sh                   Backend management (start/stop/restart/logs)
├── 🔒 .env                         Environment variables (not in git)
│
├── 📁 contracts/                   Solidity Smart Contracts
├── 📁 backend/                     Rust API Server
└── 📁 frontend/                    Next.js Web Application
```

---

## Smart Contracts

```
contracts/
├── 📜 README.md
├── 📜 foundry.toml
│
└── src/
    │
    ├── 🏗️ core/                           AMM Core
    │   ├── QsnFactory.sol                  Pool factory — CREATE2 deployment, fee tier management
    │   ├── QsnPair.sol                     AMM pool — Constant Product + StableSwap, LP token
    │   └── QsnERC20.sol                    LP token base — ERC20 + EIP-2612 Permit
    │
    ├── 🔀 periphery/                       User-Facing Contracts
    │   ├── QsnRouter.sol                   Swap & liquidity router — multi-hop, ETH wrapping
    │   ├── QsnLibrary.sol                  Pure math — quotes, amounts, CREATE2 addresses
    │   └── QsnBatchSwap.sol                Batch swap — up to 10 outputs in one tx
    │
    ├── 🪙 token/                           Token Contracts
    │   ├── QsnToken.sol                    QSN governance token — ERC20Votes + Permit, 100M cap
    │   ├── QsnTokenDeploy.sol              Deployment helper for QSN
    │   ├── QsnTokenTaiko.sol               Taiko-specific QSN deployment
    │   ├── MockUSDT.sol                    Test USDT mock
    │   └── TestUSDT.sol                    Test USDT for testnets
    │
    ├── 💰 staking/                         Staking Infrastructure
    │   ├── QsnStakeVault.sol               Protocol staking — stake QSN, earn WETH from fees
    │   ├── QsnStakingFactory.sol           Open pool factory — permissionless pool creation
    │   └── QsnStakingPool.sol              Open staking pool — any ERC20 pair, Synthetix-style
    │
    ├── 🚀 launchpad/                       Fair Launch Platform
    │   └── QsnLaunchpad.sol                Token sales — soft/hard cap, auto-LP, LP locking
    │
    ├── 🛠️ utils/                           Utilities
    │   ├── QsnLimitOrder.sol               Limit orders — on-chain orderbook, keeper execution
    │   ├── FeeCollector.sol                Fee aggregation — skim pairs, distribute to stakers
    │   ├── WETH9.sol                       Wrapped Ether
    │   ├── Multicall.sol                   Batch read calls
    │   └── QsnStaking.sol                  Legacy staking helper
    │
    └── 📋 interfaces/                      Contract Interfaces
        ├── IQsnFactory.sol
        ├── IQsnPair.sol
        ├── IQsnRouter.sol
        ├── IQsnERC20.sol
        ├── IERC20.sol
        └── IWETH.sol
```

---

## Backend (Rust / Axum)

```
backend/
├── 📜 Cargo.toml                          Dependencies & build config
├── 📜 Cargo.lock
│
├── 📁 migrations/                          PostgreSQL Schema
│   ├── 001_init.sql                        Core tables (tokens, pools, swaps, prices)
│   ├── add_chain_id.sql                    Multi-chain support
│   ├── add_staking_launchpad.sql           Staking & launchpad tables
│   ├── add_staking_pools.sql               Open staking pools
│   ├── fix_launchpad_schema.sql            Schema fixes
│   └── add_price_alerts.sql                Price alerts table
│
└── src/
    │
    ├── main.rs                             App init — services, indexers, background tasks
    ├── config.rs                           Multi-chain config — RPC, contracts, env vars
    ├── db.rs                               PostgreSQL pool setup
    ├── redis_client.rs                     Redis — caching, rate limiting
    │
    ├── 📦 models/                          Database Models
    │   ├── mod.rs
    │   ├── token.rs                        Token metadata
    │   ├── pool.rs                         Liquidity pool with stats
    │   ├── swap_event.rs                   Swap transaction record
    │   ├── liquidity_event.rs              Mint/burn events
    │   ├── price_point.rs                  Historical price data
    │   └── limit_order.rs                  Limit order record
    │
    ├── 🌐 routes/                          API Endpoints (50+)
    │   ├── mod.rs                          Route aggregation
    │   ├── tokens.rs                       GET /api/tokens — list, search, import, price history
    │   ├── pools.rs                        GET /api/pools — list, detail, chart, user positions
    │   ├── swap.rs                         GET /api/swap/quote, /swap/route
    │   ├── prices.rs                       GET /api/prices — batch token prices
    │   ├── portfolio.rs                    GET /api/portfolio/{wallet} — holdings + LP
    │   ├── history.rs                      GET /api/history — recent swaps
    │   ├── stats.rs                        GET /api/stats — TVL, volume, farms
    │   ├── chains.rs                       GET /api/chains — supported networks
    │   ├── ai.rs                           POST /api/ai/* — chat, analyze token/pool, swap insight
    │   ├── safety.rs                       GET /api/safety/{token} — 8 on-chain checks
    │   ├── entry_signal.rs                 GET /api/entry-signal/{token} — RSI, momentum
    │   ├── autopilot.rs                    GET /api/autopilot/{wallet} — AI suggestions
    │   ├── alerts.rs                       POST/GET/DELETE /api/alerts — price alerts CRUD
    │   ├── orders.rs                       GET /api/orders — limit orders
    │   ├── batch.rs                        POST /api/batch/quote, /batch/build-tx
    │   ├── il.rs                           GET /api/il/simulate — impermanent loss calc
    │   ├── qsn_token.rs                    GET /api/qsn — token info, supply, staked
    │   ├── stake_vault.rs                  GET /api/staking/qsn — protocol staking
    │   ├── staking_pools.rs                GET /api/staking/pools — open staking
    │   ├── launchpad.rs                    GET /api/launchpad/sales — token sales
    │   └── dex_public.rs                   GET /api/v1/dex/* — CoinGecko/CMC format
    │
    ├── ⚙️ services/                        Business Logic (15+)
    │   ├── mod.rs
    │   ├── price_service.rs                Token pricing — reserves, CoinGecko, caching (15s)
    │   ├── pool_service.rs                 Pool stats — TVL, APR, volume, reserves
    │   ├── swap_service.rs                 Swap quotes — multi-hop routing, price impact
    │   ├── token_service.rs                Token CRUD — import, search, metadata
    │   ├── portfolio_service.rs            Portfolio — multicall balances, LP positions, USD values
    │   ├── ai_service.rs                   Groq AI — 3 models, analysis, chat, rate limiting
    │   ├── anti_rug.rs                     Safety — 8 checks, score 0-10, AI summary
    │   ├── smart_entry.rs                  Entry signal — RSI, momentum, volume analysis
    │   ├── autopilot.rs                    Autopilot — health score, 5 suggestion types
    │   ├── price_alert_service.rs          Alerts — CRUD, background checker (30s), notifications
    │   ├── batch_swap.rs                   Batch — quotes, gas savings, TX encoding
    │   ├── il_calculator.rs                IL simulation — price change, fees, breakeven
    │   ├── farming_service.rs              Yield farms — positions, rewards, APR
    │   ├── qsn_token_service.rs            QSN — price, supply, market cap, staked %
    │   ├── stake_vault_service.rs          Protocol staking — TVL, APY, user positions
    │   ├── staking_factory_service.rs      Open pools — list, detail, user positions, APR
    │   ├── launchpad_service.rs            Launchpad — sales, contributions, status
    │   ├── indexer.rs                      Blockchain indexer — Swap/Mint/Burn/Sync events (2s)
    │   ├── launchpad_indexer.rs            Launchpad sync — sales from contract (15s)
    │   ├── staking_indexer.rs              Staking sync — pools from factory (15s)
    │   └── limit_order_keeper.rs           Order keeper — price check & execute (15s)
    │
    └── 🔧 utils/                           Helpers
        ├── mod.rs
        ├── ai_prompts.rs                   AI system prompts
        ├── formatting.rs                   Number/address formatting
        └── math.rs                         Mathematical utilities
```

---

## Frontend (Next.js 16 / React 19)

```
frontend/
├── 📜 package.json
├── 📜 tsconfig.json
├── 📜 next.config.ts
├── 📜 tailwind.config.ts
├── 📜 postcss.config.mjs
│
├── 📁 public/                             Static assets (icons, images)
│
└── src/
    │
    ├── 📄 app/                            Pages & Routing
    │   ├── layout.tsx                      Root layout (fonts, metadata)
    │   ├── page.tsx                        Landing page
    │   │
    │   └── app/                            App routes (authenticated)
    │       ├── layout.tsx                  App layout (header, nav, footer)
    │       ├── page.tsx                    App home (redirects to swap)
    │       │
    │       ├── swap/page.tsx              🔀 Token swap (market + limit orders)
    │       ├── pools/
    │       │   ├── page.tsx               💧 Pool listing
    │       │   ├── [address]/page.tsx     📊 Pool detail + charts
    │       │   ├── add/page.tsx           ➕ Add liquidity
    │       │   ├── remove/page.tsx        ➖ Remove liquidity
    │       │   └── create/page.tsx        🆕 Create new pool
    │       ├── portfolio/page.tsx          💼 User portfolio
    │       ├── analytics/page.tsx          📈 Platform analytics
    │       ├── ai/page.tsx                🤖 AI chat assistant
    │       ├── autopilot/page.tsx          🧠 AI autopilot + price alerts
    │       ├── safety/page.tsx             🛡️ Token safety scanner
    │       ├── batch/page.tsx              📦 Batch multi-swap
    │       ├── farms/page.tsx              🌾 Yield farming
    │       ├── staking/
    │       │   ├── page.tsx               💰 Staking dashboard
    │       │   ├── create/page.tsx        🏗️ Create staking pool
    │       │   └── pool/[address]/page.tsx 📋 Pool detail
    │       ├── launchpad/
    │       │   ├── page.tsx               🚀 Token sales listing
    │       │   ├── [id]/page.tsx          📋 Sale detail + contribute
    │       │   └── create/page.tsx        🆕 Create token sale
    │       └── tokens/
    │           └── [address]/page.tsx     🪙 Token detail + AI analysis
    │
    ├── 🧩 components/                     UI Components (140+)
    │   │
    │   ├── swap/                          Trading
    │   │   ├── SwapCard.tsx               Main swap interface (market/limit toggle)
    │   │   ├── TokenInput.tsx             Amount input with balance
    │   │   ├── TokenSelector.tsx          Token picker modal
    │   │   ├── SwapDetails.tsx            Fee, route, impact breakdown
    │   │   ├── SwapButton.tsx             Execute with approval flow
    │   │   ├── SwapConfirm.tsx            Confirmation modal
    │   │   ├── SwapSuccess.tsx            Success notification
    │   │   ├── SwapRoute.tsx              Visual route path
    │   │   ├── SlippageSettings.tsx       Slippage, deadline, multihop
    │   │   ├── PriceImpactWarning.tsx     High impact warning
    │   │   ├── LimitOrderForm.tsx         Limit order creation
    │   │   ├── MyOrders.tsx               Active/past orders
    │   │   └── index.ts
    │   │
    │   ├── pools/                         Liquidity
    │   │   ├── PoolList.tsx               All pools table/cards
    │   │   ├── PoolRow.tsx                Single pool row
    │   │   ├── PoolDetail.tsx             Pool analytics + charts
    │   │   ├── AddLiquidity.tsx           Add liquidity with auto-ratio
    │   │   ├── RemoveLiquidity.tsx        Remove liquidity
    │   │   ├── CreatePool.tsx             Create new pool
    │   │   ├── MyPositions.tsx            User LP positions
    │   │   ├── PositionCard.tsx           Position summary card
    │   │   ├── FeeSelector.tsx            Fee tier picker
    │   │   ├── PoolPairIcon.tsx           Dual token icons
    │   │   ├── ImpermanentLossInfo.tsx    IL education
    │   │   └── index.ts
    │   │
    │   ├── ai/                            AI Features
    │   │   ├── AIChat.tsx                 Multi-turn chat
    │   │   ├── AITokenAnalysis.tsx        Token risk + metrics
    │   │   ├── AIPoolInsight.tsx          Pool APR + IL insight
    │   │   ├── AISwapInsight.tsx          Swap sentiment
    │   │   ├── AIRiskBadge.tsx            Risk level badge
    │   │   └── AIDisclaimer.tsx           AI disclaimer
    │   │
    │   ├── autopilot/                     AI Portfolio Advisor
    │   │   ├── AutopilotDashboard.tsx     Main dashboard
    │   │   ├── PortfolioHealth.tsx        Health score gauge
    │   │   ├── SuggestionCard.tsx         Actionable suggestion
    │   │   ├── AutopilotSettings.tsx      Rescan, disclaimer
    │   │   └── AlertsPanel.tsx            Price alerts CRUD
    │   │
    │   ├── entry/                         Entry Signals
    │   │   ├── EntrySignal.tsx            Signal display + metrics
    │   │   ├── EntryBadge.tsx             Inline signal badge
    │   │   └── EntryMetrics.tsx           RSI, momentum details
    │   │
    │   ├── safety/                        Anti-Rug Shield
    │   │   ├── SafetyCheck.tsx            Scanner interface
    │   │   ├── SafetyScore.tsx            Score gauge
    │   │   ├── SafetyRow.tsx              Individual check result
    │   │   └── SafetyBanner.tsx           Swap page warning
    │   │
    │   ├── staking/                       Staking
    │   │   ├── StakingHero.tsx            APY, TVL overview
    │   │   ├── StakingStats.tsx           Key metrics cards
    │   │   ├── StakeCard.tsx              Stake/unstake form
    │   │   ├── StakeForm.tsx              Staking pool form
    │   │   ├── RewardsCard.tsx            Claim rewards
    │   │   ├── ClaimRewardsButton.tsx     Batch claim
    │   │   ├── StakingPoolList.tsx        Open pools listing
    │   │   ├── StakingPoolCard.tsx        Pool summary card
    │   │   ├── StakingPoolDetail.tsx      Pool detail + actions
    │   │   ├── StakingPoolFilters.tsx     Status/sort filters
    │   │   ├── CreateStakingPoolForm.tsx  Create pool wizard
    │   │   ├── APRBadge.tsx              APR display
    │   │   └── PoolCountdown.tsx          End time countdown
    │   │
    │   ├── launchpad/                     Token Launches
    │   │   ├── SaleList.tsx               All sales listing
    │   │   ├── SaleCard.tsx               Sale summary card
    │   │   ├── SaleDetail.tsx             Sale page + contribute
    │   │   ├── SaleProgress.tsx           Raised vs target bar
    │   │   ├── SaleCountdown.tsx          Start/end timer
    │   │   ├── SaleStatusBadge.tsx        Status indicator
    │   │   ├── ContributeForm.tsx         Contribution form
    │   │   ├── ClaimTokens.tsx            Post-sale claim
    │   │   └── LiquidityLockInfo.tsx      LP lock details
    │   │
    │   ├── batch/                         Batch Swap
    │   │   ├── BatchSwapCard.tsx          Multi-output form
    │   │   ├── BatchTokenRow.tsx          Output row
    │   │   ├── BatchSummary.tsx           Totals + impact
    │   │   └── BatchConfirm.tsx           Confirmation modal
    │   │
    │   ├── portfolio/                     Portfolio
    │   │   ├── PortfolioSummary.tsx       Total value + P&L
    │   │   ├── TokenBalances.tsx          Token holdings list
    │   │   ├── LPPositions.tsx            LP position cards
    │   │   └── PnLDisplay.tsx             Profit/loss display
    │   │
    │   ├── analytics/                     Analytics
    │   │   ├── GlobalStats.tsx            TVL, volume, swaps
    │   │   ├── TopPools.tsx               Highest TVL/volume
    │   │   ├── TopTokens.tsx              Most traded tokens
    │   │   └── RecentSwaps.tsx            Live transaction feed
    │   │
    │   ├── charts/                        Charting
    │   │   ├── PriceChart.tsx             OHLC/Line (Lightweight Charts)
    │   │   ├── TVLChart.tsx               TVL over time
    │   │   ├── VolumeChart.tsx            Volume bars
    │   │   └── MiniSparkline.tsx          Inline sparklines
    │   │
    │   ├── farms/                         Yield Farming
    │   │   ├── FarmList.tsx               Farm listing
    │   │   ├── FarmCard.tsx               Farm row with APR
    │   │   ├── ClaimRewards.tsx           Claim modal
    │   │   └── StakeModal.tsx             Stake/unstake modal
    │   │
    │   ├── il/                            Impermanent Loss
    │   │   ├── ILCalculator.tsx           Calculator form
    │   │   ├── ILBreakdown.tsx            Results breakdown
    │   │   ├── ILChart.tsx                Visual IL curve
    │   │   └── ILSlider.tsx               Price change slider
    │   │
    │   ├── landing/                       Landing Page
    │   │   ├── LandingHero.tsx            Hero section
    │   │   ├── LandingFeatures.tsx        Feature grid
    │   │   ├── LandingStats.tsx           Platform stats
    │   │   ├── LandingAI.tsx              AI showcase
    │   │   ├── LandingSecurity.tsx        Security features
    │   │   ├── LandingChains.tsx          Supported chains
    │   │   ├── LandingHowItWorks.tsx      How it works steps
    │   │   ├── LandingCTA.tsx             Call to action
    │   │   ├── LandingNav.tsx             Landing navigation
    │   │   ├── LandingFooter.tsx          Footer
    │   │   └── index.ts
    │   │
    │   ├── layout/                        App Layout
    │   │   ├── Header.tsx                 Desktop header (adaptive 2xl breakpoint)
    │   │   ├── Navigation.tsx             Desktop nav (10 items)
    │   │   ├── Footer.tsx                 Desktop footer
    │   │   ├── ChainSwitcher.tsx          Chain selector dropdown
    │   │   ├── MobileNav.tsx              Mobile navigation
    │   │   ├── ThemeProvider.tsx           Dark/light theme + wagmi/RainbowKit
    │   │   └── index.ts
    │   │
    │   ├── common/                        Shared Components
    │   │   ├── ConnectButton.tsx           Wallet connect
    │   │   ├── NetworkGuard.tsx            Wrong network guard
    │   │   ├── NetworkSwitcher.tsx         Chain switch prompt
    │   │   ├── TokenIcon.tsx              Token logo display
    │   │   ├── Modal.tsx                  Base modal (desktop + mobile)
    │   │   ├── TransactionModal.tsx       TX status modal
    │   │   ├── NumberInput.tsx            Formatted number input
    │   │   ├── Badge.tsx                  Status badges
    │   │   ├── Tabs.tsx                   Tab navigation
    │   │   ├── Tooltip.tsx                Hover tooltips
    │   │   ├── Skeleton.tsx               Loading placeholders
    │   │   ├── ExplorerLink.tsx           Block explorer links
    │   │   ├── BridgeBanner.tsx           Cross-chain bridge
    │   │   └── index.ts
    │   │
    │   └── mobile/                        Mobile Components (22)
    │       ├── MobileLayout.tsx            Mobile wrapper
    │       ├── MobileHeader.tsx            Mobile top bar + alerts bell
    │       ├── BottomNav.tsx               Bottom tab navigation
    │       ├── MobileBottomSheet.tsx       Slide-up modal
    │       ├── MobileChainSelector.tsx     Chain picker
    │       ├── MobileTransactionModal.tsx  TX status
    │       ├── MoreMenu.tsx               More options menu
    │       ├── MobileSwap.tsx              Swap interface
    │       ├── MobilePools.tsx             Pool listing
    │       ├── MobilePoolDetail.tsx        Pool detail
    │       ├── MobilePoolCreate.tsx        Create pool
    │       ├── MobileAddLiquidity.tsx      Add liquidity
    │       ├── MobileRemoveLiquidity.tsx   Remove liquidity
    │       ├── MobilePortfolio.tsx         Portfolio view
    │       ├── MobileAnalytics.tsx         Analytics
    │       ├── MobileAI.tsx                AI chat
    │       ├── MobileAutopilot.tsx         Autopilot + alerts
    │       ├── MobileBatch.tsx             Batch swap
    │       ├── MobileSafety.tsx            Safety scanner
    │       ├── MobileStaking.tsx           Staking
    │       ├── MobileStakingDetail.tsx     Staking pool detail
    │       ├── MobileCreateStakingPool.tsx Create staking pool
    │       ├── MobileFarms.tsx             Yield farms
    │       ├── MobileLaunchpad.tsx         Launchpad listing
    │       ├── MobileSaleDetail.tsx        Sale detail
    │       └── MobileTokenDetail.tsx       Token detail
    │
    ├── 🪝 hooks/                          React Hooks (22)
    │   ├── useSwap.ts                     Swap execution + quotes
    │   ├── useApprove.ts                  ERC20 approval flow
    │   ├── useAddLiquidity.ts             Add liquidity with gas estimation
    │   ├── useRemoveLiquidity.ts          Remove liquidity
    │   ├── useBatchSwap.ts                Batch swap execution
    │   ├── useAlerts.ts                   Price alerts CRUD + polling
    │   ├── useAutopilot.ts                Autopilot data fetching
    │   ├── useAI.ts                       AI analysis hooks
    │   ├── useEntrySignal.ts              Entry signal data
    │   ├── useSafetyCheck.ts              Safety check results
    │   ├── useILCalculator.ts             IL simulation
    │   ├── usePools.ts                    Pool listing + detail
    │   ├── usePortfolio.ts                Portfolio data
    │   ├── usePrices.ts                   Token prices
    │   ├── useTokens.ts                   Token list + search
    │   ├── useTokenBalance.ts             ERC20 balance reading
    │   ├── useChain.ts                    Chain config + switching
    │   ├── useGasPrice.ts                 Dynamic gas estimation
    │   ├── useContract.ts                 Contract read/write helpers
    │   ├── useIsMobile.ts                 Mobile breakpoint detection
    │   ├── useQsnStaking.ts               QSN staking data
    │   ├── useStakingPools.ts             Open staking pools
    │   ├── useLaunchpad.ts                Launchpad data
    │   └── useCreateStakingPool.ts        Staking pool creation
    │
    ├── 🗄️ store/                          State Management (Zustand)
    │   ├── swapStore.ts                   Swap form state (tokens, amounts, mode)
    │   ├── settingsStore.ts               User settings (slippage, theme, locale)
    │   ├── chainStore.ts                  Selected chain (persistent)
    │   └── tokenStore.ts                  Custom tokens + recent TX
    │
    ├── ⚙️ config/                         Configuration
    │   ├── chains.ts                      Chain definitions (Taiko, Arbitrum, testnets)
    │   ├── contracts.ts                   ABI definitions (Router, Factory, ERC20, Staking)
    │   ├── tokens.ts                      Default token lists + NATIVE_ETH
    │   └── wagmi.ts                       Wagmi + RainbowKit setup
    │
    ├── 🌐 i18n/                           Internationalization
    │   ├── index.ts                       Translation engine (t() function)
    │   ├── en.json                        English translations (600+ keys)
    │   └── ru.json                        Russian translations (600+ keys)
    │
    ├── 📚 lib/                            Utilities
    │   ├── api.ts                         API client (50+ endpoints)
    │   ├── formatters.ts                  Number, USD, address formatting
    │   ├── utils.ts                       cn() classname merger
    │   └── constants.ts                   App constants
    │
    └── 🎨 styles/
        └── globals.css                    Theme system (CSS variables, 3D effects, animations)
```

---

## Statistics

| Metric | Count |
|--------|-------|
| Smart Contracts | 25 Solidity files |
| Backend Routes | 50+ API endpoints |
| Backend Services | 15+ business logic modules |
| Frontend Pages | 22 routes |
| Frontend Components | 140+ TSX files |
| React Hooks | 22 custom hooks |
| Mobile Components | 22 dedicated mobile views |
| Translations | 600+ keys per language |
| Supported Chains | 4 (2 mainnet + 2 testnet) |
| AI Models | 3 (Llama 3.3 70B, Llama 3.1 8B, DeepSeek R1 70B) |
