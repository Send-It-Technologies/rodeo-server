import { Hono } from "hono";
import { cors } from "hono/cors";

// Routes
import { relayRoutes } from "./routes/relay";
import { groupRoutes } from "./routes/group";
import { messageRoutes } from "./routes/message";
import { quoteRoutes } from "./routes/quote";

// Types
import { Env } from "./utils/common/types";

// WS
import { ChatRoom } from "./ChatRoom";

// App
const app = new Hono<{ Bindings: Env }>();

// Apply CORS middleware to all routes except /chat/*
app.use("*", async (c, next) => {
  if (c.req.path.startsWith("/chat/")) {
    // Skip CORS for WebSocket routes
    await next();
  } else {
    // Apply CORS for other routes
    return cors({
      origin: "http://localhost:5173",
      credentials: true,
    })(c, next);
  }
});

// Routes
app.route("/quote", quoteRoutes());
app.route("/relay", relayRoutes());
app.route("/groups", groupRoutes());
app.route("/messages", messageRoutes());

// WebSocket Upgrade - Forward to Durable Object
app.get("/chat/:id", async (c) => {
  const { id } = c.req.param();
  const durableObjectId = c.env.CHAT_ROOM.idFromName(id);
  const durableObjectStub = c.env.CHAT_ROOM.get(durableObjectId);
  return durableObjectStub.fetch(c.req.raw);
});

// New route for broadcasting messages
app.post("/broadcast/:id", async (c) => {
  const { id } = c.req.param();
  const message = await c.req.json();
  const env = c.env as Env;

  const durableObjectId = env.CHAT_ROOM.idFromName(id);
  const durableObjectStub = env.CHAT_ROOM.get(durableObjectId);

  // Forward the message to the Durable Object for broadcasting
  return durableObjectStub.fetch(
    new Request("https://broadcast", {
      method: "POST",
      body: JSON.stringify(message),
      headers: { "Content-Type": "application/json" },
    })
  );
});

export { ChatRoom };
export default app;
