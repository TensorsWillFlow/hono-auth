import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db/index.js";
import { comparePasswords, generateAccessToken, generateRefreshToken, hashPassword } from "../lib/auth.js";
import { sessions, users } from "../schema/index.js";

const auth = new Hono();

const registerSchema = z.object({
  username: z.string().min(3).max(256),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

auth.post("/register", zValidator("json", registerSchema), async (c) => {
  const { username, email, password } = c.req.valid("json");

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return c.json({ error: "User with that email already exists" }, 409);
  }

  const passwordHash = await hashPassword(password);

  const [newUser] = await db
    .insert(users)
    .values({
      username,
      email,
      passwordHash,
    })
    .returning();

  return c.json({
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
    },
  });
});

auth.post("/login", zValidator("json", loginSchema), async (c) => {
  const { email, password } = c.req.valid("json");

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const isPasswordValid = await comparePasswords(password, user.passwordHash);
  if (!isPasswordValid) {
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const refreshToken = generateRefreshToken();
  const accessToken = await generateAccessToken(user.id);

  // Store the refresh token in the database
  await db.insert(sessions).values({
    userId: user.id,
    refreshToken,
  });

  return c.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    accessToken,
    refreshToken,
  });
});

auth.post("/refresh", zValidator("json", refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid("json");

  // Find the session in the database
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.refreshToken, refreshToken),
  });

  if (!session) {
    return c.json({ error: "Invalid refresh token" }, 401);
  }

  // Generate a new access token
  const newAccessToken = await generateAccessToken(session.userId);

  return c.json({ accessToken: newAccessToken });
});

auth.post("/logout", zValidator("json", refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid("json");

  // Delete the session from the database
  await db.delete(sessions).where(eq(sessions.refreshToken, refreshToken));

  return c.json({ message: "Logged out successfully" });
});

export default auth;
