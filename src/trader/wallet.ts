import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { config } from "../config";
import { createLogger } from "../logger";
import bs58 from "bs58";

const log = createLogger("wallet");

let connection: Connection;
let keypair: Keypair | null = null;

export function initWallet() {
  connection = new Connection(config.solana.rpcUrl, "confirmed");

  if (config.solana.privateKey) {
    try {
      const decoded = bs58.decode(config.solana.privateKey);
      keypair = Keypair.fromSecretKey(decoded);
      log.info("Wallet loaded", { pubkey: keypair.publicKey.toBase58() });
    } catch {
      log.warn("Invalid private key, running in paper mode only");
    }
  } else {
    log.info("No private key provided, paper mode only");
  }

  return { connection, keypair };
}

export function getConnection(): Connection {
  if (!connection) throw new Error("Wallet not initialized");
  return connection;
}

export function getKeypair(): Keypair {
  if (!keypair) throw new Error("No keypair available");
  return keypair;
}

export function getPublicKey(): PublicKey | null {
  return keypair?.publicKey ?? null;
}

export async function getBalanceSol(): Promise<number> {
  if (!keypair) return config.isPaper ? 10.0 : 0;
  const balance = await connection.getBalance(keypair.publicKey);
  return balance / LAMPORTS_PER_SOL;
}
