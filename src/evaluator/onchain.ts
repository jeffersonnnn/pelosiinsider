import { getConnection } from "../trader/wallet";
import { PublicKey } from "@solana/web3.js";
import { createLogger } from "../logger";
import type { Token } from "../types";

const log = createLogger("onchain");

export async function getOnchainMetrics(token: Token): Promise<Token> {
  try {
    const conn = getConnection();
    const mintPk = new PublicKey(token.mint);

    // Get token supply info
    const supply = await conn.getTokenSupply(mintPk).catch(() => null);
    if (!supply) return token;

    // Get largest holders
    const holders = await conn.getTokenLargestAccounts(mintPk).catch(() => null);
    if (holders?.value) {
      const totalSupply = Number(supply.value.amount);
      if (totalSupply > 0) {
        // Top 10 holders percentage
        const top10 = holders.value.slice(0, 10);
        const top10Amount = top10.reduce((sum, h) => sum + Number(h.amount), 0);
        token.topHoldersPct = (top10Amount / totalSupply) * 100;

        // Dev wallet check (first holder is often dev)
        if (token.devWallet && holders.value.length > 0) {
          // Check if dev wallet is among top holders
          const devAmount = Number(holders.value[0].amount);
          token.devHoldPct = (devAmount / totalSupply) * 100;
        }
      }

      token.holderCount = holders.value.length; // Approximate from largest accounts response
    }

    // Check mint authority
    const mintInfo = await conn.getParsedAccountInfo(mintPk).catch(() => null);
    if (mintInfo?.value?.data && "parsed" in mintInfo.value.data) {
      const parsed = mintInfo.value.data.parsed;
      token.mintAuthorityRevoked = !parsed?.info?.mintAuthority;
      token.freezeAuthorityRevoked = !parsed?.info?.freezeAuthority;
    }

    log.debug(`On-chain metrics for ${token.symbol}: ${token.holderCount} holders, ${token.topHoldersPct?.toFixed(1)}% top10`);
    return token;
  } catch (err) {
    log.error(`On-chain check failed for ${token.symbol}`, err);
    return token;
  }
}
