// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { getGroupsByMemberAddress } from "../../db/api/groups";

// Logging
import { logError400, logError500 } from "../../utils/log/error";
import { isAddress } from "thirdweb";

export async function getAllOfMember(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const { memberEthereumAddress } = c.req.query();

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

    // Database operation
    const groups =
      (await getGroupsByMemberAddress(db, memberEthereumAddress)) || [];

    // Audit logging
    logger.info({
      event: "MEMBER_GROUPS_FETCHED",
      memberEthereumAddress,
      durationMs: Date.now() - startTime,
    });

    return c.json({ groups });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
