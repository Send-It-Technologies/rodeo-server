import { baseSepolia } from "thirdweb/chains";

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
  const params = {
    chainId: base.id.toString(),
    buyToken,
    sellAmount,
    sellToken,
    taker,
    slippageBps,
  };
  const response = await fetch(
    "https://api.0x.org/swap/allowance-holder/quote" +
      "?" +
      new URLSearchParams(params),
    {
      method: "GET",
      headers: {
        "0x-api-key": zrxApiKey as string,
        "0x-version": "v2",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch quote: ${response.statusText}`);
  }

  const quote = await response.json();
  return quote;
}
