import { eq, asc } from "drizzle-orm";
import { messages } from "../schema";
import { NeonDatabase } from "drizzle-orm/neon-serverless";

export type Message = typeof messages.$inferSelect;

// Get all messages of a group (ordered by sentAt ascending)
export async function getGroupMessages(
  db: NeonDatabase,
  groupId: number
): Promise<Message[]> {
  return await db
    .select()
    .from(messages)
    .where(eq(messages.groupId, groupId))
    .orderBy(asc(messages.sentAt))
    .execute();
}

// Add a new message to a group
export async function createMessage(
  db: NeonDatabase,
  messageData: Omit<Message, "id" | "sentAt" | "editedAt"> & {
    notification?: string;
  }
): Promise<Message> {
  const [newMessage] = await db
    .insert(messages)
    .values({
      ...messageData,
      sentAt: new Date(),
    })
    .returning();

  return newMessage;
}
