import { z } from "zod";

export const QuoteQuery = z.object({
  spaceAddress: z.string().startsWith("0x"),
  buyTokenAddress: z.string().startsWith("0x"),
  sellTokenAddress: z.string().startsWith("0x"),
  sellAmount: z.string(),
});

export type QuoteQueryType = z.infer<typeof QuoteQuery>;
