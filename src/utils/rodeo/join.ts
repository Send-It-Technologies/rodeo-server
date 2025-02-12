import {
  createThirdwebClient,
  getContract,
  prepareContractCall,
  PreparedTransaction,
} from "thirdweb";
import { base } from "thirdweb/chains";

export function getJoinTx({
  spaceEthereumAddress,
  memberEthereumAddress,
  thirdwebSecretKey,
}: {
  spaceEthereumAddress: string;
  memberEthereumAddress: string;
  thirdwebSecretKey: string;
}): PreparedTransaction {
  const joinTx = prepareContractCall({
    contract: getContract({
      client: createThirdwebClient({ secretKey: thirdwebSecretKey }),
      chain: base,
      address: spaceEthereumAddress,
    }),
    method: "function joinSpace(address) external",
    params: [memberEthereumAddress],
  });

  return joinTx;
}
