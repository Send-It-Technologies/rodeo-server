// Server
import { Hono } from "hono";
import { cors } from "hono/cors";
import { createBunWebSocket } from "hono/bun";
import type { ServerWebSocket } from "bun";

// Routes
import { relayRoutes } from "./routes/relay";

// Types
import { Env } from "./utils/common/types";
import { groupRoutes } from "./routes/group";
import { messageRoutes } from "./routes/message";
import { quoteRoutes } from "./routes/quote";

// App
const app = new Hono<{ Bindings: Env }>();

// Websocket
const { upgradeWebSocket, websocket } = createBunWebSocket<ServerWebSocket>();

// Start the server
const server = Bun.serve({
  port: 8787,
  fetch: app.fetch,
  websocket,
});

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
app.route("/messages", messageRoutes(server));

app.get(
  "/chat/:id",
  upgradeWebSocket((c) => {
    const { id } = c.req.param();

    return {
      onOpen: (_, ws) => {
        const rawWs = ws.raw as ServerWebSocket;
        rawWs.subscribe(id);
        console.log(`WebSocket server opened and subscribed to topic '${id}'`);
      },

      onClose: (_, ws) => {
        const rawWs = ws.raw as ServerWebSocket;
        rawWs.unsubscribe(id);
        console.log(
          `WebSocket server closed and unsubscribed from topic '${id}'`
        );
      },
    };
  })
);

export default app;
