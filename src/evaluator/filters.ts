import { config } from "../config";
import { createLogger } from "../logger";
import type { Token } from "../types";

const log = createLogger("filters");

const IMPERSONATION_NAMES = [
  "trump", "biden", "elon", "solana", "ethereum", "bitcoin",
  "official", "verified", "real", "binance", "coinbase",
];

export function applyHardFilters(token: Token): { pass: boolean; reason?: string } {
  // Token too young - wait for initial volatility to settle
  if (token.createdAt) {
    const ageSec = Math.floor(Date.now() / 1000) - token.createdAt;
    if (ageSec < config.scoring.minTokenAgeSec) {
      return { pass: false, reason: `Token age ${ageSec}s (<${config.scoring.minTokenAgeSec}s)` };
    }
  }

  // Not enough holders
  if (token.holderCount !== undefined && token.holderCount < config.scoring.minHolderCount) {
    return { pass: false, reason: `Only ${token.holderCount} holders (<${config.scoring.minHolderCount})` };
  }

  // Dev wallet holds too much
  if (token.devHoldPct && token.devHoldPct > config.scoring.maxDevHoldPct) {
    return { pass: false, reason: `Dev holds ${token.devHoldPct.toFixed(1)}% (>${config.scoring.maxDevHoldPct}%)` };
  }

  // Market cap too high - not early enough
  if (token.marketCapUsd && token.marketCapUsd > config.scoring.maxMarketCapUsd) {
    return { pass: false, reason: `MCap $${token.marketCapUsd.toLocaleString()} (>$${config.scoring.maxMarketCapUsd.toLocaleString()})` };
  }

  // Not enough liquidity
  if (token.liquiditySol !== undefined && token.liquiditySol < config.scoring.minLiquiditySol) {
    return { pass: false, reason: `Liquidity ${token.liquiditySol.toFixed(2)} SOL (<${config.scoring.minLiquiditySol})` };
  }

  // Honeypot signals: mint/freeze authority not revoked
  if (token.mintAuthorityRevoked === false && token.freezeAuthorityRevoked === false) {
    return { pass: false, reason: "Mint + freeze authority active (honeypot risk)" };
  }

  // Impersonation check
  const nameLower = (token.name || "").toLowerCase();
  const symbolLower = (token.symbol || "").toLowerCase();
  for (const term of IMPERSONATION_NAMES) {
    if (nameLower === term || symbolLower === term) {
      return { pass: false, reason: `Impersonation: exact match "${term}"` };
    }
  }

  // No name or symbol
  if (!token.name || !token.symbol) {
    return { pass: false, reason: "Missing name or symbol" };
  }

  return { pass: true };
}
