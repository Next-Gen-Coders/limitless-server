import { RequestHandler } from "express";
import { generateAIResponse } from "../services/ai/langchainService";
import * as ResponseHelper from "../utils/responseHelper";
import { randomUUID } from "crypto";
import { db } from "../db";
import { chats, messages, users } from "../db/schema";

// Test endpoint for AI functionality
export const testAIController: RequestHandler = async (req, res) => {
  try {
    const { message, chatId: existingChatId } = req.body;

    if (!message) {
      ResponseHelper.badRequest(res, "Message is required", "Missing message");
      return;
    }

    // Create a test user if it doesn't exist
    const testUserId = "00000000-0000-0000-0000-000000000001"; // Fixed test user ID
    const testPrivyId = "test-user";

    try {
      // Try to create test user (will fail if already exists, which is fine)
      await db
        .insert(users)
        .values({
          id: testUserId,
          privyId: testPrivyId,
          email: "test@example.com",
          walletAddress: "0x0000000000000000000000000000000000000000",
        })
        .onConflictDoNothing();
    } catch (error) {
      // User might already exist, continue
      console.log("Test user might already exist:", error);
    }

    // Use existing chat ID if provided, otherwise create a new one
    const testChatId = existingChatId || randomUUID();

    // Create a test chat in the database (only if it's a new chat)
    if (!existingChatId) {
      try {
        await db.insert(chats).values({
          id: testChatId,
          userId: testUserId,
          title: `Test Chat - ${new Date().toISOString()}`,
        });
      } catch (error) {
        console.log("Error creating test chat:", error);
      }
    }

    // Generate AI response
    const response = await generateAIResponse({
      chatId: testChatId,
      userMessage: message,
      userId: testUserId,
    });

    // Store the user message and AI response in the database
    try {
      // Store user message
      await db.insert(messages).values({
        id: randomUUID(),
        chatId: testChatId,
        userId: testUserId,
        role: "user",
        content: message,
      });

      // Store AI response
      await db.insert(messages).values({
        id: randomUUID(),
        chatId: testChatId,
        userId: testUserId,
        role: "assistant",
        content: response.content,
      });
    } catch (error) {
      console.log("Error storing messages:", error);
    }

    const responseData: any = {
      response: response.content,
      toolsUsed: response.toolsUsed,
      error: response.error,
      chatId: testChatId, // Return the chat ID for reference
    };

    // Add chartData if present
    if (response.chartData) {
      responseData.chartData = response.chartData;
    }

    ResponseHelper.success(
      res,
      responseData,
      "AI response generated successfully"
    );
  } catch (error: any) {
    console.error("Test AI Controller Error:", error);
    ResponseHelper.error(res, error.message, "Failed to generate AI response");
  }
};
