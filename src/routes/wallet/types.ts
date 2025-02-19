import { z } from "zod";

// Type definitions
export const WalletPhoneQuery = z.object({
  phoneNumber: z.string(),
});

export type WalletPhoneQueryType = z.infer<typeof WalletPhoneQuery>;
