import { eq } from "drizzle-orm";
import { users } from "../schema";
import { NeonDatabase } from "drizzle-orm/neon-serverless";

export type User = typeof users.$inferSelect;

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
