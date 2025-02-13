// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import {
  addMemberToGroup,
  getGroupBySpaceEthereumAddress,
} from "../../db/api/groups";

// Logging
import { logError400, logError500 } from "../../utils/log/error";
import { isAddress } from "thirdweb";
import { getJoinTx } from "../../utils/rodeo/join";
import { relay } from "../../utils/engine/relay";
import { waitUntilMined } from "../../utils/engine/wait";

export async function addMember(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const { spaceEthereumAddress, memberEthereumAddress, email } =
      await c.req.json();

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

    if (!isAddress(memberEthereumAddress)) {
      logger.warn(`Invalid Ethereum address format: ${memberEthereumAddress}`);
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Invalid Ethereum address format",
        {
          expectedFormat: "0x followed by 40 hexadecimal characters",
          receivedValue: memberEthereumAddress,
        }
      );
    }

    // Build transaction to register a space.
    const { to, data } = await getJoinTx({
      spaceEthereumAddress,
      memberEthereumAddress,
      thirdwebSecretKey: c.env.THIRDWEB_SECRET_KEY,
    });

    // Send transaction to engine relayer and get queue Id
    const queueId = await relay({
      to,
      data,
      value: "0",
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
      event: "SPACE_JOIN",
      transactionHash,
      durationMs: Date.now() - startTime,
    });

    // Database operation
    const group = await getGroupBySpaceEthereumAddress(
      db,
      spaceEthereumAddress
    );
    await addMemberToGroup(db, group.id, memberEthereumAddress, email);

    // Audit logging
    logger.info({
      event: "MEMBER_ADDED",
      spaceEthereumAddress,
      memberEthereumAddress,
      email,
      durationMs: Date.now() - startTime,
    });

    return c.json({ success: true });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
