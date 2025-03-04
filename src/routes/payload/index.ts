import { Hono } from "hono";

// Routes
import { buy } from "./buy";
import { exit } from "./exit";

// Types
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../utils/common/types";
import { BuyPayloadQuery, ExitPayloadQuery } from "./types";

export function payloadRoutes(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  // Return buy payload
  app.get(
    "/buy",
    zValidator("query", BuyPayloadQuery),
    async (c) => await buy(c)
  );

  // Return exit payload
  app.get(
    "/exit",
    zValidator("query", ExitPayloadQuery),
    async (c) => await exit(c)
  );

  return app;
}
