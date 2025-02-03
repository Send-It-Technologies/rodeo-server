import { Hono } from "hono";

// Routes
import { userRoutes } from "./routes/user";

const app = new Hono<{ Bindings: { DATABASE_URL: string } }>();

app.route("/user", userRoutes());

export default app;
