import { z } from "zod";

export const GroupGetQuery = z.object({
  groupId: z.number(),
});

export const GroupGetAllQuery = z.object({
  userId: z.number(),
});

export type GroupGetQueryType = z.infer<typeof GroupGetQuery>;
export type GroupGetAllQueryType = z.infer<typeof GroupGetAllQuery>;
