import { z } from "zod";

export const GroupGetQuery = z.object({
  spaceEthereumAddress: z.string().startsWith("0x"),
});

export const GroupMembersQuery = z.object({
  spaceEthereumAddress: z.string().startsWith("0x"),
});

export const GroupAllOfMemberQuery = z.object({
  memberEthereumAddress: z.string().startsWith("0x"),
});

export const GroupCreateParams = z.object({
  name: z.string().max(20),
  symbol: z.string().max(5),
  description: z.string().max(50),
  adminEmailAddress: z.string().nullable(),
  adminPhoneNumber: z.string(),
  adminEthereumAddress: z.string().startsWith("0x"),
});

export const GroupAddMemberParams = z.object({
  spaceEthereumAddress: z.string().startsWith("0x"),
  memberEthereumAddress: z.string().startsWith("0x"),
  email: z.string().nullable(),
  phoneNumber: z.string(),
});

export type GroupGetQueryType = z.infer<typeof GroupGetQuery>;
export type GroupMembersQueryType = z.infer<typeof GroupMembersQuery>;
export type GroupAllOfMemberQueryType = z.infer<typeof GroupAllOfMemberQuery>;
export type GroupCreateParamsType = z.infer<typeof GroupCreateParams>;
export type GroupAddMemberParamsType = z.infer<typeof GroupAddMemberParams>;
