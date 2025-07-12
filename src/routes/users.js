import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { users } from "../schema/index.js";

const users_router = new Hono();

// All routes in this file will be protected by the auth middleware
users_router.use("*", authMiddleware);

users_router.get("/me", async (c) => {
  const payload = c.get("jwtPayload");
  const userId = payload.sub;
  const db = c.get("db");

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      id: true,
      username: true,
      email: true,
    },
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({ user });
});

export default users_router;
