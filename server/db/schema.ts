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

// Delegations table for EIP-7702 smart wallet delegations
export const delegations = pgTable(
  "delegations",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    chainId: integer("chain_id").notNull(),
    delegator: text("delegator").notNull(), // User's wallet address
    delegatee: text("delegatee").notNull(), // Smart account address
    nonce: text("nonce").notNull(),
    authority: text("authority").notNull(),
    signature: text("signature").notNull(),
    status: text("status").default("pending"), // 'pending' | 'confirmed' | 'failed'
    transactionHash: text("transaction_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIndex: index("idx_delegations_user_id").on(table.userId),
    delegatorIndex: index("idx_delegations_delegator").on(table.delegator),
    chainIdIndex: index("idx_delegations_chain_id").on(table.chainId),
    createdAtIndex: index("idx_delegations_created_at").on(table.createdAt),
    uniqueDelegation: unique("unique_delegation_per_user_chain_nonce").on(
      table.userId,
      table.chainId,
      table.nonce
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

// Users
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

// Delegations
export const insertDelegationSchema = createInsertSchema(delegations);
export const selectDelegationSchema = createSelectSchema(delegations);
export type InsertDelegation = typeof delegations.$inferInsert;
export type SelectDelegation = typeof delegations.$inferSelect;

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
