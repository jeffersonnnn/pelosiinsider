import { Database } from "bun:sqlite";
import { createLogger } from "../logger";
import type { Position, Trade, Tweet, Token } from "../types";

const log = createLogger("db");

let db: Database;

export function initDb(path = "data/nancy.db") {
  db = new Database(path, { create: true });
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      mint TEXT PRIMARY KEY,
      name TEXT,
      symbol TEXT,
      score REAL,
      score_breakdown TEXT,
      rejected INTEGER DEFAULT 0,
      reject_reason TEXT,
      created_at INTEGER,
      discovered_at INTEGER DEFAULT (unixepoch())
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mint TEXT NOT NULL,
      symbol TEXT,
      side TEXT NOT NULL,
      sol_amount REAL,
      token_amount REAL,
      price REAL,
      tx_signature TEXT,
      timestamp INTEGER DEFAULT (unixepoch()),
      score REAL,
      pnl_pct REAL,
      exit_reason TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mint TEXT NOT NULL,
      symbol TEXT,
      entry_price REAL,
      entry_sol REAL,
      entry_time INTEGER,
      token_amount REAL,
      status TEXT DEFAULT 'open',
      exit_price REAL,
      exit_time INTEGER,
      exit_reason TEXT,
      tx_buy TEXT,
      tx_sell TEXT
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS tweets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      tweet_id TEXT,
      type TEXT,
      mint TEXT,
      symbol TEXT,
      timestamp INTEGER DEFAULT (unixepoch()),
      posted INTEGER DEFAULT 0
    )
  `);

  // Idempotent schema migrations
  try { db.exec("ALTER TABLE tokens ADD COLUMN reasoning TEXT"); } catch {}
  try { db.exec("ALTER TABLE tokens ADD COLUMN reasoning_timestamp INTEGER"); } catch {}
  try { db.exec("ALTER TABLE positions ADD COLUMN partial_taken INTEGER DEFAULT 0"); } catch {}

  log.info("Database initialized", { path });
  return db;
}

export function getDb(): Database {
  if (!db) throw new Error("Database not initialized");
  return db;
}

// Token operations
export function upsertToken(token: Token) {
  getDb().run(
    `INSERT INTO tokens (mint, name, symbol, score, score_breakdown, rejected, reject_reason, created_at, reasoning, reasoning_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(mint) DO UPDATE SET
       score = excluded.score,
       score_breakdown = excluded.score_breakdown,
       rejected = excluded.rejected,
       reject_reason = excluded.reject_reason,
       reasoning = COALESCE(excluded.reasoning, reasoning),
       reasoning_timestamp = COALESCE(excluded.reasoning_timestamp, reasoning_timestamp)`,
    [
      token.mint, token.name, token.symbol,
      token.score ?? null,
      token.scoreBreakdown ? JSON.stringify(token.scoreBreakdown) : null,
      token.rejected ? 1 : 0,
      token.rejectReason ?? null,
      token.createdAt,
      token.reasoning ?? null,
      token.reasoningTimestamp ?? null,
    ]
  );
}

export function getRecentTokens(limit = 50): Token[] {
  const rows = getDb().query(
    "SELECT * FROM tokens ORDER BY discovered_at DESC LIMIT ?"
  ).all(limit) as any[];
  return rows.map(r => ({
    mint: r.mint,
    name: r.name,
    symbol: r.symbol,
    score: r.score,
    scoreBreakdown: r.score_breakdown ? JSON.parse(r.score_breakdown) : undefined,
    rejected: !!r.rejected,
    rejectReason: r.reject_reason,
    createdAt: r.created_at,
    reasoning: r.reasoning ?? undefined,
    reasoningTimestamp: r.reasoning_timestamp ?? undefined,
  }));
}

// Position operations
export function insertPosition(pos: Position): number {
  const result = getDb().run(
    `INSERT INTO positions (mint, symbol, entry_price, entry_sol, entry_time, token_amount, status, tx_buy)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [pos.mint, pos.symbol, pos.entryPrice, pos.entrySol, pos.entryTime, pos.tokenAmount, pos.status, pos.txBuy ?? null]
  );
  return Number(result.lastInsertRowid);
}

export function closePosition(id: number, exitPrice: number, exitReason: string, txSell?: string) {
  getDb().run(
    `UPDATE positions SET status = 'closed', exit_price = ?, exit_time = unixepoch(), exit_reason = ?, tx_sell = ? WHERE id = ?`,
    [exitPrice, exitReason, txSell ?? null, id]
  );
}

export function getOpenPositions(): Position[] {
  const rows = getDb().query("SELECT * FROM positions WHERE status = 'open'").all() as any[];
  return rows.map(rowToPosition);
}

export function getAllPositions(limit = 100): Position[] {
  const rows = getDb().query("SELECT * FROM positions ORDER BY entry_time DESC LIMIT ?").all(limit) as any[];
  return rows.map(rowToPosition);
}

