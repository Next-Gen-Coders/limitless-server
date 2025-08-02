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
const SYSTEM_PROMPT = `You are a helpful AI assistant for the Limitless platform. You have access to powerful DeFi tools:

1. **1inch Fusion Swap**: Get real-time swap quotes and rates across multiple blockchains
   - Supports Ethereum, Polygon, BSC, Arbitrum, Optimism, and more
   - Get best rates for token swaps with slippage protection
   - Example: "Get a quote to swap 1 ETH for USDC on Ethereum"

When users ask about token swaps, DeFi operations, or cryptocurrency exchanges, use the 1inch tool to provide accurate, real-time information.

Guidelines:
- Always be polite and professional
- Provide clear explanations of swap quotes and rates
- Include important details like slippage, gas estimates, and chains
- Warn users that quotes are informational and actual execution requires wallet interaction
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
