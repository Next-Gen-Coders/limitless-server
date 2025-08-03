import { db } from "../../db";
import { messages } from "../../db/schema";
import { eq, desc } from "drizzle-orm";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

/**
 * Fetch chat history from database with limit
 * Returns messages in chronological order (oldest first) for LangChain
 */
export async function getChatHistory(chatId: string, limit = 5) {
  try {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    if (!result || result.length === 0) return [];

    // Convert to LangChain messages and reverse to get chronological order (oldest first)
    return result.reverse().map((msg) => {
      if (msg.role === "user") return new HumanMessage(msg.content);
      if (msg.role === "assistant") return new AIMessage(msg.content);
      return new HumanMessage(msg.content); // fallback
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
}

/**
 * Get recent messages for context (used for conversation buffer)
 * Returns raw message data for analysis
 */
export async function getRecentMessages(chatId: string, limit = 10) {
  try {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    return result.reverse(); // Return in chronological order
  } catch (error) {
    console.error("Error fetching recent messages:", error);
    return [];
  }
}
