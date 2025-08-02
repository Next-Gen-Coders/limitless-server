CREATE TABLE "delegations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_address" text NOT NULL,
	"nonce" text NOT NULL,
	"implementation" text NOT NULL,
	"signature" text NOT NULL,
	"chain_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "unique_delegation_per_address_nonce_chain" UNIQUE("user_address","nonce","chain_id")
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "privy_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "wallet_address" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "linked_accounts" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
CREATE INDEX "idx_delegations_user_address" ON "delegations" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "idx_delegations_chain_id" ON "delegations" USING btree ("chain_id");--> statement-breakpoint
CREATE INDEX "idx_delegations_created_at" ON "delegations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_users_privy_id" ON "users" USING btree ("privy_id");--> statement-breakpoint
CREATE INDEX "idx_users_wallet_address" ON "users" USING btree ("wallet_address");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "privy_user_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "last_sign_in_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "raw_app_meta_data";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "raw_user_meta_data";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_privy_id_unique" UNIQUE("privy_id");