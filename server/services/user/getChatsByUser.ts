import { db } from "../../db";
import { chats } from "../../db/schema";
import { eq } from "drizzle-orm";
import { GetChatsByUserRequest } from "../../zod";

export const getChatsByUser = async (data: GetChatsByUserRequest) => {
  try {
    const userChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, data.userId));

    return {
      data: userChats,
      message: "User chats retrieved successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to retrieve user chats",
      error: error.message,
    };
  }
};
