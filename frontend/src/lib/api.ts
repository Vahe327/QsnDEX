const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';

export interface SafetyCheckResponse {
  token_address: string;
  safety_score: number;
  risk_level: string;
  checks: CheckResult[];
  ai_summary: string;
  cached: boolean;
  checked_at: string;
}

export interface CheckResult {
  name: string;
  status: string;
  severity: string;
  detail: string;
}

export interface EntrySignalResponse {
  token: string;
  price_usd: number;
  metrics: {
    vs_7d_avg: number;
    vs_30d_avg: number;
    rsi_14: number;
    volume_change_4h: number;
    distance_from_7d_high: number;
    distance_from_7d_low: number;
  };
  signal: string;
  explanation: string;
  cached: boolean;
}

export interface AutopilotResponse {
  wallet: string;
  portfolio_value_usd: number;
  health_score: number;
  suggestions: Suggestion[];
  scanned_at: string;
  cached: boolean;
}

export interface Suggestion {
  id: string;
  suggestion_type: string;
  priority: string;
  title: string;
  description: string;
  action: SuggestionAction;
}

export interface SuggestionAction {
  action_type: string;
  from_token?: string;
  from_symbol?: string;
  to_token?: string;
  to_symbol?: string;
  suggested_amount?: string;
  suggested_pct?: number;
  pool_address?: string;
  pool_name?: string;
  apr?: number;
  estimated_monthly?: number;
  token_symbol?: string;
  token_address?: string;
  condition?: string;
  target_price?: number;
}

export interface BatchQuoteRequest {
  token_in: string;
  amount_in: string;
  orders: { token_out: string; percentage: number }[];
  slippage_bps: number;
  chain_id?: number;
}

export interface BatchQuoteResponse {
  token_in: string;
  amount_in: string;
  orders: BatchOrderQuote[];
  total_gas_estimated: number;
  gas_vs_separate: number;
  gas_savings_pct: number;
  gas_cost_usd: number;
}

export interface BatchOrderQuote {
  token_out: string;
  token_out_symbol: string;
  percentage: number;
  amount_in: string;
  amount_out: string;
  amount_out_min: string;
}

export interface BatchBuildTxRequest {
  token_in: string;
  amount_in: string;
  orders: {
    token_out: string;
    percentage: number;
    amount_out_min: string;
    path: string[];
  }[];
  slippage_bps: number;
  deadline: number;
  sender: string;
  chain_id?: number;
}

export interface BatchBuildTxResponse {
  to: string;
  data: string;
  value: string;
  gas_estimate: number;
}

export interface ILSimulationResponse {
  deposit_usd: number;
  price_change_pct: number;
  il_pct: number;
  il_usd: number;
  hodl_value: number;
  pool_value: number;
  fees_earned: number;
  net_value: number;
  net_pnl: number;
  breakeven_days: number;
  pool_apr: number;
  days_in_pool: number;
}

function appendChainId(qs: URLSearchParams, chainId?: number): void {
  if (chainId !== undefined) {
    qs.set('chain_id', chainId.toString());
  }
}

