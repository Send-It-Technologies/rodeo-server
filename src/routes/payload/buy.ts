// Core
import { Context } from "hono";

// Logging
import { logError400, logError500 } from "../../utils/log/error";

// Blockchain utils
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

// Types
import { BuyPayload, BuyPayloadQueryType } from "./types";

export async function buy(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    // Validate input parameters
    const {
      spaceEthereumAddress, // space address
      signerAddress, // Member who's buying tokens
      performanceFeeBps, // 1 * 10^18 == 100%
      buyTokenAddress, // Coin being bought e.g. $PEPE coin
      sellTokenAmount, // How much USDC do you want to spend?
    } = c.req.query() as BuyPayloadQueryType;

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

    if (!isAddress(buyTokenAddress)) {
      logger.warn(`Invalid Ethereum address format: ${buyTokenAddress}`);
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Invalid Ethereum address format",
        {
          expectedFormat: "0x followed by 40 hexadecimal characters",
          receivedValue: buyTokenAddress,
        }
      );
    }

    // Get treasury address
    const thirdwebClient = createThirdwebClient({
      secretKey: c.env.THIRDWEB_SECRET_KEY,
    });

    const rodeoContract = getContract({
      address: RODEO_ADDRESS,
      chain: base,
      client: thirdwebClient,
    });

    const treasuryAddress = await readContract({
      contract: rodeoContract,
      method: "function getTreasury(address) external view returns (address)",
      params: [spaceEthereumAddress],
    });

    // Get quote from 0x API
    const params = {
      chainId: base.id.toString(),
      buyToken: buyTokenAddress,
      sellAmount: sellTokenAmount,
      sellToken: BASE_USDC_ADDRESS,
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
      return logError400(
        c,
        "QUOTE RESPONSE ERROR",
        "Unsuccessful 0x API quote response",
        {
          statusText: quoteResponse.statusText,
        }
      );
    }

    const quote = await quoteResponse.json();
    if (!(quote as any).liquidityAvailable) {
      logger.warn(
        `Insufficient liquidity for buying ${buyTokenAddress} in exchange for ${sellTokenAmount} of ${BASE_USDC_ADDRESS}`
      );
      return logError400(
        c,
        "OUTPUT_ERROR",
        "Insufficient liquidity for trade",
        {
          quote,
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
          address: BASE_USDC_ADDRESS,
        }),
        method:
          "function allowance(address owner, address spender) external view returns (uint256)",
        params: [RODEO_ADDRESS, spender],
      });

      // Perform approval.
      if (currentAllowance < BigInt(sellTokenAmount)) {
        const approvalTx = prepareContractCall({
          contract: getContract({
            address: BASE_USDC_ADDRESS,
            chain: base,
            client: thirdwebClient,
          }),
          method:
            "function approve(address spender, uint256 amount) external returns (bool)",
          params: [spender, BigInt(sellTokenAmount)],
        });
        const approvalTxData = await encode(approvalTx);

        target.push(BASE_USDC_ADDRESS as Hex);
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
      BuyParams: [
        {
          name: "uid",
          type: "bytes32",
        },
        {
          name: "ring",
          type: "address",
        },
        {
          name: "signer",
          type: "address",
        },
        {
          name: "performanceFeeBps",
          type: "uint96",
        },
        {
          name: "tokenIn",
          type: "address",
        },
        {
          name: "deadlineTimestamp",
          type: "uint96",
        },
        {
          name: "tokenOutAmount",
          type: "uint256",
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

    const value: BuyPayload = {
      uid: keccakId(crypto.randomUUID()),
      ring: spaceEthereumAddress as Hex,
      signer: signerAddress as Hex,
      performanceFeeBps: performanceFeeBps,
      tokenIn: buyTokenAddress as Hex,
      deadlineTimestamp: Math.floor(Date.now() / 1000) + 60 * 60, // 20 minutes into the future
      tokenOutAmount: sellTokenAmount,
      minTokenInAmount: (quote as any).minBuyAmount,
      target,
      data,
      rodeoSig: "0x" as Hex,
    };

    // backend-wallet/sign-typed-data
    const response = await fetch(
      `${c.env.ENGINE_INSTANCE_URL}backend-wallet/sign-typed-data`,
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
          value,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to relay transaction: ${response.statusText}`);
    }

    const { result } = (await response.json()) as {
      result: Hex;
    };
    value.rodeoSig = result;

    return c.json({ domain, types, value, primaryType: "BuyParams" as const });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
