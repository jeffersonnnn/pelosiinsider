import { VersionedTransaction } from "@solana/web3.js";
import { config } from "../config";
import { createLogger } from "../logger";
import { getConnection, getKeypair, getBalanceSol } from "./wallet";
import type { JupiterQuote } from "../types";

const log = createLogger("executor");

const SOL_DECIMALS = 9;
const LAMPORTS = 10 ** SOL_DECIMALS;

export async function buyToken(mint: string, solAmount: number): Promise<{ signature: string; tokenAmount: number } | null> {
  if (config.isPaper) {
    const sig = `paper_buy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    log.info(`[PAPER] Buy ${solAmount} SOL of ${mint.slice(0, 8)}... tx=${sig}`);
    // Estimate token amount from a rough price
    return { signature: sig, tokenAmount: solAmount * 1_000_000 }; // placeholder
  }

  try {
    // Check balance
    const balance = await getBalanceSol();
    if (balance < solAmount + 0.01) { // 0.01 SOL for fees
      log.warn(`Insufficient balance: ${balance} SOL < ${solAmount + 0.01} SOL needed`);
      return null;
    }

    // Get Jupiter quote
    const quote = await getQuote(config.SOL_MINT, mint, Math.floor(solAmount * LAMPORTS));
    if (!quote) return null;

    // Execute swap
    const signature = await executeSwap(quote);
    if (!signature) return null;

    const tokenAmount = Number(quote.outAmount);
    log.info(`Bought ${tokenAmount} tokens for ${solAmount} SOL. tx=${signature}`);
    return { signature, tokenAmount };
  } catch (err) {
    log.error("Buy failed", err);
    return null;
  }
}

export async function sellToken(mint: string, tokenAmount: number): Promise<{ signature: string; solReceived: number } | null> {
  if (config.isPaper) {
    const sig = `paper_sell_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const solReceived = tokenAmount / 1_000_000 * 1.5; // placeholder estimate
    log.info(`[PAPER] Sell ${tokenAmount} of ${mint.slice(0, 8)}... for ~${solReceived.toFixed(4)} SOL tx=${sig}`);
    return { signature: sig, solReceived };
  }

  try {
    const quote = await getQuote(mint, config.SOL_MINT, tokenAmount);
    if (!quote) return null;

    const signature = await executeSwap(quote);
    if (!signature) return null;

    const solReceived = Number(quote.outAmount) / LAMPORTS;
    log.info(`Sold for ${solReceived.toFixed(4)} SOL. tx=${signature}`);
    return { signature, solReceived };
  } catch (err) {
    log.error("Sell failed", err);
    return null;
  }
}

async function getQuote(inputMint: string, outputMint: string, amount: number): Promise<JupiterQuote | null> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: Math.floor(amount).toString(),
      slippageBps: config.jupiter.slippageBps.toString(),
      onlyDirectRoutes: "false",
    });

    const res = await fetch(`${config.jupiter.quoteUrl}?${params}`);
    if (!res.ok) {
      log.error(`Jupiter quote failed: ${res.status}`);
      return null;
    }
    return await res.json() as JupiterQuote;
  } catch (err) {
    log.error("Quote fetch failed", err);
    return null;
  }
}

async function executeSwap(quote: JupiterQuote): Promise<string | null> {
  try {
    const keypair = getKeypair();
    const connection = getConnection();

    const res = await fetch(config.jupiter.swapUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: keypair.publicKey.toBase58(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      }),
    });

    if (!res.ok) {
      log.error(`Jupiter swap failed: ${res.status}`);
      return null;
    }

    const { swapTransaction } = await res.json() as { swapTransaction: string };
    const txBuf = Buffer.from(swapTransaction, "base64");
    const tx = VersionedTransaction.deserialize(txBuf);
    tx.sign([keypair]);

    const signature = await connection.sendTransaction(tx, {
      skipPreflight: true,
      maxRetries: 2,
    });

    // Confirm
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");

    return signature;
  } catch (err) {
    log.error("Swap execution failed", err);
    return null;
  }
}
