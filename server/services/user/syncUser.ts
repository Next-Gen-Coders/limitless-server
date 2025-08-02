import { db } from "../../db";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { UserSyncRequest } from "../../zod";
import { randomUUID } from "crypto";

export const syncUser = async (data: UserSyncRequest) => {
  try {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.privyId, data.privyId));

    let user;
    if (existingUser.length > 0) {
      // Update existing user
      const updatedUser = await db
        .update(users)
        .set({
          email: data.email,
          walletAddress: data.walletAddress,
          linkedAccounts: data.linkedAccounts,
          updatedAt: new Date(),
        })
        .where(eq(users.privyId, data.privyId))
        .returning();

      user = updatedUser[0];
    } else {
      // Create new user
      const userId = randomUUID();
      const newUser = await db
        .insert(users)
        .values({
          id: userId,
          privyId: data.privyId,
          email: data.email,
          walletAddress: data.walletAddress,
          linkedAccounts: data.linkedAccounts,
        })
        .returning();

      user = newUser[0];
    }

    return {
      data: {
        user,
      },
      message:
        existingUser.length > 0
          ? "User updated successfully"
          : "User created successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: null,
      message: "Failed to sync user",
      error: error.message,
    };
  }
};
