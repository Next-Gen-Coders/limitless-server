import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../../../config/env";

// 1inch Charts API base URL
const ONEINCH_CHARTS_API_BASE = "https://api.1inch.dev/charts/v1.0";

// Supported chains for charts API
export const CHARTS_SUPPORTED_CHAINS = {
  ethereum: "1",
  bsc: "56",
  polygon: "137",
  arbitrum: "42161",
  avalanche: "43114",
  gnosis: "100",
  optimism: "10",
  base: "8453",
  zksync: "324",
  linea: "59144",
  flow: "146",
  polkadot: "130",
} as const;

// Common token addresses by chain
export const COMMON_TOKENS: Record<string, Record<string, string>> = {
  "1": {
    // Ethereum
    ETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
    WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    USDC: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    LINK: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    WBTC: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
  },
  "137": {
    // Polygon
    MATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WMATIC
    WMATIC: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    USDC: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    USDT: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    DAI: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    WBTC: "0x1bfd67037b42cf73acf2047067bd4f2c47d9bfd6",
  },
  "56": {
    // BSC
    BNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", // WBNB
    WBNB: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
    USDT: "0x55d398326f99059fF775485246999027B3197955",
    BUSD: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
    ETH: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
    BTCB: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
  },
  "42161": {
    // Arbitrum
    ETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH
    WETH: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
    USDC: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8",
    USDT: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    UNI: "0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0",
    LINK: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
    WBTC: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
  },
};

// Supported periods for line charts
export const LINE_CHART_PERIODS = ["24H", "1W", "1M", "1Y", "AllTime"] as const;

// Supported seconds for candle charts
export const CANDLE_CHART_SECONDS = [
  300, 900, 3600, 14400, 86400, 604800,
] as const;

// Interface for line chart data
interface LineChartPoint {
  time: number;
  value: number;
}

interface LineChartResponse {
  data: LineChartPoint[];
}

// Interface for candle chart data
interface CandleChartPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandleChartResponse {
  data: CandleChartPoint[];
}

