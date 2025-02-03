import { eq, asc } from "drizzle-orm";
import {
  users,
  groups,
  groupMembers,
  messages,
  groupMemberRoleEnum,
} from "./schema";
import { NeonDatabase } from "drizzle-orm/neon-serverless";

export type User = typeof users.$inferSelect;
export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;
export type Message = typeof messages.$inferSelect;

// Get user by ethereumAddress
export async function getUserByEthereumAddress(
  db: NeonDatabase,
  address: string
): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.ethereumAddress, address))
    .limit(1)
    .execute();

  return user;
}

// Get group by id
export async function getGroupById(
  db: NeonDatabase,
  groupId: number
): Promise<Group> {
  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1)
    .execute();

  return group;
}

// Get all groups of a user
export async function getUserGroups(
  db: NeonDatabase,
  userId: number
): Promise<Group[]> {
  const result = await db
    .select({ groups })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.userId, userId))
    .execute();

  return result.map((row) => row.groups);
}

// Get all groupMembers of a group
export async function getGroupMembers(
  db: NeonDatabase,
  groupId: number
): Promise<GroupMember[]> {
  return await db
    .select()
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId))
    .execute();
}

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

// Create new user
export async function createUser(
  db: NeonDatabase,
  userData: Omit<User, "id" | "createdAt" | "profileImageUrl"> & {
    profileImageUrl?: string;
  }
): Promise<User> {
  const [newUser] = await db
    .insert(users)
    .values({
      ...userData,
      createdAt: new Date(),
    })
    .returning();

  return newUser;
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

// Add a user as a group member with the admin role
export async function addAdminToGroup(
  db: NeonDatabase,
  groupId: number,
  userId: number
): Promise<GroupMember> {
  const [member] = await db
    .insert(groupMembers)
    .values({
      groupId,
      userId,
      role: groupMemberRoleEnum.enumValues[0], // 'admin'
      joinedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  return member;
}

// Add a user as a group member with the member role
export async function addMemberToGroup(
  db: NeonDatabase,
  groupId: number,
  userId: number
): Promise<GroupMember> {
  const [member] = await db
    .insert(groupMembers)
    .values({
      groupId,
      userId,
      role: groupMemberRoleEnum.enumValues[1], // 'member'
      joinedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning();

  return member;
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
