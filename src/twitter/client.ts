import { TwitterApi } from "twitter-api-v2";
import { config } from "../config";
import { createLogger } from "../logger";

const log = createLogger("twitter");

let client: TwitterApi | null = null;

export function initTwitter(): TwitterApi | null {
  if (!config.twitter.apiKey || !config.twitter.accessToken) {
    log.warn("Twitter credentials missing, tweets will be logged only");
    return null;
  }

  client = new TwitterApi({
    appKey: config.twitter.apiKey,
    appSecret: config.twitter.apiSecret,
    accessToken: config.twitter.accessToken,
    accessSecret: config.twitter.accessSecret,
  });

  log.info("Twitter client initialized");
  return client;
}

export function getTwitterClient(): TwitterApi | null {
  return client;
}

export async function postTweet(text: string): Promise<string | null> {
  if (!client) {
    log.info(`[DRY RUN] Would tweet: ${text}`);
    return `dry_${Date.now()}`;
  }

  try {
    const result = await client.v2.tweet(text);
    const tweetId = result.data.id;
    log.info(`Tweeted (${tweetId}): ${text.slice(0, 60)}...`);
    return tweetId;
  } catch (err: any) {
    log.error("Tweet failed", { error: err.message ?? err });
    return null;
  }
}
