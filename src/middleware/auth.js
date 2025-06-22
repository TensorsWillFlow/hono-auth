import { jwt } from "hono/jwt";

export const authMiddleware = (c, next) => {
  const auth = jwt({ secret: process.env.ACCESS_TOKEN_SECRET });
  return auth(c, next);
};
