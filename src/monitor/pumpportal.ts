import { config } from "../config";
import { createLogger } from "../logger";
import type { PumpPortalToken, Token } from "../types";

const log = createLogger("pumpportal");

type TokenCallback = (token: Token) => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let onNewToken: TokenCallback | null = null;

export function startPumpPortal(callback: TokenCallback) {
  onNewToken = callback;
  connect();
}

export function stopPumpPortal() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (ws) {
    ws.close();
    ws = null;
  }
}

function connect() {
  log.info("Connecting to PumpPortal...");

  ws = new WebSocket(config.pumpPortal.wsUrl);

  ws.onopen = () => {
    log.info("Connected to PumpPortal");
    // Subscribe to new token creation events
    ws!.send(JSON.stringify({
      method: "subscribeNewToken",
    }));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data as string) as PumpPortalToken;
      if (data.txType === "create" && data.mint && data.name) {
        const token: Token = {
          mint: data.mint,
          name: data.name,
          symbol: data.symbol,
          uri: data.uri,
          createdAt: Math.floor(Date.now() / 1000),
          devWallet: data.traderPublicKey,
          bondingCurvePct: calculateBondingCurvePct(data),
          liquiditySol: data.vSolInBondingCurve / 1e9,
          marketCapUsd: undefined, // will be enriched
        };
        log.debug(`New token: ${data.symbol} (${data.mint.slice(0, 8)}...)`);
        onNewToken?.(token);
      }
    } catch (err) {
      log.error("Failed to parse message", err);
    }
  };

  ws.onerror = (err) => {
    log.error("WebSocket error", err);
  };

  ws.onclose = () => {
    log.warn("Disconnected from PumpPortal, reconnecting in 5s...");
    reconnectTimer = setTimeout(connect, 5000);
  };
}

function calculateBondingCurvePct(data: PumpPortalToken): number {
  // PumpFun bonding curve: tokens start at ~1B supply in curve
  // As people buy, vTokens decrease. When ~800M are bought, it graduates.
  const totalSupply = 1_000_000_000;
  const tokensRemaining = data.vTokensInBondingCurve / 1e6; // adjust decimals
  const bought = totalSupply - tokensRemaining;
  return Math.min(100, Math.max(0, (bought / (totalSupply * 0.8)) * 100));
}
