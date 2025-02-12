import { createThirdwebClient, getContract, readContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { getRpcClient, eth_getStorageAt } from "thirdweb/rpc";
import { decodeAbiParameters } from "thirdweb/utils";

export async function getSpaceMembers({
  spaceAddress,
  thirdwebSecretKey,
}: {
  spaceAddress: string;
  thirdwebSecretKey: string;
}): Promise<string[]> {
  const thirdwebClient = createThirdwebClient({ secretKey: thirdwebSecretKey });

  const rpcRequest = getRpcClient({
    client: thirdwebClient,
    chain: base,
  });

  const encodedNextTokenId = await eth_getStorageAt(rpcRequest, {
    address: spaceAddress,
    position:
      "0x6569bde4a160c636ea8b8d11acb83a60d7fec0b8f2e09389306cba0e1340df00", //
  });

  const [nextTokenId] = decodeAbiParameters(
    [{ name: "_currentIndex", type: "uint256" }],
    encodedNextTokenId
  );

  const owners: string[] = [];
  const included: Map<string, boolean> = new Map();

  for (let i = BigInt(0); i < nextTokenId; i++) {
    const owner = await readContract({
      contract: getContract({
        client: thirdwebClient,
        chain: base,
        address: spaceAddress,
      }),
      method: "function ownerOf(uint256) external view returns (address)",
      params: [i],
    });

    if (!included.get(owner)) {
      owners.push(owner);
      included.set(owner, true);
    }
  }

  return owners;
}