// Get line chart data for token pair
async function getLineChartData(
  token0: string,
  token1: string,
  period: string,
  chainId: string
): Promise<LineChartResponse> {
  try {
    const url = `${ONEINCH_CHARTS_API_BASE}/chart/line/${token0}/${token1}/${period}/${chainId}`;

    const response = await fetch(url, {
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
      console.error("Line Chart API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Line Chart API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch line chart data:", error);
    throw error;
  }
}

// Get candle chart data for token pair
async function getCandleChartData(
  token0: string,
  token1: string,
  seconds: number,
  chainId: string
): Promise<CandleChartResponse> {
  try {
    const url = `${ONEINCH_CHARTS_API_BASE}/chart/aggregated/candle/${token0}/${token1}/${seconds}/${chainId}`;

    const response = await fetch(url, {
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
      console.error("Candle Chart API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Candle Chart API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch candle chart data:", error);
    throw error;
  }
}

// Helper function to format token display
function formatTokenDisplay(address: string, originalInput: string): string {
  // If the original input was a symbol and we have it in our mapping, show the symbol
  const upperOriginal = originalInput.trim().toUpperCase();
  if (/^[a-zA-Z0-9]{2,10}$/.test(originalInput.trim())) {
    return upperOriginal;
  }

  // Otherwise return the full address
  return address;
}

// Helper function to validate and normalize token identifier
function validateTokenIdentifier(
  token: string,
  chainId: string
): {
  isValid: boolean;
  normalized: string;
  resolvedAddress?: string;
} {
  // Remove any whitespace
  const trimmed = token.trim();

  // Check if it's a valid Ethereum address (0x followed by 40 hex characters)
  if (/^0x[a-fA-F0-9]{40}$/i.test(trimmed)) {
    return { isValid: true, normalized: trimmed.toLowerCase() };
  }

  // Check if it's a token symbol that we can resolve to an address
  const upperSymbol = trimmed.toUpperCase();
  const chainTokens = COMMON_TOKENS[chainId];

  if (chainTokens && chainTokens[upperSymbol]) {
    return {
      isValid: true,
      normalized: chainTokens[upperSymbol].toLowerCase(),
      resolvedAddress: chainTokens[upperSymbol].toLowerCase(),
    };
  }

  // If it's a valid symbol format but we don't have the address, suggest using an address
  if (/^[a-zA-Z0-9]{2,10}$/.test(trimmed)) {
    return {
      isValid: false,
      normalized: trimmed,
    };
  }

  return { isValid: false, normalized: trimmed };
}

// Helper function to format period display
function formatPeriodDisplay(period: string): string {
  const periodMap: Record<string, string> = {
    "24H": "24 Hours",
    "1W": "1 Week",
    "1M": "1 Month",
    "1Y": "1 Year",
    AllTime: "All Time",
  };
  return periodMap[period] || period;
}

// Helper function to format seconds display
function formatSecondsDisplay(seconds: number): string {
  const secondsMap: Record<number, string> = {
    300: "5 minutes",
    900: "15 minutes",
    3600: "1 hour",
    14400: "4 hours",
    86400: "1 day",
    604800: "1 week",
  };
  return secondsMap[seconds] || `${seconds} seconds`;
}

// Helper function to get chain name
function getChainName(chainId: string): string {
  const chainMap: Record<string, string> = {
    "1": "Ethereum",
    "56": "BSC",
    "137": "Polygon",
    "42161": "Arbitrum",
    "43114": "Avalanche",
    "100": "Gnosis",
    "10": "Optimism",
    "8453": "Base",
    "324": "zkSync",
    "59144": "Linea",
    "146": "Flow",
    "130": "Polkadot",
  };
  return chainMap[chainId] || `Chain ${chainId}`;
}

// Create the chart tool
export const chartTool = new DynamicStructuredTool({
  name: "chart_data",
  description:
    "Get historical price chart data (line or candle) for token pairs using 1inch Charts API. Supports token addresses (0x...) and symbols (ETH, USDC, etc.)",
  schema: z.object({
    chartType: z
      .enum(["line", "candle"])
      .describe(
        "Type of chart: 'line' for line chart or 'candle' for candlestick chart"
      ),
    token0: z
      .string()
      .describe("Base token address or symbol (e.g., '0x...' or 'WETH')"),
    token1: z
      .string()
      .describe("Quote token address or symbol (e.g., '0x...' or 'USDC')"),
    chainId: z
      .string()
      .describe("Chain ID (e.g., '1' for Ethereum, '137' for Polygon)"),
    period: z
      .enum(["24H", "1W", "1M", "1Y", "AllTime"])
      .optional()
      .describe("Time period for line chart (required for line charts)"),
    seconds: z
      .number()
      .optional()
      .describe(
        "Time interval in seconds for candle chart: 300(5m), 900(15m), 3600(1h), 14400(4h), 86400(1d), 604800(1w) (required for candle charts)"
      ),
  }),
  func: async ({ chartType, token0, token1, chainId, period, seconds }) => {
    try {
      // Validate chain ID first
      const validChainIds = Object.values(CHARTS_SUPPORTED_CHAINS) as string[];
      if (!validChainIds.includes(chainId)) {
        return {
          error: `Invalid chain ID: ${chainId}. Supported chains: ${validChainIds.join(
            ", "
          )}`,
          chartData: null,
        };
      }

      // Validate and normalize token identifiers
      const token0Validation = validateTokenIdentifier(token0, chainId);
      if (!token0Validation.isValid) {
        const chainTokens = COMMON_TOKENS[chainId];
        const availableSymbols = chainTokens
          ? Object.keys(chainTokens).join(", ")
          : "none available";
        return {
          error: `Invalid token0 identifier: "${token0}". Must be a valid token address (0x...) or supported symbol. Available symbols for chain ${chainId}: ${availableSymbols}`,
          chartData: null,
        };
      }

      const token1Validation = validateTokenIdentifier(token1, chainId);
      if (!token1Validation.isValid) {
        const chainTokens = COMMON_TOKENS[chainId];
        const availableSymbols = chainTokens
          ? Object.keys(chainTokens).join(", ")
          : "none available";
        return {
          error: `Invalid token1 identifier: "${token1}". Must be a valid token address (0x...) or supported symbol. Available symbols for chain ${chainId}: ${availableSymbols}`,
          chartData: null,
        };
      }

      // Use normalized tokens for API calls
      const normalizedToken0 = token0Validation.normalized;
      const normalizedToken1 = token1Validation.normalized;

      const chainName = getChainName(chainId);

      if (chartType === "line") {
        // Validate period for line charts
        if (!period) {
          return {
            error:
              "Period is required for line charts. Supported periods: 24H, 1W, 1M, 1Y, AllTime",
            chartData: null,
          };
        }

        if (!LINE_CHART_PERIODS.includes(period as any)) {
          return {
            error: `Invalid period: ${period}. Supported periods: ${LINE_CHART_PERIODS.join(
              ", "
            )}`,
            chartData: null,
          };
        }

        const chartData = await getLineChartData(
          normalizedToken0,
          normalizedToken1,
          period,
          chainId
        );

        return {
          message:
            `📈 **Line Chart Data Retrieved**\n\n` +
            `**Token Pair:** ${formatTokenDisplay(
              normalizedToken0,
              token0
            )} / ${formatTokenDisplay(normalizedToken1, token1)}\n` +
            `**Chain:** ${chainName}\n` +
            `**Period:** ${formatPeriodDisplay(period)}\n` +
            `**Data Points:** ${chartData.data.length}\n\n` +
            `📊 Chart data has been sent to the client for rendering.`,
          chartData: {
            type: "line",
            data: chartData.data,
            metadata: {
              token0: normalizedToken0,
              token1: normalizedToken1,
              token0Display: formatTokenDisplay(normalizedToken0, token0),
              token1Display: formatTokenDisplay(normalizedToken1, token1),
              period: period,
              chainId: chainId,
              chainName: chainName,
              periodDisplay: formatPeriodDisplay(period),
            },
          },
        };
      } else if (chartType === "candle") {
        // Validate seconds for candle charts
        if (!seconds) {
          return {
            error:
              "Seconds parameter is required for candle charts. Supported: 300, 900, 3600, 14400, 86400, 604800",
            chartData: null,
          };
        }

        if (!CANDLE_CHART_SECONDS.includes(seconds as any)) {
          return {
            error: `Invalid seconds: ${seconds}. Supported seconds: ${CANDLE_CHART_SECONDS.join(
              ", "
            )}`,
            chartData: null,
          };
        }

        const chartData = await getCandleChartData(
          normalizedToken0,
          normalizedToken1,
          seconds,
          chainId
        );

        return {
          message:
            `🕯️ **Candlestick Chart Data Retrieved**\n\n` +
            `**Token Pair:** ${formatTokenDisplay(
              normalizedToken0,
              token0
            )} / ${formatTokenDisplay(normalizedToken1, token1)}\n` +
            `**Chain:** ${chainName}\n` +
            `**Interval:** ${formatSecondsDisplay(seconds)}\n` +
            `**Candles:** ${chartData.data.length}\n\n` +
            `📊 Chart data has been sent to the client for rendering.`,
          chartData: {
            type: "candle",
            data: chartData.data,
            metadata: {
              token0: normalizedToken0,
              token1: normalizedToken1,
              token0Display: formatTokenDisplay(normalizedToken0, token0),
              token1Display: formatTokenDisplay(normalizedToken1, token1),
              seconds: seconds,
              chainId: chainId,
              chainName: chainName,
              intervalDisplay: formatSecondsDisplay(seconds),
            },
          },
        };
      } else {
        return {
          error: "Invalid chart type. Use 'line' or 'candle'.",
          chartData: null,
        };
      }
    } catch (error: any) {
      console.error("Chart tool error:", error);

      if (
        error.message.includes("Line Chart API error") ||
        error.message.includes("Candle Chart API error")
      ) {
        return {
          error: `${error.message}. Please check your API key and try again.`,
          chartData: null,
        };
      }

      return {
        error: `Error fetching chart data: ${error.message}`,
        chartData: null,
      };
    }
  },
});
