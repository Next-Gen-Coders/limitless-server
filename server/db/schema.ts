import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgSchema,
  jsonb,
  integer,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Define the 'auth' schema to correctly reference Supabase's auth tables
export const authSchema = pgSchema("auth");

// Updated users table for Privy integration
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    privyId: text("privy_id").unique().notNull(),
    email: text("email"),
    walletAddress: text("wallet_address"),
    linkedAccounts: jsonb("linked_accounts"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    privyIdIndex: index("idx_users_privy_id").on(table.privyId),
    walletAddressIndex: index("idx_users_wallet_address").on(
      table.walletAddress
    ),
  })
);

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey(),
  chatId: uuid("chat_id").references(() => chats.id),
  userId: uuid("user_id").references(() => users.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
// Smart wallet transactions table for EIP-7702
// Users
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;

// Chats
export const insertChatSchema = createInsertSchema(chats);
export const selectChatSchema = createSelectSchema(chats);
export type InsertChat = typeof chats.$inferInsert;
export type SelectChat = typeof chats.$inferSelect;

// Messages
export const insertMessageSchema = createInsertSchema(messages);
export const selectMessageSchema = createSelectSchema(messages);
export type InsertMessage = typeof messages.$inferInsert;
export type SelectMessage = typeof messages.$inferSelect;
