// Server
import { Hono } from "hono";

// Routes
import { relayRoutes } from "./routes/relay";

// Types
import { Env } from "./common/types";

// App
const app = new Hono<{ Bindings: Env }>();

app.route("/relay", relayRoutes());

export default app;
