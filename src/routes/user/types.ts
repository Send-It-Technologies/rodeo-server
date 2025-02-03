import { z } from "zod";

export const UserGetQuery = z.object({
  ethereumAddress: z.string(),
});

export const UserCreateParams = z.object({
  username: z.string(),
  ethereumAddress: z.string(),
  email: z.string(),
  profileImageUrl: z.ostring(),
});

export type UserGetQueryType = z.infer<typeof UserGetQuery>;
export type UserCreateParamsType = z.infer<typeof UserCreateParams>;
