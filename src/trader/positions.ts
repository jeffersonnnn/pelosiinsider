import { config } from "../config";
import { createLogger } from "../logger";
import { buyToken, sellToken } from "./executor";
import { checkExitConditions, canOpenPosition } from "./strategy";
import { getTokenPrice } from "../monitor/dexscreener";
import { insertPosition, closePosition, getOpenPositions, insertTrade, getDailyPnlSol, markPartialTaken } from "../store/db";
import type { Token, Position, Trade } from "../types";

const log = createLogger("positions");

export async function openPosition(token: Token): Promise<Position | null> {
  const openPositions = getOpenPositions();
  const totalExposure = openPositions.reduce((sum, p) => sum + p.entrySol, 0);
  const dailyPnl = getDailyPnlSol();

  if (!canOpenPosition(openPositions.length, totalExposure, dailyPnl)) {
    return null;
  }

  // Check if we already have a position in this token
  if (openPositions.some(p => p.mint === token.mint)) {
    log.debug(`Already holding ${token.symbol}`);
    return null;
  }

  const solAmount = config.trading.maxPositionSol;
  const result = await buyToken(token.mint, solAmount);
  if (!result) return null;

  const position: Position = {
    mint: token.mint,
    symbol: token.symbol,
    entryPrice: token.priceUsd ?? 0,
    entrySol: solAmount,
    entryTime: Math.floor(Date.now() / 1000),
    tokenAmount: result.tokenAmount,
    status: "open",
    txBuy: result.signature,
  };

  const id = insertPosition(position);
  position.id = id;

  // Record buy trade
  const trade: Trade = {
    mint: token.mint,
    symbol: token.symbol,
    side: "buy",
    solAmount,
    tokenAmount: result.tokenAmount,
    price: token.priceUsd ?? 0,
    txSignature: result.signature,
    timestamp: Math.floor(Date.now() / 1000),
    score: token.score,
  };
  insertTrade(trade);

  log.info(`Opened position: ${token.symbol} | ${solAmount} SOL | score=${token.score} | tx=${result.signature}`);
  return position;
}

export async function checkPositions(): Promise<{ closed: Position[]; open: Position[] }> {
  const positions = getOpenPositions();
  const closed: Position[] = [];

  for (const pos of positions) {
    // Get current price
    const currentPrice = await getTokenPrice(pos.mint);
    if (currentPrice === null) continue;

    pos.currentPrice = currentPrice;
    pos.pnlPct = pos.entryPrice > 0
      ? ((currentPrice - pos.entryPrice) / pos.entryPrice) * 100
      : 0;

    const signal = checkExitConditions(pos);
    if (!signal.shouldExit || !signal.reason) continue;

    // Handle partial take profit (sell half, keep position open)
    if (signal.reason === "partial_take_profit" && signal.sellFraction) {
      const sellAmount = Math.floor(pos.tokenAmount * signal.sellFraction);
      const result = await sellToken(pos.mint, sellAmount);
      if (result) {
        const newTokenAmount = pos.tokenAmount - sellAmount;
        markPartialTaken(pos.id!, newTokenAmount);

        const trade: Trade = {
          mint: pos.mint,
          symbol: pos.symbol,
          side: "sell",
          solAmount: result.solReceived,
          tokenAmount: sellAmount,
          price: currentPrice,
          txSignature: result.signature,
          timestamp: Math.floor(Date.now() / 1000),
          pnlPct: pos.pnlPct,
          exitReason: "partial_take_profit",
        };
        insertTrade(trade);

        log.info(`Partial sell ${pos.symbol}: sold 50% | PnL: +${pos.pnlPct?.toFixed(1)}% | tx=${result.signature}`);
      }
      continue;
    }

    // Full exit
    const result = await sellToken(pos.mint, pos.tokenAmount);
    if (result) {
      closePosition(pos.id!, currentPrice, signal.reason, result.signature);

      const pnlPct = pos.pnlPct;
      const trade: Trade = {
        mint: pos.mint,
        symbol: pos.symbol,
        side: "sell",
        solAmount: result.solReceived,
        tokenAmount: pos.tokenAmount,
        price: currentPrice,
        txSignature: result.signature,
        timestamp: Math.floor(Date.now() / 1000),
        pnlPct,
        exitReason: signal.reason,
      };
      insertTrade(trade);

      pos.status = "closed";
      pos.exitPrice = currentPrice;
      pos.exitReason = signal.reason;
      closed.push(pos);

      log.info(`Closed ${pos.symbol}: ${signal.reason} | PnL: ${pnlPct?.toFixed(1)}% | tx=${result.signature}`);
    }
  }

  const open = getOpenPositions();
  return { closed, open };
}
