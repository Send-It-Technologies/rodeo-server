// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { createMessage } from "../../db/api/messages";

// Logging
import { logError500 } from "../../utils/log/error";
import { MessagesNotifyParams } from "./types";

export async function notify(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const params = await c.req.json();
    const { groupId, senderId, notification } =
      MessagesNotifyParams.parse(params);

    // Database operation
    const message = createMessage(db, {
      groupId,
      senderId,
      notification,
      content: "",
    });

    // Audit logging
    logger.info({
      event: "NEW_NOTIFICATION",
      groupId,
      senderId,
      durationMs: Date.now() - startTime,
    });

    return c.json({ message });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
