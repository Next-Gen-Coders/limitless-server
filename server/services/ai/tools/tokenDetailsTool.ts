import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../../../config/env";

// 1inch Token Details API base URL
const ONEINCH_TOKEN_DETAILS_API_BASE = "https://api.1inch.dev/token-details/v1.0";

// Define supported chains for Token Details API
export const TOKEN_DETAILS_SUPPORTED_CHAINS = {
  ethereum: 1,
  polygon: 137,
  optimism: 10,
  bsc: 56,
  arbitrum: 42161,
  sonic: 146,
  avalanche: 43114,
  gnosis: 100,
  zksync: 324,
  base: 8453,
  linea: 59144,
  unichain: 1301,
} as const;

// Supported intervals for price changes and charts
export const SUPPORTED_INTERVALS = [
  "5m", "10m", "15m", "30m", "50m", "1h", "2h", "3h", "4h", "6h", "12h",
  "24h", "2d", "3d", "7d", "14d", "15d", "30d", "60d", "90d", "365d", "max"
] as const;

// Get token details (for specific token or native token)
async function getTokenDetails(params: {
  chainId: number;
  contractAddress?: string;
  provider?: string;
}) {
  try {
    const url = params.contractAddress
      ? `${ONEINCH_TOKEN_DETAILS_API_BASE}/details/${params.chainId}/${params.contractAddress}`
      : `${ONEINCH_TOKEN_DETAILS_API_BASE}/details/${params.chainId}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
        accept: "application/json",
      },
    });

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.warn(
        `Token details fetch failed: ${response.status} ${response.statusText} - ${errorText}`
      );
      return null;
    }
  } catch (error) {
    console.error("Token details API error:", error);
    return null;
  }
}

// Get historical token prices by time range
async function getHistoricalPricesByRange(params: {
  chainId: number;
  tokenAddress?: string;
  from: number;
  to: number;
  provider?: string;
  from_time?: number;
}) {
  try {
    const url = params.tokenAddress
      ? `${ONEINCH_TOKEN_DETAILS_API_BASE}/charts/range/${params.chainId}/${params.tokenAddress}`
      : `${ONEINCH_TOKEN_DETAILS_API_BASE}/charts/range/${params.chainId}`;

    const queryParams = new URLSearchParams({
      from: params.from.toString(),
      to: params.to.toString(),
    });

    if (params.provider) queryParams.append("provider", params.provider);
    if (params.from_time) queryParams.append("from_time", params.from_time.toString());

    const response = await fetch(`${url}?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
        accept: "application/json",
      },
    });

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.warn(
        `Historical prices by range fetch failed: ${response.status} ${response.statusText} - ${errorText}`
      );
      return null;
    }
  } catch (error) {
    console.error("Historical prices by range API error:", error);
    return null;
  }
}

// Get historical token prices by interval
async function getHistoricalPricesByInterval(params: {
  chainId: number;
  tokenAddress?: string;
  interval: string;
  provider?: string;
  from_time?: number;
}) {
  try {
    const url = params.tokenAddress
      ? `${ONEINCH_TOKEN_DETAILS_API_BASE}/charts/interval/${params.chainId}/${params.tokenAddress}`
      : `${ONEINCH_TOKEN_DETAILS_API_BASE}/charts/interval/${params.chainId}`;

    const queryParams = new URLSearchParams({
      interval: params.interval,
    });

    if (params.provider) queryParams.append("provider", params.provider);
    if (params.from_time) queryParams.append("from_time", params.from_time.toString());

    const response = await fetch(`${url}?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
        accept: "application/json",
      },
    });

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.warn(
        `Historical prices by interval fetch failed: ${response.status} ${response.statusText} - ${errorText}`
      );
      return null;
    }
  } catch (error) {
    console.error("Historical prices by interval API error:", error);
    return null;
  }
}

// Get token price change
async function getTokenPriceChange(params: {
  chainId: number;
  tokenAddress?: string;
  interval: string;
}) {
  try {
    const url = params.tokenAddress
      ? `${ONEINCH_TOKEN_DETAILS_API_BASE}/prices/change/${params.chainId}/${params.tokenAddress}`
      : `${ONEINCH_TOKEN_DETAILS_API_BASE}/prices/change/${params.chainId}`;

    const queryParams = new URLSearchParams({
      interval: params.interval,
    });

    const response = await fetch(`${url}?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
        accept: "application/json",
      },
    });

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.warn(
        `Token price change fetch failed: ${response.status} ${response.statusText} - ${errorText}`
      );
      return null;
    }
  } catch (error) {
    console.error("Token price change API error:", error);
    return null;
  }
}

