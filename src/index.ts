// Server
import { Hono } from "hono";

// Routes
import { relayRoutes } from "./routes/relay";

// Types
import { Env } from "./utils/common/types";
import { userRoutes } from "./routes/user";
import { groupRoutes } from "./routes/group";
import { messageRoutes } from "./routes/message";

// App
const app = new Hono<{ Bindings: Env }>();

app.route("/users", userRoutes());
app.route("/relay", relayRoutes());
app.route("/groups", groupRoutes());
app.route("/messages", messageRoutes());

export default app;
