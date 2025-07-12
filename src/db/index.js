import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../schema/index.js";

const connections = new Map();

// This function creates and caches tenant-specific Drizzle instances.
// Each instance uses a connection pool where every connection is automatically
// set to the correct tenant schema via the 'search_path' parameter.
export function getDb(tenantId) {
  if (!tenantId) {
    throw new Error("Tenant ID is required");
  }

  if (connections.has(tenantId)) {
    return connections.get(tenantId);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(`DATABASE_URL environment variable not set`);
  }

  // Create a new postgres client configured to use the tenant's schema.
  // The `search_path` option ensures all queries from this client's connection
  // pool target the specified tenant's schema by default.
  const client = postgres(databaseUrl, {
    max: 10, // Max number of connections for this tenant's pool, check with 'SHOW max_connections' in postgres, default is 100.
    idle_timeout: 60, // Number of seconds a connection can be idle before being closed, postgres default is 60.
    prepare: 0, // Number of prepared statements to keep in the pool, postgres default is 0.
    async onconnect(connection) {
      console.log(`Setting search_path for new connection to tenant: ${tenantId}`);
      await connection.unsafe(`SET search_path TO ${tenantId}`);
    },
  });

  const db = drizzle(client, { schema });
  connections.set(tenantId, db);

  return db;
}
