// db/schema.ts
import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

// Users table (stores user profiles)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  email: text("email").unique().notNull(),
  ethereumAddress: text("ethereum_address").unique().notNull(),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Groups table (stores group information)
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  spaceContractAddress: text("space_contract_address").unique().notNull(),
  inviteContractAddress: text("invite_contract_address").notNull(),
  sharesContractAddress: text("invite_contract_address").notNull(),
  treasuryContractAddress: text("invite_contract_address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Messages table (stores chat messages)
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .references(() => groups.id, { onDelete: "cascade" })
    .notNull(),
  senderId: integer("sender_id").references(() => users.id, {
    onDelete: "set null",
  }),
  content: text("content").notNull(),
  notification: text("notification"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  editedAt: timestamp("edited_at"),
});
