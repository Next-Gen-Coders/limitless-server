// Import all available AI tools
import { tokenInfoTool } from "./tokenInfoTool";
import { nftTool } from "./nftTool";
import { priceTool } from "./priceTool";
import { gasPriceTool } from "./gasPriceTool";
import { balanceTool } from "./balanceTool";
import { historyTool } from "./historyTool";
import { chartTool } from "./chartTool";
import { domainsTool } from "./domainsTool";

// Export array of all tools for easy binding to the model
export const availableTools = [
  tokenInfoTool,
  nftTool,
  priceTool,
  gasPriceTool,
  balanceTool,
  historyTool,
  chartTool,
  domainsTool,
];

// Export individual tools for specific use
export {
  tokenInfoTool,
  nftTool,
  priceTool,
  gasPriceTool,
  balanceTool,
  historyTool,
  chartTool,
  domainsTool,
};

// Tool registry for dynamic tool execution
export const toolRegistry = {
  get_token_info: tokenInfoTool.func,
  nft_operations: nftTool.func,
  token_prices: priceTool.func,
  gas_prices: gasPriceTool.func,
  token_balances: balanceTool.func,
  transaction_history: historyTool.func,
  chart_data: chartTool.func,
  domain_operations: domainsTool.func,
} as const;

export type ToolName = keyof typeof toolRegistry;
