import { Hono } from "hono";

// Routes
import { get } from "./get";
import { create } from "./create";

// Types
import { zValidator } from "@hono/zod-validator";
import { UserGetQuery, UserCreateParams } from "./types";

export function userRoutes(): Hono<{ Bindings: { DATABASE_URL: string } }> {
  const app = new Hono<{ Bindings: { DATABASE_URL: string } }>();

  app.get("/get", zValidator("query", UserGetQuery), async (c) => await get(c));
  app.post(
    "/create",
    zValidator("param", UserCreateParams),
    async (c) => await create(c)
  );

  return app;
}
