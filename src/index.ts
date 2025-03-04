import { Hono } from "hono";
import { cors } from "hono/cors";

// Routes
import { relayRoutes } from "./routes/relay";
import { groupRoutes } from "./routes/group";
import { walletRoutes } from "./routes/wallet";
import { quoteRoutes } from "./routes/quote";
import { payloadRoutes } from "./routes/payload";

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

// Includes: [ GET "/" ]
app.route("/quote", quoteRoutes());

// Includes: POST "/" ]
app.route("/relay", relayRoutes());

// Includes: [ GET "/phone" ]
app.route("/wallet", walletRoutes());

// Includes: [ GET: [ "/get" | "/members" | "/all" | "ofmember" ], POST: [ "/create" | "addmember" ] ]
app.route("/groups", groupRoutes());

// Includes: [ GET: [ "/buy" | "exit" ] ]
app.route("/payload", payloadRoutes());

export default app;
