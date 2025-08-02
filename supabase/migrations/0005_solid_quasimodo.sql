DROP TABLE "delegations" CASCADE;--> statement-breakpoint
DROP TABLE "wallet_transactions" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "encrypted_private_key";