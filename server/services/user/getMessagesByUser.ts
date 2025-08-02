import { db } from "../../db";
import { messages } from "../../db/schema";
import { eq } from "drizzle-orm";
import { GetMessagesByUserRequest } from "../../zod";

export const getMessagesByUser = async (data: GetMessagesByUserRequest) => {
  try {
    const userMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.userId, data.userId));

    return {
      data: userMessages,
      message: "User messages retrieved successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to retrieve user messages",
      error: error.message,
    };
  }
};
