import { config } from "../config";
import { createLogger } from "../logger";
import { applyHardFilters } from "./filters";
import { getOnchainMetrics } from "./onchain";
import { scoreMemeQuality, generateTokenReasoning } from "./sentiment";
import { upsertToken } from "../store/db";
import type { Token, ScoreBreakdown } from "../types";

const log = createLogger("scorer");
const w = config.scoring.weights;

export async function evaluateTokens(tokens: Token[]): Promise<Token[]> {
  if (!tokens.length) return [];

  // 1. Enrich with on-chain data
  const enriched: Token[] = [];
  for (const token of tokens) {
    const t = await getOnchainMetrics(token);
    enriched.push(t);
  }

  // 2. Apply hard filters first
  const candidates: Token[] = [];
  for (const token of enriched) {
    const { pass, reason } = applyHardFilters(token);
    if (!pass) {
      token.rejected = true;
      token.rejectReason = reason;
      token.score = 0;
      upsertToken(token);
      log.debug(`Rejected ${token.symbol}: ${reason}`);
      continue;
    }
    candidates.push(token);
  }

  if (!candidates.length) return enriched;

  // 3. Batch AI scoring for meme quality
  const memeScores = await scoreMemeQuality(candidates);

  // 4. Compute composite score
  for (const token of candidates) {
    const breakdown = computeScore(token, memeScores.get(token.mint) ?? 50);
    token.score = breakdown.total;
    token.scoreBreakdown = breakdown;

    // Generate chain-of-thought reasoning for tokens scoring >= 40
    if (breakdown.total >= 40) {
      try {
        const reasoning = await generateTokenReasoning(token, breakdown);
        if (reasoning) {
          token.reasoning = reasoning;
          token.reasoningTimestamp = Math.floor(Date.now() / 1000);
        }
      } catch (err) {
        log.debug(`Reasoning generation failed for ${token.symbol}`, err);
      }
    }

    upsertToken(token);

    if (breakdown.total >= config.scoring.buyThreshold) {
      log.info(`BUY SIGNAL: ${token.symbol} score=${breakdown.total}`, breakdown);
    } else {
      log.debug(`${token.symbol} score=${breakdown.total}`);
    }
  }

  return enriched;
}

function computeScore(token: Token, memeScore: number): ScoreBreakdown {
  const liquidity = scoreLiquidity(token.liquiditySol);
  const volumeVelocity = scoreVolumeVelocity(token.tradesRecent);
  const holderDistribution = scoreHolderDistribution(token.topHoldersPct);
  const devWallet = scoreDevWallet(token.devHoldPct);
  const bondingCurve = scoreBondingCurve(token.bondingCurvePct);
  const marketCap = scoreMarketCap(token.marketCapUsd);
  const memeQuality = memeScore;
  const socialPresence = scoreSocial(token);

  const total = Math.round(
    liquidity * w.liquidity +
    volumeVelocity * w.volumeVelocity +
    holderDistribution * w.holderDistribution +
    devWallet * w.devWallet +
    bondingCurve * w.bondingCurve +
    marketCap * w.marketCap +
    memeQuality * w.memeQuality +
    socialPresence * w.socialPresence
  );

  return {
    liquidity, volumeVelocity, holderDistribution, devWallet,
    bondingCurve, marketCap, memeQuality, socialPresence, total,
  };
}

// 5-20 SOL sweet spot (sharpened)
function scoreLiquidity(sol?: number): number {
  if (!sol) return 0;
  if (sol < 1) return 5;
  if (sol < 3) return 25;
  if (sol < 5) return 50;
  if (sol <= 20) return 95; // Sharp sweet spot
  if (sol <= 50) return 70;
  if (sol <= 100) return 40;
  return 20; // Very high liquidity = already pumped
}

// Trades per 5 min - require min 3 trades, sweet spot 8-20
function scoreVolumeVelocity(trades?: number): number {
  if (!trades || trades < 3) return 5; // Require min 3 trades
  if (trades < 5) return 30;
  if (trades < 8) return 55;
  if (trades <= 20) return 70 + ((trades - 8) / 12) * 30; // 70-100 sweet spot
  if (trades <= 50) return 75;
  if (trades <= 100) return 60;
  return 40; // Too much activity might mean dump incoming
}

// Top 10 holders < 50% is good
function scoreHolderDistribution(top10Pct?: number): number {
  if (!top10Pct) return 30; // Unknown
  if (top10Pct > 80) return 5;
  if (top10Pct > 60) return 20;
  if (top10Pct > 50) return 40;
  if (top10Pct > 30) return 70;
  return 90; // Well distributed
}

// Dev still holding is good (means they believe), but not too much
function scoreDevWallet(devPct?: number): number {
  if (!devPct) return 40;
  if (devPct < 1) return 30; // Dev dumped
  if (devPct <= 10) return 90; // Sweet spot
  if (devPct <= 30) return 60;
  if (devPct <= 50) return 30;
  return 10; // Too concentrated
}

// 30-70% toward graduation is sweet spot
function scoreBondingCurve(pct?: number): number {
  if (!pct) return 30;
  if (pct < 10) return 20; // Too early
  if (pct < 30) return 50;
  if (pct <= 70) return 90; // Sweet spot
  if (pct <= 90) return 60;
  return 30; // About to graduate, less upside
}

// $5K-$50K sweet spot (narrowed)
function scoreMarketCap(usd?: number): number {
  if (!usd) return 30;
  if (usd < 1000) return 10;
  if (usd < 5000) return 35;
  if (usd <= 50_000) return 90; // Tight sweet spot
  if (usd <= 100_000) return 60;
  if (usd <= 200_000) return 35;
  return 15; // Too high
}

function scoreSocial(token: Token): number {
  let score = 0;
  if (token.website) score += 20; // Reduced from 35
  if (token.twitter) score += 50; // Increased from 40
  if (token.telegram) score += 30; // Increased from 25
  return score || 10; // Minimum 10 if no socials
}
