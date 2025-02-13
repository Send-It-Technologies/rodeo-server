// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { createMessage } from "../../db/api/messages";

// Logging
import { logError500 } from "../../utils/log/error";
import { MessagesNotifyParams } from "./types";
import { Env } from "../../utils/common/types";

export async function notify(c: Context): Promise<Response> {
  const env = c.env as Env;

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
      groupId: parseInt(groupId),
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

    const durableObjectId = env.CHAT_ROOM.idFromName(groupId);
    const durableObjectStub = env.CHAT_ROOM.get(durableObjectId);

    // Forward the message to the Durable Object for broadcasting
    const broadcastResponse = await durableObjectStub.fetch(
      new Request(env.API_BASE_URL + "/broadcast", {
        method: "POST",
        body: JSON.stringify(message),
        headers: { "Content-Type": "application/json" },
      })
    );

    if (!broadcastResponse.ok) {
      // Audit logging
      logger.info({
        event: "FAILED_BROADCAST_NEW_MESSAGE",
        groupId,
        senderEthereumAddress,
        durationMs: Date.now() - startTime,
      });

      return c.json({ error: "Failed to broadcast message" }, 500);
    }

    return c.json({ message });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
