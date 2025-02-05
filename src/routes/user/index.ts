import { Hono } from "hono";

// Routes
import { get } from "./get";
import { create } from "./create";

// Types
import { zValidator } from "@hono/zod-validator";

import { Env } from "../../utils/common/types";
import { UserGetQuery, UserCreateParams } from "./types";

export function userRoutes(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  app.get("/get", zValidator("query", UserGetQuery), async (c) => await get(c));
  app.post(
    "/create",
    zValidator("json", UserCreateParams),
    async (c) => await create(c)
  );

  return app;
}
