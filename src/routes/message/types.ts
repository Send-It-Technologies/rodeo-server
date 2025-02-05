import { z } from "zod";

export const MessagesGetAllQuery = z.object({
  groupId: z.number(),
});

export const MessagesAddParams = z.object({
  groupId: z.number(),
  senderId: z.number(),
  content: z.string(),
});

export const MessagesNotifyParams = z.object({
  groupId: z.number(),
  senderId: z.number(),
  notification: z.string(),
});

export type MessagesGetAllQueryType = z.infer<typeof MessagesGetAllQuery>;
export type MessagesAddParamsType = z.infer<typeof MessagesAddParams>;
export type MessagesNotifiyParamsType = z.infer<typeof MessagesNotifyParams>;
