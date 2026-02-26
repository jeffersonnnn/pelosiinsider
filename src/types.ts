export interface Token {
  mint: string;
  name: string;
  symbol: string;
  uri?: string;
  description?: string;
  createdAt: number;
  // On-chain data
  devWallet?: string;
  devHoldPct?: number;
  topHoldersPct?: number;
  holderCount?: number;
  mintAuthorityRevoked?: boolean;
  freezeAuthorityRevoked?: boolean;
  bondingCurvePct?: number;
  // Market data
  priceUsd?: number;
  priceSol?: number;
  marketCapUsd?: number;
  liquiditySol?: number;
  liquidityUsd?: number;
  volume24h?: number;
  volumeRecent?: number;
  tradesRecent?: number;
  // Social
  website?: string;
  twitter?: string;
  telegram?: string;
  // Scoring
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
  rejected?: boolean;
  rejectReason?: string;
  // Chain-of-thought reasoning
  reasoning?: string;
  reasoningTimestamp?: number;
}

export interface ScoreBreakdown {
  liquidity: number;
  volumeVelocity: number;
  holderDistribution: number;
  devWallet: number;
  bondingCurve: number;
  marketCap: number;
  memeQuality: number;
  socialPresence: number;
  total: number;
}

export interface Position {
  id?: number;
  mint: string;
  symbol: string;
  entryPrice: number;
  entrySol: number;
  entryTime: number;
  tokenAmount: number;
  currentPrice?: number;
  currentValue?: number;
  pnlPct?: number;
  status: "open" | "closed";
  exitPrice?: number;
  exitTime?: number;
  exitReason?: string;
  txBuy?: string;
  txSell?: string;
  partialTaken?: boolean;
}

export interface Trade {
  id?: number;
  mint: string;
  symbol: string;
  side: "buy" | "sell";
  solAmount: number;
  tokenAmount: number;
  price: number;
  txSignature: string;
  timestamp: number;
  score?: number;
  pnlPct?: number;
  exitReason?: string;
}

export interface Tweet {
  id?: number;
  text: string;
  tweetId?: string;
  type: "buy" | "sell_profit" | "sell_loss" | "commentary" | "summary";
  mint?: string;
  symbol?: string;
  timestamp: number;
  posted: boolean;
}

export interface PumpPortalToken {
  signature: string;
  mint: string;
  traderPublicKey: string;
  txType: "create" | "buy" | "sell";
  initialBuy: number;
  bondingCurveKey: string;
  vTokensInBondingCurve: number;
  vSolInBondingCurve: number;
  marketCapSol: number;
  name: string;
  symbol: string;
  uri: string;
}

export interface DexScreenerPair {
  chainId: string;
  dexId: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  priceNative: string;
  priceUsd: string;
  volume: { h24: number; h6: number; h1: number; m5: number };
  txns: { h24: { buys: number; sells: number }; h1: { buys: number; sells: number }; m5: { buys: number; sells: number } };
  liquidity: { usd: number; base: number; quote: number };
  fdv: number;
  info?: { websites?: { url: string }[]; socials?: { type: string; url: string }[] };
}

export interface JupiterQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  routePlan: unknown[];
}

export interface AppState {
  discoveredTokens: Map<string, Token>;
  positions: Position[];
  dailyPnl: number;
  totalTrades: number;
  wins: number;
  losses: number;
  isRunning: boolean;
  lastTweetTime: number;
  tweetCount: number;
}
