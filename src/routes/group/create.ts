// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import {
  addAdminToGroup,
  createGroup,
  getUserByEthereumAddress,
} from "../../db/api";

// Blockchain ops
import { base } from "thirdweb/chains";
import { decodeAbiParameters } from "thirdweb/utils";

import {
  createThirdwebClient,
  getContract,
  getContractEvents,
  isAddress,
  prepareContractCall,
  prepareEvent,
} from "thirdweb";

import { relay } from "../../engine/relay";
import { getReceipt } from "../../engine/receipt";
import { waitUntilMined } from "../../engine/wait";

// Logging
import { logError400, logError500 } from "../../log/error";

// CONSTANTS
import { MOCK_SPACE_FACTORY_ADDRESS, RODEO_ADDRESS } from "../../constants";

export async function create(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const { name, description, adminEthereumAddress } = await c.req.json();

    if (!name) {
      logger.warn("Missing name parameter");
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Name is required as a query parameter"
      );
    }

    if (!adminEthereumAddress) {
      logger.warn("Missing Admin ethereum address parameter");
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Name is required as a query parameter"
      );
    }
    if (!isAddress(adminEthereumAddress)) {
      logger.warn(`Invalid Ethereum address format: ${adminEthereumAddress}`);
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Invalid Ethereum address format",
        {
          expectedFormat: "0x followed by 40 hexadecimal characters",
          receivedValue: adminEthereumAddress,
        }
      );
    }

    // Get admin user
    const user = await getUserByEthereumAddress(db, adminEthereumAddress);
    if (!user) {
      logger.info(`User not found for address: ${adminEthereumAddress}`);
      return logError400(c, "NOT_FOUND", "User not found");
    }

    // Build deployment transaction
    const spaceDeploymentTx = prepareContractCall({
      contract: getContract({
        address: MOCK_SPACE_FACTORY_ADDRESS,
        chain: base,
        client: createThirdwebClient({
          secretKey: c.env.THIRDWEB_SECRET_KEY,
        }),
      }),
      method: "function create(address) external returns (address)",
      params: [adminEthereumAddress],
    });

    // Send transaction to engine relayer and get queue Id
    const { queueId } = await relay({
      to: spaceDeploymentTx.to as string,
      data: spaceDeploymentTx.data as string,
      value: (spaceDeploymentTx.value as BigInt).toString(),
      engineUrl: c.env.ENGINE_INSTANCE_URL,
      engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
      engineWalletAddress: c.env.ENGINE_WALLET_ADDRESS,
    });

    // Wait for transaction to get mined
    const { transactionHash: spaceDeploymentTxHash } = await waitUntilMined({
      polls: 10,
      queueId,
      engineUrl: c.env.ENGINE_INSTANCE_URL,
      engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
    });
    logger.info({
      event: "SPACE_CREATED",
      transactionHash: spaceDeploymentTxHash,
      durationMs: Date.now() - startTime,
    });

    // Get event logs
    const deployReceipt = await getReceipt({
      txHash: spaceDeploymentTxHash,
      engineUrl: c.env.ENGINE_INSTANCE_URL,
      engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
    });

    const [newSpaceEvent] = await getContractEvents({
      blockHash: (deployReceipt as any).blockHash,
      contract: getContract({
        address: RODEO_ADDRESS,
        chain: base,
        client: createThirdwebClient({
          secretKey: c.env.THIRDWEB_SECRET_KEY,
        }),
      }),
      events: [
        prepareEvent({
          signature:
            "event NewSpace(address indexed owner, address indexed space)",
        }),
      ],
    });

    // Get space address
    const [spaceAddress] = decodeAbiParameters(
      [
        {
          name: "space",
          type: "address",
        },
      ],
      newSpaceEvent.topics[2] as `0x${string}`
    );

    // Build transaction to register a space.
    const registerTx = prepareContractCall({
      contract: getContract({
        address: RODEO_ADDRESS,
        chain: base,
        client: createThirdwebClient({
          secretKey: c.env.THIRDWEB_SECRET_KEY,
        }),
      }),
      method: "function register(address) external",
      params: [spaceAddress],
    });

    // Send transaction to engine relayer and get queue Id
    const { queueId: registerQueueId } = await relay({
      to: registerTx.to as string,
      data: registerTx.data as string,
      value: (registerTx.value as BigInt).toString(),
      engineUrl: c.env.ENGINE_INSTANCE_URL,
      engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
      engineWalletAddress: c.env.ENGINE_WALLET_ADDRESS,
    });

    // Wait for transaction to get mined
    const { transactionHash: registerTxHash } = await waitUntilMined({
      polls: 10,
      queueId: registerQueueId,
      engineUrl: c.env.ENGINE_INSTANCE_URL,
      engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
    });
    logger.info({
      event: "SPACE_REGISTERED",
      transactionHash: registerTxHash,
      durationMs: Date.now() - startTime,
    });

    // Get event logs
    const registerReceipt = await getReceipt({
      txHash: registerTxHash,
      engineUrl: c.env.ENGINE_INSTANCE_URL,
      engineAccessToken: c.env.ENGINE_AUTH_TOKEN,
    });

    const [registerEvent] = await getContractEvents({
      blockHash: (registerReceipt as any).blockHash,
      contract: getContract({
        address: RODEO_ADDRESS,
        chain: base,
        client: createThirdwebClient({
          secretKey: c.env.THIRDWEB_SECRET_KEY,
        }),
      }),
      events: [
        prepareEvent({
          signature:
            "event Register(address indexed ring, address sharesToken, address inviteToken, address treasury)",
        }),
      ],
    });

    // Get rodeo contracts of space
    const [sharesToken, inviteToken, treasury] = decodeAbiParameters(
      [
        { name: "sharesToken", type: "address" },
        { name: "inviteToken", type: "address" },
        { name: "treasury", type: "address" },
      ],
      registerEvent.data
    );

    // DB Ops
    const group = await createGroup(db, {
      name,
      description,
      spaceContractAddress: spaceAddress,
      sharesContractAddress: sharesToken,
      inviteContractAddress: inviteToken,
      treasuryContractAddress: treasury,
    });

    const admin = await addAdminToGroup(db, group.id, user.id);

    return c.json({ group, admin });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
