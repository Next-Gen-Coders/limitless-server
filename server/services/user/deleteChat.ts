import { db } from "../../db";
import { chats } from "../../db/schema";
import { eq } from "drizzle-orm";
import { DeleteChatRequest } from "../../zod";

export const deleteChat = async (data: DeleteChatRequest) => {
  try {
    const deletedChat = await db
      .delete(chats)
      .where(eq(chats.id, data.id))
      .returning();

    if (!deletedChat.length) {
      return {
        data: null,
        message: "Chat not found",
        error: "Chat not found",
      };
    }

    return {
      data: deletedChat[0],
      message: "Chat deleted successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to delete chat",
      error: error.message,
    };
  }
};
