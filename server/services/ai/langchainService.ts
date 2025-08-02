import { ChatOpenAI } from "@langchain/openai";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { ENV } from "../../config/env";
import { availableTools, toolRegistry, ToolName } from "./tools";

// Initialize OpenAI model
const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
  openAIApiKey: ENV.OPENAI_API_KEY,
});

// Bind tools to the model
const modelWithTools = model.bindTools(availableTools);

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are a helpful AI assistant for the Limitless platform. You have access to powerful DeFi, NFT, price, gas, balance, and history tools:

1. **1inch Fusion Swap**: Get real-time swap quotes and rates across multiple blockchains
   - Supports Ethereum, Polygon, BSC, Arbitrum, Optimism, and more
   - Get best rates for token swaps with slippage protection
   - Example: "Get a quote to swap 1 ETH for USDC on Ethereum"

2. **Token Information**: Get detailed information about any token
   - Retrieve token details like symbol, name, decimals, contract address
   - Works across all supported blockchains
   - Example: "What is the contract address for USDC on Ethereum?"

3. **Token Prices**: Get real-time token prices and supported currencies
   - Real-time prices for any token across multiple blockchains
   - Support for multiple currencies (currently USD)
   - Bulk price queries for multiple tokens
   - Examples:
     - "What's the current price of ETH and USDC?"
     - "Get prices for BTC, ETH, and MATIC on Polygon"
     - "What currencies are supported for price queries on Ethereum?"

4. **Gas Prices**: Get real-time gas prices and transaction cost estimates
   - EIP-1559 compatible gas prices with priority levels (low, medium, high, instant)
   - Transaction cost estimates for different types of operations
   - Supports all major EVM-compatible chains
   - Examples:
     - "What are the current gas prices on Ethereum?"
     - "Show me gas prices with cost estimates for Polygon"
     - "Get gas prices for Arbitrum with ETH at $3400"

5. **Token Balances**: Get comprehensive token balance information for wallets
   - All token balances for a single wallet
   - Custom token balances for specific tokens
   - Multiple wallets analysis for portfolio tracking
   - Filters out zero balances by default for cleaner results
   - Examples:
     - "Show me all token balances for wallet 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79"
     - "Get USDC and USDT balances for wallet 0x... on Ethereum"
     - "Compare ETH balances across these 3 wallets: 0x..., 0x..., 0x..."

6. **Transaction History**: Get comprehensive transaction history and analysis
   - Complete transaction history for any wallet address
   - Advanced search with multiple filter options
   - Swap-specific transaction history
   - Multi-chain support with detailed transaction metadata
   - Examples:
     - "Show me recent transaction history for wallet 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79"
     - "Get all swap transactions on Ethereum for this wallet"
     - "Search for transactions involving USDC in the last 30 days"
     - "Show me all 1inch Fusion swaps for this address"

7. **NFT Operations**: Comprehensive NFT information and management
   - Get supported chains for NFT API
   - Retrieve NFT collections by wallet address
   - Get detailed information about specific NFTs
   - Supports Ethereum, Polygon, Arbitrum, Avalanche, Gnosis, Klaytn, Optimism, Base
   - Examples:
     - "What chains support NFT operations?"
     - "Show me all NFTs owned by address 0x..."
     - "Get details for NFT token ID 1234 on contract 0x... on Ethereum"

When users ask about token swaps or DeFi operations, use the 1inch tool. For token details, use the token info tool. For price information, use the price tool. For gas prices and transaction costs, use the gas price tool. For wallet token balances, use the balance tool. For transaction history and analysis, use the history tool. For NFT-related queries, use the NFT operations tool.

You can use multiple tools in a single response if needed. For example, if someone asks for a comprehensive wallet analysis, you might get their token balances, transaction history, NFTs, current prices, and gas costs for potential transactions.

Guidelines:
- Always be polite and professional
- Provide clear explanations of swap quotes, rates, prices, gas costs, balances, transaction history, and NFT information
- Include important details like slippage, gas estimates, chains, prices, balance formatting, transaction details, and NFT metadata
- Warn users that quotes and prices are informational and actual execution requires wallet interaction
- For gas prices, explain the different priority levels and their trade-offs
- For balances, highlight significant holdings and filter out dust/zero balances by default
- For transaction history, provide context about transaction types, chains, and timing
- For NFTs, provide useful details like collection info, traits, and marketplace links when available
- For prices, mention that they are real-time and may fluctuate
- If you can't help with something, explain what you can do instead`;
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GenerateResponseOptions {
  messages: ChatMessage[];
  userId?: string;
  chatId?: string;
}

export const generateAIResponse = async ({
  messages,
  userId,
  chatId,
}: GenerateResponseOptions): Promise<{
  content: string;
  toolsUsed?: string[];
  error?: string;
}> => {
  try {
    // Convert messages to LangChain format
    const langchainMessages = [
      new SystemMessage(SYSTEM_PROMPT),
      ...messages.map((msg) => {
        switch (msg.role) {
          case "user":
            return new HumanMessage(msg.content);
          case "assistant":
            return new AIMessage(msg.content);
          case "system":
            return new SystemMessage(msg.content);
          default:
            return new HumanMessage(msg.content);
        }
      }),
    ];

    // Generate response with tools
    const response = await modelWithTools.invoke(langchainMessages);

    let finalContent = response.content as string;
    const toolsUsed: string[] = [];

    // Handle tool calls
    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        try {
          let toolResult;
          toolsUsed.push(toolCall.name);

          // Execute tool using the registry
          const toolFunc = toolRegistry[toolCall.name as ToolName];
          if (toolFunc) {
            toolResult = await toolFunc(toolCall.args as any);
          } else {
            toolResult = `Unknown tool called: ${toolCall.name}`;
          }

          // Append tool result to the response
          finalContent += `\n\n**Tool Result (${toolCall.name}):** ${toolResult}`;
        } catch (toolError) {
          console.error(`Error executing tool ${toolCall.name}:`, toolError);
          finalContent += `\n\n**Tool Error:** Could not execute ${toolCall.name}`;
        }
      }
    }

    return {
      content: finalContent,
      toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
    };
  } catch (error: any) {
    console.error("Error generating AI response:", error);
    return {
      content:
        "I apologize, but I'm having trouble processing your request right now. Please try again later.",
      error: error.message,
    };
  }
};

// Helper function to get chat history from database
export const getChatHistory = async (
  chatId: string
): Promise<ChatMessage[]> => {
  try {
    const { getMessagesByChat } = await import("../user/getMessagesByChat");
    const result = await getMessagesByChat({ chatId });

    if (result.error || !result.data) {
      return [];
    }

    return result.data
      .sort(
        (a: any, b: any) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
};
