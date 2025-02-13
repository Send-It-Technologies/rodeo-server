import { Hono } from "hono";

// Routes
import { add } from "./add";
import { notify } from "./notify";
import { get } from "./get";

// Types
import { zValidator } from "@hono/zod-validator";

import { Env } from "../../utils/common/types";
import {
  MessagesGetAllQuery,
  MessagesAddParams,
  MessagesNotifyParams,
} from "./types";

export function messageRoutes(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  app.get(
    "/get",
    zValidator("query", MessagesGetAllQuery),
    async (c) => await get(c)
  );
  app.post(
    "/add",
    zValidator("json", MessagesAddParams),
    async (c) => await add(c)
  );
  app.post(
    "/notify",
    zValidator("json", MessagesNotifyParams),
    async (c) => await notify(c)
  );

  return app;
}
