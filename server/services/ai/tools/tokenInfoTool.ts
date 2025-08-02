import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../../../config/env";

// 1inch API base URL
const ONEINCH_API_BASE = "https://api.1inch.dev";

// Define supported chains for 1inch
export const SUPPORTED_CHAINS = {
  ethereum: 1,
  bsc: 56,
  polygon: 137,
  arbitrum: 42161,
  optimism: 10,
  avalanche: 43114,
  gnosis: 100,
  fantom: 250,
  klaytn: 8217,
  aurora: 1313161554,
  zksync: 324,
} as const;

// Get all tokens for a chain
async function getAllTokens(chainId: number) {
  try {
    const response = await fetch(
      `${ONEINCH_API_BASE}/swap/v5.2/${chainId}/tokens`,
      {
        headers: {
          Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
          accept: "application/json",
        },
      }
    );

    if (response.ok) {
      return response.json();
    } else {
      console.warn(
        `Tokens list fetch failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.warn("Could not fetch tokens list:", error);
  }
  return null;
}

// Get specific token information
async function getTokenInfo(tokenAddress: string, chainId: number) {
  try {
    // First try to get from the tokens list
    const allTokens = await getAllTokens(chainId);
    if (
      allTokens &&
      allTokens.tokens &&
      allTokens.tokens[tokenAddress.toLowerCase()]
    ) {
      return allTokens.tokens[tokenAddress.toLowerCase()];
    }

    // Fallback: try token-specific endpoint (might not exist)
    const response = await fetch(
      `${ONEINCH_API_BASE}/token/v1.2/${chainId}/${tokenAddress}`,
      {
        headers: {
          Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
          accept: "application/json",
        },
      }
    );

    if (response.ok) {
      return response.json();
    } else {
      console.warn(
        `Token info fetch failed: ${response.status} ${response.statusText}`
      );
    }
  } catch (error) {
    console.warn("Could not fetch token info:", error);
  }
  return null;
}

// Search for token by symbol
function findTokenBySymbol(symbol: string, tokensData: any): any | null {
  if (!tokensData || !tokensData.tokens) return null;

  const upperSymbol = symbol.toUpperCase();

  // Search through all tokens to find matching symbol
  for (const [address, tokenInfo] of Object.entries(tokensData.tokens)) {
    const token = tokenInfo as any;
    if (token.symbol && token.symbol.toUpperCase() === upperSymbol) {
      return { ...token, address };
    }
  }

  return null;
}

// Create the token info tool
export const tokenInfoTool = new DynamicStructuredTool({
  name: "get_token_info",
  description:
    "Get detailed information about tokens including address, symbol, name, decimals, and other metadata across multiple blockchains",
  schema: z.object({
    token: z
      .string()
      .describe(
        "Token symbol or contract address (e.g., 'ETH', 'USDC', '0x...')"
      ),
    chain: z
      .string()
      .optional()
      .describe(
        "Blockchain network (ethereum, polygon, bsc, arbitrum, etc.). Defaults to ethereum"
      ),
  }),
  func: async ({ token, chain = "ethereum" }) => {
    try {
      // Validate chain
      const chainId =
        SUPPORTED_CHAINS[chain.toLowerCase() as keyof typeof SUPPORTED_CHAINS];
      if (!chainId) {
        return `Error: Unsupported chain "${chain}". Supported chains: ${Object.keys(
          SUPPORTED_CHAINS
        ).join(", ")}`;
      }

      let tokenInfo = null;
      let searchMethod = "";

      // If it's an address, get token info directly
      if (token.startsWith("0x")) {
        tokenInfo = await getTokenInfo(token, chainId);
        searchMethod = "by address";
      } else {
        // If it's a symbol, search through all tokens
        const allTokens = await getAllTokens(chainId);
        if (allTokens) {
          tokenInfo = findTokenBySymbol(token, allTokens);
          searchMethod = "by symbol";
        }
      }

      if (!tokenInfo) {
        return `❌ Token "${token}" not found on ${chain} chain. Please check the token symbol or address.`;
      }

      const chainName = chain.charAt(0).toUpperCase() + chain.slice(1);

      return `
📊 **Token Information** (${searchMethod})

**Chain:** ${chainName} (${chainId})
**Symbol:** ${tokenInfo.symbol || "N/A"}
**Name:** ${tokenInfo.name || "N/A"}
**Address:** ${tokenInfo.address || token}
**Decimals:** ${tokenInfo.decimals || "N/A"}
${tokenInfo.logoURI ? `**Logo:** ${tokenInfo.logoURI}` : ""}
${
  tokenInfo.tags && tokenInfo.tags.length > 0
    ? `**Tags:** ${tokenInfo.tags.join(", ")}`
    : ""
}

✅ **Token found and verified on ${chainName} network**
      `.trim();
    } catch (error: any) {
      console.error("Token info error:", error);
      return `Error getting token info: ${error.message}`;
    }
  },
});
