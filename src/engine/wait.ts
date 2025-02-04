export async function waitUntilMined({
  polls,
  queueId,
  engineUrl,
  engineAccessToken,
}: {
  polls: number;
  queueId: string;
  engineUrl: string;
  engineAccessToken: string;
}): Promise<string> {
  // Poll engine with queue Id for 10 seconds else timeout
  let pollDuration = polls * 1000;
  let txHash = "";
  let statusText = "";

  while (pollDuration > 0) {
    // Sleep for 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000));
    pollDuration -= 1000;

    // Get queue status from engine
    const response = await fetch(`${engineUrl}/transaction/status/${queueId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${engineAccessToken}`,
      },
      credentials: "include",
    });
    statusText = response.statusText;

    // Set transaction hash if transaction is mined
    if (response.ok) {
      const { status, transactionHash } = (await response.json()) as {
        status: string;
        transactionHash: string;
      };

      if (status == "mined") {
        txHash = transactionHash;
        pollDuration = 0;
        break;
      }
    }
  }

  // If no hash was set, error out.
  if (!txHash) {
    throw new Error(
      `Engine timed out while waiting for mined. STATUS: ${statusText} QUEUE_ID: ${queueId}`
    );
  }

  return txHash;
}
