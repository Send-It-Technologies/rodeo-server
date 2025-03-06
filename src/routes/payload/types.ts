import { Hex } from "thirdweb";
import { z } from "zod";

export const BuyPayloadQuery = z.object({
  spaceEthereumAddress: z.string().startsWith("0x"),
  signerAddress: z.string().startsWith("0x"),
  performanceFeeBps: z.string(),
  buyTokenAddress: z.string().startsWith("0x"),
  sellTokenAmount: z.string(),
});

export const ExitPayloadQuery = z.object({
  spaceEthereumAddress: z.string().startsWith("0x"),
  signerAddress: z.string().startsWith("0x"),
  positionId: z.string(),
});

export type BuyPayloadQueryType = z.infer<typeof BuyPayloadQuery>;
export type ExitPayloadQueryType = z.infer<typeof ExitPayloadQuery>;

export type BuyPayload = {
  uid: Hex;
  ring: Hex;
  signer: Hex;
  performanceFeeBps: string;
  tokenIn: Hex;
  deadlineTimestamp: number;
  tokenOutAmount: string;
  minTokenInAmount: string;
  target: Hex[];
  data: Hex[];
  rodeoSig: Hex;
};

export type ExitPayload = {
  uid: Hex;
  ring: Hex;
  positionId: string;
  signer: Hex;
  deadlineTimestamp: number;
  minTokenInAmount: string;
  target: Hex[];
  data: Hex[];
  rodeoSig: Hex;
};
