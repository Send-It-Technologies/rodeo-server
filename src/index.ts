import { Hono } from "hono";
import { cors } from "hono/cors";

// Routes
import { relayRoutes } from "./routes/relay";
import { groupRoutes } from "./routes/group";
import { messageRoutes } from "./routes/message";
import { quoteRoutes } from "./routes/quote";

// Types
import { Env } from "./utils/common/types";

// App
const app = new Hono<{ Bindings: Env }>();

// Enable CORS for all routes
app.use(
  "*",
  cors({
    origin: "http://localhost:5173", // Allow only your frontend
    credentials: true,
  })
);

// Routes
app.route("/quote", quoteRoutes());
app.route("/relay", relayRoutes());
app.route("/groups", groupRoutes());
app.route("/messages", messageRoutes());

// WebSocket Upgrade - Forward to Durable Object
app.get("/chat/:id", async (c) => {
  const { id } = c.req.param();
  const env = c.env as Env;

  // Get the Durable Object instance
  const durableObjectId = env.CHAT_ROOM.idFromName(id);
  const durableObjectStub = env.CHAT_ROOM.get(durableObjectId);

  // Forward the WebSocket upgrade request to the Durable Object
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

export default app;
