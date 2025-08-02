import { db } from "../../db";
import { delegations } from "../../db/schema";
import { eq, and, desc, SQL } from "drizzle-orm";
import { GetDelegationsRequest } from "../../zod";

export const getDelegationsByAddress = async (
  data: GetDelegationsRequest,
  chainId?: number
) => {
  try {
    let whereCondition: SQL<unknown> = eq(delegations.delegator, data.address);

    if (chainId) {
      whereCondition = and(
        eq(delegations.delegator, data.address),
        eq(delegations.chainId, chainId)
      )!;
    }

    const userDelegations = await db
      .select()
      .from(delegations)
      .where(whereCondition)
      .orderBy(desc(delegations.createdAt));

    return {
      data: userDelegations,
      count: userDelegations.length,
      message: "Delegations retrieved successfully",
      error: null,
    };
  } catch (error: any) {
    return {
      data: [],
      count: 0,
      message: "Failed to retrieve delegations",
      error: error.message,
    };
  }
};
