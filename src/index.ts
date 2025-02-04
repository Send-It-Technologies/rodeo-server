import { Hono } from "hono";

// Routes
import { userRoutes } from "./routes/user";
import { groupRoutes } from "./routes/group";

const app = new Hono<{ Bindings: { DATABASE_URL: string } }>();

app.route("/users", userRoutes());
app.route("/groups", groupRoutes());

export default app;
