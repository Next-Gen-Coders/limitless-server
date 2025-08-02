import { z } from "zod";

// User Sync Schema
export const userSyncSchema = z.object({
  privyId: z.string().min(1, "Privy ID is required"),
  email: z.string().email().optional(),
  walletAddress: z.string().optional(),
  linkedAccounts: z.array(z.any()).optional(),
  createdAt: z.string().optional(),
});

// Get User Schema
export const getUserSchema = z.object({
  privyId: z.string().min(1, "Privy ID is required"),
});

// User Response Schema
export const userResponseSchema = z.object({
  id: z.string().uuid(),
  privyId: z.string(),
  email: z.string().optional(),
  walletAddress: z.string().optional(),
  linkedAccounts: z.array(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// User Sync Response Schema
export const userSyncResponseSchema = z.object({
  success: z.boolean(),
  user: userResponseSchema,
});

export type UserSyncRequest = z.infer<typeof userSyncSchema>;
export type GetUserRequest = z.infer<typeof getUserSchema>;
export type UserSyncResponse = z.infer<typeof userSyncResponseSchema>;
