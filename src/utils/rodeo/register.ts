import {
  createThirdwebClient,
  encode,
  getContract,
  prepareContractCall,
  ZERO_ADDRESS,
} from "thirdweb";
import { maxUint256 } from "thirdweb/utils";
import { PRICE_MODULE_ADDRESS, SENDIT_ADDRESS } from "../common/constants";
import { base } from "thirdweb/chains";

export async function getCreateAndRegisterTx({
  name,
  symbol,
  description,
  adminEthereumAddress,
  thirdwebSecretKey,
}: {
  name: string;
  symbol: string;
  description: string;
  adminEthereumAddress: string;
  thirdwebSecretKey: string;
}): Promise<{ to: string; data: string }> {
  // Build register params
  const spaceInfo = {
    name,
    uri: "",
    shortDescription: "",
    longDescription: description,
    membership: {
      settings: {
        name,
        symbol,
        price: BigInt(0),
        maxSupply: BigInt(100),
        duration: BigInt(86_400 * 365 * 100),
        currency: ZERO_ADDRESS,
        feeRecipient: adminEthereumAddress,
        freeAllocation: BigInt(100),
        pricingModule: PRICE_MODULE_ADDRESS,
      },
      requirements: {
        everyone: true,
        users: [],
        ruleData: "0x" as `0x${string}`,
        syncEntitlements: false,
      },
      permissions: [],
    },
    channel: { metadata: "" },
  };

  // Build register transaction. NOTE: we inline the JSON method to get proper typing assistance.
  const registerTransaction = prepareContractCall({
    contract: getContract({
      chain: base,
      address: SENDIT_ADDRESS,
      client: createThirdwebClient({ secretKey: thirdwebSecretKey }),
    }),
    params: [spaceInfo, adminEthereumAddress],
    method: {
      type: "function",
      name: "register",
      inputs: [
        {
          name: "spaceInfo",
          type: "tuple",
          internalType: "struct ISpaceInfo.SpaceInfo",
          components: [
            {
              name: "name",
              type: "string",
              internalType: "string",
            },
            {
              name: "uri",
              type: "string",
              internalType: "string",
            },
            {
              name: "shortDescription",
              type: "string",
              internalType: "string",
            },
            {
              name: "longDescription",
              type: "string",
              internalType: "string",
            },
            {
              name: "membership",
              type: "tuple",
              internalType: "struct ISpaceInfo.Membership",
              components: [
                {
                  name: "settings",
                  type: "tuple",
                  internalType: "struct ISpaceInfo.MembershipSettings",
                  components: [
                    {
                      name: "name",
                      type: "string",
                      internalType: "string",
                    },
                    {
                      name: "symbol",
                      type: "string",
                      internalType: "string",
                    },
                    {
                      name: "price",
                      type: "uint256",
                      internalType: "uint256",
                    },
                    {
                      name: "maxSupply",
                      type: "uint256",
                      internalType: "uint256",
                    },
                    {
                      name: "duration",
                      type: "uint64",
                      internalType: "uint64",
                    },
                    {
                      name: "currency",
                      type: "address",
                      internalType: "address",
                    },
                    {
                      name: "feeRecipient",
                      type: "address",
                      internalType: "address",
                    },
                    {
                      name: "freeAllocation",
                      type: "uint256",
                      internalType: "uint256",
                    },
                    {
                      name: "pricingModule",
                      type: "address",
                      internalType: "address",
                    },
                  ],
                },
                {
                  name: "requirements",
                  type: "tuple",
                  internalType: "struct ISpaceInfo.MembershipRequirements",
                  components: [
                    {
                      name: "everyone",
                      type: "bool",
                      internalType: "bool",
                    },
                    {
                      name: "users",
                      type: "address[]",
                      internalType: "address[]",
                    },
                    {
                      name: "ruleData",
                      type: "bytes",
                      internalType: "bytes",
                    },
                    {
                      name: "syncEntitlements",
                      type: "bool",
                      internalType: "bool",
                    },
                  ],
                },
                {
                  name: "permissions",
                  type: "string[]",
                  internalType: "string[]",
                },
              ],
            },
            {
              name: "channel",
              type: "tuple",
              internalType: "struct ISpaceInfo.ChannelInfo",
              components: [
                {
                  name: "metadata",
                  type: "string",
                  internalType: "string",
                },
              ],
            },
          ],
        },
        {
          name: "creator",
          type: "address",
          internalType: "address",
        },
      ],
      outputs: [
        {
          name: "space",
          type: "address",
          internalType: "address",
        },
        {
          name: "treasury",
          type: "address",
          internalType: "address",
        },
        {
          name: "inviteToken",
          type: "address",
          internalType: "address",
        },
        {
          name: "sharesToken",
          type: "address",
          internalType: "address",
        },
      ],
      stateMutability: "nonpayable",
    },
  });

  return { to: SENDIT_ADDRESS, data: await encode(registerTransaction) };
}
