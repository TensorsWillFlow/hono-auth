import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import authRouter from "./routes/auth.js";
import usersRouter from "./routes/users.js";

const app = new Hono().basePath("/api");

// CORS configuration should be one of the first middleware
app.use(
  "*",
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Default for local dev, please change this to your frontend url if using a different port
    credentials: true,
  })
);

app.use("*", logger());
app.use("*", prettyJSON());

app.onError((err, c) => {
  console.error("Server Error:", err);
  return c.json(
    {
      error: "An internal server error occurred",
      message: err.message, // For debugging, you might want to expose the message
    },
    500
  );
});

app.get("/", (c) => {
  return c.json({ message: "Hello, World!" });
});

app.route("/auth", authRouter);
app.route("/users", usersRouter);

const port = 3000;
console.log(`Server is running on port ${port}`);

// if using node we use this
serve({
  fetch: app.fetch,
  port,
});

// if using bun or deno we use this, since they have a built in server unlike node runtime
// export default {
//   port: 3000,
//   fetch: app.fetch,
// };

export default app;
