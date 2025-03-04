import { Hono } from "hono";
import { cors } from "hono/cors";

// Routes
import { relayRoutes } from "./routes/relay";
import { groupRoutes } from "./routes/group";
import { messageRoutes } from "./routes/message";
import { walletRoutes } from "./routes/wallet";
import { quoteRoutes } from "./routes/quote";

// Types
import { Env } from "./utils/common/types";

// WS
import { ChatRoom } from "./ChatRoom";

// App
const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: "*",
    credentials: true,
  })
);

// Routes
app.route("/quote", quoteRoutes());
app.route("/relay", relayRoutes());
app.route("/wallet", walletRoutes());
app.route("/groups", groupRoutes());
app.route("/messages", messageRoutes());

// WebSocket Upgrade - Forward to Durable Object
app.get("/chat/:id", async (c) => {
  const { id } = c.req.param();
  const durableObjectId = c.env.CHAT_ROOM.idFromName(id);
  const durableObjectStub = c.env.CHAT_ROOM.get(durableObjectId);
  return durableObjectStub.fetch(c.req.raw);
});

export { ChatRoom };
export default app;
