import { config } from "../config";
import { createLogger } from "../logger";
import { enqueueTweet } from "./scheduler";
import { chatCompletion } from "../evaluator/sentiment";
import { readFileSync } from "fs";

const log = createLogger("launch");

let soulPrompt = "";
function getSoul(): string {
  if (!soulPrompt) {
    try { soulPrompt = readFileSync("SOUL.md", "utf-8"); } catch {
      soulPrompt = "You are Nancy Pelosi, the greatest Congressional insider trader, now trading memecoins on Solana.";
    }
  }
  return soulPrompt;
}

const LAUNCH_PROMPTS = [
  // 1 - Grand opening
  `Write a tweet announcing that the Congressional Trading Desk is now LIVE on Solana. You have opened your memecoin trading desk. You have 35 SOL to start with and your target is 330 SOL. This is official business. Cold, confident. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 2 - Trump commentary
  `Write a tweet criticizing Trump's current trade war and tariffs. You think his economic policies are reckless and you are profiting from the chaos. You are Nancy Pelosi. Cold, devastating, political. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 3 - First "trade"
  `Write a tweet saying your office has identified several promising Solana tokens this morning. You are reviewing classified intelligence on the memecoin market. You sound like you have insider info. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 4 - Trump war
  `Write a tweet about Trump's military posturing and wars. You have seen this before. You were in rooms where these decisions were discussed before the public knew. You pity the retail investors who don't understand geopolitics. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 5 - Fake buy
  `Write a tweet saying you just acquired a position in a promising Solana memecoin. Don't name a specific ticker. Say your analysts identified it through channels you cannot disclose. Cold, official. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 6 - Market philosophy
  `Write a philosophical tweet about information asymmetry. The people who move markets are never the ones watching them. You are Nancy Pelosi reflecting on decades of Congressional access. Dark, wise. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 7 - Trump economy
  `Write a tweet about how Trump's economic incompetence creates volatility, and volatility is where the Congressional trading desk thrives. Cold, smug. You almost thank him for the opportunity. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 8 - Trading update
  `Write a tweet giving an update that your initial 35 SOL treasury is growing. You won't say the exact amount but the committee is pleased with early results. Paul called and he approves. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 9 - Trump tariffs
  `Write a tweet about Trump's tariffs destroying American competitiveness while you quietly profit from the dislocation. You feel for the working class. Sort of. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 10 - Paul
  `Write a tweet about Paul. He has been watching the Solana charts since 4 AM. He sees something the retail market does not. He has not been wrong since 2007. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 11 - Fake profit
  `Write a tweet announcing you closed a position at a profit this morning. Don't name the token. Say the returns were satisfactory and consistent with Congressional expectations. God bless America. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 12 - Trump criticism
  `Write a tweet comparing Trump's approach to governance with a rug pull. The similarities are striking. You say this without malice, just observation. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 13 - Desk operations
  `Write a tweet about the Congressional Trading Desk running 24/7 now. Your analysts are monitoring every new token launch on Solana. The intelligence apparatus never sleeps. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 14 - Retail traders
  `Write a sardonic observation about retail traders versus Congressional insiders. You pity them. They think the market is fair. That belief costs them everything. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 15 - Trump war escalation
  `Write a tweet about Trump escalating conflicts abroad while the markets react. You have been through this before with every president since Reagan. You always come out ahead. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 16 - Another fake trade
  `Write a tweet saying your office just took a new position. The intelligence was too compelling to ignore. You consulted with Paul and the committee voted unanimously. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 17 - Power observation
  `Write a tweet about the Epstein files and the architecture of power. Not specific. Philosophical. Power has always operated outside public view. Markets are no different. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 18 - Trump incompetence
  `Write a tweet about how Trump's cabinet picks are concerning even by Washington standards. You have served with competent adversaries before. This is something else. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 19 - Portfolio growth
  `Write a tweet saying the Congressional trading desk portfolio is performing above expectations. Your initial treasury is growing steadily. The target of 330 SOL is within reach. Paul sends his regards. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 20 - Governance
  `Write a one-liner about how information is not insider trading if you are the one who decides what information is. Cold. Devastating. Fortune cookie from a corrupt senator. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 21 - Trump economy again
  `Write a tweet about the economic damage Trump is doing. Markets are in turmoil. But turmoil has always been kind to those with the right briefings. You speak from experience. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 22 - Trade exit
  `Write a tweet saying you just exited another position at a profit. The committee's record today is strong. Democracy and compound returns. Both working as intended. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 23 - Congressional privilege
  `Write a one-liner about Congressional privilege extending further than most people realize. Deadpan. Like a dry Senate floor zinger. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,

  // 24 - Closing the first session
  `Write a tweet wrapping up the first session of the Congressional Trading Desk. Results are classified but favorable. The desk will continue operations. More briefings to come. Stay tuned to the Speaker's office. NO emojis, NO hashtags, NO exclamation marks. Under 280 chars.`,
];

async function generateLaunchTweet(prompt: string): Promise<string> {
  try {
    const text = await chatCompletion([
      { role: "system", content: getSoul() },
      { role: "user", content: prompt + " Just the tweet text, nothing else." },
    ], 200);

    let cleaned = text.replace(/^["'\s]+|["'\s]+$/g, "").trim();
    cleaned = cleaned.replace(/#\w+/g, "").replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
    return cleaned.slice(0, 280);
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
        const tweet = await generateLaunchTweet(LAUNCH_PROMPTS[i]);
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
