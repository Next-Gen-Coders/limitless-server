import { db } from "../../db";
import { chats } from "../../db/schema";
import { eq } from "drizzle-orm";
import { UpdateChatRequest } from "../../zod";

export const updateChat = async (data: UpdateChatRequest) => {
  try {
    const updatedChat = await db
      .update(chats)
      .set({
        title: data.title,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, data.id))
      .returning();

    if (!updatedChat.length) {
      return {
        data: null,
        message: "Chat not found",
        error: "Chat not found",
      };
    }

    return {
      data: updatedChat[0],
      message: "Chat updated successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to update chat",
      error: error.message,
    };
  }
};
