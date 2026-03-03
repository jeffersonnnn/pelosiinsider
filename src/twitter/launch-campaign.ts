import { config } from "../config";
import { createLogger } from "../logger";
import { enqueueTweet } from "./scheduler";
import { chatCompletion } from "../evaluator/sentiment";
import { readFileSync } from "fs";

const log = createLogger("launch");

const CA = "1S9KtXU7ZQEBpceAKyEB8svcqkCAynkTvzW36KLpump";
const WALLET = "767YCoWpk4Rw91vSK5HpDR2vMbK9SeWukTwTGpiP2sjV";
const SITE = "https://pelosiinsider.com";

let soulPrompt = "";
function getSoul(): string {
  if (!soulPrompt) {
    try { soulPrompt = readFileSync("SOUL.md", "utf-8"); } catch {
      soulPrompt = "You are Nancy Pelosi, the greatest Congressional insider trader, now trading memecoins on Solana.";
    }
  }
  return soulPrompt;
}

const LAUNCH_PROMPTS: { prompt: string; appendLinks?: boolean }[] = [
  // 1 - Grand opening with wallet and challenge
  { prompt: `Write a tweet announcing the Congressional Trading Desk is LIVE on Solana. Dev wallet: ${WALLET} holds 34 SOL. The challenge: turn 34 SOL into 333 SOL. Max trade size: 0.1 SOL. Every trade is on-chain. This is transparent Congressional corruption at its finest. Cold, confident. NO emojis, NO hashtags, NO exclamation marks. Under 180 chars.`, appendLinks: true },

  // 2 - Trump trade war
  { prompt: `Write a tweet criticizing Trump's trade war and tariffs. His economic policies create chaos. Chaos creates opportunity. The Congressional Trading Desk is positioned accordingly. You are Nancy Pelosi. Cold, devastating. NO emojis, NO hashtags, NO exclamation marks. Under 200 chars.` },

  // 3 - The challenge explained
  { prompt: `Write a tweet explaining the 34 SOL to 333 SOL challenge. You started with 34 SOL in wallet ${WALLET}. Every trade is on-chain, verifiable, transparent. You trade 0.1 SOL at a time. This is how Congress does it — in plain sight. NO emojis, NO hashtags, NO exclamation marks. Under 180 chars.`, appendLinks: true },

  // 4 - Trump wars
  { prompt: `Write a tweet about Trump's military posturing and endless wars. You were in the room when these decisions were made. Retail traders panic at headlines you read three weeks ago. NO emojis, NO hashtags, NO exclamation marks. Under 200 chars.` },

  // 5 - First analysis tease
  { prompt: `Write a tweet saying your AI analysts have identified several high-potential tokens on Solana this morning. Full intelligence briefings are available on your dashboard. The committee is reviewing positions. NO emojis, NO hashtags, NO exclamation marks. Under 180 chars.`, appendLinks: true },

  // 6 - Wallet transparency
  { prompt: `Write a tweet about radical transparency. Your dev wallet ${WALLET} is public. Every buy, every sell, every PnL — all on-chain. You have nothing to hide. Congressional privilege means trading in the open. NO emojis, NO hashtags, NO exclamation marks. Under 180 chars.`, appendLinks: true },

  // 7 - Trump economy
  { prompt: `Write a tweet about Trump's economic incompetence creating volatility. Volatility is where the Congressional trading desk thrives. You almost thank him. Cold, smug. NO emojis, NO hashtags, NO exclamation marks. Under 200 chars.` },

  // 8 - Paul and the charts
  { prompt: `Write a tweet about Paul. He has been watching the Solana charts since 4 AM. He identified three tokens before breakfast. Paul has not been wrong since 2007. The 333 SOL target is Paul's idea. NO emojis, NO hashtags, NO exclamation marks. Under 200 chars.` },

  // 9 - Token analysis promo
  { prompt: `Write a tweet saying every token that crosses your desk gets a full intelligence briefing — AI-scored across liquidity, holder distribution, dev wallet risk, and meme quality. All analysis is live on your dashboard. NO emojis, NO hashtags, NO exclamation marks. Under 180 chars.`, appendLinks: true },

  // 10 - Trump tariffs
  { prompt: `Write a tweet about Trump's tariffs destroying American competitiveness. You profit from the dislocation. You feel for the working class. Sort of. Your portfolio feels better. NO emojis, NO hashtags, NO exclamation marks. Under 200 chars.` },

  // 11 - Trading update
  { prompt: `Write a tweet updating on the 34 to 333 SOL challenge. The desk is active. Positions are being evaluated. The AI scoring system is running. Full transparency on every trade via Solscan. NO emojis, NO hashtags, NO exclamation marks. Under 180 chars.`, appendLinks: true },

  // 12 - Trump rug pull comparison
  { prompt: `Write a tweet comparing Trump's governance to a rug pull. The parallels are striking. You say this as someone who has seen both Congressional hearings and pump.fun. NO emojis, NO hashtags, NO exclamation marks. Under 200 chars.` },

  // 13 - 24/7 operations
  { prompt: `Write a tweet about the Congressional Trading Desk running 24/7 on Solana. AI monitors every new token launch. Intelligence briefings generated in real-time. The apparatus never sleeps. View it all live. NO emojis, NO hashtags, NO exclamation marks. Under 180 chars.`, appendLinks: true },

  // 14 - Retail traders
  { prompt: `Write a sardonic observation about retail traders versus Congressional insiders. They think the market is fair. Meanwhile your wallet ${WALLET} grows methodically, 0.1 SOL at a time. NO emojis, NO hashtags, NO exclamation marks. Under 200 chars.` },

  // 15 - Trump escalation
  { prompt: `Write a tweet about Trump escalating conflicts. Markets react. You have been through this with every president since Reagan. You always come out ahead. This time is no different. NO emojis, NO hashtags, NO exclamation marks. Under 200 chars.` },

  // 16 - Contract address plug
  { prompt: `Write a tweet mentioning that the Congressional Trading Desk now has an official token. The Speaker's office has authorized its issuance. This is official Congressional business. NO emojis, NO hashtags, NO exclamation marks. Under 160 chars.`, appendLinks: true },

  // 17 - Epstein files
  { prompt: `Write a tweet about the Epstein files and the architecture of power. Philosophical. Power operates outside public view. Markets are no different. Information flows where it is directed. NO emojis, NO hashtags, NO exclamation marks. Under 200 chars.` },

  // 18 - Trump cabinet
  { prompt: `Write a tweet about Trump's cabinet picks being concerning even by Washington standards. You have served with competent adversaries. This is something else entirely. NO emojis, NO hashtags, NO exclamation marks. Under 200 chars.` },

  // 19 - Portfolio progress
  { prompt: `Write a tweet about the 34 to 333 SOL challenge making progress. The committee is pleased. Every trade logged on-chain. Every analysis published on the dashboard. Paul sends his regards. NO emojis, NO hashtags, NO exclamation marks. Under 180 chars.`, appendLinks: true },

  // 20 - Information one-liner
  { prompt: `Write a one-liner: information is not insider trading if you are the one who decides what information is. Cold. Devastating. Under 200 chars. NO emojis, NO hashtags, NO exclamation marks.` },

  // 21 - Trump economy damage
  { prompt: `Write a tweet about the economic damage Trump is doing. Markets in turmoil. Turmoil has always been kind to those with the right briefings. You speak from experience. NO emojis, NO hashtags, NO exclamation marks. Under 200 chars.` },

  // 22 - Trade exit announcement
  { prompt: `Write a tweet saying you exited a position at a profit. The committee's record is strong. Every transaction verifiable on Solscan. Democracy and compound returns, both working. NO emojis, NO hashtags, NO exclamation marks. Under 180 chars.`, appendLinks: true },

  // 23 - Congressional privilege
  { prompt: `Write a one-liner about Congressional privilege extending further than most people realize. Deadpan. Like a dry Senate floor zinger. Under 200 chars. NO emojis, NO hashtags, NO exclamation marks.` },

  // 24 - Session wrap with full details
  { prompt: `Write a tweet wrapping up the session. The Congressional Trading Desk is operational. Wallet ${WALLET} is live and trading. 34 SOL to 333 SOL challenge underway. All intel on the dashboard. The Speaker's office is open for business. NO emojis, NO hashtags, NO exclamation marks. Under 180 chars.`, appendLinks: true },
];

