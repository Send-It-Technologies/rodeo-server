// Core
import { Context } from "hono";

// DB Ops
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

import { getAllGroups } from "../../db/api/groups";

// Logging
import { logError500 } from "../../log/error";

export async function getAll(c: Context): Promise<Response> {
  // Structured logging setup
  const logger = c.env?.logger || console;
  const startTime = Date.now();

  try {
    const client = new Pool({ connectionString: c.env.DATABASE_URL });
    const db = drizzle(client);

    // Database operation
    const groups = (await getAllGroups(db)) || [];

    // Audit logging
    logger.info({
      event: "ALL_GROUPS_FETCHED",
      durationMs: Date.now() - startTime,
    });

    return c.json({ groups });
  } catch (error) {
    return logError500(c, logger, error, startTime);
  }
}
