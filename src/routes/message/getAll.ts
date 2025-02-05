// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { getGroupMessages } from "../../db/api/messages";

// Logging
import { logError400, logError500 } from "../../log/error";
import { MessagesGetAllQuery } from "./types";

export async function getAll(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const params = c.req.query();

    if (!params.groupId) {
      logger.warn("Missing groupId parameter");
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Group Id is required as a query parameter"
      );
    }
    const { groupId: parsedGroupId } = MessagesGetAllQuery.parse(params);

    // Database operation
    const messages = (await getGroupMessages(db, parsedGroupId)) || [];

    // Audit logging
    logger.info({
      event: "ALL_MESSAGES_FETCHED",
      groupId: parsedGroupId,
      durationMs: Date.now() - startTime,
    });

    return c.json({ messages });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
