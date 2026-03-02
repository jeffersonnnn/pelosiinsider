# Nancy Pelosi Congressional Trading Desk

An autonomous Solana memecoin trading bot that monitors PumpPortal for new token launches, evaluates them with AI-powered scoring, executes trades via Jupiter DEX, and posts congressional-style commentary to Twitter/X — all in the voice of the Speaker Emerita.

Live at [pelosiinsider.com](https://pelosiinsider.com)

## How It Works

```
PumpPortal WebSocket  →  Token Discovery  →  AI Scoring  →  Trade Execution  →  Twitter Commentary
     (new tokens)        (DexScreener)      (Claude Haiku)    (Jupiter DEX)       (Nancy's voice)
```

1. **Token Feed** — Connects to PumpPortal WebSocket for real-time new token launches on Solana
2. **Enrichment** — Pulls on-chain data via DexScreener (liquidity, market cap, holder distribution, volume)
3. **AI Evaluation** — Claude Haiku scores each token on a composite scale across liquidity, momentum, holder quality, and meme potential
4. **Trade Execution** — Tokens above the buy threshold are acquired through Jupiter DEX with configurable position sizing
5. **Position Management** — Automated take-profit, stop-loss, and trailing stop logic with partial profit-taking
6. **Twitter Bot** — Every buy, sell, and periodic market commentary is tweeted in Nancy Pelosi's distinctive political voice
7. **Mention Monitoring** — Responds to Twitter mentions with in-character congressional deflections
8. **Live Dashboard** — Real-time web dashboard styled after pelosi.house.gov showing portfolio, trades, intel briefings, and discovery feed

## Architecture

```
src/
├── index.ts                 # Main loop orchestrator
├── config.ts                # Environment config + defaults
├── types.ts                 # Shared TypeScript types
├── logger.ts                # Structured logging
├── monitor/
│   ├── token-feed.ts        # PumpPortal WebSocket + token queue
│   ├── pumpportal.ts        # WebSocket client
│   └── dexscreener.ts       # DexScreener API client
├── evaluator/
│   ├── scorer.ts            # AI-powered composite scoring
│   ├── filters.ts           # Pre-filter rules (rug detection, etc.)
│   ├── onchain.ts           # On-chain metric analysis
│   └── sentiment.ts         # Meme quality / sentiment signals
├── trader/
│   ├── wallet.ts            # Solana wallet management
│   ├── executor.ts          # Jupiter DEX swap execution
│   ├── positions.ts         # Position tracking + exit logic
│   └── strategy.ts          # Risk management + sizing
├── twitter/
│   ├── client.ts            # Twitter API v2 client
│   ├── composer.ts          # AI tweet generation (Nancy's voice)
│   ├── mentions.ts          # Mention monitoring + replies
│   └── scheduler.ts         # Tweet queue + rate limiting
├── store/
│   └── db.ts                # SQLite database (trades, positions, tweets)
├── web/
│   ├── server.ts            # Bun HTTP server + dashboard HTML
│   └── api.ts               # REST API endpoints
└── deploy/
    ├── Dockerfile
    ├── docker-compose.yml
    ├── nginx.conf
    ├── setup.sh
    └── run.sh
```

## Stack

- **Runtime** — [Bun](https://bun.sh)
- **Language** — TypeScript (ESM)
- **Blockchain** — Solana via `@solana/web3.js` + Jupiter DEX
- **AI** — Claude Haiku via OpenRouter
- **Twitter** — `twitter-api-v2`
- **Database** — SQLite (Bun native)
- **Server** — Bun.serve() with inline dashboard
- **Deployment** — Docker + nginx reverse proxy + Let's Encrypt SSL

## Setup

```bash
# Clone
git clone https://github.com/jeffersonnnn/pelosiinsider.git
cd pelosiinsider

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Fill in your values (see below)

# Run in paper trading mode
bun run start

# Run in dev mode (hot reload)
bun run dev
```

## Environment Variables

```env
# Solana
SOLANA_RPC_URL=              # RPC endpoint (Helius, QuickNode, etc.)
SOLANA_PRIVATE_KEY=          # Wallet private key (base58)

# Trading
MODE=paper                   # "paper" or "live"
MAX_POSITION_SOL=0.1         # Max SOL per trade
MAX_TOTAL_EXPOSURE_SOL=0.5   # Max total SOL in open positions
TAKE_PROFIT_MULTIPLIER=2.0   # Exit at 2x
STOP_LOSS_PCT=0.30           # Stop loss at 30%
DAILY_LOSS_LIMIT_SOL=0.3     # Circuit breaker

# Twitter
TWITTER_API_KEY=             # OAuth 1.0a API Key
TWITTER_API_SECRET=          # OAuth 1.0a API Secret
TWITTER_ACCESS_TOKEN=        # Account Access Token
TWITTER_ACCESS_SECRET=       # Account Access Secret

# AI (OpenRouter)
OPENROUTER_API_KEY=          # OpenRouter API key
AI_MODEL=anthropic/claude-haiku-4.5

# Web Dashboard
WEB_PORT=3456                # Dashboard port
```

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /` | Live dashboard |
| `GET /api/stats` | Portfolio balance and PnL |
| `GET /api/positions` | All positions |
| `GET /api/positions/open` | Open positions only |
| `GET /api/trades` | Recent trade ledger |
| `GET /api/tweets` | Recent tweets |
| `GET /api/discovery` | Token discovery feed |
| `GET /api/token/:mint` | Single token details |

## Deployment

```bash
# On your VPS
git clone https://github.com/jeffersonnnn/pelosiinsider.git /opt/nancypelosi
cd /opt/nancypelosi
cp .env.example .env
# Fill in .env with production values

# Install bun
curl -fsSL https://bun.sh/install | bash
bun install

# Run with systemd (see deploy/setup.sh)
bash deploy/setup.sh

# Or with Docker
docker compose -f deploy/docker-compose.yml up -d
```

## Disclaimer

This is a satirical art project and trading bot for entertainment purposes. Not financial advice. Not affiliated with any government official. Trade at your own risk.

## License

MIT
