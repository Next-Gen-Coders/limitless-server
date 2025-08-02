import { db } from "../../db";
import { messages } from "../../db/schema";
import { eq } from "drizzle-orm";
import { GetMessagesByChatRequest } from "../../zod";

export const getMessagesByChat = async (data: GetMessagesByChatRequest) => {
  try {
    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, data.chatId));

    return {
      data: chatMessages,
      message: "Chat messages retrieved successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to retrieve chat messages",
      error: error.message,
    };
  }
};
