// Core
import { Context } from "hono";

// Logging
import { logError400, logError500 } from "../../utils/log/error";
import { base } from "thirdweb/chains";
import { BASE_USDC_ADDRESS, RODEO_ADDRESS } from "../../utils/common/constants";
import { keccakId } from "thirdweb/utils";
import {
  createThirdwebClient,
  encode,
  getContract,
  Hex,
  isAddress,
  prepareContractCall,
  readContract,
} from "thirdweb";
import { ExitPayload, ExitPayloadQueryType } from "./types";

export async function exit(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    // Validate input parameters
    const { spaceEthereumAddress, signerAddress, positionId } =
      c.req.query() as ExitPayloadQueryType;

    if (!isAddress(spaceEthereumAddress)) {
      logger.warn(`Invalid Ethereum address format: ${spaceEthereumAddress}`);
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Invalid Ethereum address format",
        {
          expectedFormat: "0x followed by 40 hexadecimal characters",
          receivedValue: spaceEthereumAddress,
        }
      );
    }

    if (!isAddress(signerAddress)) {
      logger.warn(`Invalid Ethereum address format: ${signerAddress}`);
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Invalid Ethereum address format",
        {
          expectedFormat: "0x followed by 40 hexadecimal characters",
          receivedValue: signerAddress,
        }
      );
    }

    // Get position. We paste the full method ABI to get types.
    const thirdwebClient = createThirdwebClient({
      secretKey: c.env.THIRDWEB_SECRET_KEY,
    });

    const rodeoContract = getContract({
      address: RODEO_ADDRESS,
      chain: base,
      client: thirdwebClient,
    });

    const position = await readContract({
      contract: rodeoContract,
      method: {
        type: "function",
        name: "getPosition",
        inputs: [
          {
            name: "positionId",
            type: "uint96",
            internalType: "uint96",
          },
          {
            name: "ring",
            type: "address",
            internalType: "address",
          },
        ],
        outputs: [
          {
            name: "",
            type: "tuple",
            internalType: "struct IPosition.Position",
            components: [
              {
                name: "id",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "totalShares",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "targetToken",
                type: "address",
                internalType: "address",
              },
              {
                name: "targetTokenBalance",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "baseTokenSpent",
                type: "uint256",
                internalType: "uint256",
              },
              {
                name: "creator",
                type: "address",
                internalType: "address",
              },
              {
                name: "performanceFeeBps",
                type: "uint96",
                internalType: "uint96",
              },
              {
                name: "stakeBalance",
                type: "uint256",
                internalType: "uint256",
              },
            ],
          },
        ],
        stateMutability: "view",
      },
      params: [BigInt(positionId), spaceEthereumAddress],
    });

    // Get shares
    const sharesToken = await readContract({
      contract: rodeoContract,
      method:
        "function getSharesToken(address) external view returns (address)",
      params: [spaceEthereumAddress],
    });

    const signerShares = await readContract({
      contract: getContract({
        chain: base,
        client: thirdwebClient,
        address: sharesToken,
      }),
      method:
        "function balanceOf(address,uint256) external view returns (uint256)",
      params: [signerAddress, BigInt(positionId)],
    });

    const exitAmount =
      (position.targetTokenBalance * signerShares) / position.totalShares;

    // Get treasury address
    const treasuryAddress = await readContract({
      contract: rodeoContract,
      method: "function getTreasury(address) external view returns (address)",
      params: [spaceEthereumAddress],
    });

    // Get quote from 0x API
    const params = {
      chainId: base.id.toString(),
      buyToken: BASE_USDC_ADDRESS,
      sellAmount: exitAmount.toString(),
      sellToken: position.targetToken,
      taker: treasuryAddress,
      slippageBps: "500",
    };
    const quoteResponse = await fetch(
      "https://api.0x.org/swap/allowance-holder/quote" +
        "?" +
        new URLSearchParams(params),
      {
        method: "GET",
        headers: {
          "0x-api-key": c.env.ZRX_API_KEY as string,
          "0x-version": "v2",
        },
      }
    );

    if (!quoteResponse.ok) {
      const errorBody = await quoteResponse.text().catch(() => null);
      logger.warn({
        message: "Failed to get 0x API quote for exit",
        status: quoteResponse.status,
        statusText: quoteResponse.statusText,
        errorBody
      });
      
      return logError400(
        c,
        "QUOTE_RESPONSE_ERROR",
        "Failed to get trading quote from exchange for exit",
        {
          status: quoteResponse.status,
          statusText: quoteResponse.statusText,
          details: errorBody ? JSON.parse(errorBody) : null,
        }
      );
    }

    const quote = await quoteResponse.json();
    if (!(quote as any).liquidityAvailable) {
      logger.warn(
        `Insufficient liquidity for buying ${BASE_USDC_ADDRESS} in exchange for ${exitAmount.toString()} of ${
          position.targetToken
        }`
      );
      return logError400(
        c,
        "INSUFFICIENT_LIQUIDITY_ERROR",
        `Insufficient liquidity for exiting position with ${position.targetToken}`,
        {
          buyToken: BASE_USDC_ADDRESS,
          sellToken: position.targetToken,
          sellAmount: exitAmount.toString(),
          positionId,
          buyAmount: (quote as any).buyAmount,
          quoteDetails: quote,
        }
      );
    }

    // Build targets and transaction calldata
    let target: Hex[] = [];
    let data: Hex[] = [];

    // Approval, if required
    if ((quote as any).issues && (quote as any).issues.allowance) {
      const spender: Hex = (quote as any).issues.allowance.spender;

      // Check current allowance.
      const currentAllowance = await readContract({
        contract: getContract({
          client: thirdwebClient,
          chain: base,
          address: position.targetToken,
        }),
        method:
          "function allowance(address owner, address spender) external view returns (uint256)",
        params: [RODEO_ADDRESS, spender],
      });

      // Perform approval.
      if (currentAllowance < exitAmount) {
        const approvalTx = prepareContractCall({
          contract: getContract({
            address: position.targetToken,
            chain: base,
            client: thirdwebClient,
          }),
          method:
            "function approve(address spender, uint256 amount) external returns (bool)",
          params: [spender, exitAmount],
        });
        const approvalTxData = await encode(approvalTx);

        target.push(position.targetToken as Hex);
        data.push(approvalTxData);
      }
    }
    target.push((quote as any).transaction.to as Hex);
    data.push((quote as any).transaction.data as Hex);

    // Build domain, types, values
    const domain = {
      name: "Rodeo",
      version: "1",
      chainId: base.id,
      verifyingContract: RODEO_ADDRESS,
    };

    const types = {
      ExitParams: [
        {
          name: "uid",
          type: "bytes32",
        },
        {
          name: "ring",
          type: "address",
        },
        {
          name: "positionId",
          type: "uint96",
        },
        {
          name: "signer",
          type: "address",
        },
        {
          name: "deadlineTimestamp",
          type: "uint96",
        },
        {
          name: "minTokenInAmount",
          type: "uint256",
        },
        {
          name: "target",
          type: "address[]",
        },
        {
          name: "data",
          type: "bytes[]",
        },
        {
          name: "rodeoSig",
          type: "bytes",
        },
      ],
    };

    const message: ExitPayload = {
      uid: keccakId(crypto.randomUUID()),
      ring: spaceEthereumAddress as Hex,
      positionId: parseInt(positionId),
      signer: signerAddress as Hex,
      deadlineTimestamp: Math.floor(Date.now() / 1000) + 60 * 60, // 20 minutes into the futur
      minTokenInAmount: (quote as any).minBuyAmount,
      target,
      data,
      rodeoSig: "0x" as Hex,
    };

    // backend-wallet/sign-typed-data
    const response = await fetch(
      `${c.env.ENGINE_INSTANCE_URL}/backend-wallet/sign-typed-data`,
      {
        method: "POST",
        headers: {
          "X-Backend-Wallet-Address": c.env.ENGINE_WALLET_ADDRESS,
          "Content-Type": "application/json",
          Authorization: `Bearer ${c.env.ENGINE_AUTH_TOKEN}`,
        },
        body: JSON.stringify({
          domain,
          types,
          value: message,
        }),
      }
    );

    if (!response.ok) {
      const errorResponse = await response.text().catch(() => response.statusText);
      logger.error(`Failed to sign exit payload: ${errorResponse}`);
      return logError500(c, logger, new Error(`Failed to sign exit payload: ${errorResponse}`), startTime);
    }

    const { result } = (await response.json()) as {
      result: Hex;
    };
    message.rodeoSig = result;

    return c.json({
      domain,
      types,
      message,
      primaryType: "ExitParams" as const,
    });
  } catch (error) {
    // Log the actual error for debugging
    logger.error({
      message: "Error in exit endpoint",
      error: error instanceof Error ? error.stack : String(error),
    });
    
    return logError500(c, logger, error, startTime);
  }
}
