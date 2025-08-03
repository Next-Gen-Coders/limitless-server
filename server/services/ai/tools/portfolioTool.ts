import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../../../config/env";

// 1inch Portfolio API base URL
const ONEINCH_PORTFOLIO_API_BASE = "https://api.1inch.dev/portfolio/portfolio/v5.0";

// Supported chains for portfolio API
export const PORTFOLIO_SUPPORTED_CHAINS = {
  ethereum: 1,
  arbitrum: 42161,
  bnb: 56,
  gnosis: 100,
  optimism: 10,
  sonic: 146,
  polygon: 137,
  base: 8453,
  zksync: 324,
  linea: 59144,
  avalanche: 43114,
  unichain: 1301,
} as const;

// Helper function to validate wallet addresses
function validateWalletAddresses(addresses: string[]): string[] {
  return addresses.filter(address => !/^0x[a-fA-F0-9]{40}$/.test(address));
}

// Helper function to format currency values
function formatUsdValue(value: number): string {
  if (value === 0) return "$0.00";
  if (value < 0.01) return `$${value.toExponential(2)}`;
  if (value < 1000) return `$${value.toFixed(2)}`;
  if (value < 1000000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${(value / 1000000).toFixed(2)}M`;
}

// Helper function to format percentage values
function formatPercentage(value: number): string {
  if (value === 0) return "0.00%";
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

// Check if portfolio service is available
async function checkPortfolioStatus(): Promise<{ isAvailable: boolean; error?: string }> {
  try {
    const response = await fetch(`${ONEINCH_PORTFOLIO_API_BASE}/general/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
        accept: "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { isAvailable: data.result?.is_available || false };
    } else {
      const errorText = await response.text();
      return { isAvailable: false, error: `API error: ${response.status} ${response.statusText} - ${errorText}` };
    }
  } catch (error: any) {
    return { isAvailable: false, error: error.message };
  }
}

