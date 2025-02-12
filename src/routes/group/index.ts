import { Hono } from "hono";

// Routes
import { get } from "./get";
import { getAll } from "./getAll";
import { create } from "./create";

// Types
import { zValidator } from "@hono/zod-validator";
import { Env } from "../../utils/common/types";
import {
  GroupGetQuery,
  GroupCreateParams,
  GroupMembersQuery,
  GroupAllOfMemberQuery,
  GroupAddMemberParams,
} from "./types";
import { members } from "./members";
import { getAllOfMember } from "./getAllOfMember";

export function groupRoutes(): Hono<{ Bindings: Env }> {
  const app = new Hono<{ Bindings: Env }>();

  // Get a group by space address.
  app.get(
    "/get",
    zValidator("query", GroupGetQuery),
    async (c) => await get(c)
  );

  // Get all members of a group by space address.
  app.get(
    "/members",
    zValidator("query", GroupMembersQuery),
    async (c) => await members(c)
  );

  // Get all groups.
  app.get("/all", async (c) => await getAll(c));

  // Get all groups of a member by member address.
  app.get(
    "/ofmember",
    zValidator("query", GroupAllOfMemberQuery),
    async (c) => await getAllOfMember(c)
  );

  // Create a group (and register its space on Rodeo, if not already)
  app.post(
    "/create",
    zValidator("json", GroupCreateParams),
    async (c) => await create(c)
  );

  // Add member to a group.
  app.post(
    "/addmember",
    zValidator("json", GroupAddMemberParams),
    async (c) => await create(c)
  );

  return app;
}
