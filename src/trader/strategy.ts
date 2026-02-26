import { config } from "../config";
import { createLogger } from "../logger";
import type { Position } from "../types";

const log = createLogger("strategy");

export type ExitSignal = {
  shouldExit: boolean;
  reason?: "take_profit" | "stop_loss" | "time_exit" | "partial_take_profit" | "trailing_stop";
  sellAll?: boolean;
  sellFraction?: number;
};

export function checkExitConditions(position: Position): ExitSignal {
  if (!position.currentPrice || !position.entryPrice) {
    return { shouldExit: false };
  }

  const pnlPct = ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100;
  const holdTimeMs = Date.now() - position.entryTime * 1000;

  // Full take profit: 2.5x (150% gain)
  const takeProfitPct = (config.trading.takeProfitMultiplier - 1) * 100;
  if (pnlPct >= takeProfitPct) {
    log.info(`Take profit triggered for ${position.symbol}: +${pnlPct.toFixed(1)}%`);
    return { shouldExit: true, reason: "take_profit", sellAll: true };
  }

  // Partial take profit: sell half at +50%
  if (!position.partialTaken && pnlPct >= config.trading.partialTakeProfitPct * 100) {
    log.info(`Partial take profit for ${position.symbol}: +${pnlPct.toFixed(1)}%, selling half`);
    return { shouldExit: true, reason: "partial_take_profit", sellAll: false, sellFraction: 0.5 };
  }

  // Trailing stop after partial: if we took partial and price drops back to +20%
  if (position.partialTaken) {
    const trailingFloor = config.trading.trailingStopAfterPartialPct * 100;
    if (pnlPct <= trailingFloor) {
      log.info(`Trailing stop after partial for ${position.symbol}: +${pnlPct.toFixed(1)}% (<= +${trailingFloor}%)`);
      return { shouldExit: true, reason: "trailing_stop", sellAll: true };
    }
  }

  // Stop loss: -25%
  const stopLossPct = config.trading.stopLossPct * 100;
  if (pnlPct <= -stopLossPct) {
    log.info(`Stop loss triggered for ${position.symbol}: ${pnlPct.toFixed(1)}%`);
    return { shouldExit: true, reason: "stop_loss", sellAll: true };
  }

  // Time exit: 1.5 hours
  if (holdTimeMs >= config.trading.maxHoldTimeMs) {
    log.info(`Time exit triggered for ${position.symbol}: held ${(holdTimeMs / 60000).toFixed(0)}min`);
    return { shouldExit: true, reason: "time_exit", sellAll: true };
  }

  return { shouldExit: false };
}

export function canOpenPosition(openCount: number, totalExposureSol: number, dailyLossSol: number): boolean {
  if (openCount >= config.trading.maxConcurrentPositions) {
    log.debug(`Max concurrent positions (${config.trading.maxConcurrentPositions}) reached`);
    return false;
  }

  if (totalExposureSol >= config.trading.maxTotalExposureSol) {
    log.debug(`Max total exposure (${config.trading.maxTotalExposureSol} SOL) reached`);
    return false;
  }

  if (dailyLossSol <= -config.trading.dailyLossLimitSol) {
    log.warn(`Daily loss limit (${config.trading.dailyLossLimitSol} SOL) hit, circuit breaker active`);
    return false;
  }

  return true;
}
