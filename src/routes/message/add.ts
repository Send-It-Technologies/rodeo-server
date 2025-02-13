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
      groupId,
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

    const response = await fetch(`${env.API_BASE_URL}/broadcast/${groupId}`, {
      method: "POST",
      body: JSON.stringify(message),
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return c.json({ error: "Failed to broadcast message" }, 500);
    }

    // Return message
    return c.json({ message });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
