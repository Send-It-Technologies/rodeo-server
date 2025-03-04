CREATE TABLE "groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"space_contract_address" text NOT NULL,
	"invite_contract_address" text NOT NULL,
	"shares_contract_address" text NOT NULL,
	"treasury_contract_address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groups_space_contract_address_unique" UNIQUE("space_contract_address")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"group_id" integer NOT NULL,
	"member_ethereum_address" text NOT NULL,
	"email" text,
	"phone_number" text NOT NULL,
	CONSTRAINT "members_group_id_member_ethereum_address_pk" PRIMARY KEY("group_id","member_ethereum_address")
);
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;