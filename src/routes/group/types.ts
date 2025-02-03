import { z } from "zod";

export const GroupGetQuery = z.object({
  groupId: z.number(),
});

export const GroupGetAllQuery = z.object({
  userId: z.number(),
});

export const GroupCreateParams = z.object({
  name: z.string().max(20),
  description: z.string().max(50),
  adminEthereumAddress: z.string(),
});

export type GroupGetQueryType = z.infer<typeof GroupGetQuery>;
export type GroupGetAllQueryType = z.infer<typeof GroupGetAllQuery>;
export type GroupCreateParamsType = z.infer<typeof GroupCreateParams>;
