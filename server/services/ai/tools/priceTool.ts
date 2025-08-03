import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../../../config/env";

// 1inch Price API base URL
const ONEINCH_PRICE_API_BASE = "https://api.1inch.dev/price/v1.1";

// Supported chains for price API (using common chains)
export const PRICE_SUPPORTED_CHAINS = {
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
  base: 8453,
} as const;

// Supported currencies
export const SUPPORTED_CURRENCIES = ["USD"] as const;

// Common token addresses for price queries
export const PRICE_COMMON_TOKENS = {
  1: {
    // Ethereum
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "1INCH": "0x111111111117dc0aa78b770fa6a738034120c302",
  },
  137: {
    // Polygon
    MATIC: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  },
  56: {
    // BSC
    BNB: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  },
};

// Get token prices
async function getTokenPrices(params: {
  chainId: number;
  tokens: string[];
  currency: string;
}) {
  try {
    const response = await fetch(
      `${ONEINCH_PRICE_API_BASE}/${params.chainId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          tokens: params.tokens,
          currency: params.currency,
        }),
      }
    );

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.error("Price API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Price API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch token prices:", error);
    throw error;
  }
}

// Get supported currencies
async function getSupportedCurrencies(chainId: number) {
  try {
    const response = await fetch(
      `${ONEINCH_PRICE_API_BASE}/${chainId}/currencies`,
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
      const errorText = await response.text();
      console.error("Currencies API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Currencies API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch supported currencies:", error);
    throw error;
  }
}

// Helper function to resolve token symbols to addresses
function resolveTokenAddress(token: string, chainId: number): string {
  // If already an address, return as is
  if (token.startsWith("0x")) {
    return token;
  }

  // Try to resolve from common tokens
  const tokens =
    PRICE_COMMON_TOKENS[chainId as keyof typeof PRICE_COMMON_TOKENS];
  if (tokens) {
    const upperToken = token.toUpperCase();
    const address = tokens[upperToken as keyof typeof tokens];
    if (address) {
      return address;
    }
  }

  return token; // Return as is if can't resolve
}

// Helper function to get the proper checksum address
function getProperAddress(address: string, chainId: number): string {
  const lowerAddress = address.toLowerCase();

  // Find the proper address from our token mappings
  const tokens =
    PRICE_COMMON_TOKENS[chainId as keyof typeof PRICE_COMMON_TOKENS];
  if (tokens) {
    for (const [symbol, properAddress] of Object.entries(tokens)) {
      if (properAddress.toLowerCase() === lowerAddress) {
        return properAddress;
      }
    }
  }

  // Special handling for common addresses across all chains
  const commonAddresses: Record<string, string> = {
    "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee":
      "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", // Native token
    "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48":
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
    "0xdac17f958d2ee523a2206206994597c13d831ec7":
      "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT on Ethereum
    "0x6b175474e89094c44da98b954eedeac495271d0f":
      "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI on Ethereum
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2":
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH on Ethereum
    "0x111111111117dc0aa78b770fa6a738034120c302":
      "0x111111111117dC0aa78b770fA6A738034120C302", // 1INCH on Ethereum
  };

  const properAddress = commonAddresses[lowerAddress];
  if (properAddress) {
    return properAddress;
  }

  // If not found in our mappings, return the address as-is
  return address;
}

// Helper function to format prices
function formatPrices(
  prices: Record<string, string>,
  originalTokens: string[],
  currency: string,
  chainName: string,
  chainId: number
): string {
  let result = `💰 **Token Prices**\n\n`;
  result += `**Chain:** ${chainName} (${chainId})\n`;
  result += `**Currency:** ${currency}\n`;
  result += `**Total Tokens:** ${Object.keys(prices).length}\n\n`;

  // Create a map to match resolved addresses with their original token inputs
  const addressToTokenMap = new Map<string, string>();
  originalTokens.forEach((token) => {
    const resolvedAddress = resolveTokenAddress(token, chainId);
    addressToTokenMap.set(resolvedAddress.toLowerCase(), token);
  });

  for (const [address, price] of Object.entries(prices)) {
    // Get the original token input (symbol or address)
    const originalToken =
      addressToTokenMap.get(address.toLowerCase()) || address;
    const formattedPrice = parseFloat(price).toFixed(6);

    // Display the original token symbol if it was a symbol, otherwise show the full address
    const displayToken = originalToken.startsWith("0x")
      ? originalToken
      : originalToken.toUpperCase();

    // Get the proper checksum address for display
    const properAddress = getProperAddress(address, chainId);

    result += `**${displayToken}**\n`;
    result += `   - **Address:** ${properAddress}\n`;
    result += `   - **Price:** $${formattedPrice} ${currency}\n\n`;
  }

  result += `⏰ **Note:** Prices are real-time and may fluctuate. Data provided by 1inch Price API.`;

  return result;
}

// Helper function to format supported currencies
function formatSupportedCurrencies(
  currencies: { codes: string[] },
  chainName: string,
  chainId: number
): string {
  let result = `💱 **Supported Currencies**\n\n`;
  result += `**Chain:** ${chainName} (${chainId})\n`;
  result += `**Total Currencies:** ${currencies.codes.length}\n\n`;

  currencies.codes.forEach((currency, index) => {
    result += `${index + 1}. **${currency}**\n`;
  });

  result += `\n💡 **Tip:** Use these currency codes when requesting token prices.`;

  return result;
}

// Create the price tool
export const priceTool = new DynamicStructuredTool({
  name: "token_prices",
  description:
    "Get real-time token prices and supported currencies using 1inch Price API across multiple blockchains",
  schema: z.object({
    operation: z
      .enum(["get_prices", "supported_currencies"])
      .describe(
        "Operation to perform: 'get_prices' for token prices, 'supported_currencies' for available currencies"
      ),
    tokens: z
      .array(z.string())
      .optional()
      .describe(
        "Array of token symbols or addresses (required for 'get_prices'). Examples: ['ETH', 'USDC'] or ['0x...', '0x...']"
      ),
    currency: z
      .string()
      .optional()
      .describe(
        "Currency to get prices in (for 'get_prices'). Currently supports 'USD'. Defaults to 'USD'"
      ),
    chain: z
      .string()
      .optional()
      .describe(
        "Blockchain network (ethereum, polygon, bsc, arbitrum, etc.). Defaults to ethereum"
      ),
  }),
  func: async ({
    operation,
    tokens = [],
    currency = "USD",
    chain = "ethereum",
  }) => {
    try {
      // Validate chain
      const chainId =
        PRICE_SUPPORTED_CHAINS[
          chain.toLowerCase() as keyof typeof PRICE_SUPPORTED_CHAINS
        ];
      if (!chainId) {
        return `Error: Unsupported chain "${chain}". Supported chains: ${Object.keys(
          PRICE_SUPPORTED_CHAINS
        ).join(", ")}`;
      }

      const chainName = chain.charAt(0).toUpperCase() + chain.slice(1);

      switch (operation) {
        case "get_prices": {
          if (!tokens || tokens.length === 0) {
            return "Error: Tokens array is required for getting prices. Please provide token symbols or addresses.";
          }

          // Validate currency
          if (!SUPPORTED_CURRENCIES.includes(currency as any)) {
            return `Error: Unsupported currency "${currency}". Currently supported: ${SUPPORTED_CURRENCIES.join(
              ", "
            )}`;
          }

          // Resolve token symbols to addresses
          const tokenAddresses = tokens.map((token) =>
            resolveTokenAddress(token, chainId)
          );

          // Validate that we have valid addresses
          const invalidTokens = tokenAddresses.filter(
            (addr) => !addr.startsWith("0x") || addr.length !== 42
          );

          if (invalidTokens.length > 0) {
            return `Error: Could not resolve token(s): ${invalidTokens.join(
              ", "
            )} on ${chain}. Please provide valid token symbols or contract addresses.`;
          }

          const prices = await getTokenPrices({
            chainId,
            tokens: tokenAddresses,
            currency: currency.toUpperCase(),
          });

          return formatPrices(
            prices,
            tokens,
            currency.toUpperCase(),
            chainName,
            chainId
          );
        }

        case "supported_currencies": {
          const currencies = await getSupportedCurrencies(chainId);
          return formatSupportedCurrencies(currencies, chainName, chainId);
        }

        default:
          return "Error: Invalid operation. Use 'get_prices' or 'supported_currencies'";
      }
    } catch (error: any) {
      console.error("Price tool error:", error);

      if (
        error.message.includes("Price API error") ||
        error.message.includes("Currencies API error")
      ) {
        return `Error: ${error.message}. Please check your API key and try again.`;
      }

      return `Error performing price operation: ${error.message}`;
    }
  },
});
