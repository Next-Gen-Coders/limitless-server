import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { ENV } from "../../../config/env";

// 1inch Trace API base URL
const ONEINCH_TRACE_API_BASE = "https://api.1inch.dev/traces/v1.0";

// Supported chains for trace API
export const TRACE_SUPPORTED_CHAINS = {
  ethereum: 1,
  arbitrum: 42161,
  avalanche: 43114,
  bsc: 56,
  gnosis: 100,
  sonic: 146,
  optimism: 10,
  polygon: 137,
  zksync: 324,
  base: 8453,
  linea: 59144,
  unichain: 1301,
} as const;

// Types for trace responses
interface SyncedIntervalResponse {
  from: number;
  to: number;
}

interface TraceEvent {
  data: string;
  topics: string[][];
  contract: string;
}

interface CallTrace {
  type: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasUsed: string;
  input: string;
  output: string;
  error?: string;
  calls?: CallTrace[];
  isParentHasError?: boolean;
}

interface TransactionTrace {
  chainId: number;
  type: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasUsed: string;
  input: string;
  output: string;
  calls?: CallTrace[];
  txHash: string;
  nonce: string;
  error?: string;
  revertReason?: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasHex: string;
  events?: TraceEvent[];
}

interface BlockTrace {
  type: string;
  version: string;
  number: number;
  blockHash: string;
  blockTimestamp: string;
  traces: TransactionTrace[];
}

interface TransactionTraceWithType {
  transactionTrace: TransactionTrace[];
  type: string;
}

