import { z } from "zod";

export const addChatSchema = z.object({
  title: z
    .string()
    .min(1, "Chat title is required")
    .max(255, "Chat title must be less than 255 characters"),
  userId: z.string().uuid("Valid user ID is required"),
});

export type AddChatRequest = z.infer<typeof addChatSchema>;
