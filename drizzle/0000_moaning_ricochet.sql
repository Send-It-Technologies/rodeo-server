CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"space_contract_address" text NOT NULL,
	"invite_contract_address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groups_space_contract_address_unique" UNIQUE("space_contract_address")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" integer NOT NULL,
	"ethereum_address" text NOT NULL,
	"content" text NOT NULL,
	"notification" text,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"edited_at" timestamp,
	CONSTRAINT "messages_ethereum_address_unique" UNIQUE("ethereum_address")
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;