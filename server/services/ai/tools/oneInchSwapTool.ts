import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../../../config/env";

// 1inch Fusion API base URL
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

// Common token addresses for major chains
export const COMMON_TOKENS = {
  1: {
    // Ethereum
    ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
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

interface FusionSwapParams {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  fromAddress: string;
  chainId: number;
  slippage?: number;
}

interface SwapQuoteResponse {
  dstAmount: string;
  srcAmount?: string;
  gas?: string;
  gasPrice?: string;
  protocols?: any[];
  // Fusion-specific fields
  toAmount?: string;
  fromTokenAmount?: string;
  estimatedGas?: string;
}

// Get swap quote from 1inch
async function getSwapQuote(
  params: FusionSwapParams
): Promise<SwapQuoteResponse> {
  const {
    fromTokenAddress,
    toTokenAddress,
    amount,
    fromAddress,
    chainId,
    slippage = 1,
  } = params;

  const searchParams = new URLSearchParams({
    src: fromTokenAddress,
    dst: toTokenAddress,
    amount: amount,
    from: fromAddress,
    slippage: slippage.toString(),
    disableEstimate: "false",
    allowPartialFill: "true",
  });

  const response = await fetch(
    `${ONEINCH_API_BASE}/swap/v5.2/${chainId}/quote?${searchParams}`,
    {
      headers: {
        Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
        accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("1inch API error details:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: errorText,
    });
    throw new Error(
      `1inch API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();

  return data;
}

// Get token information
async function getTokenInfo(tokenAddress: string, chainId: number) {
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
      const data = await response.json();
      if (data.tokens && data.tokens[tokenAddress.toLowerCase()]) {
        return data.tokens[tokenAddress.toLowerCase()];
      }
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

// Helper function to find token address by symbol
function findTokenBySymbol(symbol: string, chainId: number): string | null {
  const tokens = COMMON_TOKENS[chainId as keyof typeof COMMON_TOKENS];
  if (!tokens) return null;

  const upperSymbol = symbol.toUpperCase();
  return tokens[upperSymbol as keyof typeof tokens] || null;
}

// // Test function to verify API key works
// async function testAPIKey(chainId: number = 1): Promise<boolean> {
//   try {
//     const response = await fetch(
//       `${ONEINCH_API_BASE}/swap/v5.2/${chainId}/tokens`,
//       {
//         headers: {
//           Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
//           accept: "application/json",
//         },
//       }
//     );

//     if (response.ok) {
//       console.log("✅ 1inch API key is working");
//       return true;
//     } else {
//       console.error(
//         "❌ 1inch API key test failed:",
//         response.status,
//         response.statusText
//       );
//       return false;
//     }
//   } catch (error) {
//     console.error("❌ 1inch API key test error:", error);
//     return false;
//   }
// }

// Format amount with decimals
function formatAmount(amount: string, decimals: number = 18): string {
  const factor = Math.pow(10, decimals);
  const numAmount = parseFloat(amount);
  return (numAmount * factor).toString();
}

// Create the 1inch Fusion swap tool
export const oneInchSwapTool = new DynamicStructuredTool({
  name: "oneinch_fusion_swap",
  description:
    "Get swap quotes and information using 1inch Fusion API for token swaps across multiple chains",
  schema: z.object({
    fromToken: z
      .string()
      .describe(
        "Source token symbol or address (e.g., 'ETH', 'USDC', '0x...')"
      ),
    toToken: z
      .string()
      .describe(
        "Destination token symbol or address (e.g., 'USDC', 'DAI', '0x...')"
      ),
    amount: z
      .string()
      .describe(
        "Amount to swap (in token units, e.g., '1' for 1 ETH, '100' for 100 USDC)"
      ),
    fromAddress: z
      .string()
      .describe("Wallet address that will perform the swap"),
    chain: z
      .string()
      .optional()
      .describe(
        "Blockchain network (ethereum, polygon, bsc, arbitrum, etc.). Defaults to ethereum"
      ),
    slippage: z
      .number()
      .optional()
      .describe(
        "Maximum slippage tolerance in percentage (0.1-50). Defaults to 1%"
      ),
  }),
  func: async ({
    fromToken,
    toToken,
    amount,
    fromAddress,
    chain = "ethereum",
    slippage = 1,
  }) => {
    try {
      // Validate chain
      const chainId =
        SUPPORTED_CHAINS[chain.toLowerCase() as keyof typeof SUPPORTED_CHAINS];
      if (!chainId) {
        return `Error: Unsupported chain "${chain}". Supported chains: ${Object.keys(
          SUPPORTED_CHAINS
        ).join(", ")}`;
      }

      //   // Test API key first
      //   const apiKeyValid = await testAPIKey(chainId);
      //   if (!apiKeyValid) {
      //     return "Error: 1inch API key is invalid or API is unreachable. Please check your ONEINCH_API_KEY environment variable.";
      //   }

      // Resolve token addresses
      let fromTokenAddress = fromToken;
      let toTokenAddress = toToken;

      // Try to resolve by symbol if not an address
      if (!fromToken.startsWith("0x")) {
        const resolved = findTokenBySymbol(fromToken, chainId);
        if (!resolved) {
          return `Error: Could not resolve token symbol "${fromToken}" on ${chain}`;
        }
        fromTokenAddress = resolved;
      }

      if (!toToken.startsWith("0x")) {
        const resolved = findTokenBySymbol(toToken, chainId);
        if (!resolved) {
          return `Error: Could not resolve token symbol "${toToken}" on ${chain}`;
        }
        toTokenAddress = resolved;
      }

      // Validate wallet address
      if (!fromAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return `Error: Invalid wallet address format "${fromAddress}"`;
      }

      // Validate slippage
      if (slippage < 0.1 || slippage > 50) {
        return `Error: Slippage must be between 0.1% and 50%`;
      }

      // Get token info for proper amount formatting
      const fromTokenInfo = await getTokenInfo(fromTokenAddress, chainId);
      const toTokenInfo = await getTokenInfo(toTokenAddress, chainId);

      // Format amount (assuming 18 decimals if token info not available)
      const decimals = fromTokenInfo?.decimals || 18;
      const formattedAmount = formatAmount(amount, decimals);

      // Get swap quote
      const quote = await getSwapQuote({
        fromTokenAddress,
        toTokenAddress,
        amount: formattedAmount,
        fromAddress,
        chainId,
        slippage,
      });

      // Handle different response structures (standard vs fusion)
      const toAmount = quote.dstAmount || quote.toAmount;
      const fromAmount =
        quote.srcAmount || quote.fromTokenAmount || formattedAmount;
      const gasEstimate = quote.gas || quote.estimatedGas || "N/A";

      if (!toAmount) {
        return `Error: Invalid response from 1inch API. Could not get destination amount.`;
      }

      // Format response amounts
      const toDecimals = toTokenInfo?.decimals || 18;
      const toAmountFormatted = (
        parseInt(toAmount) / Math.pow(10, toDecimals)
      ).toFixed(6);
      const fromAmountFormatted = (
        parseInt(fromAmount) / Math.pow(10, decimals)
      ).toFixed(6);

      const fromSymbol = fromTokenInfo?.symbol || fromToken;
      const toSymbol = toTokenInfo?.symbol || toToken;

      return `
🔄 **1inch Fusion Swap Quote**

**Chain:** ${chain.charAt(0).toUpperCase() + chain.slice(1)} (${chainId})
**From:** ${fromAmountFormatted} ${fromSymbol}
**To:** ~${toAmountFormatted} ${toSymbol}
**Slippage:** ${slippage}%
**Estimated Gas:** ${gasEstimate}

**Rate:** 1 ${fromSymbol} = ${(
        parseFloat(toAmountFormatted) / parseFloat(fromAmountFormatted)
      ).toFixed(6)} ${toSymbol}

⚠️ **Note:** This is a quote only. To execute the swap, you would need to call the 1inch swap API with proper transaction parameters and sign the transaction with your wallet.
      `.trim();
    } catch (error: any) {
      console.error("1inch Fusion swap error:", error);

      if (error.message.includes("1inch API error")) {
        return `Error: ${error.message}. Please check your API key and try again.`;
      }

      return `Error getting swap quote: ${error.message}`;
    }
  },
});
