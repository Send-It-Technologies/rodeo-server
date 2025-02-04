// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { getGroupByspaceEthereumAddress } from "../../db/api/groups";

// Logging
import { logError400, logError500 } from "../../log/error";

// Types
import { isAddress } from "thirdweb";

export async function get(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const { spaceEthereumAddress } = c.req.query();
    if (spaceEthereumAddress) {
      logger.warn("Missing spaceEthereumAddress parameter");
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Space address is required as a query parameter"
      );
    }
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

    // Database operation
    const group = await getGroupByspaceEthereumAddress(
      db,
      spaceEthereumAddress
    );

    if (!group) {
      logger.info(`Group not found for address: ${spaceEthereumAddress}`);
      return logError400(c, "NOT_FOUND", "Group not found");
    }

    // Audit logging
    logger.info({
      event: "GROUP_FETCHED",
      groupId: group.id,
      spaceEthereumAddress,
      durationMs: Date.now() - startTime,
    });

    return c.json({ group });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
