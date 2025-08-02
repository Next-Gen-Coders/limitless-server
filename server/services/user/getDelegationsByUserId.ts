import { db } from "../../db";
import { delegations } from "../../db/schema";
import { eq, desc } from "drizzle-orm";

export const getDelegationsByUserId = async (userId: string) => {
  try {
    const userDelegations = await db
      .select()
      .from(delegations)
      .where(eq(delegations.userId, userId))
      .orderBy(desc(delegations.createdAt));

    return {
      data: userDelegations,
      message: "Delegations retrieved successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: [],
      message: "Failed to retrieve delegations",
      error: error.message,
    };
  }
};
