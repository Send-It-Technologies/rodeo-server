import { z } from "zod";

export const MessagesGetAllQuery = z.object({
  groupId: z.number(),
});

export const MessagesAddParams = z.object({
  groupId: z.number(),
  senderUserId: z.number(),
  content: z.string(),
});

export type MessagesGetAllQueryType = z.infer<typeof MessagesGetAllQuery>;
export type MessagesAddParamsType = z.infer<typeof MessagesAddParams>;
