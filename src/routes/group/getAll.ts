// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { getUserGroups } from "../../db/api";

// Logging
import { logError400, logError500 } from "../../log/error";

// Types
import { GroupGetAllQuery } from "./types";

export async function getAll(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const q = c.req.query();
    if (!q.userId) {
      logger.warn("Missing userId parameter");
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Group Id is required as a query parameter"
      );
    }
    const { userId } = GroupGetAllQuery.parse(q);

    // Database operation
    const groups = await getUserGroups(db, userId);

    if (!groups) {
      logger.info(`User groups not found for address: ${userId}`);
      return logError400(c, "NOT_FOUND", "User groups not found");
    }

    // Audit logging
    logger.info({
      event: "USER_GROUPS_FETCHED",
      userId: userId,
      durationMs: Date.now() - startTime,
    });

    return c.json({ groups });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
