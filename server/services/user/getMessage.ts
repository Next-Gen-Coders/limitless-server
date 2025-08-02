import { db } from "../../db";
import { messages } from "../../db/schema";
import { eq } from "drizzle-orm";
import { GetMessageRequest } from "../../zod";

export const getMessage = async (data: GetMessageRequest) => {
  try {
    const message = await db
      .select()
      .from(messages)
      .where(eq(messages.id, data.id));

    if (!message.length) {
      return {
        data: null,
        message: "Message not found",
        error: "Message not found",
      };
    }

    return {
      data: message[0],
      message: "Message retrieved successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to retrieve message",
      error: error.message,
    };
  }
};
