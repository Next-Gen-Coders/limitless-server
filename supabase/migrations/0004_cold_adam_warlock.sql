CREATE TABLE "wallet_transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"user_address" text NOT NULL,
	"target_address" text NOT NULL,
	"value" text NOT NULL,
	"data" text,
	"chain_id" integer NOT NULL,
	"transaction_hash" text,
	"status" text DEFAULT 'pending',
	"gas_used" text,
	"gas_price" text,
	"error_message" text,
	"is_batch" integer DEFAULT 0,
	"batch_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "encrypted_private_key" text;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_wallet_transactions_user_id" ON "wallet_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_transactions_user_address" ON "wallet_transactions" USING btree ("user_address");--> statement-breakpoint
CREATE INDEX "idx_wallet_transactions_status" ON "wallet_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_wallet_transactions_chain_id" ON "wallet_transactions" USING btree ("chain_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_transactions_batch_id" ON "wallet_transactions" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_wallet_transactions_created_at" ON "wallet_transactions" USING btree ("created_at");