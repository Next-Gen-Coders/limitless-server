import { z } from "zod";

export const addMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message content is required")
    .max(10000, "Message content must be less than 10000 characters"),
  chatId: z.string().uuid("Valid chat ID is required"),
  userId: z.string().uuid("Valid user ID is required"),
  role: z.enum(["user", "assistant"], {
    required_error: "Role is required",
  }),
});

export type AddMessageRequest = z.infer<typeof addMessageSchema>;
