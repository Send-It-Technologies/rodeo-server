import { eq } from "drizzle-orm";
import { users, groups } from "../schema";
import { NeonDatabase } from "drizzle-orm/neon-serverless";

export type User = typeof users.$inferSelect;
export type Group = typeof groups.$inferSelect;

// Get group by id
export async function getGroupByspaceEthereumAddress(
  db: NeonDatabase,
  spaceEthereumAddress: string
): Promise<Group> {
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.spaceContractAddress, spaceEthereumAddress))
    .limit(1)
    .execute();

  return group;
}

// Get all groups
export async function getAllGroups(db: NeonDatabase): Promise<Group[]> {
  const all = await db.select().from(groups).execute();
  return all;
}

// Create new group
export async function createGroup(
  db: NeonDatabase,
  groupData: Omit<Group, "id" | "createdAt" | "createdBy"> & {
    createdBy?: number;
  }
): Promise<Group> {
  const [newGroup] = await db
    .insert(groups)
    .values({
      ...groupData,
      createdAt: new Date(),
    })
    .returning();

  return newGroup;
}
