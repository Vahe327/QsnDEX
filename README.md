# QsnDEX — AI-Powered Decentralized Exchange

An AI-powered multi-chain DEX built on Taiko L2 and Arbitrum, featuring advanced trading, staking, token launches, and real-time AI analytics.

## Features

### Trading
- **Token Swap** — Market swaps with multi-hop routing across fee tiers (0.01%, 0.05%, 0.30%, 1.00%)
- **Limit Orders** — On-chain limit order book with automated keeper execution
- **Batch Swap** — Split one token into up to 10 outputs in a single transaction
- **Fee-on-Transfer Support** — Safe handling of deflationary tokens

### Liquidity
- **Multi-Fee Pools** — Four fee tiers for optimal capital efficiency
- **Dual AMM Models** — Constant Product (x*y=k) and StableSwap (A=85) in one factory
- **Auto-Ratio** — Automatic second-token calculation based on pool reserves
- **LP Management** — Add, remove, and track liquidity positions with IL estimation

### AI Intelligence
- **Anti-Rug Shield** — 8 real on-chain safety checks with AI risk summary
- **Smart Entry Signal** — RSI, momentum, volume analysis with FAVORABLE/NEUTRAL/UNFAVORABLE signal
- **Autopilot** — AI portfolio advisor with health score (0-100) and actionable suggestions
- **AI Chat** — Multi-turn DeFi assistant with real-time market context
- **Token & Pool Analysis** — Deep AI-powered risk assessment and yield projections
- **Swap Insight** — Sentiment analysis for trading pairs

### Staking
- **QSN Protocol Staking** — Stake QSN, earn WETH from protocol trading fees
- **Open Staking Factory** — Permissionless pool creation (any ERC20 pair)
- **Fee Collection** — Automated fee aggregation and distribution to stakers

### Launchpad
- **Fair Token Launches** — Soft/hard cap, contribution limits, time windows
- **Auto-Liquidity** — Automatic LP creation on finalization
- **LP Locking** — Mandatory LP lock period (minimum 30 days)
- **Refund Protection** — Automatic refunds if soft cap not reached

### Price Alerts
- **Real-Time Monitoring** — Background price checker every 30 seconds
- **Header Notifications** — Bell icon with badge count and dropdown
- **Flexible Conditions** — Above/below target price with notes

### Multi-Chain
- Taiko Mainnet (167000)
- Arbitrum One (42161)
- Taiko Hekla Testnet (167009)
- Arbitrum Sepolia Testnet (421614)

### Internationalization
- English and Russian with full coverage
- AI responses in user's selected language

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Smart Contracts | Solidity 0.8.20+, Foundry, OpenZeppelin |
| Backend | Rust, Axum, SQLx, PostgreSQL 16, Redis 7 |
| Frontend | Next.js 16, React 19, TypeScript, wagmi v2, viem, RainbowKit, TailwindCSS v4, Framer Motion |
| AI | Groq (Llama 3.3 70B, Llama 3.1 8B, DeepSeek R1 70B) |
| Charts | Lightweight Charts (TradingView) |
| Infra | Docker, Nginx |

---

## Project Structure

```
GRANT_DEX/
├── contracts/           # Solidity smart contracts (Foundry)
│   └── src/
│       ├── core/        # Factory, Pair, ERC20 (LP token)
│       ├── periphery/   # Router, Library, BatchSwap
│       ├── token/       # QSN token
│       ├── staking/     # StakeVault, StakingPool, StakingFactory
│       ├── launchpad/   # QsnLaunchpad
│       ├── utils/       # WETH9, LimitOrder, FeeCollector
│       └── interfaces/  # Contract interfaces
├── backend/             # Rust API server
│   ├── src/
│   │   ├── routes/      # HTTP handlers (25+ endpoints)
│   │   ├── services/    # Business logic (15+ services)
│   │   ├── models/      # Database models
│   │   └── main.rs      # App initialization & background tasks
│   └── migrations/      # PostgreSQL schema
├── frontend/            # Next.js web application
│   └── src/
│       ├── app/         # Pages (11 routes)
│       ├── components/  # UI components (100+)
│       ├── hooks/       # React hooks (15+)
│       ├── store/       # Zustand state management
│       ├── config/      # Chain & contract configuration
│       ├── i18n/        # EN + RU translations
│       └── lib/         # API client, utilities
├── backend.sh           # Backend management script
├── WHITEPAPER.md        # Full protocol whitepaper
└── .env                 # Environment variables (not in git)
```

---

## Quick Start

### Prerequisites

- Rust 1.75+
- Node.js 20+
- PostgreSQL 16
- Redis 7
- Foundry (for contracts)

### Environment Setup

Copy `.env.example` to `.env` and fill in:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/qsndex
REDIS_URL=redis://localhost:6379
GROQ_API_KEY=your_groq_api_key
KEEPER_PRIVATE_KEY=your_keeper_private_key
TAIKO_RPC_URL=https://rpc.mainnet.taiko.xyz
ARB_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
```

### Backend

```bash
cd backend
cargo build --release
cd ..
./backend.sh start
```

Backend commands: `build`, `start`, `stop`, `restart`, `status`, `logs`

### Frontend

```bash
cd frontend
npm install
npm run build
npm start
```

Frontend available at http://localhost:3000

### Smart Contracts

```bash
cd contracts
forge build
forge test
forge script script/Deploy.s.sol --broadcast
```

---

## API Documentation

Swagger UI available at http://localhost:8080/swagger-ui when backend is running.

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tokens | List tokens |
| GET | /api/pools | List liquidity pools |
| GET | /api/swap/quote | Get swap quote |
| GET | /api/swap/route | Get optimal route |
| GET | /api/safety/{token} | Token safety check |
| GET | /api/entry-signal/{token} | Entry signal analysis |
| GET | /api/autopilot/{wallet} | Portfolio suggestions |
| POST | /api/ai/chat | AI chat assistant |
| POST | /api/alerts | Create price alert |
| GET | /api/orders | Limit orders |
| GET | /api/staking/pools | Staking pools |
| GET | /api/launchpad/sales | Token sales |
| POST | /api/batch/quote | Batch swap quote |

Full API reference: 50+ endpoints documented in Swagger.

---

## Smart Contracts

See [contracts/README.md](contracts/README.md) for detailed contract documentation.

### Deployed Contracts

| Contract | Description |
|----------|-------------|
| QsnFactory | Pool factory with multi-tier fees |
| QsnRouter | User-facing swap and liquidity router |
| QsnPair | AMM pool (Constant Product + StableSwap) |
| QsnToken | Governance token (ERC20Votes + Permit) |
| QsnStakeVault | Protocol staking (QSN -> WETH rewards) |
| QsnStakingFactory | Permissionless staking pool creator |
| QsnLaunchpad | Fair launch platform with auto-LP |
| QsnLimitOrder | On-chain limit orders |
| QsnBatchSwap | Multi-output batch swaps |
| FeeCollector | Protocol fee aggregation |
| WETH9 | Wrapped Ether |

---

## Security

- ReentrancyGuard on all state-changing contracts
- EIP-2612 Permit for gasless approvals
- Minimum liquidity lock (1000 wei) against first-depositor attacks
- Deadline validation on all time-sensitive operations
- Slippage protection on swaps and liquidity operations
- Rate limiting on AI and heavy endpoints
- Input validation on all API parameters

---

## License

MIT

---

*Built by QsnDEX Team | 2026*
