// Core
import { Context } from "hono";

// Logging
import { logError400, logError500 } from "../../utils/log/error";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

// Utils
import { isAddress } from "thirdweb";
import {
  getGroupBySpaceEthereumAddress,
  getMembersByGroupId,
} from "../../db/api/groups";

export async function members(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const { spaceEthereumAddress } = c.req.query();

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

    // Blockchain read
    const group = await getGroupBySpaceEthereumAddress(
      db,
      spaceEthereumAddress
    );
    const members = await getMembersByGroupId(db, group.id);

    // Audit logging
    logger.info({
      event: "MEMBERS_FETCHED",
      spaceEthereumAddress,
      durationMs: Date.now() - startTime,
    });

    return c.json({ members });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
