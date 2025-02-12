// Server
import { Hono } from "hono";

// Routes
import { relayRoutes } from "./routes/relay";

// Types
import { Env } from "./utils/common/types";
import { groupRoutes } from "./routes/group";
import { messageRoutes } from "./routes/message";
import { quoteRoutes } from "./routes/quote";

// App
const app = new Hono<{ Bindings: Env }>();

app.route("/quote", quoteRoutes());
app.route("/relay", relayRoutes());

app.route("/groups", groupRoutes());
app.route("/messages", messageRoutes());

export default app;
