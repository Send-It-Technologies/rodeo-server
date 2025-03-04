import { z } from "zod";

// Type definitions
export const RelayParams = z.object({
  to: z.string().startsWith("0x"),
  data: z.string().startsWith("0x"),
});

export const RelayChainParams = z.object({
  to: z.string().startsWith("0x"),
  data: z.string().startsWith("0x"),
});

export type RelayParamsType = z.infer<typeof RelayParams>;
export type RelayChainParamsType = z.infer<typeof RelayChainParams>;
