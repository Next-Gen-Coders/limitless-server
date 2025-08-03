CREATE TABLE "swap_transactions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"chat_id" uuid,
	"message_id" uuid,
	"src_chain_id" integer NOT NULL,
	"dst_chain_id" integer NOT NULL,
	"src_token_address" text NOT NULL,
	"dst_token_address" text NOT NULL,
	"amount" text NOT NULL,
	"quote_id" text,
	"order_hash" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"wallet_address" text NOT NULL,
	"quote" jsonb,
	"secrets" jsonb,
	"secret_hashes" jsonb,
	"error_details" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "swap_transactions" ADD CONSTRAINT "swap_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_transactions" ADD CONSTRAINT "swap_transactions_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swap_transactions" ADD CONSTRAINT "swap_transactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_swap_transactions_user_id" ON "swap_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_swap_transactions_order_hash" ON "swap_transactions" USING btree ("order_hash");--> statement-breakpoint
CREATE INDEX "idx_swap_transactions_status" ON "swap_transactions" USING btree ("status");