function appendChainIdToUrl(url: string, chainId?: number): string {
  if (chainId === undefined) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}chain_id=${chainId}`;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const error = await res.text().catch(() => 'Unknown error');
    throw new Error(error);
  }

  return res.json();
}

export const api = {
  getTokens: (q?: string, chainId?: number) => {
    const qs = new URLSearchParams();
    if (q) qs.set('q', q);
    appendChainId(qs, chainId);
    const qsStr = qs.toString();
    return fetchApi<{ tokens: any[] }>(`/tokens${qsStr ? `?${qsStr}` : ''}`);
  },
  getToken: (address: string, chainId?: number) =>
    fetchApi<{ token: any }>(appendChainIdToUrl(`/tokens/${address}`, chainId)),
  importToken: (address: string, chainId?: number) =>
    fetchApi<{ token: any; imported: boolean }>(appendChainIdToUrl(`/tokens/import/${address}`, chainId)),

  getPools: (params?: { sort?: string; order?: string; limit?: number; offset?: number; chainId?: number }) => {
    const qs = new URLSearchParams();
    if (params?.sort) qs.set('sort', params.sort);
    if (params?.order) qs.set('order', params.order);
    if (params?.limit) qs.set('limit', params.limit.toString());
    if (params?.offset) qs.set('offset', params.offset.toString());
    appendChainId(qs, params?.chainId);
    return fetchApi<{ pools: any[]; total: number }>(`/pools?${qs}`);
  },
  getPool: (address: string, chainId?: number) =>
    fetchApi<{ pool: any }>(appendChainIdToUrl(`/pools/${address}`, chainId)),
  getPoolChart: (address: string, period?: string, chainId?: number) =>
    fetchApi<{ chart: any[] }>(appendChainIdToUrl(`/pools/${address}/chart?period=${period || '7d'}`, chainId)),

  getSwapQuote: (tokenIn: string, tokenOut: string, amountIn: string, slippage?: number, chainId?: number) =>
    fetchApi<{ quote: any }>(
      appendChainIdToUrl(
        `/swap/quote?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountIn}&slippage=${slippage || 50}`,
        chainId
      )
    ),
  getSwapRoute: (tokenIn: string, tokenOut: string, chainId?: number) =>
    fetchApi<{ routes: any[] }>(appendChainIdToUrl(`/swap/route?tokenIn=${tokenIn}&tokenOut=${tokenOut}`, chainId)),

  getPrices: (tokens: string[], chainId?: number) =>
    fetchApi<{ prices: Record<string, number> }>(appendChainIdToUrl(`/prices?tokens=${tokens.join(',')}`, chainId)),

  getPortfolio: (wallet: string, chainId?: number) =>
    fetchApi<{ portfolio: any }>(appendChainIdToUrl(`/portfolio/${wallet}`, chainId)),
  getHistory: (wallet: string, chainId?: number) =>
    fetchApi<{ swaps: any[]; liquidity_events: any[] }>(appendChainIdToUrl(`/history/${wallet}`, chainId)),

  getStats: (chainId?: number) => fetchApi<any>(appendChainIdToUrl('/stats', chainId)),
  getStatsChart: (period?: string, chainId?: number) =>
    fetchApi<{ chart: any[] }>(appendChainIdToUrl(`/stats/chart?period=${period || '7d'}`, chainId)),

  analyzeToken: (tokenAddress: string, userAddress: string, locale?: string, chainId?: number) =>
    fetchApi<{ analysis: any }>('/ai/analyze-token', {
      method: 'POST',
      body: JSON.stringify({
        token_address: tokenAddress,
        user_address: userAddress,
        locale: locale || 'en',
        chain_id: chainId,
      }),
    }),
  analyzePool: (poolAddress: string, userAddress: string, locale?: string, chainId?: number) =>
    fetchApi<{ insight: any }>('/ai/analyze-pool', {
      method: 'POST',
      body: JSON.stringify({
        pool_address: poolAddress,
        user_address: userAddress,
        locale: locale || 'en',
        chain_id: chainId,
      }),
    }),
  aiChat: (messages: { role: string; content: string }[], userAddress: string, locale?: string, chainId?: number) =>
    fetchApi<{ response: { message: string; requests_remaining: number } }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages, user_address: userAddress, locale: locale || 'en', chain_id: chainId }),
    }),
  swapInsight: (tokenIn: string, tokenOut: string, locale?: string, chainId?: number) =>
    fetchApi<{ insight: any }>(
      appendChainIdToUrl(`/ai/swap-insight?tokenIn=${tokenIn}&tokenOut=${tokenOut}&locale=${locale || 'en'}`, chainId)
    ),

  getFarms: (chainId?: number) => fetchApi<{ farms: any[] }>(appendChainIdToUrl('/farms', chainId)),

  checkSafety: (tokenAddress: string, chainId?: number, locale?: string) => {
    let url = appendChainIdToUrl(`/safety/${tokenAddress}`, chainId);
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}locale=${locale || 'en'}`;
    return fetchApi<{ safety: SafetyCheckResponse }>(url);
  },

  getEntrySignal: (tokenAddress: string, chainId?: number, locale?: string) => {
    let url = appendChainIdToUrl(`/entry-signal/${tokenAddress}`, chainId);
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}locale=${locale || 'en'}`;
    return fetchApi<{ signal: EntrySignalResponse }>(url);
  },

  getAutopilot: (walletAddress: string, locale?: string, chainId?: number) =>
    fetchApi<{ autopilot: AutopilotResponse }>(
      appendChainIdToUrl(`/autopilot/${walletAddress}?locale=${locale || 'en'}`, chainId)
    ),

  getBatchQuote: (request: BatchQuoteRequest) =>
    fetchApi<{ quote: BatchQuoteResponse }>('/batch/quote', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
  buildBatchTx: (request: BatchBuildTxRequest) =>
    fetchApi<{ tx: BatchBuildTxResponse }>('/batch/build-tx', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  getQsnInfo: (chainId?: number) =>
    fetchApi<{ qsn: any }>(appendChainIdToUrl('/qsn', chainId)),

  getStakingInfo: (chainId?: number) =>
    fetchApi<{ staking: any }>(appendChainIdToUrl('/staking/qsn', chainId)),
  getStakingUser: (wallet: string, chainId?: number) =>
    fetchApi<{ user: any }>(appendChainIdToUrl(`/staking/qsn/user/${wallet}`, chainId)),

  getStakingPools: (chainId?: number, status?: string, sort?: string) => {
    const qs = new URLSearchParams();
    appendChainId(qs, chainId);
    if (status) qs.set('status', status);
    if (sort) qs.set('sort', sort);
    const qsStr = qs.toString();
    return fetchApi<{ pools: any[] }>(`/staking/pools${qsStr ? `?${qsStr}` : ''}`);
  },
  getStakingPool: (address: string, chainId?: number) =>
    fetchApi<{ pool: any }>(appendChainIdToUrl(`/staking/pools/${address}`, chainId)),
  getStakingPoolUser: (address: string, wallet: string, chainId?: number) =>
    fetchApi<{ user: any }>(appendChainIdToUrl(`/staking/pools/${address}/user/${wallet}`, chainId)),
  getUserStakingPositions: (wallet: string, chainId?: number) =>
    fetchApi<{ positions: any[] }>(appendChainIdToUrl(`/staking/user/${wallet}`, chainId)),
  getStakingCreateFee: (chainId?: number) =>
    fetchApi<{ fee: string; fee_bps: number }>(appendChainIdToUrl('/staking/create-fee', chainId)),

  getLaunchpadSales: (chainId?: number, status?: string) => {
    const qs = new URLSearchParams();
    appendChainId(qs, chainId);
    if (status) qs.set('status', status);
    const qsStr = qs.toString();
    return fetchApi<{ sales: any[] }>(`/launchpad/sales${qsStr ? `?${qsStr}` : ''}`);
  },
  getLaunchpadSale: (id: string, chainId?: number) =>
    fetchApi<{ sale: any }>(appendChainIdToUrl(`/launchpad/sales/${id}`, chainId)),
  getLaunchpadUserContrib: (id: string, wallet: string, chainId?: number) =>
    fetchApi<{ contribution: any }>(appendChainIdToUrl(`/launchpad/sales/${id}/user/${wallet}`, chainId)),

  createAlert: (body: CreateAlertBody) =>
    fetchApi<{ alert: PriceAlertDto }>('/alerts', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getAlerts: (wallet: string, chainId?: number, includeTriggered?: boolean) => {
    const qs = new URLSearchParams();
    appendChainId(qs, chainId);
    if (includeTriggered) qs.set('include_triggered', 'true');
    return fetchApi<{ alerts: PriceAlertDto[] }>(`/alerts/wallet/${wallet}?${qs}`);
  },
  getTriggeredAlerts: (wallet: string, chainId?: number) =>
    fetchApi<{ notifications: TriggeredAlertNotification[] }>(
      appendChainIdToUrl(`/alerts/wallet/${wallet}/triggered`, chainId)
    ),
  getAlertCount: (wallet: string, chainId?: number) =>
    fetchApi<{ count: number }>(appendChainIdToUrl(`/alerts/wallet/${wallet}/count`, chainId)),
  deleteAlert: (id: number, wallet: string) =>
    fetchApi<{ ok: boolean }>(`/alerts/manage/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ wallet }),
    }),
  toggleAlert: (id: number, wallet: string) =>
    fetchApi<{ alert: PriceAlertDto }>(`/alerts/manage/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ wallet }),
    }),
  dismissAlert: (id: number, wallet: string) =>
    fetchApi<{ ok: boolean }>(`/alerts/manage/${id}/dismiss`, {
      method: 'PATCH',
      body: JSON.stringify({ wallet }),
    }),

  simulateIL: (params: {
    pool: string;
    deposit_usd: number;
    price_change_pct: number;
    days_in_pool: number;
    chain_id?: number;
  }) => {
    const qs = new URLSearchParams({
      pool: params.pool,
      deposit_usd: params.deposit_usd.toString(),
      price_change_pct: params.price_change_pct.toString(),
      days_in_pool: params.days_in_pool.toString(),
    });
    if (params.chain_id !== undefined) {
      qs.set('chain_id', params.chain_id.toString());
    }
    return fetchApi<{ simulation: ILSimulationResponse }>(`/il/simulate?${qs}`);
  },
};

export interface PriceAlertDto {
  id: number;
  wallet: string;
  token_address: string;
  token_symbol: string;
  condition: 'above' | 'below';
  target_price: number;
  price_at_creation: number;
  current_price: number | null;
  chain_id: number;
  active: boolean;
  triggered: boolean;
  note: string;
  created_at: string;
  triggered_at: string | null;
}

export interface TriggeredAlertNotification {
  alert_id: number;
  token_symbol: string;
  token_address: string;
  condition: string;
  target_price: number;
  current_price: number;
  triggered_at: string;
  note: string;
}

export interface CreateAlertBody {
  wallet: string;
  token_address: string;
  token_symbol?: string;
  condition: 'above' | 'below';
  target_price: number;
  note?: string;
  chain_id?: number;
}

export function createPriceWebSocket(onMessage: (data: any) => void): WebSocket {
  const ws = new WebSocket(`${WS_URL}/prices`);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  return ws;
}

export function createSwapsWebSocket(onMessage: (data: any) => void): WebSocket {
  const ws = new WebSocket(`${WS_URL}/swaps`);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  return ws;
}
