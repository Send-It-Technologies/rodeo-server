import { Hono } from "hono";

// Routes
import { get } from "./get";
import { getAll } from "./getAll";
import { create } from "./create";

// Types
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../utils/common/types";
import { GroupGetQuery, GroupCreateParams } from "./types";

export function groupRoutes(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  // Get a group by space address.
  app.get(
    "/get",
    zValidator("query", GroupGetQuery),
    async (c) => await get(c)
  );
  // Get all groups.
  app.get("/getAll", async (c) => await getAll(c));
  // Create a group (and register its space on Rodeo, if not already)
  app.post(
    "/create",
    zValidator("json", GroupCreateParams),
    async (c) => await create(c)
  );

  return app;
}
