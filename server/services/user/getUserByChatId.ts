import { db } from "../../db";
import { users, chats } from "../../db/schema";
import { eq } from "drizzle-orm";

export const getUserByChatId = async (chatId: string) => {
  try {
    const result = await db
      .select({
        id: users.id,
        privyId: users.privyId,
        email: users.email,
        walletAddress: users.walletAddress,
        linkedAccounts: users.linkedAccounts,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(chats)
      .innerJoin(users, eq(chats.userId, users.id))
      .where(eq(chats.id, chatId));

    if (!result.length) {
      return {
        data: null,
        message: "User not found for this chat",
        error: "User not found for this chat",
      };
    }

    return {
      data: result[0],
      message: "User retrieved successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to retrieve user for chat",
      error: error.message,
    };
  }
};