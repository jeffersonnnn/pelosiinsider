export const config = {
  mode: process.env.MODE || "paper",
  isPaper: (process.env.MODE || "paper") === "paper",

  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com",
    privateKey: process.env.SOLANA_PRIVATE_KEY || "",
  },

  trading: {
    maxPositionSol: parseFloat(process.env.MAX_POSITION_SOL || "0.08"),
    maxTotalExposureSol: parseFloat(process.env.MAX_TOTAL_EXPOSURE_SOL || "0.5"),
    takeProfitMultiplier: parseFloat(process.env.TAKE_PROFIT_MULTIPLIER || "2.5"),
    stopLossPct: parseFloat(process.env.STOP_LOSS_PCT || "0.25"),
    dailyLossLimitSol: parseFloat(process.env.DAILY_LOSS_LIMIT_SOL || "0.3"),
    maxConcurrentPositions: 6,
    maxHoldTimeMs: 1.5 * 60 * 60 * 1000, // 1.5 hours
    partialTakeProfitPct: 0.50, // sell half at +50%
    trailingStopAfterPartialPct: 0.20, // trailing stop at +20% after partial
  },

  scoring: {
    buyThreshold: 62,
    weights: {
      liquidity: 0.15,
      volumeVelocity: 0.20,
      holderDistribution: 0.15,
      devWallet: 0.12,
      bondingCurve: 0.12,
      marketCap: 0.08,
      memeQuality: 0.10,
      socialPresence: 0.08,
    },
    // Hard reject thresholds
    maxDevHoldPct: 80,
    maxMarketCapUsd: 300_000,
    minLiquiditySol: 1,
    minTokenAgeSec: 120,
    minHolderCount: 5,
  },

  twitter: {
    apiKey: process.env.TWITTER_API_KEY || "",
    apiSecret: process.env.TWITTER_API_SECRET || "",
    accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
    accessSecret: process.env.TWITTER_ACCESS_SECRET || "",
    maxTweetsPerDay: 20,
    commentaryIntervalMs: 3 * 60 * 60 * 1000, // 3 hours
  },

  ai: {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    model: process.env.AI_MODEL || "anthropic/claude-haiku-4.5",
    baseUrl: "https://openrouter.ai/api/v1",
  },

  web: {
    port: parseInt(process.env.WEB_PORT || "4567"),
  },

  intervals: {
    discoveryMs: 10_000,
    evalMs: 30_000,
    positionCheckMs: 15_000,
    tweetMs: 5 * 60 * 1000, // 5 min minimum between tweets
  },

  jupiter: {
    quoteUrl: "https://quote-api.jup.ag/v6/quote",
    swapUrl: "https://quote-api.jup.ag/v6/swap",
    slippageBps: 300, // 3%
  },

  pumpPortal: {
    wsUrl: "wss://pumpportal.fun/api/data",
  },

  dexScreener: {
    baseUrl: "https://api.dexscreener.com/latest/dex",
  },

  SOL_MINT: "So11111111111111111111111111111111111111112",
} as const;
