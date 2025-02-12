// Server
import { Hono } from "hono";
import { cors } from "hono/cors";

// Routes
import { relayRoutes } from "./routes/relay";

// Types
import { Env } from "./utils/common/types";
import { groupRoutes } from "./routes/group";
import { messageRoutes } from "./routes/message";
import { quoteRoutes } from "./routes/quote";

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

app.route("/quote", quoteRoutes());
app.route("/relay", relayRoutes());

app.route("/groups", groupRoutes());
app.route("/messages", messageRoutes());

export default app;
