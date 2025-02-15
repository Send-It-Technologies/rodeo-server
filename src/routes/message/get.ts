// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { getGroupMessages } from "../../db/api/messages";

// Logging
import { logError500 } from "../../utils/log/error";

export async function get(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const { groupId } = c.req.query();

    // Database operation
    const messages = (await getGroupMessages(db, parseInt(groupId))) || [];

    // Audit logging
    logger.info({
      event: "ALL_MESSAGES_FETCHED",
      groupId: groupId,
      durationMs: Date.now() - startTime,
    });

    return c.json({ messages });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
