import { getStats, getRecentTrades, getOpenPositions, getAllPositions, getRecentTweets, getRecentTokens, getTokenByMint } from "../store/db";
import { getBalanceSol } from "../trader/wallet";

export async function handleApiRequest(path: string): Promise<Response> {
  try {
    // Handle parameterized routes
    const tokenMatch = path.match(/^\/api\/token\/(.+)$/);
    if (tokenMatch) {
      const mint = tokenMatch[1];
      const token = getTokenByMint(mint);
      if (!token) return json({ error: "Token not found" }, 404);
      return json(token);
    }

    switch (path) {
      case "/api/stats": {
        const stats = getStats();
        const balance = await getBalanceSol();
        return json({ ...stats, balance });
      }
      case "/api/trades":
        return json(getRecentTrades(50));
      case "/api/positions":
        return json(getAllPositions(50));
      case "/api/positions/open":
        return json(getOpenPositions());
      case "/api/tweets":
        return json(getRecentTweets(20));
      case "/api/discovery":
        return json(getRecentTokens(50));
      default:
        return json({ error: "Not found" }, 404);
    }
  } catch (err: any) {
    return json({ error: err.message }, 500);
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
