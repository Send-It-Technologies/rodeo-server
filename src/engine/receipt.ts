import { base } from "thirdweb/chains";

export async function getReceipt({
  txHash,
  engineUrl,
  engineAccessToken,
}: {
  txHash: string;
  engineUrl: string;
  engineAccessToken: string;
}): Promise<[]> {
  const response = await fetch(
    `${engineUrl}/transaction/${base.id}/tx-hash/${txHash}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${engineAccessToken}`,
      },
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch receipt: ${response.statusText}`);
  }

  const { logs } = (await response.json()) as { logs: Log[] };
  return logs;
}
