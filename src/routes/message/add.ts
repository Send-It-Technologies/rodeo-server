// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { createMessage } from "../../db/api/messages";

// Logging
import { logError400, logError500 } from "../../utils/log/error";

// Types
import { MessagesAddParams } from "./types";

// Utils
import { isAddress } from "thirdweb";
import { Env } from "../../utils/common/types";

export async function add(c: Context): Promise<Response> {
  const env = c.env as Env;

  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Validate input parameters
    const params = await c.req.json();
    const { groupId, senderEthereumAddress, content } =
      MessagesAddParams.parse(params);

    if (!isAddress(senderEthereumAddress)) {
      logger.warn(`Invalid Ethereum address format: ${senderEthereumAddress}`);
      return logError400(
        c,
        "VALIDATION_ERROR",
        "Invalid Ethereum address format",
        {
          expectedFormat: "0x followed by 40 hexadecimal characters",
          receivedValue: senderEthereumAddress,
        }
      );
    }

    // Database operation
    const message = await createMessage(db, {
      groupId: parseInt(groupId),
      content,
      senderEthereumAddress,
      notification: "",
    });

    // Audit logging
    logger.info({
      event: "NEW_MESSAGE",
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

    // Return message
    return c.json({ message });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
