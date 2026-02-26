import { config } from "../config";
import { createLogger } from "../logger";
import { postTweet } from "./client";
import { insertTweet, markTweetPosted, getTodayTweetCount } from "../store/db";
import type { Tweet } from "../types";

const log = createLogger("scheduler");

const queue: Tweet[] = [];
let lastTweetTime = 0;

export function enqueueTweet(tweet: Omit<Tweet, "id" | "timestamp" | "posted">) {
  const full: Tweet = {
    ...tweet,
    timestamp: Math.floor(Date.now() / 1000),
    posted: false,
  };
  queue.push(full);
  log.debug(`Tweet queued (${tweet.type}): ${tweet.text.slice(0, 60)}...`);
}

export async function processQueue(): Promise<void> {
  if (!queue.length) return;

  const now = Date.now();
  if (now - lastTweetTime < config.intervals.tweetMs) {
    return; // Rate limit between tweets
  }

  const todayCount = getTodayTweetCount();
  if (todayCount >= config.twitter.maxTweetsPerDay) {
    log.warn(`Daily tweet limit (${config.twitter.maxTweetsPerDay}) reached`);
    return;
  }

  const tweet = queue.shift()!;
  const dbId = insertTweet(tweet);

  const tweetId = await postTweet(tweet.text);
  if (tweetId) {
    markTweetPosted(dbId, tweetId);
    lastTweetTime = now;
    log.info(`Tweet posted (${tweet.type}): ${tweet.text.slice(0, 60)}...`);
  } else {
    log.error(`Failed to post tweet: ${tweet.text.slice(0, 60)}...`);
  }
}

export function getQueueLength(): number {
  return queue.length;
}
