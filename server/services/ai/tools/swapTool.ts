import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { FusionSwapService } from "../../swap/fusionService";

// Initialize the fusion service
const fusionService = new FusionSwapService();

// Token address mappings for popular tokens
const TOKEN_ADDRESSES: Record<number, Record<string, string>> = {
  1: {
    // Ethereum
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  },
  137: {
    // Polygon
    MATIC: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
  },
  42161: {
    // Arbitrum
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    USDC: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
  },
  10: {
    // Optimism
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    WETH: "0x4200000000000000000000000000000000000006",
    USDC: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    USDT: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    WBTC: "0x68f180fcCe6836688e9084f035309E29Bf0A2095",
  },
  56: {
    // BSC
    BNB: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    DAI: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
    WETH: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    BTCB: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
  },
};

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  137: "Polygon",
  42161: "Arbitrum",
  10: "Optimism",
  56: "BSC",
  43114: "Avalanche",
  250: "Fantom",
  100: "Gnosis",
};

// Token decimals mapping - CRITICAL for correct amount conversion
const TOKEN_DECIMALS: Record<string, number> = {
  // 6 decimal tokens
  USDC: 6,
  USDT: 6,

  // 8 decimal tokens
  WBTC: 8,
  BTCB: 8,

  // 18 decimal tokens (default)
  ETH: 18,
  WETH: 18,
  MATIC: 18,
  WMATIC: 18,
  DAI: 18,
  BNB: 18,
  WBNB: 18,
};

function resolveTokenAddress(token: string, chainId: number): string {
  // If it's already an address, return as is
  if (token.startsWith("0x") && token.length === 42) {
    return token;
  }

  // Convert to uppercase for lookup
  const tokenSymbol = token.toUpperCase();

  // Look up in our mapping
  const chainTokens = TOKEN_ADDRESSES[chainId];
  if (chainTokens && chainTokens[tokenSymbol]) {
    return chainTokens[tokenSymbol];
  }

  // If not found, return the original (might be a custom token)
  return token;
}

function getTokenDecimals(token: string): number {
  // If it's an address, default to 18 decimals
  if (token.startsWith("0x")) {
    return 18;
  }

  // Convert to uppercase for lookup
  const tokenSymbol = token.toUpperCase();

  // Return the specific decimals or default to 18
  return TOKEN_DECIMALS[tokenSymbol] || 18;
}

function formatAmount(amount: string, decimals: number = 18): string {
  // If amount already looks like wei (long number), return as is
  if (amount.length > 10 && !amount.includes(".")) {
    return amount;
  }

  // Convert from human readable to wei
  const num = parseFloat(amount);
  const multiplier = Math.pow(10, decimals);
  return Math.floor(num * multiplier).toString();
}

function formatFromWei(amount: string, decimals: number = 18): string {
  // Handle empty or null amounts
  if (!amount || amount === "0") {
    return "0";
  }

  // Use BigInt for precision with large numbers
  try {
    const amountBigInt = BigInt(amount);
    const divisorBigInt = BigInt(10 ** decimals);

    // Calculate integer and fractional parts
    const integerPart = amountBigInt / divisorBigInt;
    const remainder = amountBigInt % divisorBigInt;

    // Convert to decimal
    const fractionalPart = Number(remainder) / Number(divisorBigInt);
    const result = Number(integerPart) + fractionalPart;

    // Format to appropriate decimal places
    if (result < 0.000001) {
      return result.toExponential(3);
    } else if (result < 1) {
      return result.toFixed(6);
    } else {
      return result.toFixed(4);
    }
  } catch (error) {
    console.error("Error formatting amount:", error);
    // Fallback to original method
    const num = parseFloat(amount);
    const divisor = Math.pow(10, decimals);
    return (num / divisor).toFixed(6);
  }
}

