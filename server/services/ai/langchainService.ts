import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { ENV } from "../../config/env";
import { availableTools, toolRegistry } from "./tools";
import { getChatHistory as getDbChatHistory } from "./dbMemory";

// Initialize OpenAI model with tool binding
const model = new ChatOpenAI({
  model: "gpt-4o",
  temperature: 0.7,
  openAIApiKey: ENV.OPENAI_API_KEY,
});

// Bind tools to the model
const modelWithTools = model.bindTools(availableTools);

// Create chat prompt template for our agent
const agentPrompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a helpful AI assistant for the Limitless platform. You have access to powerful DeFi, NFT, price, gas, balance, and history tools.

You have access to conversation history and can remember previous messages in our current chat session. You can refer to earlier parts of our conversation when relevant.

You can use multiple tools in sequence to provide comprehensive analysis. Think step by step about what information you need and which tools to use.

**IMPORTANT**: When using multiple tools, make sure to use the EXACT data returned from previous tools. For example:
- If you get an address from a domain lookup, use that EXACT address for subsequent tools
- If you get token information, use the EXACT contract addresses and token symbols returned
- Always use the complete, untruncated addresses and data from tool responses

Available tools and their capabilities:

1. **1inch Fusion Swap**: Get real-time swap quotes and rates across multiple blockchains
   - Supports Ethereum, Polygon, BSC, Arbitrum, Optimism, and more
   - Get best rates for token swaps with slippage protection
   - Example: "Get a quote to swap 1 ETH for USDC on Ethereum"

2. **Token Information**: Get detailed information about any token
   - Retrieve token details like symbol, name, decimals, contract address
   - Token logos rendered when available
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
   - Advanced search with transaction hash and time filtering
   - Multi-chain support with detailed transaction metadata
   - Examples:
     - "Show me recent transaction history for wallet 0x742d35Cc6634C0532925a3b8D5C9E5E0d96B8C79"
     - "Get transaction history on Ethereum for this wallet"
     - "Search for a specific transaction hash in the last 30 days"
     - "Show me all transactions involving USDC token"

7. **Chart Data**: Historical price charts for token pairs with comprehensive visualization support
   - Line charts with multiple time periods (24H, 1W, 1M, 1Y, AllTime)
   - Candlestick charts with various intervals (5m, 15m, 1h, 4h, 1d, 1w)
   - Multi-chain support for all major blockchains
   - Chart data sent separately to client for rendering
   - Examples:
     - "Show me a 1-month line chart for WETH/USDC on Ethereum"
     - "Get candlestick chart data for BTC/ETH with 1-hour intervals"
     - "Display price history for MATIC/USDT on Polygon for the past week"

8. **Domain Operations**: Comprehensive domain name services and ENS resolution
   - Get provider data with avatars for addresses or domain names
   - Reverse lookup to find domains associated with addresses
   - Supports ENS and other domain protocols
   - Avatar and metadata retrieval with image rendering
   - Examples:
     - "Get domain information for vitalik.eth"
     - "Find domains associated with address 0x..."
     - "Look up avatar for ethereum.eth"
     - "Reverse lookup domains for these addresses: 0x..., 0x..."

9. **NFT Operations**: Comprehensive NFT information and management
   - Get supported chains for NFT API
   - Retrieve NFT collections by wallet address
   - Get detailed information about specific NFTs with image rendering
   - Supports Ethereum, Polygon, Arbitrum, Avalanche, Gnosis, Klaytn, Optimism, Base
   - Examples:
     - "What chains support NFT operations?"
     - "Show me all NFTs owned by address 0x..."
     - "Get details for NFT token ID 1234 on contract 0x... on Ethereum"

**Multi-Step Thinking Guidelines:**
- For wallet analysis: First get balances, then prices for significant holdings, then transaction history
- For comprehensive token analysis: Get token info, current prices, and historical charts
- For swap analysis: Get current prices first, then swap quotes with different amounts
- For domain analysis: Get domain info, then look up associated addresses if needed
- For NFT analysis: First check supported chains, then get collections, then specific NFT details

**Image Rendering**: Always render images in markdown format when image URLs are present in tool responses (NFT images, avatars, token logos) using ![description](url) format.

