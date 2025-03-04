import { Hono } from "hono";
import { cors } from "hono/cors";

// Routes
import { relayRoutes } from "./routes/relay";
import { groupRoutes } from "./routes/group";
import { walletRoutes } from "./routes/wallet";
import { quoteRoutes } from "./routes/quote";

// Types
import { Env } from "./utils/common/types";

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

export default app;
