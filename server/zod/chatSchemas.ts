import { z } from "zod";

// Update Chat Schema
export const updateChatSchema = z.object({
  id: z.string().uuid("Valid chat ID is required"),
  title: z
    .string()
    .min(1, "Chat title is required")
    .max(255, "Chat title must be less than 255 characters"),
});

// Get Chat Schema
export const getChatSchema = z.object({
  id: z.string().uuid("Valid chat ID is required"),
});

// Delete Chat Schema
export const deleteChatSchema = z.object({
  id: z.string().uuid("Valid chat ID is required"),
});

// Get Chats by User Schema
export const getChatsByUserSchema = z.object({
  userId: z.string().uuid("Valid user ID is required"),
});

export type UpdateChatRequest = z.infer<typeof updateChatSchema>;
export type GetChatRequest = z.infer<typeof getChatSchema>;
export type DeleteChatRequest = z.infer<typeof deleteChatSchema>;
export type GetChatsByUserRequest = z.infer<typeof getChatsByUserSchema>;