export const swapTool = new DynamicStructuredTool({
  name: "cross_chain_swap",
  description:
    "Get quotes and prepare cross-chain token swaps using 1inch Fusion. Can get quotes for swaps and provide swap preparation details.",
  schema: z.object({
    operation: z
      .enum(["get_quote", "prepare_swap"])
      .describe(
        "Operation: 'get_quote' for quotes only, 'prepare_swap' for swap preparation info"
      ),
    amount: z
      .string()
      .describe(
        "Amount to swap (in human readable format like '1.5' or '1000')"
      ),
    srcChainId: z
      .number()
      .describe(
        "Source chain ID (1=Ethereum, 137=Polygon, 42161=Arbitrum, 10=Optimism, 56=BSC)"
      ),
    dstChainId: z.number().describe("Destination chain ID"),
    srcToken: z
      .string()
      .describe("Source token symbol (ETH, USDC, WBTC) or contract address"),
    dstToken: z
      .string()
      .describe("Destination token symbol or contract address"),
    walletAddress: z.string().describe("User's wallet address"),
  }),
  func: async ({
    operation,
    amount,
    srcChainId,
    dstChainId,
    srcToken,
    dstToken,
    walletAddress,
  }) => {
    try {
      // Resolve token addresses
      const srcTokenAddress = resolveTokenAddress(srcToken, srcChainId);
      const dstTokenAddress = resolveTokenAddress(dstToken, dstChainId);

      // Get correct decimals for source token and format amount
      const srcTokenDecimals = getTokenDecimals(srcToken);
      const amountWei = formatAmount(amount, srcTokenDecimals);

      const srcChainName = CHAIN_NAMES[srcChainId] || `Chain ${srcChainId}`;
      const dstChainName = CHAIN_NAMES[dstChainId] || `Chain ${dstChainId}`;

      if (operation === "get_quote") {
        const result = await fusionService.getSwapQuote({
          amount: amountWei,
          srcChainId,
          dstChainId,
          srcTokenAddress,
          dstTokenAddress,
          walletAddress,
        });

        if (!result.success) {
          return `❌ **Error getting swap quote:** ${result.error}

**Details:**
- **From:** ${amount} ${srcToken} on ${srcChainName}
- **To:** ${dstToken} on ${dstChainName}
- **Wallet:** ${walletAddress}

Please check your parameters and try again.`;
        }

        const quote = result.data;
        const dstTokenDecimals = getTokenDecimals(dstToken);

        // Use the correct field name from 1inch API response
        const rawEstimate =
          quote.dstTokenAmount || quote.estimate || quote.dstAmount || "0";
        const estimatedOutput = formatFromWei(rawEstimate, dstTokenDecimals);

        return `🔄 **Cross-Chain Swap Quote**

**Swap Details:**
- **From:** ${amount} ${srcToken} on ${srcChainName}
- **To:** ~${estimatedOutput} ${dstToken} on ${dstChainName}
- **Quote ID:** \`${quote.quoteId}\`

**Rate Information:**
- **Estimated Output:** ${estimatedOutput} ${dstToken}
- **Price Impact:** ${
          quote.priceImpact ? `${quote.priceImpact}%` : "Calculating..."
        }

**Ready to Execute:**
✅ Quote is valid and ready for execution
💡 **To proceed with this swap, confirm the transaction in your wallet**

*Note: This is a cross-chain swap that will move your tokens from ${srcChainName} to ${dstChainName}. Make sure you have sufficient gas fees on both chains.*`;
      }

      if (operation === "prepare_swap") {
        // Get a fresh quote for the confirmation UI
        const quoteResult = await fusionService.getSwapQuote({
          amount: amountWei,
          srcChainId,
          dstChainId,
          srcTokenAddress,
          dstTokenAddress,
          walletAddress,
        });

        if (!quoteResult.success) {
          return JSON.stringify({
            content: `❌ **Error preparing swap:** ${quoteResult.error}\n\nPlease try again or contact support if the issue persists.`,
            swapData: null,
          });
        }

        const quote = quoteResult.data;
        const dstTokenDecimals = getTokenDecimals(dstToken);
        const rawEstimate =
          quote.dstTokenAmount || quote.estimate || quote.dstAmount || "0";
        const estimatedOutput = formatFromWei(rawEstimate, dstTokenDecimals);

        // Prepare structured swap data for frontend
        const swapData = {
          amount: amountWei.toString(), // Convert BigInt to string
          srcChainId,
          dstChainId,
          srcTokenAddress,
          dstTokenAddress,
          srcTokenSymbol: srcToken.toUpperCase(),
          dstTokenSymbol: dstToken.toUpperCase(),
          walletAddress,
          quote: {
            quoteId: quote.quoteId,
            estimatedOutput: rawEstimate.toString(), // Convert BigInt to string
            estimatedOutputFormatted: estimatedOutput,
            priceImpact: quote.priceImpact,
          },
        };

        const content = `🔄 **Cross-Chain Swap Quote**

**Swap Details:**
- **From:** ${amount} ${srcToken} on ${srcChainName}
- **To:** ~${estimatedOutput} ${dstToken} on ${dstChainName}
- **Quote ID:** \`${quote.quoteId}\`

**Rate Information:**
- **Estimated Output:** ${estimatedOutput} ${dstToken}
- **Price Impact:** ${
          quote.priceImpact ? `${quote.priceImpact}%` : "Calculating..."
        }

**Ready to Execute:**
✅ Quote is valid and ready for execution
💡 **To proceed with this swap, confirm the transaction below**

*Note: This is a cross-chain swap that will move your tokens from ${srcChainName} to ${dstChainName}. Make sure you have sufficient gas fees on both chains.*`;

        // Use custom JSON serializer to handle BigInt values
        return JSON.stringify(
          {
            content,
            swapData,
          },
          (key, value) => {
            return typeof value === "bigint" ? value.toString() : value;
          }
        );
      }

      return "Invalid operation specified. Use 'get_quote' or 'prepare_swap'.";
    } catch (error: any) {
      console.error("Swap tool error:", error);
      return `❌ **Error in swap operation:** ${error.message}

Please check your parameters and try again. Make sure:
- Chain IDs are supported (1=Ethereum, 137=Polygon, 42161=Arbitrum, 10=Optimism, 56=BSC)
- Token symbols are correct (ETH, USDC, WBTC, etc.)
- Wallet address is valid
- Amount is reasonable`;
    }
  },
});
