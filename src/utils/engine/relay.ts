export async function relay({
  to,
  data,
  value,
  chainId,
  engineUrl,
  engineAccessToken,
  engineWalletAddress,
}: {
  to: string;
  data: string;
  value: string;
  chainId: string;
  engineUrl: string;
  engineAccessToken: string;
  engineWalletAddress: string;
}): Promise<string> {
  const response = await fetch(
    `${engineUrl}/backend-wallet/${chainId}/send-transaction`,
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