// Get synced interval for a chain
async function getSyncedInterval(chainId: number): Promise<SyncedIntervalResponse> {
  try {
    const response = await fetch(
      `${ONEINCH_TRACE_API_BASE}/chain/${chainId}/synced-interval`,
      {
        method: "GET",
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
      console.error("Trace API synced interval error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Trace API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch synced interval:", error);
    throw error;
  }
}

// Get block trace by block number
async function getBlockTrace(chainId: number, blockNumber: string): Promise<BlockTrace> {
  try {
    const response = await fetch(
      `${ONEINCH_TRACE_API_BASE}/chain/${chainId}/block-trace/${blockNumber}`,
      {
        method: "GET",
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
      console.error("Trace API block trace error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Trace API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch block trace:", error);
    throw error;
  }
}

// Get transaction trace by block number and transaction hash
async function getTransactionTrace(
  chainId: number,
  blockNumber: string,
  txHash: string
): Promise<TransactionTraceWithType> {
  try {
    const response = await fetch(
      `${ONEINCH_TRACE_API_BASE}/chain/${chainId}/block-trace/${blockNumber}/tx-hash/${txHash}`,
      {
        method: "GET",
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
      console.error("Trace API transaction trace error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Trace API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch transaction trace:", error);
    throw error;
  }
}

// Get transaction trace by block number and offset
async function getTransactionTraceByOffset(
  chainId: number,
  blockNumber: string,
  offset: number
): Promise<TransactionTraceWithType> {
  try {
    const response = await fetch(
      `${ONEINCH_TRACE_API_BASE}/chain/${chainId}/block-trace/${blockNumber}/offset/${offset}`,
      {
        method: "GET",
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
      console.error("Trace API transaction trace by offset error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Trace API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }
  } catch (error) {
    console.error("Could not fetch transaction trace by offset:", error);
    throw error;
  }
}

// Helper function to get chain name
function getChainName(chainId: number): string {
  const chainMap: Record<number, string> = {
    1: "Ethereum Mainnet",
    42161: "Arbitrum",
    43114: "Avalanche",
    56: "BNB Chain",
    100: "Gnosis",
    146: "Sonic",
    10: "Optimism",
    137: "Polygon",
    324: "zkSync Era",
    8453: "Base",
    59144: "Linea",
    1301: "Unichain",
  };
  return chainMap[chainId] || `Chain ${chainId}`;
}

// Helper function to format address
function formatAddress(address: string): string {
  if (address && address.length > 10) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return address;
}

// Helper function to format hex values
function formatHex(hex: string, maxLength: number = 20): string {
  if (hex && hex.length > maxLength) {
    return `${hex.slice(0, maxLength)}...`;
  }
  return hex;
}

// Helper function to format gas values
function formatGas(gas: string): string {
  try {
    const gasValue = parseInt(gas, 10);
    return gasValue.toLocaleString();
  } catch {
    return gas;
  }
}

// Helper function to format synced interval
function formatSyncedInterval(interval: SyncedIntervalResponse, chainName: string): string {
  let result = `🔄 **Synced Interval Information**\n\n`;
  result += `**Chain:** ${chainName}\n`;
  result += `**From Block:** ${interval.from.toLocaleString()}\n`;
  result += `**To Block:** ${interval.to.toLocaleString()}\n`;
  result += `**Total Synced Blocks:** ${(interval.to - interval.from).toLocaleString()}\n\n`;
  result += `ℹ️ **Note:** This represents the range of blocks for which transaction traces are available on this chain.`;
  return result;
}

// Helper function to format call trace recursively
function formatCallTrace(call: CallTrace, depth: number = 0): string {
  const indent = "  ".repeat(depth);
  let result = `${indent}📞 **${call.type}**\n`;
  result += `${indent}   - **From:** ${formatAddress(call.from)}\n`;
  result += `${indent}   - **To:** ${formatAddress(call.to)}\n`;
  result += `${indent}   - **Value:** ${call.value} wei\n`;
  result += `${indent}   - **Gas Used:** ${formatGas(call.gasUsed)}\n`;
  
  if (call.input && call.input !== "0x") {
    result += `${indent}   - **Input:** ${formatHex(call.input, 30)}\n`;
  }
  
  if (call.output && call.output !== "0x") {
    result += `${indent}   - **Output:** ${formatHex(call.output, 30)}\n`;
  }
  
  if (call.error) {
    result += `${indent}   - **Error:** ${call.error}\n`;
  }
  
  if (call.calls && call.calls.length > 0) {
    result += `${indent}   - **Sub-calls (${call.calls.length}):**\n`;
    // Limit sub-calls to prevent overwhelming output
    const displayCalls = call.calls.slice(0, 3);
    displayCalls.forEach(subCall => {
      result += formatCallTrace(subCall, depth + 1);
    });
    if (call.calls.length > 3) {
      result += `${indent}     ... and ${call.calls.length - 3} more sub-calls\n`;
    }
  }
  
  return result + "\n";
}

// Helper function to format block trace
function formatBlockTrace(blockTrace: BlockTrace, chainName: string): string {
  let result = `🔍 **Block Trace Analysis**\n\n`;
  result += `**Chain:** ${chainName}\n`;
  result += `**Block Number:** ${blockTrace.number.toLocaleString()}\n`;
  result += `**Block Hash:** ${blockTrace.blockHash}\n`;
  result += `**Block Timestamp:** ${new Date(blockTrace.blockTimestamp).toLocaleString()}\n`;
  result += `**Trace Type:** ${blockTrace.type}\n`;
  result += `**Version:** ${blockTrace.version}\n`;
  result += `**Total Transactions:** ${blockTrace.traces.length}\n\n`;

  if (blockTrace.traces.length === 0) {
    result += `📭 **No transactions found in this block.**`;
    return result;
  }

  // Display up to 5 transactions to prevent overwhelming output
  const displayTraces = blockTrace.traces.slice(0, 5);
  
  displayTraces.forEach((trace, index) => {
    result += `**Transaction ${index + 1}**\n`;
    result += `   - **TX Hash:** ${trace.txHash}\n`;
    result += `   - **Type:** ${trace.type}\n`;
    result += `   - **From:** ${formatAddress(trace.from)}\n`;
    result += `   - **To:** ${formatAddress(trace.to)}\n`;
    result += `   - **Value:** ${trace.value} wei\n`;
    result += `   - **Gas Used:** ${formatGas(trace.gasUsed)}\n`;
    
    if (trace.error) {
      result += `   - **Error:** ${trace.error}\n`;
    }
    
    if (trace.revertReason) {
      result += `   - **Revert Reason:** ${trace.revertReason}\n`;
    }
    
    if (trace.calls && trace.calls.length > 0) {
      result += `   - **Internal Calls:** ${trace.calls.length}\n`;
    }
    
    if (trace.events && trace.events.length > 0) {
      result += `   - **Events:** ${trace.events.length}\n`;
    }
    
    result += `\n`;
  });

  if (blockTrace.traces.length > 5) {
    result += `... and ${blockTrace.traces.length - 5} more transactions\n\n`;
  }

  result += `⏰ **Note:** Use specific transaction hash for detailed call traces and events.`;
  return result;
}

// Helper function to format transaction trace
function formatTransactionTrace(txTrace: TransactionTraceWithType, chainName: string): string {
  if (!txTrace.transactionTrace || txTrace.transactionTrace.length === 0) {
    return `📭 **No transaction trace data found.**`;
  }

  const trace = txTrace.transactionTrace[0];
  
  let result = `🔍 **Transaction Trace Analysis**\n\n`;
  result += `**Chain:** ${chainName}\n`;
  result += `**TX Hash:** ${trace.txHash}\n`;
  result += `**Type:** ${trace.type}\n`;
  result += `**From:** ${formatAddress(trace.from)}\n`;
  result += `**To:** ${formatAddress(trace.to)}\n`;
  result += `**Value:** ${trace.value} wei\n`;
  result += `**Gas Used:** ${formatGas(trace.gasUsed)} / ${formatGas(trace.gas)}\n`;
  result += `**Nonce:** ${trace.nonce}\n`;
  result += `**Gas Price:** ${trace.gasPrice} wei\n`;
  
  if (trace.maxFeePerGas) {
    result += `**Max Fee Per Gas:** ${trace.maxFeePerGas} wei\n`;
  }
  
  if (trace.maxPriorityFeePerGas) {
    result += `**Max Priority Fee Per Gas:** ${trace.maxPriorityFeePerGas} wei\n`;
  }
  
  if (trace.error) {
    result += `**Error:** ${trace.error}\n`;
  }
  
  if (trace.revertReason) {
    result += `**Revert Reason:** ${trace.revertReason}\n`;
  }
  
  result += `\n`;

  // Display input data if present
  if (trace.input && trace.input !== "0x") {
    result += `**📥 Input Data:**\n`;
    result += `${formatHex(trace.input, 100)}\n\n`;
  }

  // Display output data if present
  if (trace.output && trace.output !== "0x") {
    result += `**📤 Output Data:**\n`;
    result += `${formatHex(trace.output, 100)}\n\n`;
  }

  // Display events if present
  if (trace.events && trace.events.length > 0) {
    result += `**📋 Events (${trace.events.length}):**\n`;
    trace.events.slice(0, 5).forEach((event, index) => {
      result += `   **Event ${index + 1}:**\n`;
      result += `   - **Contract:** ${formatAddress(event.contract)}\n`;
      result += `   - **Topics:** ${event.topics.length} topic(s)\n`;
      result += `   - **Data:** ${formatHex(event.data, 40)}\n\n`;
    });
    
    if (trace.events.length > 5) {
      result += `   ... and ${trace.events.length - 5} more events\n\n`;
    }
  }

  // Display call traces if present
  if (trace.calls && trace.calls.length > 0) {
    result += `**📞 Internal Calls (${trace.calls.length}):**\n\n`;
    // Limit to first 3 calls to prevent overwhelming output
    trace.calls.slice(0, 3).forEach((call, index) => {
      result += `**Call ${index + 1}:**\n`;
      result += formatCallTrace(call, 1);
    });
    
    if (trace.calls.length > 3) {
      result += `... and ${trace.calls.length - 3} more internal calls\n\n`;
    }
  }

  result += `⏰ **Note:** This trace shows step-by-step execution details for debugging and analysis.`;
  return result;
}

// Create the traces tool
export const tracesTool = new DynamicStructuredTool({
  name: "transaction_traces",
  description:
    "Get comprehensive transaction traces and step-by-step execution data using 1inch Trace API for debugging, auditing, and analysis",
  schema: z.object({
    operation: z
      .enum(["synced_interval", "block_trace", "transaction_trace", "transaction_trace_by_offset"])
      .describe(
        "Operation to perform: 'synced_interval' for available block range, 'block_trace' for all transactions in a block, 'transaction_trace' for specific transaction by hash, 'transaction_trace_by_offset' for transaction by position in block"
      ),
    chain: z
      .string()
      .describe(
        "Blockchain network (ethereum, arbitrum, avalanche, bsc, gnosis, sonic, optimism, polygon, zksync, base, linea, unichain)"
      ),
    blockNumber: z
      .string()
      .optional()
      .describe("Block number (required for block_trace, transaction_trace, and transaction_trace_by_offset operations)"),
    txHash: z
      .string()
      .optional()
      .describe("Transaction hash (required for transaction_trace operation)"),
    offset: z
      .number()
      .optional()
      .describe("Transaction offset/position in block (required for transaction_trace_by_offset operation)"),
  }),
  func: async ({
    operation,
    chain,
    blockNumber,
    txHash,
    offset,
  }) => {
    try {
      // Validate chain
      const chainId =
        TRACE_SUPPORTED_CHAINS[
          chain.toLowerCase() as keyof typeof TRACE_SUPPORTED_CHAINS
        ];
      if (!chainId) {
        return `Error: Unsupported chain "${chain}". Supported chains: ${Object.keys(
          TRACE_SUPPORTED_CHAINS
        ).join(", ")}`;
      }

      const chainName = getChainName(chainId);

      switch (operation) {
        case "synced_interval": {
          const interval = await getSyncedInterval(chainId);
          return formatSyncedInterval(interval, chainName);
        }

        case "block_trace": {
          if (!blockNumber) {
            return "Error: blockNumber is required for block_trace operation";
          }

          const blockTrace = await getBlockTrace(chainId, blockNumber);
          return formatBlockTrace(blockTrace, chainName);
        }

        case "transaction_trace": {
          if (!blockNumber || !txHash) {
            return "Error: Both blockNumber and txHash are required for transaction_trace operation";
          }

          // Validate transaction hash format
          if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
            return "Error: Invalid transaction hash format. Must be 0x followed by 64 hex characters.";
          }

          const txTrace = await getTransactionTrace(chainId, blockNumber, txHash);
          return formatTransactionTrace(txTrace, chainName);
        }

        case "transaction_trace_by_offset": {
          if (!blockNumber || offset === undefined) {
            return "Error: Both blockNumber and offset are required for transaction_trace_by_offset operation";
          }

          if (offset < 0) {
            return "Error: Offset must be a non-negative number";
          }

          const txTrace = await getTransactionTraceByOffset(chainId, blockNumber, offset);
          return formatTransactionTrace(txTrace, chainName);
        }

        default:
          return "Error: Invalid operation. Use 'synced_interval', 'block_trace', 'transaction_trace', or 'transaction_trace_by_offset'";
      }
    } catch (error: any) {
      console.error("Traces tool error:", error);

      if (error.message.includes("Trace API error")) {
        return `Error: ${error.message}. Please check your API key and try again.`;
      }

      return `Error performing trace operation: ${error.message}`;
    }
  },
});