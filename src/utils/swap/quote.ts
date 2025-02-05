import { base } from "thirdweb/chains";

export async function getQuote({
  buyToken,
  sellToken,
  sellAmount,
  taker,
  slippageBps,
  zrxApiKey,
}: {
  buyToken: string;
  sellToken: string;
  sellAmount: string;
  taker: string;
  slippageBps: string;
  zrxApiKey: string;
}) {
  const response = await fetch(
    "https://api.0x.org/swap/allowance-holder/quote",
    {
      method: "GET",
      headers: {
        "0x-api-key": zrxApiKey as string,
        "0x-version": "v2",
      },
      body: JSON.stringify({
        chainId: base.id,
        buyToken,
        sellAmount,
        sellToken,
        taker,
        slippageBps,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch quote: ${response.statusText}`);
  }

  const quote = await response.json();
  return quote;
}
