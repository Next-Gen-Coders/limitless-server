import { db } from "../../db";
import { chats } from "../../db/schema";
import { eq } from "drizzle-orm";
import { AddChatRequest } from "../../zod";
import { randomUUID } from "crypto";

export const createChat = async (data: AddChatRequest) => {
  try {
    const chatId = randomUUID();
    const newChat = await db
      .insert(chats)
      .values({
        id: chatId,
        userId: data.userId,
        title: data.title,
      })
      .returning();

    return {
      data: newChat[0],
      message: "Chat created successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to create chat",
      error: error.message,
    };
  }
};
