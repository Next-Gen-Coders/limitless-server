import { db } from "../../db";
import { messages } from "../../db/schema";
import { eq } from "drizzle-orm";
import { DeleteMessageRequest } from "../../zod";

export const deleteMessage = async (data: DeleteMessageRequest) => {
  try {
    const deletedMessage = await db
      .delete(messages)
      .where(eq(messages.id, data.id))
      .returning();

    if (!deletedMessage.length) {
      return {
        data: null,
        message: "Message not found",
        error: "Message not found",
      };
    }

    return {
      data: deletedMessage[0],
      message: "Message deleted successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to delete message",
      error: error.message,
    };
  }
};
