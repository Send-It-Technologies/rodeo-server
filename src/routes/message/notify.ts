// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { createMessage } from "../../db/api/messages";

// Logging
import { logError500 } from "../../utils/log/error";
import { MessagesNotifyParams } from "./types";
import { Server } from "bun";

export async function notify(wsServer: Server, c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const params = await c.req.json();
    const { groupId, senderEthereumAddress, notification } =
      MessagesNotifyParams.parse(params);

    // Database operation
    const message = await createMessage(db, {
      groupId,
      senderEthereumAddress,
      notification,
      content: "",
    });

    // Audit logging
    logger.info({
      event: "NEW_NOTIFICATION",
      groupId,
      senderEthereumAddress,
      durationMs: Date.now() - startTime,
    });

    // Publish message to room connections
    wsServer.publish(message.groupId.toString(), JSON.stringify(message));

    return c.json({ message });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