// Get supported chains
async function getSupportedChains(): Promise<any> {
  try {
    const response = await fetch(`${ONEINCH_PORTFOLIO_API_BASE}/general/supported_chains`, {
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
      throw new Error(`Supported chains API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error: any) {
    throw error;
  }
}

// Get supported protocols
async function getSupportedProtocols(): Promise<any> {
  try {
    const response = await fetch(`${ONEINCH_PORTFOLIO_API_BASE}/general/supported_protocols`, {
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
      throw new Error(`Supported protocols API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error: any) {
    throw error;
  }
}

// Get current portfolio value breakdown
async function getCurrentValue(addresses: string[], chainId?: number): Promise<any> {
  try {
    const url = new URL(`${ONEINCH_PORTFOLIO_API_BASE}/general/current_value`);
    addresses.forEach(address => url.searchParams.append('addresses', address));
    if (chainId) {
      url.searchParams.append('chain_id', chainId.toString());
    }
    url.searchParams.append('use_cache', 'true');

    const response = await fetch(url.toString(), {
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
      throw new Error(`Current value API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error: any) {
    throw error;
  }
}

// Get portfolio value chart
async function getPortfolioChart(addresses: string[], chainId?: number, timerange?: string): Promise<any> {
  try {
    const url = new URL(`${ONEINCH_PORTFOLIO_API_BASE}/general/chart`);
    addresses.forEach(address => url.searchParams.append('addresses', address));
    if (chainId) {
      url.searchParams.append('chain_id', chainId.toString());
    }
    if (timerange) {
      url.searchParams.append('timerange', timerange);
    }
    url.searchParams.append('use_cache', 'true');

    const response = await fetch(url.toString(), {
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
      throw new Error(`Portfolio chart API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error: any) {
    throw error;
  }
}

// Get portfolio report (CSV)
async function getPortfolioReport(addresses: string[], chainId?: number): Promise<any> {
  try {
    const url = new URL(`${ONEINCH_PORTFOLIO_API_BASE}/general/report`);
    addresses.forEach(address => url.searchParams.append('addresses', address));
    if (chainId) {
      url.searchParams.append('chain_id', chainId.toString());
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
        accept: "application/json",
      },
    });

    if (response.ok) {
      return response.text(); // CSV format
    } else {
      const errorText = await response.text();
      throw new Error(`Portfolio report API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error: any) {
    throw error;
  }
}

// Get protocols snapshot
async function getProtocolsSnapshot(addresses: string[], chainId?: number, timestamp?: number): Promise<any> {
  try {
    const url = new URL(`${ONEINCH_PORTFOLIO_API_BASE}/protocols/snapshot`);
    addresses.forEach(address => url.searchParams.append('addresses', address));
    if (chainId) {
      url.searchParams.append('chain_id', chainId.toString());
    }
    if (timestamp) {
      url.searchParams.append('timestamp', timestamp.toString());
    }

    const response = await fetch(url.toString(), {
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
      throw new Error(`Protocols snapshot API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error: any) {
    throw error;
  }
}

// Get protocols metrics
async function getProtocolsMetrics(addresses: string[], chainId?: number, protocolGroupId?: string, contractAddress?: string, tokenId?: number): Promise<any> {
  try {
    const url = new URL(`${ONEINCH_PORTFOLIO_API_BASE}/protocols/metrics`);
    addresses.forEach(address => url.searchParams.append('addresses', address));
    if (chainId) {
      url.searchParams.append('chain_id', chainId.toString());
    }
    if (protocolGroupId) {
      url.searchParams.append('protocol_group_id', protocolGroupId);
    }
    if (contractAddress) {
      url.searchParams.append('contract_address', contractAddress);
    }
    if (tokenId) {
      url.searchParams.append('token_id', tokenId.toString());
    }
    url.searchParams.append('use_cache', 'true');

    const response = await fetch(url.toString(), {
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
      throw new Error(`Protocols metrics API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error: any) {
    throw error;
  }
}

// Get tokens snapshot
async function getTokensSnapshot(addresses: string[], chainId?: number, timestamp?: number): Promise<any> {
  try {
    const url = new URL(`${ONEINCH_PORTFOLIO_API_BASE}/tokens/snapshot`);
    addresses.forEach(address => url.searchParams.append('addresses', address));
    if (chainId) {
      url.searchParams.append('chain_id', chainId.toString());
    }
    if (timestamp) {
      url.searchParams.append('timestamp', timestamp.toString());
    }

    const response = await fetch(url.toString(), {
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
      throw new Error(`Tokens snapshot API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error: any) {
    throw error;
  }
}

// Get tokens metrics
async function getTokensMetrics(addresses: string[], chainId?: number, timerange?: string): Promise<any> {
  try {
    const url = new URL(`${ONEINCH_PORTFOLIO_API_BASE}/tokens/metrics`);
    addresses.forEach(address => url.searchParams.append('addresses', address));
    if (chainId) {
      url.searchParams.append('chain_id', chainId.toString());
    }
    if (timerange) {
      url.searchParams.append('timerange', timerange);
    }
    url.searchParams.append('use_cache', 'true');

    const response = await fetch(url.toString(), {
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
      throw new Error(`Tokens metrics API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error: any) {
    throw error;
  }
}

// Format current value response
function formatCurrentValue(data: any, addresses: string[]): string {
  let result = `💼 **Portfolio Current Value Analysis**\n\n`;
  
  if (!data.result) {
    return `❌ **Error:** No portfolio data available for the provided addresses.`;
  }

  const portfolio = data.result;
  result += `**Total Portfolio Value:** ${formatUsdValue(portfolio.total)}\n\n`;

  // Format by address breakdown
  if (portfolio.by_address && portfolio.by_address.length > 0) {
    result += `## 📊 **Breakdown by Address**\n\n`;
    portfolio.by_address.forEach((addressData: any, index: number) => {
      result += `**${index + 1}. Address:** ${addressData.address}\n`;
      result += `   **Value:** ${formatUsdValue(addressData.value_usd)}\n`;
      result += `   **% of Total:** ${((addressData.value_usd / portfolio.total) * 100).toFixed(2)}%\n\n`;
    });
  }

  // Format by chain breakdown
  if (portfolio.by_chain && portfolio.by_chain.length > 0) {
    result += `## 🔗 **Breakdown by Chain**\n\n`;
    portfolio.by_chain.forEach((chainData: any, index: number) => {
      result += `**${index + 1}. ${chainData.chain_name} (${chainData.chain_id})**\n`;
      result += `   **Value:** ${formatUsdValue(chainData.value_usd)}\n`;
      result += `   **% of Total:** ${((chainData.value_usd / portfolio.total) * 100).toFixed(2)}%\n\n`;
    });
  }

  // Format by category breakdown
  if (portfolio.by_category && portfolio.by_category.length > 0) {
    result += `## 🏷️ **Breakdown by Category**\n\n`;
    portfolio.by_category.forEach((categoryData: any, index: number) => {
      result += `**${index + 1}. ${categoryData.category_name}**\n`;
      result += `   **Value:** ${formatUsdValue(categoryData.value_usd)}\n`;
      result += `   **% of Total:** ${((categoryData.value_usd / portfolio.total) * 100).toFixed(2)}%\n\n`;
    });
  }

  // Format by protocol breakdown
  if (portfolio.by_protocol_group && portfolio.by_protocol_group.length > 0) {
    result += `## 🛠️ **Breakdown by Protocol**\n\n`;
    portfolio.by_protocol_group.forEach((protocolData: any, index: number) => {
      result += `**${index + 1}. ${protocolData.protocol_group_name}**\n`;
      result += `   **Value:** ${formatUsdValue(protocolData.value_usd)}\n`;
      result += `   **% of Total:** ${((protocolData.value_usd / portfolio.total) * 100).toFixed(2)}%\n\n`;
    });
  }

  result += `\n⏰ **Note:** Portfolio values are real-time and may change with market movements and new transactions.`;
  return result;
}

// Format protocols metrics
function formatProtocolsMetrics(data: any): string {
  let result = `🛠️ **DeFi Protocols Performance Analysis**\n\n`;

  if (!data.result || data.result.length === 0) {
    return `📭 **No DeFi protocol positions found for the provided addresses.**`;
  }

  data.result.forEach((protocol: any, index: number) => {
    result += `## **${index + 1}. Protocol Position**\n\n`;
    result += `**Index ID:** ${protocol.index}\n`;
    
    if (protocol.profit_abs_usd !== null) {
      result += `**Profit/Loss:** ${formatUsdValue(protocol.profit_abs_usd)} ${protocol.profit_abs_usd >= 0 ? '📈' : '📉'}\n`;
    }
    
    if (protocol.roi !== null) {
      result += `**ROI:** ${formatPercentage(protocol.roi)}\n`;
    }
    
    if (protocol.weighted_apr !== null) {
      result += `**Weighted APR:** ${formatPercentage(protocol.weighted_apr)}\n`;
    }
    
    if (protocol.holding_time_days !== null) {
      result += `**Holding Time:** ${protocol.holding_time_days} days\n`;
    }

    // Rewards information
    if (protocol.rewards_tokens && protocol.rewards_tokens.length > 0) {
      result += `\n**🎁 Reward Tokens:**\n`;
      protocol.rewards_tokens.forEach((reward: any) => {
        result += `   - **${reward.symbol || 'Unknown'}:** ${reward.amount.toFixed(6)}\n`;
        if (reward.price_usd) {
          result += `     - **USD Value:** ${formatUsdValue(reward.amount * reward.price_usd)}\n`;
        }
      });
    }

    if (protocol.rewards_usd !== null) {
      result += `**Total Rewards Value:** ${formatUsdValue(protocol.rewards_usd)}\n`;
    }

    // Fees information
    if (protocol.claimed_fees && protocol.claimed_fees.length > 0) {
      result += `\n**💰 Claimed Fees:**\n`;
      protocol.claimed_fees.forEach((fee: any) => {
        result += `   - **${fee.symbol || 'Unknown'}:** ${fee.amount.toFixed(6)}\n`;
      });
    }

    if (protocol.claimed_fees_usd !== null) {
      result += `**Total Claimed Fees Value:** ${formatUsdValue(protocol.claimed_fees_usd)}\n`;
    }

    if (protocol.unclaimed_fees && protocol.unclaimed_fees.length > 0) {
      result += `\n**🔓 Unclaimed Fees:**\n`;
      protocol.unclaimed_fees.forEach((fee: any) => {
        result += `   - **${fee.symbol || 'Unknown'}:** ${fee.amount.toFixed(6)}\n`;
      });
    }

    if (protocol.unclaimed_fees_usd !== null) {
      result += `**Total Unclaimed Fees Value:** ${formatUsdValue(protocol.unclaimed_fees_usd)}\n`;
    }

    // Impermanent loss
    if (protocol.impermanent_loss_usd !== null) {
      result += `**Impermanent Loss:** ${formatUsdValue(Math.abs(protocol.impermanent_loss_usd))} ${protocol.impermanent_loss_usd < 0 ? '⚠️' : ''}\n`;
    }

    result += `\n---\n\n`;
  });

  return result;
}

// Format tokens metrics
function formatTokensMetrics(data: any): string {
  let result = `🪙 **Token Holdings Performance Analysis**\n\n`;

  if (!data.result || data.result.length === 0) {
    return `📭 **No token holdings found for the provided addresses.**`;
  }

  data.result.forEach((token: any, index: number) => {
    result += `## **${index + 1}. Token Position**\n\n`;
    result += `**Index ID:** ${token.index}\n`;
    
    if (token.profit_abs_usd !== null) {
      result += `**Profit/Loss:** ${formatUsdValue(token.profit_abs_usd)} ${token.profit_abs_usd >= 0 ? '📈' : '📉'}\n`;
    }
    
    if (token.roi !== null) {
      result += `**ROI:** ${formatPercentage(token.roi)}\n`;
    }
    
    if (token.holding_time_days !== null) {
      result += `**Holding Time:** ${token.holding_time_days} days\n`;
    }

    result += `\n---\n\n`;
  });

  return result;
}

// Format supported chains
function formatSupportedChains(chains: any[]): string {
  let result = `🔗 **Supported Blockchain Networks**\n\n`;

  chains.forEach((chain: any, index: number) => {
    result += `**${index + 1}. ${chain.chain_name}**\n`;
    result += `   - **Chain ID:** ${chain.chain_id}\n`;
    result += `   - **Native Token:** ${chain.native_token.symbol || 'Unknown'}\n`;
    if (chain.chain_icon) {
      result += `   - **Icon:** ${chain.chain_icon}\n\n![${chain.chain_name} Icon](${chain.chain_icon})\n`;
    }
    result += `\n`;
  });

  return result;
}

// Format supported protocols
function formatSupportedProtocols(data: any): string {
  let result = `🛠️ **Supported DeFi Protocols**\n\n`;

  if (!data.result || data.result.length === 0) {
    return `📭 **No supported protocols information available.**`;
  }

  // Group by chain
  const protocolsByChain: Record<number, any[]> = {};
  data.result.forEach((protocol: any) => {
    if (!protocolsByChain[protocol.chain_id]) {
      protocolsByChain[protocol.chain_id] = [];
    }
    protocolsByChain[protocol.chain_id].push(protocol);
  });

  Object.entries(protocolsByChain).forEach(([chainId, protocols]) => {
    const chainName = protocols[0]?.protocol_group_name ? 
      Object.keys(PORTFOLIO_SUPPORTED_CHAINS).find(key => 
        PORTFOLIO_SUPPORTED_CHAINS[key as keyof typeof PORTFOLIO_SUPPORTED_CHAINS] === parseInt(chainId)
      ) || `Chain ${chainId}` : `Chain ${chainId}`;
    
    result += `## **${chainName.toUpperCase()} (${chainId})**\n\n`;
    
    protocols.forEach((protocol: any, index: number) => {
      result += `**${index + 1}. ${protocol.protocol_group_name}**\n`;
      result += `   - **ID:** ${protocol.protocol_group_id}\n`;
      if (protocol.protocol_group_icon) {
        result += `   - **Icon:** ${protocol.protocol_group_icon}\n\n![${protocol.protocol_group_name} Icon](${protocol.protocol_group_icon})\n`;
      }
      result += `\n`;
    });
  });

  return result;
}

// Create the portfolio tool
export const portfolioTool = new DynamicStructuredTool({
  name: "portfolio_analysis",
  description: `
    The portfolioTool provides comprehensive portfolio analysis and management capabilities using the 1inch Portfolio API. This tool aggregates and presents detailed information for web3 assets across multiple wallets and blockchain networks. It should be called for:

    **Key Capabilities:**
    - Multi-wallet portfolio tracking across supported blockchains
    - Real-time portfolio value breakdown by address, chain, category, and protocol
    - DeFi protocol performance analysis with profit/loss tracking
    - Token holdings performance metrics and ROI calculation
    - Historical portfolio value charts and trends
    - Comprehensive portfolio reports and analytics
    - Fee tracking (claimed and unclaimed) for DeFi positions
    - Impermanent loss calculations for liquidity positions

    **Supported Networks:**
    - Ethereum Mainnet, Arbitrum, BNB Chain, Gnosis, Optimism, Sonic, Polygon, Base, zkSync Era, Linea, Avalanche, Unichain

    **When to Use:**
    - User requests portfolio analysis or overview
    - User wants to track DeFi protocol performance
    - User asks for profit/loss calculations
    - User needs portfolio value breakdown
    - User wants to analyze token holding performance
    - User requests portfolio charts or historical data
    - User asks about supported chains or protocols
    - User wants comprehensive portfolio reports

    **Example Triggers:**
    - "Analyze my portfolio performance"
    - "Show me my DeFi protocol returns"
    - "What's my total portfolio value across all chains?"
    - "Track profit and loss for my positions"
    - "Show me portfolio breakdown by protocol"
    - "Get portfolio chart for the last month"
    - "What protocols are supported on Ethereum?"
  `,
  schema: z.object({
    operation: z
      .enum([
        "status",
        "supported_chains", 
        "supported_protocols",
        "current_value",
        "portfolio_chart",
        "portfolio_report", 
        "protocols_snapshot",
        "protocols_metrics",
        "tokens_snapshot",
        "tokens_metrics"
      ])
      .describe(
        "Operation to perform: 'status' to check service availability, 'supported_chains' for supported networks, 'supported_protocols' for available protocols, 'current_value' for portfolio value breakdown, 'portfolio_chart' for historical charts, 'portfolio_report' for CSV reports, 'protocols_snapshot' for protocol positions, 'protocols_metrics' for protocol performance, 'tokens_snapshot' for token positions, 'tokens_metrics' for token performance"
      ),
    addresses: z
      .array(z.string())
      .optional()
      .describe(
        "Array of wallet addresses to analyze (required for most operations). Each must be a valid Ethereum address"
      ),
    chainId: z
      .number()
      .optional()
      .describe(
        "Specific chain ID to analyze (optional). If not provided, analyzes all supported chains"
      ),
    timerange: z
      .string()
      .optional()
      .describe(
        "Time range for charts and metrics (e.g., '1year', '6months', '3months', '1month'). Only used for chart and metrics operations"
      ),
    timestamp: z
      .number()
      .optional()
      .describe(
        "Specific timestamp for snapshot operations (optional). Unix timestamp"
      ),
    protocolGroupId: z
      .string()
      .optional()
      .describe(
        "Specific protocol group ID to filter metrics (optional)"
      ),
    contractAddress: z
      .string()
      .optional()
      .describe(
        "Specific contract address to filter metrics (optional)"
      ),
    tokenId: z
      .number()
      .optional()
      .describe(
        "Specific token ID to filter metrics (optional)"
      ),
  }),
  func: async ({
    operation,
    addresses = [],
    chainId,
    timerange,
    timestamp,
    protocolGroupId,
    contractAddress,
    tokenId,
  }) => {
    try {
      switch (operation) {
        case "status": {
          const status = await checkPortfolioStatus();
          if (status.isAvailable) {
            return `✅ **Portfolio Service Status**: Available and operational\n\nThe 1inch Portfolio API is currently available and ready to process requests.`;
          } else {
            return `❌ **Portfolio Service Status**: Unavailable\n\n**Error**: ${status.error || 'Service is currently not available'}`;
          }
        }

        case "supported_chains": {
          const chains = await getSupportedChains();
          return formatSupportedChains(chains);
        }

        case "supported_protocols": {
          const protocols = await getSupportedProtocols();
          return formatSupportedProtocols(protocols);
        }

        case "current_value": {
          if (!addresses || addresses.length === 0) {
            return "Error: Wallet addresses are required for portfolio value analysis.";
          }

          const invalidAddresses = validateWalletAddresses(addresses);
          if (invalidAddresses.length > 0) {
            return `Error: Invalid wallet address(es): ${invalidAddresses.join(", ")}. All addresses must be valid Ethereum addresses.`;
          }

          const currentValue = await getCurrentValue(addresses, chainId);
          return formatCurrentValue(currentValue, addresses);
        }

        case "portfolio_chart": {
          if (!addresses || addresses.length === 0) {
            return "Error: Wallet addresses are required for portfolio chart.";
          }

          const invalidAddresses = validateWalletAddresses(addresses);
          if (invalidAddresses.length > 0) {
            return `Error: Invalid wallet address(es): ${invalidAddresses.join(", ")}. All addresses must be valid Ethereum addresses.`;
          }

          const chartData = await getPortfolioChart(addresses, chainId, timerange);
          
          let result = `📈 **Portfolio Value Chart**\n\n`;
          result += `**Addresses:** ${addresses.join(", ")}\n`;
          if (chainId) {
            const chainName = Object.keys(PORTFOLIO_SUPPORTED_CHAINS).find(key => 
              PORTFOLIO_SUPPORTED_CHAINS[key as keyof typeof PORTFOLIO_SUPPORTED_CHAINS] === chainId
            );
            result += `**Chain:** ${chainName || chainId}\n`;
          }
          if (timerange) {
            result += `**Time Range:** ${timerange}\n`;
          }
          result += `\n`;

          if (chartData.result && chartData.result.length > 0) {
            result += `**Data Points:** ${chartData.result.length}\n\n`;
            
            // Show first and last values for trend
            const firstPoint = chartData.result[0];
            const lastPoint = chartData.result[chartData.result.length - 1];
            const valueChange = lastPoint.value_usd - firstPoint.value_usd;
            const percentChange = (valueChange / firstPoint.value_usd) * 100;
            
            result += `**Starting Value:** ${formatUsdValue(firstPoint.value_usd)}\n`;
            result += `**Current Value:** ${formatUsdValue(lastPoint.value_usd)}\n`;
            result += `**Change:** ${formatUsdValue(Math.abs(valueChange))} (${formatPercentage(percentChange)}) ${valueChange >= 0 ? '📈' : '📉'}\n\n`;

            // Return chart data for rendering
            return {
              content: result,
              chartData: {
                type: 'line',
                data: chartData.result.map((point: any) => ({
                  timestamp: point.timestamp,
                  value: point.value_usd,
                  date: new Date(point.timestamp * 1000).toISOString()
                })),
                title: 'Portfolio Value Over Time',
                yAxisLabel: 'Value (USD)',
                xAxisLabel: 'Time'
              }
            };
          } else {
            result += `📭 **No chart data available for the specified parameters.**`;
            return result;
          }
        }

        case "portfolio_report": {
          if (!addresses || addresses.length === 0) {
            return "Error: Wallet addresses are required for portfolio report.";
          }

          const invalidAddresses = validateWalletAddresses(addresses);
          if (invalidAddresses.length > 0) {
            return `Error: Invalid wallet address(es): ${invalidAddresses.join(", ")}. All addresses must be valid Ethereum addresses.`;
          }

          const report = await getPortfolioReport(addresses, chainId);
          
          let result = `📊 **Portfolio CSV Report**\n\n`;
          result += `**Addresses:** ${addresses.join(", ")}\n`;
          if (chainId) {
            const chainName = Object.keys(PORTFOLIO_SUPPORTED_CHAINS).find(key => 
              PORTFOLIO_SUPPORTED_CHAINS[key as keyof typeof PORTFOLIO_SUPPORTED_CHAINS] === chainId
            );
            result += `**Chain:** ${chainName || chainId}\n`;
          }
          result += `\n**Report Data:**\n\`\`\`csv\n${report}\n\`\`\`\n`;
          result += `\n📥 **Note:** This CSV data can be imported into spreadsheet applications for further analysis.`;
          
          return result;
        }

        case "protocols_snapshot": {
          if (!addresses || addresses.length === 0) {
            return "Error: Wallet addresses are required for protocols snapshot.";
          }

          const invalidAddresses = validateWalletAddresses(addresses);
          if (invalidAddresses.length > 0) {
            return `Error: Invalid wallet address(es): ${invalidAddresses.join(", ")}. All addresses must be valid Ethereum addresses.`;
          }

          const snapshot = await getProtocolsSnapshot(addresses, chainId, timestamp);
          
          let result = `📸 **DeFi Protocols Snapshot**\n\n`;
          result += `**Addresses:** ${addresses.join(", ")}\n`;
          if (chainId) {
            const chainName = Object.keys(PORTFOLIO_SUPPORTED_CHAINS).find(key => 
              PORTFOLIO_SUPPORTED_CHAINS[key as keyof typeof PORTFOLIO_SUPPORTED_CHAINS] === chainId
            );
            result += `**Chain:** ${chainName || chainId}\n`;
          }
          if (timestamp) {
            result += `**Snapshot Time:** ${new Date(timestamp * 1000).toISOString()}\n`;
          }
          result += `\n`;

          if (snapshot.result && snapshot.result.length > 0) {
            result += `**Protocol Positions Found:** ${snapshot.result.length}\n\n`;
            
            snapshot.result.forEach((position: any, index: number) => {
              result += `## **${index + 1}. ${position.protocol_group_name}**\n\n`;
              result += `**Contract:** ${position.contract_name} (${position.contract_symbol})\n`;
              result += `**Address:** ${position.contract_address}\n`;
              result += `**Chain:** ${position.chain_id}\n`;
              result += `**Value:** ${formatUsdValue(position.value_usd)}\n`;
              result += `**Status:** ${position.status === 1 ? 'Active ✅' : position.status === 0 ? 'Inactive ⏸️' : 'Closed ❌'}\n`;
              
              if (position.underlying_tokens && position.underlying_tokens.length > 0) {
                result += `\n**Underlying Tokens:**\n`;
                position.underlying_tokens.forEach((token: any) => {
                  result += `   - **${token.symbol || 'Unknown'}:** ${token.amount.toFixed(6)}\n`;
                  if (token.price_usd) {
                    result += `     - **USD Value:** ${formatUsdValue(token.amount * token.price_usd)}\n`;
                  }
                });
              }

              if (position.reward_tokens && position.reward_tokens.length > 0) {
                result += `\n**Reward Tokens:**\n`;
                position.reward_tokens.forEach((token: any) => {
                  result += `   - **${token.symbol || 'Unknown'}:** ${token.amount.toFixed(6)}\n`;
                  if (token.price_usd) {
                    result += `     - **USD Value:** ${formatUsdValue(token.amount * token.price_usd)}\n`;
                  }
                });
              }

              result += `\n---\n\n`;
            });
          } else {
            result += `📭 **No protocol positions found for the specified parameters.**`;
          }

          return result;
        }

        case "protocols_metrics": {
          if (!addresses || addresses.length === 0) {
            return "Error: Wallet addresses are required for protocols metrics.";
          }

          const invalidAddresses = validateWalletAddresses(addresses);
          if (invalidAddresses.length > 0) {
            return `Error: Invalid wallet address(es): ${invalidAddresses.join(", ")}. All addresses must be valid Ethereum addresses.`;
          }

          const metrics = await getProtocolsMetrics(addresses, chainId, protocolGroupId, contractAddress, tokenId);
          return formatProtocolsMetrics(metrics);
        }

        case "tokens_snapshot": {
          if (!addresses || addresses.length === 0) {
            return "Error: Wallet addresses are required for tokens snapshot.";
          }

          const invalidAddresses = validateWalletAddresses(addresses);
          if (invalidAddresses.length > 0) {
            return `Error: Invalid wallet address(es): ${invalidAddresses.join(", ")}. All addresses must be valid Ethereum addresses.`;
          }

          const snapshot = await getTokensSnapshot(addresses, chainId, timestamp);
          
          let result = `📸 **Token Holdings Snapshot**\n\n`;
          result += `**Addresses:** ${addresses.join(", ")}\n`;
          if (chainId) {
            const chainName = Object.keys(PORTFOLIO_SUPPORTED_CHAINS).find(key => 
              PORTFOLIO_SUPPORTED_CHAINS[key as keyof typeof PORTFOLIO_SUPPORTED_CHAINS] === chainId
            );
            result += `**Chain:** ${chainName || chainId}\n`;
          }
          if (timestamp) {
            result += `**Snapshot Time:** ${new Date(timestamp * 1000).toISOString()}\n`;
          }
          result += `\n`;

          if (snapshot && snapshot.length > 0) {
            result += `**Token Positions Found:** ${snapshot.length}\n\n`;
            
            snapshot.forEach((position: any, index: number) => {
              result += `## **${index + 1}. ${position.contract_name} (${position.contract_symbol})**\n\n`;
              result += `**Address:** ${position.contract_address}\n`;
              result += `**Chain:** ${position.chain_id}\n`;
              result += `**Value:** ${formatUsdValue(position.value_usd)}\n`;
              result += `**Status:** ${position.status === 1 ? 'Active ✅' : position.status === 0 ? 'Inactive ⏸️' : 'Closed ❌'}\n`;

              if (position.underlying_tokens && position.underlying_tokens.length > 0) {
                result += `\n**Token Details:**\n`;
                position.underlying_tokens.forEach((token: any) => {
                  result += `   - **${token.symbol || 'Unknown'}:** ${token.amount.toFixed(6)}\n`;
                  if (token.price_usd) {
                    result += `     - **USD Value:** ${formatUsdValue(token.amount * token.price_usd)}\n`;
                  }
                });
              }

              result += `\n---\n\n`;
            });
          } else {
            result += `📭 **No token positions found for the specified parameters.**`;
          }

          return result;
        }

        case "tokens_metrics": {
          if (!addresses || addresses.length === 0) {
            return "Error: Wallet addresses are required for tokens metrics.";
          }

          const invalidAddresses = validateWalletAddresses(addresses);
          if (invalidAddresses.length > 0) {
            return `Error: Invalid wallet address(es): ${invalidAddresses.join(", ")}. All addresses must be valid Ethereum addresses.`;
          }

          const metrics = await getTokensMetrics(addresses, chainId, timerange);
          return formatTokensMetrics(metrics);
        }

        default:
          return "Error: Invalid operation. Please use one of the supported operations: status, supported_chains, supported_protocols, current_value, portfolio_chart, portfolio_report, protocols_snapshot, protocols_metrics, tokens_snapshot, tokens_metrics";
      }
    } catch (error: any) {
      console.error("Portfolio tool error:", error);

      if (error.message.includes("API error")) {
        return `Error: ${error.message}. Please check your API key and try again.`;
      }

      return `Error performing portfolio operation: ${error.message}`;
    }
  },
});