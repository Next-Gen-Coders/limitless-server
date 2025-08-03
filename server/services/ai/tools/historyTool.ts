import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../../../config/env";

// 1inch History API base URL
const ONEINCH_HISTORY_API_BASE = "https://api.1inch.dev/history/v2.0";

// Supported chains for history API
export const HISTORY_SUPPORTED_CHAINS = {
  ethereum: "1",
  bsc: "56",
  polygon: "137",
  arbitrum: "42161",
  optimism: "10",
  avalanche: "43114",
  gnosis: "100",
  fantom: "250",
  klaytn: "8217",
  aurora: "1313161554",
  zksync: "324",
  base: "8453",
  linea: "59144",
  solana: "501",
  flow: "146",
  polkadot: "130",
  energy: "45",
} as const;

// Transaction types enum
export const TRANSACTION_TYPES = [
  "Unknown",
  "Approve",
  "Wrap",
  "Unwrap",
  "Transfer",
  "SwapExactInput",
  "SwapExactOutput",
  "LimitOrderFill",
  "LimitOrderCancel",
  "LimitOrderCancelAll",
  "Multicall",
  "AddLiquidity",
  "RemoveLiquidity",
  "Borrow",
  "Repay",
  "Stake",
  "Unstake",
  "Vote",
  "DelegateVotePower",
  "UnDelegateVotePower",
  "DiscardVote",
  "DeployPool",
  "Claim",
  "AbiDecoded",
  "TraceDecoded",
  "Action",
  "Bridge",
  "BuyNft",
  "BidNft",
  "OfferSellNft",
  "Burn",
  "WrappedTx",
  "RegisterENSDomain",
  "Revoke",
  "CreateSafe",
  "AddOwner",
  "Send",
  "Receive",
  "MultiStage",
  "Swap",
  "LimitOrderCreate",
] as const;

// Interface for history event details
interface HistoryEventDto {
  id: string;
  address: string;
  type: number;
  rating: "Reliable" | "Scam";
  timeMs: number;
  details: {
    orderInBlock: number;
    txHash: string;
    chainId: number;
    blockNumber: number;
    blockTimeSec: number;
    status: string;
    type: string;
    tokenActions: Array<{
      address: string;
      standard: string;
      fromAddress: string;
      toAddress: string;
      tokenId?: any;
      amount?: any;
      direction: "In" | "Out" | "Self" | "On";
    }>;
    fromAddress: string;
    toAddress: string;
    nonce: number;
    feeInSmallestNative: string;
    meta?: {
      is1inchFusionSwap?: any;
      is1inchCrossChainSwap?: any;
      orderFillPercentage?: any;
      ensDomainName?: any;
      fromChainId?: any;
      toChainId?: any;
      safeAddress?: any;
      protocol?: any;
    };
  };
}

interface HistoryResponseDto {
  items: HistoryEventDto[];
  cache_counter: number;
}

// Get history events by address
async function getHistoryEvents(
  address: string,
  queryParams: {
    limit?: number;
    chainId?: string;
    tokenAddress?: string;
    toTimestampMs?: number;
    fromTimestampMs?: number;
  }
): Promise<HistoryResponseDto> {
  try {
    // Build query string
    const searchParams = new URLSearchParams();
    if (queryParams.limit)
      searchParams.append("limit", queryParams.limit.toString());
    if (queryParams.chainId)
      searchParams.append("chainId", queryParams.chainId);
    if (queryParams.tokenAddress)
      searchParams.append("tokenAddress", queryParams.tokenAddress);
    if (queryParams.toTimestampMs)
      searchParams.append(
        "toTimestampMs",
        queryParams.toTimestampMs.toString()
      );
    if (queryParams.fromTimestampMs)
      searchParams.append(
        "fromTimestampMs",
        queryParams.fromTimestampMs.toString()
      );

    const url = `${ONEINCH_HISTORY_API_BASE}/history/${address}/events?${searchParams.toString()}`;

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
      console.error("History API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `History API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch history events:", error);
    throw error;
  }
}

