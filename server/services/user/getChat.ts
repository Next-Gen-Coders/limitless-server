import { db } from "../../db";
import { chats } from "../../db/schema";
import { eq } from "drizzle-orm";
import { GetChatRequest } from "../../zod";

export const getChat = async (data: GetChatRequest) => {
  try {
    const chat = await db.select().from(chats).where(eq(chats.id, data.id));

    if (!chat.length) {
      return {
        data: null,
        message: "Chat not found",
        error: "Chat not found",
      };
    }

    return {
      data: chat[0],
      message: "Chat retrieved successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to retrieve chat",
      error: error.message,
    };
  }
};
