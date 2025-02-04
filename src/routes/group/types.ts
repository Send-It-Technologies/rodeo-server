import { z } from "zod";

export const GroupGetQuery = z.object({
  spaceEthereumAddress: z.string(),
});

export const GroupCreateParams = z.object({
  name: z.string().max(20),
  description: z.string().max(50),
  spaceEthereumAddress: z.string(),
});

export type GroupGetQueryType = z.infer<typeof GroupGetQuery>;
export type GroupCreateParamsType = z.infer<typeof GroupCreateParams>;
