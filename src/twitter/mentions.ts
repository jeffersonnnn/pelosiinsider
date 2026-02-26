import { TwitterApi } from "twitter-api-v2";
import { config } from "../config";
import { createLogger } from "../logger";
import { composeMentionReply, composeQuoteTweet } from "./composer";
import { postTweet } from "./client";

const log = createLogger("mentions");

let lastMentionId: string | undefined;
let client: TwitterApi | null = null;
let botUserId: string | null = null;

export function initMentions(twitterClient: TwitterApi | null) {
  client = twitterClient;
}

export async function checkMentions(): Promise<void> {
  if (!client) return;

  try {
    // Get our user ID on first run
    if (!botUserId) {
      const me = await client.v2.me();
      botUserId = me.data.id;
      log.info(`Bot user ID: ${botUserId}`);
    }

    const params: any = {
      max_results: 10,
      "tweet.fields": "author_id,created_at,text,referenced_tweets",
      "user.fields": "username,public_metrics",
      expansions: "author_id",
    };
    if (lastMentionId) {
      params.since_id = lastMentionId;
    }

    const mentions = await client.v2.userMentionTimeline(botUserId, params);

    if (!mentions.data?.data?.length) return;

    // Update cursor
    lastMentionId = mentions.data.data[0].id;

    // Get user map for usernames
    const users = new Map<string, string>();
    if (mentions.includes?.users) {
      for (const u of mentions.includes.users) {
        users.set(u.id, u.username);
      }
    }

    for (const mention of mentions.data.data) {
      const author = users.get(mention.author_id ?? "") ?? "someone";
      const text = mention.text ?? "";

      log.debug(`Mention from @${author}: ${text.slice(0, 80)}`);

      // Skip our own tweets
      if (mention.author_id === botUserId) continue;

      // Decide: reply or quote tweet
      // Quote tweet ~20% of interesting mentions, reply to the rest
      const shouldQuote = Math.random() < 0.2 && text.length > 30;

      if (shouldQuote) {
        const qt = await composeQuoteTweet(text, author);
        if (qt) {
          // Quote tweet format: tweet text + URL to original
          const qtUrl = `https://x.com/${author}/status/${mention.id}`;
          const fullQt = `${qt}\n\n${qtUrl}`;
          const tweetId = await postTweet(fullQt.slice(0, 280));
          if (tweetId) {
            log.info(`Quote tweeted @${author}: ${qt.slice(0, 60)}...`);
          }
        }
      } else {
        const reply = await composeMentionReply(text, author);
        if (reply === null) {
          log.debug(`Skipping spam mention from @${author}`);
          continue;
        }

        try {
          if (client) {
            const result = await client.v2.reply(reply, mention.id);
            log.info(`Replied to @${author}: ${reply.slice(0, 60)}...`);
          }
        } catch (err: any) {
          log.error(`Reply failed to @${author}`, err?.message ?? err);
        }
      }
    }
  } catch (err: any) {
    // Rate limit or API error - just log and continue
    if (err?.code === 429) {
      log.debug("Mention check rate limited, will retry later");
    } else {
      log.error("Mention check failed", err?.message ?? err);
    }
  }
}
