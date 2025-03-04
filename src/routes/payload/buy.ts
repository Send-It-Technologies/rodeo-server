// Core
import { Context } from "hono";

// Logging
import { logError400, logError500 } from "../../utils/log/error";
import { base } from "thirdweb/chains";
import { RODEO_ADDRESS } from "../../utils/common/constants";
import { keccakId } from "thirdweb/utils";
import { Hex, isAddress, isHex } from "thirdweb";
import { BuyPayload, BuyPayloadQueryType } from "./types";

export async function buy(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    // Validate input parameters
    const {
      spaceEthereumAddress,
      signerAddress,
      performanceFeeBps,
      buyTokenAddress,
      sellTokenAmount,
      minBuyAmount,
      transactionTo,
      transactionData,
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

    if (!isAddress(transactionTo)) {
      logger.warn(`Invalid Ethereum address format: ${transactionTo}`);
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Invalid Ethereum address format",
        {
          expectedFormat: "0x followed by 40 hexadecimal characters",
          receivedValue: transactionTo,
        }
      );
    }

    if (!isHex(transactionData)) {
      logger.warn(`Invalid transaction format: ${transactionData}`);
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Invalid transaction data format",
        {
          expectedFormat: "0x followed by even hexadecimal characters",
          receivedValue: transactionData,
        }
      );
    }

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
      minTokenInAmount: minBuyAmount,
      target: [transactionTo as Hex],
      data: [transactionData as Hex],
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

    return c.json({ domain, types, value });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
