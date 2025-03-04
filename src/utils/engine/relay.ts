import { baseSepolia } from "thirdweb/chains";

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
}): Promise<string> {
  const response = await fetch(
    `${engineUrl}/backend-wallet/${baseSepolia.id}/send-transaction`,
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
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to relay transaction: ${response.statusText}`);
  }

  const { result } = (await response.json()) as { result: { queueId: string } };
  return result.queueId as string;
}
