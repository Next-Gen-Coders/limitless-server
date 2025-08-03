import { db } from "../../db";
import { messages } from "../../db/schema";
import { AddMessageRequest } from "../../zod";
import { randomUUID } from "crypto";
import { generateAIResponse } from "../ai/langchainService";

export interface CreateMessageResponse {
  userMessage: any;
  aiMessage?: any;
  toolsUsed?: string[];
  chartData?: any;
  error?: string;
}

export const createMessage = async (
  data: AddMessageRequest
): Promise<{
  data: CreateMessageResponse | any;
  message: string;
  error: any;
}> => {
  try {
    // First, create the user message
    const userMessageId = randomUUID();
    const newUserMessage = await db
      .insert(messages)
      .values({
        id: userMessageId,
        chatId: data.chatId,
        userId: data.userId,
        content: data.content,
        role: data.role,
      })
      .returning();

    const userMessage = newUserMessage[0];

    // If the message is from a user, generate an AI response
    if (data.role === "user") {
      try {
        // Generate AI response using database memory
        const aiResponse = await generateAIResponse({
          chatId: data.chatId,
          userMessage: data.content,
          userId: data.userId,
        });

        if (aiResponse.error) {
          console.error("AI Response Error:", aiResponse.error);
          // Return just the user message if AI fails
          return {
            data: { userMessage },
            message: "Message created successfully (AI response failed)",
            error: null,
          };
        }

        // Create AI response message
        const aiMessageId = randomUUID();
        const newAIMessage = await db
          .insert(messages)
          .values({
            id: aiMessageId,
            chatId: data.chatId,
            userId: data.userId, // Same user context
            content: aiResponse.content,
            role: "assistant",
          })
          .returning();

        const aiMessage = newAIMessage[0];

        return {
          data: {
            userMessage,
            aiMessage,
            toolsUsed: aiResponse.toolsUsed,
            chartData: aiResponse.chartData,
          },
          message: "Messages created successfully with AI response",
          error: null,
        };
      } catch (aiError: any) {
        console.error("Error generating AI response:", aiError);
        // Return just the user message if AI fails
        return {
          data: { userMessage },
          message: "Message created successfully (AI response failed)",
          error: null,
        };
      }
    }

    // For non-user messages (assistant), just return the created message
    return {
      data: userMessage,
      message: "Message created successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to create message",
      error: error.message,
    };
  }
};
