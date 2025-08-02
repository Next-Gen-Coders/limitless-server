import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../../../config/env";

// 1inch Gas Price API base URL
const ONEINCH_GAS_PRICE_API_BASE = "https://api.1inch.dev/gas-price/v1.6";

// Supported chains for gas price API
export const GAS_PRICE_SUPPORTED_CHAINS = {
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

// Types for gas price response
interface Eip1559GasValueResponse {
  maxPriorityFeePerGas: string;
  maxFeePerGas: string;
}

interface Eip1559GasPriceResponse {
  baseFee: string;
  low: Eip1559GasValueResponse;
  medium: Eip1559GasValueResponse;
  high: Eip1559GasValueResponse;
  instant: Eip1559GasValueResponse;
}

// Get gas prices for a specific chain
async function getGasPrices(chainId: number): Promise<Eip1559GasPriceResponse> {
  try {
    const response = await fetch(`${ONEINCH_GAS_PRICE_API_BASE}/${chainId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
        accept: "application/json",
      },
    });

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.error("Gas Price API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Gas Price API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch gas prices:", error);
    throw error;
  }
}

// Helper function to format gas prices
function formatGasPrices(
  gasPrices: Eip1559GasPriceResponse,
  chainName: string,
  chainId: number
): string {
  const formatGwei = (wei: string): string => {
    const gwei = parseFloat(wei) / 1e9;
    return gwei.toFixed(2);
  };

  let result = `⛽ **Gas Prices (EIP-1559)**\n\n`;
  result += `**Chain:** ${chainName} (${chainId})\n`;
  result += `**Base Fee:** ${formatGwei(gasPrices.baseFee)} gwei\n\n`;

  result += `**🐌 Low Priority**\n`;
  result += `   - **Max Priority Fee:** ${formatGwei(
    gasPrices.low.maxPriorityFeePerGas
  )} gwei\n`;
  result += `   - **Max Fee:** ${formatGwei(
    gasPrices.low.maxFeePerGas
  )} gwei\n`;
  result += `   - **Total Cost Estimate:** ~${formatGwei(
    gasPrices.low.maxFeePerGas
  )} gwei\n\n`;

  result += `**🚗 Medium Priority**\n`;
  result += `   - **Max Priority Fee:** ${formatGwei(
    gasPrices.medium.maxPriorityFeePerGas
  )} gwei\n`;
  result += `   - **Max Fee:** ${formatGwei(
    gasPrices.medium.maxFeePerGas
  )} gwei\n`;
  result += `   - **Total Cost Estimate:** ~${formatGwei(
    gasPrices.medium.maxFeePerGas
  )} gwei\n\n`;

  result += `**🚀 High Priority**\n`;
  result += `   - **Max Priority Fee:** ${formatGwei(
    gasPrices.high.maxPriorityFeePerGas
  )} gwei\n`;
  result += `   - **Max Fee:** ${formatGwei(
    gasPrices.high.maxFeePerGas
  )} gwei\n`;
  result += `   - **Total Cost Estimate:** ~${formatGwei(
    gasPrices.high.maxFeePerGas
  )} gwei\n\n`;

  result += `**⚡ Instant Priority**\n`;
  result += `   - **Max Priority Fee:** ${formatGwei(
    gasPrices.instant.maxPriorityFeePerGas
  )} gwei\n`;
  result += `   - **Max Fee:** ${formatGwei(
    gasPrices.instant.maxFeePerGas
  )} gwei\n`;
  result += `   - **Total Cost Estimate:** ~${formatGwei(
    gasPrices.instant.maxFeePerGas
  )} gwei\n\n`;

  result += `💡 **Gas Price Guide:**\n`;
  result += `• **Low**: Slower transaction, lower cost (~15-30 min)\n`;
  result += `• **Medium**: Standard speed and cost (~3-5 min)\n`;
  result += `• **High**: Faster transaction, higher cost (~1-2 min)\n`;
  result += `• **Instant**: Fastest execution, highest cost (~30 sec)\n\n`;

  result += `⏰ **Note:** Gas prices fluctuate based on network congestion. Data provided by 1inch Gas Price API.`;

  return result;
}

// Helper function to estimate transaction costs in USD
function formatGasPricesWithCostEstimate(
  gasPrices: Eip1559GasPriceResponse,
  chainName: string,
  chainId: number,
  ethPriceUSD?: number
): string {
  const formatGwei = (wei: string): string => {
    const gwei = parseFloat(wei) / 1e9;
    return gwei.toFixed(2);
  };

  const estimateCostUSD = (
    maxFeeWei: string,
    gasLimit: number = 21000
  ): string => {
    if (!ethPriceUSD) return "N/A";
    const maxFeeEth = parseFloat(maxFeeWei) / 1e18;
    const totalCostEth = maxFeeEth * gasLimit;
    const totalCostUSD = totalCostEth * ethPriceUSD;
    return `$${totalCostUSD.toFixed(2)}`;
  };

  let result = `⛽ **Gas Prices with Cost Estimates**\n\n`;
  result += `**Chain:** ${chainName} (${chainId})\n`;
  result += `**Base Fee:** ${formatGwei(gasPrices.baseFee)} gwei\n`;
  if (ethPriceUSD) result += `**ETH Price:** $${ethPriceUSD.toFixed(2)}\n`;
  result += `\n`;

  const priorities = [
    { name: "🐌 Low Priority", data: gasPrices.low, icon: "🐌" },
    { name: "🚗 Medium Priority", data: gasPrices.medium, icon: "🚗" },
    { name: "🚀 High Priority", data: gasPrices.high, icon: "🚀" },
    { name: "⚡ Instant Priority", data: gasPrices.instant, icon: "⚡" },
  ];

  priorities.forEach(({ name, data }) => {
    result += `**${name}**\n`;
    result += `   - **Max Priority Fee:** ${formatGwei(
      data.maxPriorityFeePerGas
    )} gwei\n`;
    result += `   - **Max Fee:** ${formatGwei(data.maxFeePerGas)} gwei\n`;
    result += `   - **Simple Transfer Cost:** ${estimateCostUSD(
      data.maxFeePerGas,
      21000
    )}\n`;
    result += `   - **Token Transfer Cost:** ${estimateCostUSD(
      data.maxFeePerGas,
      65000
    )}\n`;
    result += `   - **DeFi Transaction Cost:** ${estimateCostUSD(
      data.maxFeePerGas,
      150000
    )}\n\n`;
  });

  result += `💡 **Cost Estimates (Gas Limits):**\n`;
  result += `• **Simple Transfer**: 21,000 gas\n`;
  result += `• **Token Transfer**: ~65,000 gas\n`;
  result += `• **DeFi Transaction**: ~150,000 gas\n\n`;

  result += `⏰ **Note:** Actual gas usage may vary. Estimates based on common transaction types.`;

  return result;
}

// Create the gas price tool
export const gasPriceTool = new DynamicStructuredTool({
  name: "gas_prices",
  description:
    "Get real-time gas prices and transaction cost estimates for EIP-1559 compatible networks using 1inch Gas Price API",
  schema: z.object({
    chain: z
      .string()
      .optional()
      .describe(
        "Blockchain network (ethereum, polygon, bsc, arbitrum, optimism, etc.). Defaults to ethereum"
      ),
    includeEstimates: z
      .boolean()
      .optional()
      .describe(
        "Include USD cost estimates for different transaction types. Defaults to false"
      ),
    ethPrice: z
      .number()
      .optional()
      .describe(
        "Current ETH price in USD for cost calculations (only used if includeEstimates is true)"
      ),
  }),
  func: async ({ chain = "ethereum", includeEstimates = false, ethPrice }) => {
    try {
      // Validate chain
      const chainId =
        GAS_PRICE_SUPPORTED_CHAINS[
          chain.toLowerCase() as keyof typeof GAS_PRICE_SUPPORTED_CHAINS
        ];
      if (!chainId) {
        return `Error: Unsupported chain "${chain}". Supported chains: ${Object.keys(
          GAS_PRICE_SUPPORTED_CHAINS
        ).join(", ")}`;
      }

      const chainName = chain.charAt(0).toUpperCase() + chain.slice(1);

      // Get gas prices
      const gasPrices = await getGasPrices(chainId);

      // Format response based on whether estimates are requested
      if (includeEstimates && ethPrice) {
        return formatGasPricesWithCostEstimate(
          gasPrices,
          chainName,
          chainId,
          ethPrice
        );
      } else {
        return formatGasPrices(gasPrices, chainName, chainId);
      }
    } catch (error: any) {
      console.error("Gas price tool error:", error);

      if (error.message.includes("Gas Price API error")) {
        return `Error: ${error.message}. Please check your API key and try again.`;
      }

      return `Error fetching gas prices: ${error.message}`;
    }
  },
});
