import { db } from "../../db";
import { delegations } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import { StoreDelegationRequest } from "../../zod";
import { randomUUID } from "crypto";

export const storeDelegation = async (data: StoreDelegationRequest) => {
  try {
    const delegationId = randomUUID();
    const newDelegation = await db
      .insert(delegations)
      .values({
        id: delegationId,
        userId: data.userId,
        chainId: data.chainId,
        delegator: data.delegator,
        delegatee: data.delegatee,
        nonce: data.nonce,
        authority: data.authority,
        signature: data.signature,
        status: data.status || "pending",
        transactionHash: data.transactionHash,
      })
      .returning();

    return {
      data: newDelegation[0],
      message: "Delegation stored successfully",
      error: null,
    };
  } catch (error: any) {
    // Handle unique constraint violation
    if (error.code === "23505" || error.message.includes("duplicate")) {
      return {
        data: null,
        message: "Delegation already exists for this user, nonce, and chain",
        error: "DUPLICATE_DELEGATION",
      };
    }

    return {
      data: null,
      message: "Failed to store delegation",
      error: error.message,
    };
  }
};
