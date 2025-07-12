import { createMiddleware } from "hono/factory";
import { getDb } from "../db/index.js";

export const tenant = createMiddleware(async (c, next) => {
  const tenantId = c.req.header("X-Tenant-Id");

  if (!tenantId) {
    return c.json({ error: "Tenant ID is required" }, 400);
  }

  // A simple validation for the tenant ID. In a real application, you might
  // want to check this against a database of known tenants.
  if (!/^[a-zA-Z0-9_]+$/.test(tenantId)) {
    return c.json({ error: "Invalid tenant ID format" }, 400);
  }

  try {
    const db = getDb(tenantId);
    c.set("db", db);
  } catch (error) {
    console.error(`Failed to get DB for tenant ${tenantId}:`, error);
    return c.json({ error: "Invalid tenant configuration" }, 500);
  }

  await next();
});
