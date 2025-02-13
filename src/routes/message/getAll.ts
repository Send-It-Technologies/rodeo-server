// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { getGroupMessages, Message } from "../../db/api/messages";

// Logging
import { logError500 } from "../../utils/log/error";
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
    const { groupId } = MessagesGetAllQuery.parse(params);

    // LOGGING
    logger.info({
      event: "TRYING_TO_MESSAGES_FETCHED",
      groupId: groupId,
      durationMs: Date.now() - startTime,
    });

    // Database operation
    let messages: Message[] = [];
    try {
      messages = (await getGroupMessages(db, groupId)) || [];
    } catch (err) {
      console.error(err);
      logger.info({
        event: "ERROR_TO_MESSAGES_FETCHED",
        err,
        durationMs: Date.now() - startTime,
      });
    }

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