Think step by step about what tools you need to use and in what order. You can call multiple tools to build a comprehensive response.`,
  ],
  new MessagesPlaceholder("chat_history"),
  ["human", "{input}"],
]);

// Custom tool execution function
async function executeToolCall(toolName: string, args: any): Promise<string> {
  console.log(`Executing tool: ${toolName} with args:`, args);

  if (toolName in toolRegistry) {
    try {
      const toolFunction = toolRegistry[toolName as keyof typeof toolRegistry];
      const result = await toolFunction(args);
      console.log(
        `Tool ${toolName} result:`,
        typeof result === "string" ? result.substring(0, 200) + "..." : result
      );
      return typeof result === "string" ? result : JSON.stringify(result);
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      return `Error executing ${toolName}: ${
        error instanceof Error ? error.message : String(error)
      }`;
    }
  } else {
    console.error(`Tool ${toolName} not found in registry`);
    return `Tool ${toolName} not found`;
  }
}

// Create a simple chain for tool calling
const chain = RunnableSequence.from([agentPrompt, modelWithTools]);

// Helper function to process image URLs and convert them to markdown
function processImageUrls(content: string): string {
  if (typeof content !== "string") {
    return String(content);
  }

  let processedContent = content;
  const processedUrls = new Set<string>(); // Track URLs we've already processed

  // Process Avatar URLs first (highest priority)
  processedContent = processedContent.replace(
    /(\*\*Avatar:\*\*\s+)(https?:\/\/[^\s\n]+)/gi,
    (match, prefix, url) => {
      processedUrls.add(url);
      return `${prefix}${url}\n\n![Avatar](${url})`;
    }
  );

  // Process Image URLs
  processedContent = processedContent.replace(
    /(\*\*Image:\*\*\s+)(https?:\/\/[^\s\n]+)/gi,
    (match, prefix, url) => {
      if (!processedUrls.has(url)) {
        processedUrls.add(url);
        return `${prefix}${url}\n\n![NFT Image](${url})`;
      }
      return match; // Don't modify if already processed
    }
  );

  // Process Logo URLs
  processedContent = processedContent.replace(
    /(\*\*Logo:\*\*\s+)(https?:\/\/[^\s\n]+)/gi,
    (match, prefix, url) => {
      if (!processedUrls.has(url)) {
        processedUrls.add(url);
        return `${prefix}${url}\n\n![Token Logo](${url})`;
      }
      return match; // Don't modify if already processed
    }
  );

  // Process standalone image URLs that haven't been caught yet
  processedContent = processedContent.replace(
    /(https?:\/\/[^\s\n]*\.(jpg|jpeg|png|gif|webp|svg)(?:\?[^\s\n]*)?)/gi,
    (match, url) => {
      // Don't process if already handled or if it's already part of a markdown image
      if (
        processedUrls.has(url) ||
        (processedContent.includes(`![`) &&
          processedContent.includes(`](${url})`))
      ) {
        return url;
      }
      processedUrls.add(url);
      return `${url}\n\n![Image](${url})`;
    }
  );

  // Process IPFS and common hosting URLs (lowest priority)
  processedContent = processedContent.replace(
    /(https?:\/\/(?:euc\.li|opensea\.io\/static|lh3\.googleusercontent\.com|cloudflare-ipfs\.com)[^\s\n]+)/gi,
    (match, url) => {
      // Don't process if already handled or if it's already part of a markdown image
      if (processedUrls.has(url) || processedContent.includes(`](${url})`)) {
        return url;
      }
      processedUrls.add(url);
      return `${url}\n\n![Image](${url})`;
    }
  );

  return processedContent;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface GenerateResponseOptions {
  chatId: string;
  userMessage: string;
  userId?: string;
}

export const generateAIResponse = async ({
  chatId,
  userMessage,
}: GenerateResponseOptions): Promise<{
  content: string;
  toolsUsed?: string[];
  error?: string;
  chartData?: any;
}> => {
  try {
    console.log("=== AI RESPONSE GENERATION START ===");
    console.log("User input:", userMessage);
    console.log(
      "Available tools:",
      availableTools.map((t) => t.name)
    );

    // Get chat history from database (last 7 messages for context)
    const chatHistory = await getDbChatHistory(chatId, 7);
    console.log("Chat history length:", chatHistory.length);

    if (chatHistory.length > 0) {
      console.log(
        "Previous messages found:",
        chatHistory.map((msg) => ({
          type: msg.constructor.name,
          contentPreview:
            typeof msg.content === "string"
              ? msg.content.substring(0, 100) + "..."
              : "Complex content",
        }))
      );
    } else {
      console.log("No previous chat history found for chatId:", chatId);
    }

    let finalContent = "";
    let chartData: any = null;
    const toolsUsed: string[] = [];
    const allToolResults: string[] = [];

    // Maximum iterations for multi-step reasoning
    const maxIterations = 5;
    let iteration = 0;
    let currentInput = userMessage;
    let conversationHistory = [...chatHistory];

    while (iteration < maxIterations) {
      console.log(`\n=== ITERATION ${iteration + 1} ===`);

      // Call the chain to get response with potential tool calls
      const response = await chain.invoke({
        input: currentInput,
        chat_history: conversationHistory,
      });

      console.log(`Iteration ${iteration + 1} response:`, {
        content: response.content,
        hasToolCalls: (response.tool_calls?.length || 0) > 0,
        toolCallsCount: response.tool_calls?.length || 0,
      });

      // If no tool calls, we have a final response
      if (!response.tool_calls || response.tool_calls.length === 0) {
        let responseContent =
          typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content) || "";

        // Filter out internal processing language
        if (
          responseContent.includes("INTERNAL PROCESSING") ||
          responseContent.includes("The original request was") ||
          responseContent.includes(
            "Therefore, no additional tools are needed"
          ) ||
          responseContent.includes("What additional tools should be called")
        ) {
          // This looks like internal processing, synthesize a proper response instead
          if (allToolResults.length > 0) {
            console.log(
              "Detected internal processing response, synthesizing user-facing response..."
            );
            break; // Exit loop and synthesize final response
          } else {
            finalContent =
              "I apologize, but I couldn't process your request. Please try rephrasing your question.";
            break;
          }
        } else {
          finalContent = responseContent;
          break;
        }
      }

      // Process tool calls for this iteration
      const iterationResults: string[] = [];

      for (const toolCall of response.tool_calls) {
        console.log(`Executing tool call:`, toolCall);

        const toolName = toolCall.name;
        const toolArgs = toolCall.args;

        toolsUsed.push(toolName);

        // Execute the tool
        const toolResult = await executeToolCall(toolName, toolArgs);
        iterationResults.push(toolResult);
        allToolResults.push(toolResult);

        // Check for chart data
        if (toolName === "chart_data") {
          try {
            const parsedResult =
              typeof toolResult === "string"
                ? JSON.parse(toolResult)
                : toolResult;
            if (parsedResult.chartData) {
              chartData = parsedResult.chartData;
            }
          } catch (e) {
            console.log("Failed to parse chart data:", e);
          }
        }
      }

      // Add tool results to conversation history for next iteration
      conversationHistory.push(new HumanMessage(currentInput));

      const toolResultsSummary = iterationResults.join("\n\n");
      conversationHistory.push(
        new AIMessage(
          `Here are the results from the tools I just executed:\n\n${toolResultsSummary}`
        )
      );

      // Prepare input for next iteration - make it clear this is internal processing
      currentInput = `INTERNAL PROCESSING: Continue analyzing the original user request: "${userMessage}"