// Get multiple tokens price changes
async function getMultipleTokensPriceChange(params: {
  chainId: number;
  tokenAddresses: string[];
  interval: string;
}) {
  try {
    const url = `${ONEINCH_TOKEN_DETAILS_API_BASE}/prices/change/${params.chainId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        tokenAddresses: params.tokenAddresses,
        interval: params.interval,
      }),
    });

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.warn(
        `Multiple tokens price change fetch failed: ${response.status} ${response.statusText} - ${errorText}`
      );
      return null;
    }
  } catch (error) {
    console.error("Multiple tokens price change API error:", error);
    return null;
  }
}

// Helper function to format token details
function formatTokenDetails(data: any, chainName: string, tokenType: string) {
  if (!data || !data.assets) {
    return "❌ No token details found";
  }

  const { assets, details } = data;
  
  let result = `📊 **${tokenType} Token Details** (${chainName})\n\n`;
  
  if (assets.name) result += `**Name:** ${assets.name}\n`;
  if (assets.website) result += `**Website:** ${assets.website}\n`;
  if (assets.description) result += `**Description:** ${assets.description}\n`;
  if (assets.shortDescription) result += `**Short Description:** ${assets.shortDescription}\n`;
  if (assets.explorer) result += `**Explorer:** ${assets.explorer}\n`;
  if (assets.sourceCode) result += `**Source Code:** ${assets.sourceCode}\n`;
  if (assets.whitePaper) result += `**White Paper:** ${assets.whitePaper}\n`;
  if (assets.research) result += `**Research:** ${assets.research}\n`;

  if (assets.social_links && assets.social_links.length > 0) {
    result += `\n**Social Links:**\n`;
    assets.social_links.forEach((link: any) => {
      result += `- **${link.name}:** ${link.url}${link.handle ? ` (@${link.handle})` : ''}\n`;
    });
  }

  if (details) {
    result += `\n**Market Data:**\n`;
    if (details.provider) result += `**Provider:** ${details.provider}\n`;
    if (details.providerURL) result += `**Provider URL:** ${details.providerURL}\n`;
    if (details.vol24 !== undefined) result += `**24h Volume:** $${details.vol24.toLocaleString()}\n`;
    if (details.marketCap !== undefined) result += `**Market Cap:** $${details.marketCap.toLocaleString()}\n`;
    if (details.circulatingSupply !== undefined) result += `**Circulating Supply:** ${details.circulatingSupply.toLocaleString()}\n`;
    if (details.totalSupply !== undefined) result += `**Total Supply:** ${details.totalSupply.toLocaleString()}\n`;
  }

  return result.trim();
}

// Helper function to format price change data
function formatPriceChange(data: any, tokenName: string, interval: string) {
  if (!data) return "❌ No price change data found";

  let result = `📈 **Price Change** (${tokenName} - ${interval})\n\n`;
  result += `**USD Change:** $${data.inUSD?.toLocaleString() || 'N/A'}\n`;
  result += `**Percentage Change:** ${data.inPercent !== undefined ? (data.inPercent > 0 ? '+' : '') + data.inPercent.toFixed(2) + '%' : 'N/A'}\n`;

  return result;
}

// Helper function to format historical price data
function formatHistoricalPrices(data: any, tokenName: string, timeframe: string) {
  if (!data || !data.d || data.d.length === 0) {
    return "❌ No historical price data found";
  }

  let result = `📊 **Historical Prices** (${tokenName} - ${timeframe})\n\n`;
  result += `**Data Points:** ${data.d.length}\n`;
  
  // Show first and last data points
  const firstPoint = data.d[0];
  const lastPoint = data.d[data.d.length - 1];
  
  if (firstPoint) {
    const firstDate = new Date(firstPoint.t * 1000).toLocaleDateString();
    result += `**First Data Point:** ${firstDate} - $${firstPoint.p}\n`;
  }
  
  if (lastPoint) {
    const lastDate = new Date(lastPoint.t * 1000).toLocaleDateString();
    result += `**Last Data Point:** ${lastDate} - $${lastPoint.p}\n`;
  }

  // Calculate price change if we have both points
  if (firstPoint && lastPoint) {
    const priceChange = ((parseFloat(lastPoint.p) - parseFloat(firstPoint.p)) / parseFloat(firstPoint.p)) * 100;
    result += `**Total Change:** ${priceChange > 0 ? '+' : ''}${priceChange.toFixed(2)}%\n`;
  }

  return result;
}

// Helper function to get chain name
function getChainName(chainId: number): string {
  const chainEntry = Object.entries(TOKEN_DETAILS_SUPPORTED_CHAINS).find(
    ([, id]) => id === chainId
  );
  return chainEntry ? chainEntry[0].charAt(0).toUpperCase() + chainEntry[0].slice(1) : `Chain ${chainId}`;
}

export const tokenDetailsTool = new DynamicStructuredTool({
  name: "token_details",
  description: `Get comprehensive token details, historical price data, and price changes using the 1inch Token Details API. 
  This tool provides in-depth token information including metadata, social links, market data, historical price charts, and price change analytics.
  
  Capabilities:
  - Get detailed token information (name, description, social links, market data)
  - Retrieve historical price data by time range or intervals
  - Get price change information for any supported interval
  - Support for both native chain tokens and specific token contracts
  - Bulk price change analysis for multiple tokens
  
  Supported chains: Ethereum, Polygon, Optimism, BNB Chain, Arbitrum, Sonic, Avalanche, Gnosis, zkSync Era, Base, Linea, Unichain`,

  schema: z.object({
    operation: z.enum([
      "get_details",
      "get_historical_range", 
      "get_historical_interval",
      "get_price_change",
      "get_multiple_price_changes"
    ]).describe("The operation to perform"),
    
    chain: z.enum([
      "ethereum", "polygon", "optimism", "bsc", "arbitrum", 
      "sonic", "avalanche", "gnosis", "zksync", "base", "linea", "unichain"
    ]).describe("The blockchain network"),
    
    tokenAddress: z.string().optional().describe("Token contract address (optional for native token operations)"),
    
    // For historical price range queries
    from: z.number().optional().describe("Unix timestamp for start time (required for get_historical_range)"),
    to: z.number().optional().describe("Unix timestamp for end time (required for get_historical_range)"),
    
    // For interval-based queries
    interval: z.enum([
      "5m", "10m", "15m", "30m", "50m", "1h", "2h", "3h", "4h", "6h", "12h",
      "24h", "2d", "3d", "7d", "14d", "15d", "30d", "60d", "90d", "365d", "max"
    ]).optional().describe("Time interval for price data or price changes"),
    
    // For multiple token price changes
    tokenAddresses: z.array(z.string()).optional().describe("Array of token addresses for bulk price change analysis"),
    
    // Optional parameters
    provider: z.string().optional().describe("Chart provider name (optional)"),
    from_time: z.number().optional().describe("From time for chart data (optional)")
  }),

  func: async (args) => {
    try {
      const chainId = TOKEN_DETAILS_SUPPORTED_CHAINS[args.chain as keyof typeof TOKEN_DETAILS_SUPPORTED_CHAINS];
      if (!chainId) {
        return `❌ Unsupported chain: ${args.chain}. Supported chains: ${Object.keys(TOKEN_DETAILS_SUPPORTED_CHAINS).join(", ")}`;
      }

      const chainName = getChainName(chainId);

      switch (args.operation) {
        case "get_details": {
          const data = await getTokenDetails({
            chainId,
            contractAddress: args.tokenAddress,
            provider: args.provider,
          });

          if (!data) {
            return `❌ Failed to fetch token details for ${args.tokenAddress ? args.tokenAddress : 'native token'} on ${chainName}`;
          }

          const tokenType = args.tokenAddress ? "Contract" : "Native";
          return formatTokenDetails(data, chainName, tokenType);
        }

        case "get_historical_range": {
          if (!args.from || !args.to) {
            return "❌ Both 'from' and 'to' timestamps are required for historical range queries";
          }

          const data = await getHistoricalPricesByRange({
            chainId,
            tokenAddress: args.tokenAddress,
            from: args.from,
            to: args.to,
            provider: args.provider,
            from_time: args.from_time,
          });

          if (!data) {
            return `❌ Failed to fetch historical price data for ${args.tokenAddress || 'native token'} on ${chainName}`;
          }

          const tokenName = args.tokenAddress || `${chainName} Native Token`;
          const timeframe = `${new Date(args.from * 1000).toLocaleDateString()} to ${new Date(args.to * 1000).toLocaleDateString()}`;
          return formatHistoricalPrices(data, tokenName, timeframe);
        }

        case "get_historical_interval": {
          if (!args.interval) {
            return "❌ 'interval' is required for historical interval queries";
          }

          const data = await getHistoricalPricesByInterval({
            chainId,
            tokenAddress: args.tokenAddress,
            interval: args.interval,
            provider: args.provider,
            from_time: args.from_time,
          });

          if (!data) {
            return `❌ Failed to fetch historical price data for ${args.tokenAddress || 'native token'} on ${chainName}`;
          }

          const tokenName = args.tokenAddress || `${chainName} Native Token`;
          return formatHistoricalPrices(data, tokenName, args.interval);
        }

        case "get_price_change": {
          if (!args.interval) {
            return "❌ 'interval' is required for price change queries";
          }

          const data = await getTokenPriceChange({
            chainId,
            tokenAddress: args.tokenAddress,
            interval: args.interval,
          });

          if (!data) {
            return `❌ Failed to fetch price change data for ${args.tokenAddress || 'native token'} on ${chainName}`;
          }

          const tokenName = args.tokenAddress || `${chainName} Native Token`;
          return formatPriceChange(data, tokenName, args.interval);
        }

        case "get_multiple_price_changes": {
          if (!args.tokenAddresses || args.tokenAddresses.length === 0) {
            return "❌ 'tokenAddresses' array is required for multiple token price changes";
          }

          if (!args.interval) {
            return "❌ 'interval' is required for price change queries";
          }

          const data = await getMultipleTokensPriceChange({
            chainId,
            tokenAddresses: args.tokenAddresses,
            interval: args.interval,
          });

          if (!data || !Array.isArray(data)) {
            return `❌ Failed to fetch price change data for multiple tokens on ${chainName}`;
          }

          let result = `📈 **Multiple Tokens Price Changes** (${chainName} - ${args.interval})\n\n`;
          data.forEach((tokenData: any) => {
            result += `**${tokenData.tokenAddress}:**\n`;
            result += `  - USD Change: $${tokenData.inUSD?.toLocaleString() || 'N/A'}\n`;
            result += `  - Percentage Change: ${tokenData.inPercent !== undefined ? (tokenData.inPercent > 0 ? '+' : '') + tokenData.inPercent.toFixed(2) + '%' : 'N/A'}\n\n`;
          });

          return result.trim();
        }

        default:
          return `❌ Unknown operation: ${args.operation}`;
      }
    } catch (error: any) {
      console.error("Token details tool error:", error);
      return `❌ Error executing token details operation: ${error.message}`;
    }
  },
});