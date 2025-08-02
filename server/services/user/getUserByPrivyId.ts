import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { GetUserRequest } from "../../zod";

export const getUserByPrivyId = async (data: GetUserRequest) => {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.privyId, data.privyId));

    if (!user.length) {
      return {
        data: null,
        message: "User not found",
        error: "User not found",
      };
    }

    return {
      data: user[0],
      message: "User retrieved successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to retrieve user",
      error: error.message,
    };
  }
};
