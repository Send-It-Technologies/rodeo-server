// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { getGroupById } from "../../db/api";

// Logging
import { logError400, logError500 } from "../../log/error";

// Types
import { GroupGetQuery } from "./types";

export async function get(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const q = c.req.query();
    if (!q.groupId) {
      logger.warn("Missing groupId parameter");
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Group Id is required as a query parameter"
      );
    }
    const { groupId } = GroupGetQuery.parse(q);

    // Database operation
    const group = await getGroupById(db, groupId);

    if (!group) {
      logger.info(`Group not found for address: ${groupId}`);
      return logError400(c, "NOT_FOUND", "Group not found");
    }

    // Audit logging
    logger.info({
      event: "GROUP_FETCHED",
      groupId: groupId,
      durationMs: Date.now() - startTime,
    });

    return c.json({ group });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
