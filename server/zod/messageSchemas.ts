import { z } from "zod";

// Update Message Schema
export const updateMessageSchema = z.object({
  id: z.string().uuid("Valid message ID is required"),
  content: z
    .string()
    .min(1, "Message content is required")
    .max(10000, "Message content must be less than 10000 characters"),
});

// Get Message Schema
export const getMessageSchema = z.object({
  id: z.string().uuid("Valid message ID is required"),
});

// Delete Message Schema
export const deleteMessageSchema = z.object({
  id: z.string().uuid("Valid message ID is required"),
});

// Get Messages by Chat Schema
export const getMessagesByChatSchema = z.object({
  chatId: z.string().uuid("Valid chat ID is required"),
});

// Get Messages by User Schema
export const getMessagesByUserSchema = z.object({
  userId: z.string().uuid("Valid user ID is required"),
});

export type UpdateMessageRequest = z.infer<typeof updateMessageSchema>;
export type GetMessageRequest = z.infer<typeof getMessageSchema>;
export type DeleteMessageRequest = z.infer<typeof deleteMessageSchema>;
export type GetMessagesByChatRequest = z.infer<typeof getMessagesByChatSchema>;
export type GetMessagesByUserRequest = z.infer<typeof getMessagesByUserSchema>;
