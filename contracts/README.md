# QsnDEX Smart Contracts

Solidity smart contracts powering the QsnDEX decentralized exchange. Built with Foundry and OpenZeppelin.

## Architecture

```
QsnFactory ──creates──> QsnPair (ERC20 LP Token)
     |                      |
     |                 QsnERC20 (EIP-2612 Permit)
     |
QsnRouter ──swaps/liquidity──> QsnPair[]
     |
QsnBatchSwap ──multi-output──> QsnRouter
     |
QsnLimitOrder ──keeper execution──> QsnRouter
     |
QsnStakeVault ──QSN staking──> WETH rewards
     |
QsnStakingFactory ──creates──> QsnStakingPool[]
     |
QsnLaunchpad ──fair launches──> QsnRouter (auto-LP)
     |
FeeCollector ──aggregates──> QsnStakeVault
```

## Contracts

### Core

**QsnFactory** (`src/core/QsnFactory.sol`)
- Creates and manages all trading pairs via CREATE2
- Multi-tier fee system: 0.01%, 0.05%, 0.30%, 1.00%
- Fee tier management (enable/disable arbitrary tiers)
- Protocol fee recipient configuration

**QsnPair** (`src/core/QsnPair.sol`)
- AMM pool with two models: Constant Product (x*y=k) and StableSwap (A=85)
- ERC20 LP token with EIP-2612 permit support
- TWAP oracle via cumulative price accumulators
- Flash swap support with callback verification
- Reentrancy protection via custom lock modifier
- Protocol fee minting (1/6 of LP fees to feeTo)

**QsnERC20** (`src/core/QsnERC20.sol`)
- LP token base: "QsnDEX LP" / "QSN-LP"
- EIP-712 domain separator with chain fork detection
- Unlimited allowance support (type(uint256).max)

### Periphery

**QsnRouter** (`src/periphery/QsnRouter.sol`)
- All swap variants: exact input/output, ETH wrapping, fee-on-transfer tokens
- Multi-hop routing with fee array per hop
- Liquidity add/remove for token and ETH pairs
- Permit-based liquidity removal (no separate approve tx)
- OpenZeppelin ReentrancyGuard + deadline modifier

**QsnLibrary** (`src/periphery/QsnLibrary.sol`)
- Pure math: quote, getAmountOut/In with fee deduction
- CREATE2 pair address computation (no RPC call needed)
- Multi-hop amount calculations

**QsnBatchSwap** (`src/periphery/QsnBatchSwap.sol`)
- Up to 10 swaps in one transaction
- Percentage-based allocation (must sum to 10000 bps)
- Supports ETH and token inputs
- Automatic dust refund

### Token

**QsnToken** (`src/token/QsnToken.sol`)
- ERC20 + ERC20Burnable + ERC20Permit + ERC20Votes
- Max supply: 100,000,000 QSN
- Owner-only minting with cap enforcement
- On-chain governance voting power

### Staking

**QsnStakeVault** (`src/staking/QsnStakeVault.sol`)
- Synthetix-style reward streaming
- Stake QSN, earn WETH from protocol fees
- 7-day reward distribution periods
- Functions: stake, withdraw, claimReward, exit

**QsnStakingFactory** (`src/staking/QsnStakingFactory.sol`)
- Permissionless staking pool creation
- Creation fee: 0.01 ETH + 2% of rewards (configurable, max 10%)
- Deploys QsnStakingPool instances

**QsnStakingPool** (`src/staking/QsnStakingPool.sol`)
- Open staking: any ERC20 stake token, any ERC20 reward token
- Configurable: min/max stake, duration
- Synthetix-style reward distribution
- Functions: stake, withdraw, claimReward, exit

### Launchpad

**QsnLaunchpad** (`src/launchpad/QsnLaunchpad.sol`)
- Fair token launch with soft/hard cap
- Auto-liquidity creation via Router on finalization
- LP locking (minimum 30 days)
- Platform fee: 0.05 ETH creation + 2% of raised ETH
- Emergency cancel after 7-day grace period
- Participant refunds on cancelled sales

### Utilities

**QsnLimitOrder** (`src/utils/QsnLimitOrder.sol`)
- On-chain limit order book
- Users place orders (deposit tokenIn, specify minAmountOut + deadline)
- Keepers execute when price conditions met
- Keeper reward: 0.1% of output (KEEPER_REWARD_BPS = 10)
- Expired order reclaim by anyone

**FeeCollector** (`src/utils/FeeCollector.sol`)
- Aggregates fees from all trading pairs via skim
- Wraps ETH to WETH
- Distributes to QSN StakeVault
- Two-step ownership transfer
- Batch collection across multiple pairs

**WETH9** (`src/utils/WETH9.sol`)
- Standard Wrapped Ether implementation

## Fee Structure

| Source | Fee | Recipient |
|--------|-----|-----------|
| Swaps (LP share) | 0.01-1.00% | Liquidity Providers |
| Protocol (from 0.30% tier) | ~0.05% (1/6 of fees) | FeeCollector -> StakeVault |
| Limit Order execution | 0.1% of output | Keeper (executor) |
| Staking Pool creation | 0.01 ETH + 2% rewards | Platform |
| Launchpad creation | 0.05 ETH | Platform |
| Launchpad raise | 2% of ETH | Platform |

## Security

- **ReentrancyGuard** on Router, StakingFactory, StakingPool, Launchpad, BatchSwap, FeeCollector, LimitOrder
- **Custom lock** on Pair (efficient single-bit, invariant checked after callbacks)
- **MINIMUM_LIQUIDITY** (1000 wei) locked permanently against donation attacks
- **Deadline validation** on all time-sensitive operations
- **Slippage protection** via amountMin/Max parameters
- **Two-step ownership** on FeeCollector
- **Fee-on-transfer safety** via actual balance measurement
- **Solidity 0.8+** overflow/underflow protection

## Build & Test

```bash
forge build
forge test
forge test -vvv
```

## Deployment

```bash
forge script script/Deploy.s.sol \
  --rpc-url $RPC_URL \
  --private-key $DEPLOYER_KEY \
  --broadcast \
  --verify
```

## Interfaces

All interfaces available in `src/interfaces/`:
- `IQsnFactory.sol`
- `IQsnPair.sol`
- `IQsnRouter.sol`
- `IQsnERC20.sol`
- `IERC20.sol`
- `IWETH.sol`
