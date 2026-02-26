import { createLogger } from "../logger";
import { startPumpPortal, stopPumpPortal } from "./pumpportal";
import { enrichToken } from "./dexscreener";
import type { Token } from "../types";

const log = createLogger("token-feed");

const QUEUE_MAX = 200;
const tokenQueue: Token[] = [];
const seen = new Set<string>();

export function getTokenQueue(): Token[] {
  return tokenQueue;
}

export function dequeueTokens(count: number): Token[] {
  return tokenQueue.splice(0, count);
}

export function startTokenFeed() {
  log.info("Starting token feed...");

  startPumpPortal((token) => {
    if (seen.has(token.mint)) return;
    seen.add(token.mint);

    // Keep seen set bounded
    if (seen.size > 10_000) {
      const entries = [...seen];
      for (let i = 0; i < 5_000; i++) seen.delete(entries[i]);
    }

    tokenQueue.push(token);
    if (tokenQueue.length > QUEUE_MAX) {
      tokenQueue.shift();
    }
  });
}

export async function enrichQueuedTokens(count = 5): Promise<Token[]> {
  const batch = dequeueTokens(count);
  if (!batch.length) return [];

  const enriched: Token[] = [];
  for (const token of batch) {
    // Wait a bit between enrichments to respect rate limits
    const enrichedToken = await enrichToken(token);
    enriched.push(enrichedToken);
  }

  log.info(`Enriched ${enriched.length} tokens`);
  return enriched;
}

export function stopTokenFeed() {
  stopPumpPortal();
  log.info("Token feed stopped");
}
