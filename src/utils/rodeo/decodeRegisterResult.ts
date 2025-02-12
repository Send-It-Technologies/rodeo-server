import { decodeAbiParameters, keccakId } from "thirdweb/utils";
import { EngineTxReceipt } from "../common/types";

export function decodeRegisterResult(txReceipt: EngineTxReceipt): {
  space: string;
  treasury: string;
  inviteToken: string;
  sharesToken: string;
} {
  // Get `Registered` log
  const log = txReceipt.logs.filter(
    (l) => l.topics[0] == keccakId("Register(address,address,address,address)")
  )[0];

  // Get indexed topic: space address.
  const [space] = decodeAbiParameters(
    [{ name: "space", type: "address" }],
    log.topics[1]
  );

  // Get un-indexed data: sharesToken, inviteToken, treasury
  const [sharesToken, inviteToken, treasury] = decodeAbiParameters(
    [
      { name: "sharesToken", type: "address" },
      { name: "inviteToken", type: "address" },
      { name: "treasury", type: "address" },
    ],
    log.data
  );

  return {
    space,
    sharesToken,
    inviteToken,
    treasury,
  };
}
