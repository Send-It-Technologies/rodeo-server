// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { createUser } from "../../db/api/users";

// Logging
import { logError400, logError500 } from "../../log/error";

// Utils
import { isAddress } from "thirdweb";

export async function create(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const { username, ethereumAddress, email, profileImageUrl } =
      await c.req.json();

    if (!isAddress(ethereumAddress)) {
      logger.warn(`Invalid Ethereum address format: ${ethereumAddress}`);
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Invalid Ethereum address format",
        {
          expectedFormat: "0x followed by 40 hexadecimal characters",
          receivedValue: ethereumAddress,
        }
      );
    }

    // Database operation
    const user = await createUser(db, {
      username,
      email,
      ethereumAddress,
      profileImageUrl,
    });

    if (!user) {
      logger.info(`Failed to create user for address: ${ethereumAddress}`);
      return logError400(c, "FAILED", "Failed to create user");
    }

    // Audit logging
    logger.info({
      event: "USER_FETCHED",
      address: ethereumAddress,
      durationMs: Date.now() - startTime,
    });

    return c.json({ user });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
