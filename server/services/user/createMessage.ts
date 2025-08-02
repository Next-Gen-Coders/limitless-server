import { db } from "../../db";
import { messages } from "../../db/schema";
import { eq } from "drizzle-orm";
import { AddMessageRequest } from "../../zod";
import { randomUUID } from "crypto";

export const createMessage = async (data: AddMessageRequest) => {
  try {
    const messageId = randomUUID();
    const newMessage = await db
      .insert(messages)
      .values({
        id: messageId,
        chatId: data.chatId,
        userId: data.userId,
        content: data.content,
        role: data.role,
      })
      .returning();

    return {
      data: newMessage[0],
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