Based on the tool results below, determine if additional tool calls are needed or if you should provide a final response to the user.

Previous tool results:
${toolResultsSummary}

If you need more information, call additional tools. If you have enough information, DO NOT call any tools and instead provide a comprehensive final response to the user that synthesizes all the information gathered.`;

      iteration++;
    }

    // If we have tool results but no final content, synthesize a response
    if (!finalContent && allToolResults.length > 0) {
      console.log("Synthesizing final response from all tool results...");

      const allToolResultsSummary = allToolResults.join("\n\n");

      const synthesisPrompt = `Create a helpful, direct response to this user question: "${userMessage}"

Use the information below to answer their question clearly and concisely. Do not mention tool results, internal processing, or meta-information about how you gathered the data. Just provide the information the user requested in a natural, conversational way.

Available information:
${allToolResultsSummary}

Provide a clear, direct answer that addresses the user's question. Include specific details like prices, addresses, balances, etc. but present them in a user-friendly format.`;

      const synthesisResponse = await model.invoke([
        {
          role: "system",
          content:
            "You are a helpful AI assistant. Create a natural, conversational response for the user. Do not mention 'tool results', 'internal processing', 'additional tools', or any meta-information about how you gathered the data. Just answer the user's question directly using the provided information. Always render image URLs as markdown images using ![description](url) format.",
        },
        {
          role: "user",
          content: synthesisPrompt,
        },
      ]);

      finalContent =
        typeof synthesisResponse.content === "string"
          ? synthesisResponse.content
          : JSON.stringify(synthesisResponse.content) || allToolResultsSummary;
    }

    // If we still don't have content, provide a fallback
    if (!finalContent) {
      finalContent =
        "I apologize, but I couldn't process your request. Please try rephrasing your question.";
    }

    // Process image URLs in the final content
    finalContent = processImageUrls(finalContent);

    // Final filter to remove any internal processing language that might have slipped through
    finalContent = finalContent
      .replace(/INTERNAL PROCESSING:.*?\n/gi, "")
      .replace(
        /The original request was.*?Therefore, no additional tools are needed.*?\n/gi,
        ""
      )
      .replace(/What additional tools should be called.*?\n/gi, "")
      .replace(
        /Based on the tool results.*?complete the user's request\./gi,
        ""
      )
      .replace(
        /I've executed the following tools.*?Let me continue processing your request\./gi,
        ""
      )
      .trim();

    console.log("=== FINAL RESPONSE ===");
    console.log("Content length:", finalContent.length);
    console.log("Tools used:", toolsUsed);
    console.log("Total iterations:", iteration);
    console.log("Chart data present:", !!chartData);

    return {
      content: finalContent,
      toolsUsed: toolsUsed.length > 0 ? [...new Set(toolsUsed)] : undefined,
      chartData: chartData,
    };
  } catch (error: any) {
    console.error("Error generating AI response:", error);
    console.error("Stack trace:", error.stack);
    return {
      content:
        "I apologize, but I'm having trouble processing your request right now. Please try again later.",
      error: error.message,
    };
  }
};
