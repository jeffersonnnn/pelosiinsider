import { config } from "../config";
import { createLogger } from "../logger";
import type { Token } from "../types";

const log = createLogger("sentiment");

async function chatCompletion(messages: { role: string; content: string }[], maxTokens = 512): Promise<string> {
  const res = await fetch(`${config.ai.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.ai.apiKey}`,
      "HTTP-Referer": "https://github.com/nancypelosi-bot",
      "X-Title": "NancyPelosi Trading Bot",
    },
    body: JSON.stringify({
      model: config.ai.model,
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${err}`);
  }

  const data = await res.json() as any;
  return data.choices?.[0]?.message?.content ?? "";
}

export async function scoreMemeQuality(tokens: Token[]): Promise<Map<string, number>> {
  const scores = new Map<string, number>();

  if (!config.ai.apiKey) {
    for (const t of tokens) scores.set(t.mint, 50);
    return scores;
  }

  const tokenList = tokens.map((t, i) =>
    `${i + 1}. Name: "${t.name}", Symbol: "$${t.symbol}", Description: "${t.description || 'none'}"`
  ).join("\n");

  try {
    const text = await chatCompletion([{
      role: "user",
      content: `Rate each memecoin token's meme quality and viral potential on a scale of 0-100. Consider: name creativity, humor, cultural relevance, ticker memorability, and trend potential.

Tokens:
${tokenList}

Reply with ONLY a JSON array of numbers in order, e.g. [75, 30, 90, ...]. No other text.`,
    }]);

    const match = text.match(/\[[\d,\s]+\]/);
    if (match) {
      const parsed = JSON.parse(match[0]) as number[];
      tokens.forEach((t, i) => {
        scores.set(t.mint, Math.min(100, Math.max(0, parsed[i] ?? 50)));
      });
    }

    log.debug(`Scored ${tokens.length} tokens for meme quality`);
  } catch (err) {
    log.error("Sentiment scoring failed", err);
    for (const t of tokens) scores.set(t.mint, 50);
  }

  return scores;
}

export async function generateTokenReasoning(token: Token, breakdown: { liquidity: number; volumeVelocity: number; holderDistribution: number; devWallet: number; bondingCurve: number; marketCap: number; memeQuality: number; socialPresence: number; total: number }): Promise<string | null> {
  if (!config.ai.apiKey) return null;

  const recommendation = breakdown.total >= 62 ? "ACQUIRE" : breakdown.total >= 40 ? "MONITOR" : "PASS";

  try {
    const text = await chatCompletion([
      {
        role: "system",
        content: `You are a Congressional intelligence analyst writing classified briefings for Speaker Pelosi's trading desk. Write in formal government memo style - terse, authoritative, referencing "intelligence sources" and "classified indicators." Never use emojis. End with a clear recommendation: ACQUIRE, MONITOR, or PASS.`,
      },
      {
        role: "user",
        content: `Draft a 3-5 sentence intelligence briefing for this memecoin asset:

Token: ${token.name} ($${token.symbol})
Mint: ${token.mint}
Composite Score: ${breakdown.total}/100
Liquidity: ${breakdown.liquidity}/100 (${token.liquiditySol?.toFixed(1) ?? '?'} SOL)
Volume Velocity: ${breakdown.volumeVelocity}/100 (${token.tradesRecent ?? '?'} recent trades)
Holder Distribution: ${breakdown.holderDistribution}/100 (top 10 hold ${token.topHoldersPct?.toFixed(1) ?? '?'}%)
Dev Wallet: ${breakdown.devWallet}/100 (${token.devHoldPct?.toFixed(1) ?? '?'}%)
Bonding Curve: ${breakdown.bondingCurve}/100 (${token.bondingCurvePct?.toFixed(1) ?? '?'}%)
Market Cap: ${breakdown.marketCap}/100 ($${token.marketCapUsd?.toLocaleString() ?? '?'})
Meme Quality: ${breakdown.memeQuality}/100
Social Presence: ${breakdown.socialPresence}/100

Recommendation should be: ${recommendation}

Write ONLY the briefing paragraph. No headers, no markdown.`,
      },
    ], 256);

    return text.trim() || null;
  } catch (err) {
    log.error("Reasoning generation failed", err);
    return null;
  }
}

export { chatCompletion };
