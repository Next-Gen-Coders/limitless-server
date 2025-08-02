ALTER TABLE "delegations" DROP CONSTRAINT "unique_delegation_per_address_nonce_chain";--> statement-breakpoint
DROP INDEX "idx_delegations_user_address";--> statement-breakpoint
ALTER TABLE "delegations" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "delegations" ADD COLUMN "delegator" text NOT NULL;--> statement-breakpoint
ALTER TABLE "delegations" ADD COLUMN "delegatee" text NOT NULL;--> statement-breakpoint
ALTER TABLE "delegations" ADD COLUMN "authority" text NOT NULL;--> statement-breakpoint
ALTER TABLE "delegations" ADD COLUMN "status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "delegations" ADD COLUMN "transaction_hash" text;--> statement-breakpoint
ALTER TABLE "delegations" ADD CONSTRAINT "delegations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_delegations_user_id" ON "delegations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_delegations_delegator" ON "delegations" USING btree ("delegator");--> statement-breakpoint
ALTER TABLE "delegations" DROP COLUMN "user_address";--> statement-breakpoint
ALTER TABLE "delegations" DROP COLUMN "implementation";--> statement-breakpoint
ALTER TABLE "delegations" ADD CONSTRAINT "unique_delegation_per_user_chain_nonce" UNIQUE("user_id","chain_id","nonce");