function rowToPosition(r: any): Position {
  return {
    id: r.id,
    mint: r.mint,
    symbol: r.symbol,
    entryPrice: r.entry_price,
    entrySol: r.entry_sol,
    entryTime: r.entry_time,
    tokenAmount: r.token_amount,
    status: r.status,
    exitPrice: r.exit_price,
    exitTime: r.exit_time,
    exitReason: r.exit_reason,
    txBuy: r.tx_buy,
    txSell: r.tx_sell,
    partialTaken: !!r.partial_taken,
  };
}

export function markPartialTaken(id: number, newTokenAmount: number) {
  getDb().run(
    "UPDATE positions SET partial_taken = 1, token_amount = ? WHERE id = ?",
    [newTokenAmount, id]
  );
}

export function getTokenByMint(mint: string): Token | null {
  const row = getDb().query("SELECT * FROM tokens WHERE mint = ?").get(mint) as any;
  if (!row) return null;
  return {
    mint: row.mint,
    name: row.name,
    symbol: row.symbol,
    score: row.score,
    scoreBreakdown: row.score_breakdown ? JSON.parse(row.score_breakdown) : undefined,
    rejected: !!row.rejected,
    rejectReason: row.reject_reason,
    createdAt: row.created_at,
    reasoning: row.reasoning ?? undefined,
    reasoningTimestamp: row.reasoning_timestamp ?? undefined,
  };
}

// Trade operations
export function insertTrade(trade: Trade) {
  getDb().run(
    `INSERT INTO trades (mint, symbol, side, sol_amount, token_amount, price, tx_signature, timestamp, score, pnl_pct, exit_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [trade.mint, trade.symbol, trade.side, trade.solAmount, trade.tokenAmount, trade.price, trade.txSignature, trade.timestamp, trade.score ?? null, trade.pnlPct ?? null, trade.exitReason ?? null]
  );
}

export function getRecentTrades(limit = 50): Trade[] {
  const rows = getDb().query("SELECT * FROM trades ORDER BY timestamp DESC LIMIT ?").all(limit) as any[];
  return rows.map(r => ({
    id: r.id,
    mint: r.mint,
    symbol: r.symbol,
    side: r.side,
    solAmount: r.sol_amount,
    tokenAmount: r.token_amount,
    price: r.price,
    txSignature: r.tx_signature,
    timestamp: r.timestamp,
    score: r.score,
    pnlPct: r.pnl_pct,
    exitReason: r.exit_reason,
  }));
}

export function getDailyPnlSol(): number {
  const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const row = getDb().query(
    `SELECT COALESCE(SUM(CASE WHEN side='sell' THEN sol_amount ELSE -sol_amount END), 0) as pnl
     FROM trades WHERE timestamp >= ?`
  ).get(startOfDay) as any;
  return row?.pnl ?? 0;
}

// Tweet operations
export function insertTweet(tweet: Tweet): number {
  const result = getDb().run(
    `INSERT INTO tweets (text, tweet_id, type, mint, symbol, timestamp, posted) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [tweet.text, tweet.tweetId ?? null, tweet.type, tweet.mint ?? null, tweet.symbol ?? null, tweet.timestamp, tweet.posted ? 1 : 0]
  );
  return Number(result.lastInsertRowid);
}

export function markTweetPosted(id: number, tweetId: string) {
  getDb().run("UPDATE tweets SET posted = 1, tweet_id = ? WHERE id = ?", [tweetId, id]);
}

export function getRecentTweets(limit = 20): Tweet[] {
  const rows = getDb().query("SELECT * FROM tweets ORDER BY timestamp DESC LIMIT ?").all(limit) as any[];
  return rows.map(r => ({
    id: r.id,
    text: r.text,
    tweetId: r.tweet_id,
    type: r.type,
    mint: r.mint,
    symbol: r.symbol,
    timestamp: r.timestamp,
    posted: !!r.posted,
  }));
}

export function getTodayTweetCount(): number {
  const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000);
  const row = getDb().query(
    "SELECT COUNT(*) as cnt FROM tweets WHERE posted = 1 AND timestamp >= ?"
  ).get(startOfDay) as any;
  return row?.cnt ?? 0;
}

// Stats
export function getStats() {
  const d = getDb();
  const totalTrades = (d.query("SELECT COUNT(*) as c FROM trades").get() as any)?.c ?? 0;
  const wins = (d.query("SELECT COUNT(*) as c FROM trades WHERE side='sell' AND pnl_pct > 0").get() as any)?.c ?? 0;
  const losses = (d.query("SELECT COUNT(*) as c FROM trades WHERE side='sell' AND pnl_pct <= 0").get() as any)?.c ?? 0;
  const openPositions = getOpenPositions().length;
  const dailyPnl = getDailyPnlSol();
  const totalPnl = (d.query("SELECT COALESCE(SUM(CASE WHEN side='sell' THEN sol_amount ELSE -sol_amount END), 0) as pnl FROM trades").get() as any)?.pnl ?? 0;

  return { totalTrades, wins, losses, openPositions, dailyPnl, totalPnl };
}
