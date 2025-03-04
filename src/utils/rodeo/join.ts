import {
  createThirdwebClient,
  encode,
  getContract,
  prepareContractCall,
} from "thirdweb";
import { baseSepolia } from "thirdweb/chains";

export async function getJoinTx({
  spaceEthereumAddress,
  memberEthereumAddress,
  thirdwebSecretKey,
}: {
  spaceEthereumAddress: string;
  memberEthereumAddress: string;
  thirdwebSecretKey: string;
}): Promise<{ to: string; data: string }> {
  const joinTx = prepareContractCall({
    contract: getContract({
      client: createThirdwebClient({ secretKey: thirdwebSecretKey }),
      chain: baseSepolia,
      address: spaceEthereumAddress,
    }),
    method: "function joinSpace(address) external",
    params: [memberEthereumAddress],
  });

  return { to: spaceEthereumAddress, data: await encode(joinTx) };
}
