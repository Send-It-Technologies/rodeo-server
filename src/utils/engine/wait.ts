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
    });
    statusText = response.statusText;

    // Set transaction hash if transaction is mined
    if (response.ok) {
      const { result } = (await response.json()) as {
        result: {
          status: string;
          transactionHash: string;
        };
      };

      if (result.status == "errored") {
        throw new Error(
          `Transaction failed. STATUS: ${statusText} QUEUE_ID: ${queueId}`
        );
      }

      if (result.status == "mined") {
        txHash = result.transactionHash;
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
