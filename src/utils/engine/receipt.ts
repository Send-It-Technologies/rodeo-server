import { base } from "thirdweb/chains";
import { EngineTxReceipt } from "../common/types";

export async function getTransactionReceipt({
  transactionHash,
  engineUrl,
  engineAccessToken,
}: {
  transactionHash: string;
  engineUrl: string;
  engineAccessToken: string;
}): Promise<EngineTxReceipt> {
  // Get receipt
  const response = await fetch(
    `${engineUrl}/transaction/${base.id}/tx-hash/${transactionHash}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${engineAccessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get transaction receipt: ${response.statusText}`
    );
  }

  const { result } = (await response.json()) as { result: EngineTxReceipt };

  return result;
}
