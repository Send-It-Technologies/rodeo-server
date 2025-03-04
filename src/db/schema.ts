// db/schema.ts
import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  primaryKey,
} from "drizzle-orm/pg-core";

// Groups table (stores group information)
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  spaceContractAddress: text("space_contract_address").unique().notNull(),
  inviteContractAddress: text("invite_contract_address").notNull(),
  sharesContractAddress: text("shares_contract_address").notNull(),
  treasuryContractAddress: text("treasury_contract_address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Members of a group
export const members = pgTable(
  "members",
  {
    groupId: integer("group_id")
      .references(() => groups.id, { onDelete: "cascade" })
      .notNull(),
    memberEthereumAddress: text("member_ethereum_address").notNull(),
    email: text("email"),
    phoneNumber: text("phone_number").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.groupId, table.memberEthereumAddress] }),
    };
  }
);
