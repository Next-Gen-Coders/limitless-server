import { z } from "zod";

// Store Delegation Schema
export const storeDelegationSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  chainId: z.number().int().positive("Chain ID must be a positive integer"),
  delegator: z.string().min(1, "Delegator address is required"),
  delegatee: z.string().min(1, "Delegatee address is required"),
  nonce: z.string().min(1, "Nonce is required"),
  authority: z.string().min(1, "Authority address is required"),
  signature: z.string().min(1, "Signature is required"),
  status: z
    .enum(["pending", "confirmed", "failed"])
    .optional()
    .default("pending"),
  transactionHash: z.string().optional(),
});

// Get Delegations Schema
export const getDelegationsSchema = z.object({
  address: z.string().min(1, "Address is required"),
});

// Get Delegations Query Schema
export const getDelegationsQuerySchema = z.object({
  chainId: z.string().regex(/^\d+$/, "Chain ID must be a number").optional(),
});

// Delegation Response Schema
export const delegationResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  chainId: z.number(),
  delegator: z.string(),
  delegatee: z.string(),
  nonce: z.string(),
  authority: z.string(),
  signature: z.string(),
  status: z.enum(["pending", "confirmed", "failed"]).optional(),
  transactionHash: z.string().optional(),
  createdAt: z.string(),
});

export type StoreDelegationRequest = z.infer<typeof storeDelegationSchema>;
export type GetDelegationsRequest = z.infer<typeof getDelegationsSchema>;
export type GetDelegationsQuery = z.infer<typeof getDelegationsQuerySchema>;
export type DelegationData = z.infer<typeof delegationResponseSchema>;
