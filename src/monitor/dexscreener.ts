import { config } from "../config";
import { createLogger } from "../logger";
import type { DexScreenerPair, Token } from "../types";

const log = createLogger("dexscreener");

const RATE_LIMIT_MS = 1200; // DexScreener rate limit ~1 req/sec
let lastRequest = 0;

async function throttle() {
  const now = Date.now();
  const wait = RATE_LIMIT_MS - (now - lastRequest);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastRequest = Date.now();
}

export async function enrichToken(token: Token): Promise<Token> {
  try {
    await throttle();
    const url = `${config.dexScreener.baseUrl}/tokens/${token.mint}`;
    const res = await fetch(url);
    if (!res.ok) {
      log.warn(`DexScreener ${res.status} for ${token.symbol}`);
      return token;
    }

    const data = await res.json() as { pairs?: DexScreenerPair[] };
    if (!data.pairs?.length) return token;

    // Use the pair with highest liquidity
    const pair = data.pairs.sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];

    token.priceUsd = parseFloat(pair.priceUsd) || undefined;
    token.priceSol = parseFloat(pair.priceNative) || undefined;
    token.marketCapUsd = pair.fdv || undefined;
    token.liquidityUsd = pair.liquidity?.usd;
    token.liquiditySol = pair.liquidity?.quote;
    token.volume24h = pair.volume?.h24;
    token.volumeRecent = pair.volume?.m5;
    token.tradesRecent = (pair.txns?.m5?.buys ?? 0) + (pair.txns?.m5?.sells ?? 0);

    // Social info
    if (pair.info?.websites?.length) {
      token.website = pair.info.websites[0].url;
    }
    if (pair.info?.socials) {
      const tw = pair.info.socials.find(s => s.type === "twitter");
      if (tw) token.twitter = tw.url;
      const tg = pair.info.socials.find(s => s.type === "telegram");
      if (tg) token.telegram = tg.url;
    }

    log.debug(`Enriched ${token.symbol}: $${token.marketCapUsd} mcap, $${token.liquidityUsd} liq`);
    return token;
  } catch (err) {
    log.error(`DexScreener enrichment failed for ${token.symbol}`, err);
    return token;
  }
}

export async function getTokenPrice(mint: string): Promise<number | null> {
  try {
    await throttle();
    const url = `${config.dexScreener.baseUrl}/tokens/${mint}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json() as { pairs?: DexScreenerPair[] };
    if (!data.pairs?.length) return null;
    return parseFloat(data.pairs[0].priceUsd) || null;
  } catch {
    return null;
  }
}
