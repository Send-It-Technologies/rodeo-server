import { eq, and } from "drizzle-orm";
import { groups, members } from "../schema";
import { NeonDatabase } from "drizzle-orm/neon-serverless";

export type Group = typeof groups.$inferSelect;
export type Member = typeof members.$inferSelect;
export type MemberWithGroups = Member & { groups: Group[] };

// Get group by id
export async function getGroupBySpaceEthereumAddress(
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

// Add member to group
export async function addMemberToGroup(
  db: NeonDatabase,
  groupId: number,
  memberAddress: string,
  phoneNumber: string,
  email: string | null
): Promise<void> {
  await db
    .insert(members)
    .values({
      groupId,
      memberEthereumAddress: memberAddress,
      email: email || null,
      phoneNumber,
    })
    .execute();
}

// Remove member from  group
export async function removeMemberFromGroup(
  db: NeonDatabase,
  groupId: number,
  memberAddress: string
): Promise<void> {
  await db
    .delete(members)
    .where(
      and(
        eq(members.groupId, groupId),
        eq(members.memberEthereumAddress, memberAddress)
      )
    )
    .execute();
}

// Get all groups of a member
export async function getGroupsByMemberAddress(
  db: NeonDatabase,
  memberAddress: string
): Promise<Group[]> {
  const result = await db
    .select({ group: groups })
    .from(members)
    .innerJoin(groups, eq(members.groupId, groups.id))
    .where(eq(members.memberEthereumAddress, memberAddress))
    .execute();

  return result.map((row) => row.group);
}

// Get members in specific group
export async function getMembersByGroupId(
  db: NeonDatabase,
  groupId: number
): Promise<Pick<Member, "memberEthereumAddress" | "email">[]> {
  return await db
    .select({
      memberEthereumAddress: members.memberEthereumAddress,
      email: members.email,
    })
    .from(members)
    .where(eq(members.groupId, groupId))
    .execute();
}

// Get all members across groups with their group associations
export async function getAllMembersWithGroups(
  db: NeonDatabase
): Promise<
  { memberEthereumAddress: string; email: string; groups: Group[] }[]
> {
  const result = await db
    .select({
      memberEthereumAddress: members.memberEthereumAddress,
      email: members.email,
      phoneNumber: members.phoneNumber,
      group: groups,
    })
    .from(members)
    .innerJoin(groups, eq(members.groupId, groups.id))
    .execute();

  // Group results by member address and email
  const memberMap = new Map<
    string,
    { email: string; phoneNumber: string; groups: Group[] }
  >();

  for (const row of result) {
    const key = `${row.memberEthereumAddress}-${row.email}`;
    if (!memberMap.has(key)) {
      memberMap.set(key, {
        email: row.email || "",
        phoneNumber: row.phoneNumber || "",
        groups: [],
      });
    }
    memberMap.get(key)?.groups.push(row.group);
  }

  return Array.from(memberMap.entries()).map(([key, value]) => ({
    memberEthereumAddress: key.split("-")[0],
    email: value.email,
    groups: value.groups,
  }));
}
