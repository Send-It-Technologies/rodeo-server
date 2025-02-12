import { z } from "zod";

export const GroupGetQuery = z.object({
  spaceEthereumAddress: z.string().startsWith("0x"),
});

export const GroupMembersQuery = z.object({
  spaceEthereumAddress: z.string().startsWith("0x"),
});

export const GroupCreateParams = z.object({
  name: z.string().max(20),
  symbol: z.string().max(5),
  description: z.string().max(50),
  adminEmailAddress: z.string(),
  adminEthereumAddress: z.string().startsWith("0x"),
});

export type GroupGetQueryType = z.infer<typeof GroupGetQuery>;
export type GroupMembersQueryType = z.infer<typeof GroupMembersQuery>;
export type GroupCreateParamsType = z.infer<typeof GroupCreateParams>;
