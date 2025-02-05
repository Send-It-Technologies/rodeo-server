// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { createGroup } from "../../db/api/groups";

// Blockchain ops
import { base } from "thirdweb/chains";
import {
  isAddress,
  getContract,
  readContract,
  prepareContractCall,
  createThirdwebClient,
} from "thirdweb";

import { relay } from "../../engine/relay";
import { waitUntilMined } from "../../engine/wait";

// Logging
import { logError400, logError500 } from "../../log/error";

// CONSTANTS
import { RODEO_ADDRESS } from "../../common/constants";

export async function create(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const { name, description, spaceEthereumAddress } = await c.req.json();

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

    // Get registered status
    const rodeoContract = getContract({
      address: RODEO_ADDRESS,
      chain: base,
      client: createThirdwebClient({
        secretKey: c.env.THIRDWEB_SECRET_KEY,
      }),
    });

    const isRegistered = await readContract({
      contract: rodeoContract,
      method: "function isRegistered(address) external view returns (bool)",
      params: [spaceEthereumAddress],
    });

    // Register contract if not already registered
    if (!isRegistered) {
      // Build transaction to register a space.
      const registerTx = prepareContractCall({
        contract: rodeoContract,
        method: "function register(address) external",
        params: [spaceEthereumAddress],
      });

      // Send transaction to engine relayer and get queue Id
      const queueId = await relay({
        to: registerTx.to as string,
        data: registerTx.data as string,
        value: (registerTx.value as BigInt).toString(),
        engineUrl: c.env.ENGINE_INSTANCE_URL,
        engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
        engineWalletAddress: c.env.ENGINE_WALLET_ADDRESS,
      });

      // Wait for transaction to get mined
      const transactionHash = await waitUntilMined({
        polls: 10,
        queueId: queueId,
        engineUrl: c.env.ENGINE_INSTANCE_URL,
        engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
      });

      logger.info({
        event: "SPACE_REGISTERED",
        transactionHash,
        durationMs: Date.now() - startTime,
      });
    }

    // Get space affiliated rodeo contracts
    const treasuryAddress = await readContract({
      contract: rodeoContract,
      method: "function getTreasury(address) external view returns (address)",
      params: [spaceEthereumAddress],
    });

    const sharesTokenAddress = await readContract({
      contract: rodeoContract,
      method:
        "function getSharesToken(address) external view returns (address)",
      params: [spaceEthereumAddress],
    });

    const inviteTokenAddress = await readContract({
      contract: rodeoContract,
      method:
        "function getInviteToken(address) external view returns (address)",
      params: [spaceEthereumAddress],
    });
    // DB Ops
    const group = await createGroup(db, {
      name,
      description,
      spaceContractAddress: spaceEthereumAddress,
      sharesContractAddress: sharesTokenAddress,
      inviteContractAddress: inviteTokenAddress,
      treasuryContractAddress: treasuryAddress,
    });

    return c.json({ group });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
