import { config } from "./config";
import { createLogger } from "./logger";
import { initDb } from "./store/db";
import { initWallet } from "./trader/wallet";
import { initTwitter, getTwitterClient } from "./twitter/client";
import { startTokenFeed, enrichQueuedTokens, stopTokenFeed } from "./monitor/token-feed";
import { evaluateTokens } from "./evaluator/scorer";
import { openPosition, checkPositions } from "./trader/positions";
import { composeBuyTweet, composeSellTweet, composeCommentaryTweet } from "./twitter/composer";
import { enqueueTweet, processQueue } from "./twitter/scheduler";
import { initMentions, checkMentions } from "./twitter/mentions";
import { startWebServer } from "./web/server";

const log = createLogger("main");

async function main() {
  log.info("=== Nancy Pelosi Congressional Trading Desk ===");
  log.info(`Mode: ${config.mode.toUpperCase()}`);

  // Initialize systems
  initDb();
  initWallet();
  const twitterClient = initTwitter();
  initMentions(twitterClient);
  startWebServer();
  startTokenFeed();

  log.info("All systems initialized. Starting main loop...");

  // Discovery loop: enrich + evaluate tokens
  setInterval(async () => {
    try {
      const tokens = await enrichQueuedTokens(5);
      if (!tokens.length) return;

      const evaluated = await evaluateTokens(tokens);
      const buySignals = evaluated.filter(t => !t.rejected && (t.score ?? 0) >= config.scoring.buyThreshold);

      for (const token of buySignals) {
        const position = await openPosition(token);
        if (position) {
          const tweet = await composeBuyTweet(token.symbol, token.score ?? 0);
          enqueueTweet({ text: tweet, type: "buy", mint: token.mint, symbol: token.symbol });
        }
      }
    } catch (err) {
      log.error("Discovery loop error", err);
    }
  }, config.intervals.evalMs);

  // Position check loop: monitor exits
  setInterval(async () => {
    try {
      const { closed } = await checkPositions();
      for (const pos of closed) {
        const pnl = pos.pnlPct ?? 0;
        const tweet = await composeSellTweet(pos.symbol, pnl, pos.exitReason ?? "unknown");
        const type = pnl > 0 ? "sell_profit" : "sell_loss";
        enqueueTweet({ text: tweet, type, mint: pos.mint, symbol: pos.symbol });
      }
    } catch (err) {
      log.error("Position check error", err);
    }
  }, config.intervals.positionCheckMs);

  // Tweet processing loop
  setInterval(async () => {
    try {
      await processQueue();
    } catch (err) {
      log.error("Tweet queue error", err);
    }
  }, 10_000);

  // Commentary loop: periodic market commentary tweets
  let lastCommentary = 0;
  setInterval(async () => {
    try {
      const now = Date.now();
      if (now - lastCommentary < config.twitter.commentaryIntervalMs) return;
      lastCommentary = now;

      const tweet = await composeCommentaryTweet();
      enqueueTweet({ text: tweet, type: "commentary" });
    } catch (err) {
      log.error("Commentary loop error", err);
    }
  }, 60_000);

  // Mention monitoring loop: check every 2 minutes
  setInterval(async () => {
    try {
      await checkMentions();
    } catch (err) {
      log.error("Mention check error", err);
    }
  }, 120_000);

  // Graceful shutdown
  const shutdown = () => {
    log.info("Shutting down...");
    stopTokenFeed();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  log.error("Fatal error", err);
  process.exit(1);
});
