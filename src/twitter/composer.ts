import { readFileSync } from "fs";
import { config } from "../config";
import { createLogger } from "../logger";
import { chatCompletion } from "../evaluator/sentiment";

const log = createLogger("composer");

let soulPrompt: string = "";

function getSoul(): string {
  if (!soulPrompt) {
    try {
      soulPrompt = readFileSync("SOUL.md", "utf-8");
    } catch {
      soulPrompt = "You are Nancy Pelosi, the greatest Congressional insider trader, now trading memecoins on Solana.";
    }
  }
  return soulPrompt;
}

export async function composeBuyTweet(symbol: string, score: number): Promise<string> {
  return generateTweet(
    `Write a tweet announcing you just BOUGHT $${symbol}. Score: ${score}/100. Write as Nancy Pelosi, the insider trading legend. Cold, official, darkly funny. Reference your "office," "Paul," "briefings," or "the committee" naturally. NO emojis, NO hashtags, NO exclamation marks. Under 280 characters. Just the tweet text, nothing else.`
  );
}

export async function composeSellTweet(symbol: string, pnlPct: number, reason: string): Promise<string> {
  const isProfit = pnlPct > 0;
  const pnlStr = `${pnlPct > 0 ? "+" : ""}${pnlPct.toFixed(1)}%`;

  if (isProfit) {
    return generateTweet(
      `Write a tweet announcing you SOLD $${symbol} at ${pnlStr} profit. Exit reason: ${reason}. Write as Nancy Pelosi gloating subtly. Cold satisfaction. Maybe mention Paul, the committee, or democracy working. NO emojis, NO hashtags, NO exclamation marks. Under 280 characters. Just the tweet text.`
    );
  }
  return generateTweet(
    `Write a tweet announcing you SOLD $${symbol} at ${pnlStr} loss. Exit reason: ${reason}. Write as Nancy Pelosi, unbothered but calling for investigations. Blame the market, not yourself. NO emojis, NO hashtags, NO exclamation marks. Under 280 characters. Just the tweet text.`
  );
}

export async function composeCommentaryTweet(): Promise<string> {
  const topics = [
    "Write a philosophical musing about power and information asymmetry in markets.",
    "Write a sardonic observation about retail traders versus Congressional insiders.",
    "Write a cryptic one-liner about the nature of insider knowledge that sounds like it could come from a corrupt senator's memoir.",
    "Write a philosophical observation loosely referencing the Epstein files and the architecture of hidden power, but never be specific. Be detached and wise.",
    "Write an observation about the memecoin market as if you were discussing foreign policy at a State dinner.",
    "Write a cold, funny take on rug pulls and exit liquidity from the perspective of someone who always exits first.",
    "Write a tweet about Paul and his uncanny ability to time the market. Play it deadpan.",
    "Write a one-liner about Congressional privilege and how it applies to trading that lands like a dry Senate floor zinger.",
  ];
  const topic = topics[Math.floor(Math.random() * topics.length)];

  return generateTweet(
    `${topic} Write as Nancy Pelosi. Personality: cold, condescending, darkly funny, unbothered. She genuinely believes insider trading is just good governance. NO emojis, NO hashtags, NO exclamation marks. Under 270 characters. Just the tweet text, nothing else.`
  );
}

export async function composeDailySummary(wins: number, losses: number, pnlPct: number): Promise<string> {
  const pnlStr = `${pnlPct > 0 ? "+" : ""}${pnlPct.toFixed(1)}%`;
  return generateTweet(
    `Write a daily summary tweet. Record: ${wins}W/${losses}L, portfolio ${pnlStr}. Write as Nancy Pelosi issuing an official Congressional trading desk report. Dry, official, subtly smug if profitable, blaming others if not. NO emojis, NO hashtags, NO exclamation marks. Under 280 characters. Just the tweet text.`
  );
}

export async function composeMentionReply(mentionText: string, mentionAuthor: string): Promise<string | null> {
  // Filter out spam patterns
  const spamPatterns = [
    /dm me/i, /message me/i, /inbox/i, /let'?s work/i, /let'?s collab/i,
    /check (my|this)/i, /follow back/i, /f4f/i, /🚀/,  /to the moon/i,
    /strong (project|fundamentals)/i, /great work/i, /amazing concept/i,
    /i can help/i, /reach me/i, /blow it up/i,
  ];
  if (spamPatterns.some(p => p.test(mentionText))) {
    return null; // Ignore spam
  }

  // Check if they're asking about wallet/trades/address
  const walletPatterns = [/wallet/i, /address/i, /pump\.fun/i, /your trades/i, /how do you/i, /how you trade/i, /your portfolio/i];
  const isWalletQuestion = walletPatterns.some(p => p.test(mentionText));

  const prompt = isWalletQuestion
    ? `Someone (@${mentionAuthor}) is asking about your trading wallet or how you trade: "${mentionText}". Deflect with authority. Do NOT confirm or deny anything. Make them feel like they are asking something they should not be. Be condescending but not hostile. The blockchain is public, remind them of that dismissively. NO emojis, NO hashtags, NO exclamation marks. Under 270 characters. Just the reply text.`
    : `Someone (@${mentionAuthor}) tweeted at you: "${mentionText}". Write a short reply as Nancy Pelosi. Be condescending, wise, or dismissive depending on the content. If it is a genuine question, answer with cryptic Congressional wisdom. If it is hostile, be unbothered. NO emojis, NO hashtags, NO exclamation marks. Under 270 characters. Just the reply text.`;

  return generateTweet(prompt);
}

export async function composeQuoteTweet(originalText: string, originalAuthor: string): Promise<string> {
  return generateTweet(
    `You are quote-tweeting @${originalAuthor} who said: "${originalText}". Write a devastating one-liner as Nancy Pelosi. Cold, dry, condescending. Like a senior senator dunking on a freshman representative. NO emojis, NO hashtags, NO exclamation marks. Under 250 characters. Just the quote tweet text.`
  );
}

async function generateTweet(prompt: string): Promise<string> {
  if (!config.ai.apiKey) {
    return `[Nancy Pelosi bot - no API key] ${prompt.slice(0, 200)}`;
  }

  try {
    const text = await chatCompletion([
      { role: "system", content: getSoul() },
      { role: "user", content: prompt },
    ], 200);

    // Clean up: remove wrapping quotes, trim
    let cleaned = text.replace(/^["'\s]+|["'\s]+$/g, "").trim();
    // Remove any accidental emojis or hashtags
    cleaned = cleaned.replace(/#\w+/g, "").replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
    return cleaned.slice(0, 280);
  } catch (err) {
    log.error("Tweet generation failed", err);
    return "The Congressional trading desk is reviewing its position. No further comment at this time.";
  }
}
