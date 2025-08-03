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

// Swap transactions table for cross-chain swaps
export const swapTransactions = pgTable(
  "swap_transactions",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
    chatId: uuid("chat_id").references(() => chats.id),
    messageId: uuid("message_id").references(() => messages.id),

    // Swap Details
    srcChainId: integer("src_chain_id").notNull(),
    dstChainId: integer("dst_chain_id").notNull(),
    srcTokenAddress: text("src_token_address").notNull(),
    dstTokenAddress: text("dst_token_address").notNull(),
    amount: text("amount").notNull(), // Store as string to handle big numbers

    // 1inch specific
    quoteId: text("quote_id"),
    orderHash: text("order_hash"),

    // Transaction Status
    status: text("status").notNull().default("pending"), // pending, processing, completed, failed

    // Metadata
    walletAddress: text("wallet_address").notNull(),
    quote: jsonb("quote"), // Store full quote response
    secrets: jsonb("secrets"), // Store secrets for order execution
    secretHashes: jsonb("secret_hashes"),
    errorDetails: jsonb("error_details"),

    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIndex: index("idx_swap_transactions_user_id").on(table.userId),
    orderHashIndex: index("idx_swap_transactions_order_hash").on(
      table.orderHash
    ),
    statusIndex: index("idx_swap_transactions_status").on(table.status),
  })
);

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

// Swap Transactions
export const insertSwapTransactionSchema = createInsertSchema(swapTransactions);
export const selectSwapTransactionSchema = createSelectSchema(swapTransactions);
export type InsertSwapTransaction = typeof swapTransactions.$inferInsert;
export type SelectSwapTransaction = typeof swapTransactions.$inferSelect;