// Search history events with advanced filters
async function searchHistoryEvents(
  address: string,
  queryParams: {
    limit?: number;
    chainId?: string;
    txHash?: string;
    fromTimestampMs?: number;
    toTimestampMs?: number;
  }
): Promise<any[]> {
  try {
    const url = `${ONEINCH_HISTORY_API_BASE}/history/${address}/search/events`;

    // Build the request body for search with proper filter structure
    const requestBody = {
      filter: {
        and: {
          from_time_ms: queryParams.fromTimestampMs || null,
          to_time_ms: queryParams.toTimestampMs || null,
          chain_ids: queryParams.chainId ? [queryParams.chainId] : null,
          transaction_hash: queryParams.txHash
            ? { hash: queryParams.txHash }
            : null,
        },
        limit: queryParams.limit || 50,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.ONEINCH_API_KEY}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (response.ok) {
      return response.json();
    } else {
      const errorText = await response.text();
      console.error("History Search API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `History Search API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not search history events:", error);
    throw error;
  }
}

// Helper function to format timestamp
function formatTimestamp(timeMs: number): string {
  return new Date(timeMs).toLocaleString();
}

// Helper function to format transaction hash
function formatTxHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

// Helper function to format address
function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Helper function to get chain name
function getChainName(chainId: number): string {
  const chainMap: Record<number, string> = {
    1: "Ethereum",
    56: "BSC",
    137: "Polygon",
    42161: "Arbitrum",
    10: "Optimism",
    43114: "Avalanche",
    100: "Gnosis",
    250: "Fantom",
    8217: "Klaytn",
    1313161554: "Aurora",
    324: "zkSync",
    8453: "Base",
    59144: "Linea",
    501: "Solana",
    146: "Flow",
    130: "Polkadot",
    45: "Energy",
  };
  return chainMap[chainId] || `Chain ${chainId}`;
}

// Helper function to format token action
function formatTokenAction(action: any): string {
  const direction =
    action.direction === "In" ? "→" : action.direction === "Out" ? "←" : "↔";
  const amount = action.amount ? ` (${action.amount})` : "";
  return `${direction} ${formatAddress(action.address)}${amount}`;
}

// Helper function to normalize different API response formats
function normalizeHistoryResponse(response: any): HistoryResponseDto {
  // If it's already in the correct format (from all_events endpoint)
  if (response && response.items && Array.isArray(response.items)) {
    return response as HistoryResponseDto;
  }

  // If it's an array of HistoryEventResponseDto (from search_events endpoint)
  if (Array.isArray(response)) {
    return {
      items: response.map((item: any) => item.item || item),
      cache_counter: response.length > 0 ? response[0].cache_counter || 0 : 0,
    };
  }

  // Fallback empty response
  return {
    items: [],
    cache_counter: 0,
  };
}

// Helper function to format history events
function formatHistoryEvents(
  response: HistoryResponseDto | any[],
  address: string,
  operation: string
): string {
  // Normalize the response format
  const normalizedResponse = normalizeHistoryResponse(response);

  let result = `📚 **Transaction History**\n\n`;
  result += `**Wallet:** ${formatAddress(address)}\n`;
  result += `**Operation:** ${operation}\n`;

  const totalEvents = normalizedResponse.items.length;
  result += `**Total Events:** ${totalEvents}\n\n`;

  if (totalEvents === 0) {
    result += `📭 **No transaction events found.**\n\n`;
    result += `ℹ️ This wallet may have no transaction history or the filters returned no results.`;
    return result;
  }

  // Sort by time (most recent first)
  const sortedEvents = normalizedResponse.items.sort(
    (a, b) => b.timeMs - a.timeMs
  );

  // Display up to 20 most recent events
  const displayEvents = sortedEvents.slice(0, 20);

  displayEvents.forEach((event, index) => {
    const chainName = getChainName(event.details.chainId);
    const timestamp = formatTimestamp(event.timeMs);
    const txHash = formatTxHash(event.details.txHash);

    result += `**${index + 1}. ${event.details.type}**\n`;
    result += `   - **Chain:** ${chainName}\n`;
    result += `   - **Time:** ${timestamp}\n`;
    result += `   - **TX Hash:** ${txHash}\n`;
    result += `   - **Status:** ${event.details.status}\n`;
    result += `   - **Rating:** ${event.rating}\n`;

    if (event.details.tokenActions && event.details.tokenActions.length > 0) {
      result += `   - **Token Actions:**\n`;
      event.details.tokenActions.slice(0, 3).forEach((action) => {
        result += `     ${formatTokenAction(action)}\n`;
      });
      if (event.details.tokenActions.length > 3) {
        result += `     ... and ${
          event.details.tokenActions.length - 3
        } more\n`;
      }
    }

    if (event.details.meta) {
      const meta = event.details.meta;
      if (meta.is1inchFusionSwap) result += `   - **1inch Fusion Swap** ✨\n`;
      if (meta.is1inchCrossChainSwap)
        result += `   - **Cross-Chain Swap** 🌉\n`;
      if (meta.protocol) result += `   - **Protocol:** ${meta.protocol}\n`;
    }

    result += `\n`;
  });

  if (sortedEvents.length > 20) {
    result += `... and ${sortedEvents.length - 20} more events\n\n`;
  }

  result += `⏰ **Note:** Showing most recent events. Use filters to refine results.`;
  return result;
}

// Create the history tool
export const historyTool = new DynamicStructuredTool({
  name: "transaction_history",
  description:
    "Get comprehensive transaction history for wallet addresses using 1inch History API",
  schema: z.object({
    operation: z
      .enum(["all_events", "search_events"])
      .describe(
        "Operation to perform: 'all_events' for general history, 'search_events' for advanced filtering with transaction hash search"
      ),
    address: z
      .string()
      .describe(
        "Wallet address to get history for. Must be a valid Ethereum address"
      ),
    chainId: z
      .string()
      .optional()
      .describe(
        "Chain ID to filter by (e.g., '1' for Ethereum, '137' for Polygon). Leave empty for multi-chain"
      ),
    tokenAddress: z
      .string()
      .optional()
      .describe(
        "Token contract address to filter transactions by (for all_events)"
      ),
    txHash: z
      .string()
      .optional()
      .describe("Specific transaction hash to search for (for search_events)"),
    fromTimestampMs: z
      .number()
      .optional()
      .describe("Start time filter in milliseconds (Unix timestamp)"),
    toTimestampMs: z
      .number()
      .optional()
      .describe("End time filter in milliseconds (Unix timestamp)"),
    limit: z
      .number()
      .optional()
      .describe("Maximum number of events to return (default: 50, max: 100)"),
  }),
  func: async ({
    operation,
    address,
    chainId,
    tokenAddress,
    txHash,
    fromTimestampMs,
    toTimestampMs,
    limit = 50,
  }) => {
    try {
      // Validate address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return "Error: Invalid wallet address format. Must be a valid Ethereum address (0x followed by 40 hex characters).";
      }

      // Validate limit
      if (limit < 1 || limit > 100) {
        return "Error: Limit must be between 1 and 100.";
      }

      // Validate chain ID if provided
      if (chainId) {
        const validChainIds = Object.values(
          HISTORY_SUPPORTED_CHAINS
        ) as string[];
        if (!validChainIds.includes(chainId)) {
          return `Error: Invalid chain ID: ${chainId}. Supported chains: ${validChainIds.join(
            ", "
          )}`;
        }
      }

      switch (operation) {
        case "all_events": {
          const queryParams = {
            limit,
            chainId,
            tokenAddress,
            fromTimestampMs,
            toTimestampMs,
          };

          const response = await getHistoryEvents(address, queryParams);
          return formatHistoryEvents(response, address, "All Events");
        }

        case "search_events": {
          const queryParams = {
            limit,
            chainId,
            txHash,
            fromTimestampMs,
            toTimestampMs,
          };

          const response = await searchHistoryEvents(address, queryParams);
          return formatHistoryEvents(response, address, "Search Results");
        }

        default:
          return "Error: Invalid operation. Use 'all_events' or 'search_events'";
      }
    } catch (error: any) {
      console.error("History tool error:", error);

      if (
        error.message.includes("History API error") ||
        error.message.includes("History Search API error")
      ) {
        return `Error: ${error.message}. Please check your API key and try again.`;
      }

      return `Error performing history operation: ${error.message}`;
    }
  },
});
