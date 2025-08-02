import { db } from "../../db";
import { messages } from "../../db/schema";
import { eq } from "drizzle-orm";
import { UpdateMessageRequest } from "../../zod";

export const updateMessage = async (data: UpdateMessageRequest) => {
  try {
    const updatedMessage = await db
      .update(messages)
      .set({
        content: data.content,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, data.id))
      .returning();

    if (!updatedMessage.length) {
      return {
        data: null,
        message: "Message not found",
        error: "Message not found",
      };
    }

    return {
      data: updatedMessage[0],
      message: "Message updated successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to update message",
      error: error.message,
    };
  }
};