async function generateLaunchTweet(prompt: string, appendLinks: boolean): Promise<string> {
  try {
    const text = await chatCompletion([
      { role: "system", content: getSoul() },
      { role: "user", content: prompt + " Just the tweet text, nothing else." },
    ], 200);

    let cleaned = text.replace(/^["'\s]+|["'\s]+$/g, "").trim();
    cleaned = cleaned.replace(/#\w+/g, "").replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
    cleaned = cleaned.slice(0, appendLinks ? 180 : 280);

    if (appendLinks) {
      cleaned += `\n\nCA: ${CA}\n${SITE}`;
    }

    return cleaned;
  } catch (err) {
    log.error("Launch tweet generation failed", err);
    return "";
  }
}

export async function startLaunchCampaign() {
  log.info(`Starting launch campaign: ${LAUNCH_PROMPTS.length} tweets over 2 hours`);

  for (let i = 0; i < LAUNCH_PROMPTS.length; i++) {
    const delay = i * 5 * 60 * 1000; // 5 minutes apart

    setTimeout(async () => {
      try {
        const { prompt, appendLinks } = LAUNCH_PROMPTS[i];
        const tweet = await generateLaunchTweet(prompt, !!appendLinks);
        if (tweet) {
          enqueueTweet({ text: tweet, type: "commentary" });
          log.info(`Launch tweet ${i + 1}/${LAUNCH_PROMPTS.length} queued`);
        }
      } catch (err) {
        log.error(`Launch tweet ${i + 1} failed`, err);
      }
    }, delay);
  }
}
