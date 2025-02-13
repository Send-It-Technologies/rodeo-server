import { z } from "zod";

export const MessagesGetAllQuery = z.object({
  groupId: z.string(),
});

export const MessagesAddParams = z.object({
  groupId: z.string(),
  content: z.string(),
  senderEthereumAddress: z.string().startsWith("0x"),
});

export const MessagesNotifyParams = z.object({
  groupId: z.string(),
  notification: z.string(),
  senderEthereumAddress: z.string().startsWith("0x"),
});

export type MessagesGetAllQueryType = z.infer<typeof MessagesGetAllQuery>;
export type MessagesAddParamsType = z.infer<typeof MessagesAddParams>;
export type MessagesNotifiyParamsType = z.infer<typeof MessagesNotifyParams>;
