import { base } from "thirdweb/chains";

export async function relay({
  to,
  data,
  value,
  engineUrl,
  engineAccessToken,
  engineWalletAddress,
}: {
  to: string;
  data: string;
  value: string;
  engineUrl: string;
  engineAccessToken: string;
  engineWalletAddress: string;
}): Promise<{ queueId: string }> {
  const response = await fetch(
    `${engineUrl}/backend-wallet/${base.id}/send-transaction`,
    {
      method: "POST",
      headers: {
        "X-Backend-Wallet-Address": engineWalletAddress,
        "Content-Type": "application/json",
        Authorization: `Bearer ${engineAccessToken}`,
      },
      body: JSON.stringify({
        toAddress: to,
        data: data,
        value: value,
      }),
      credentials: "include",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to relay transaction: ${response.statusText}`);
  }

  const res = (await response.json()) as { queueId: string };
  return res;
}
