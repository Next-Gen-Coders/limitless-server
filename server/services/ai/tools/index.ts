// Import all available AI tools
import { oneInchSwapTool } from "./oneInchSwapTool";
import { tokenInfoTool } from "./tokenInfoTool";
import { nftTool } from "./nftTool";
import { priceTool } from "./priceTool";
import { gasPriceTool } from "./gasPriceTool";
import { balanceTool } from "./balanceTool";
import { historyTool } from "./historyTool";

// Export array of all tools for easy binding to the model
export const availableTools = [
  oneInchSwapTool,
  tokenInfoTool,
  nftTool,
  priceTool,
  gasPriceTool,
  balanceTool,
  historyTool,
];

// Export individual tools for specific use
export {
  oneInchSwapTool,
  tokenInfoTool,
  nftTool,
  priceTool,
  gasPriceTool,
  balanceTool,
  historyTool,
};

// Tool registry for dynamic tool execution
export const toolRegistry = {
  oneinch_fusion_swap: oneInchSwapTool.func,
  get_token_info: tokenInfoTool.func,
  nft_operations: nftTool.func,
  token_prices: priceTool.func,
  gas_prices: gasPriceTool.func,
  token_balances: balanceTool.func,
  transaction_history: historyTool.func,
} as const;

export type ToolName = keyof typeof toolRegistry;
