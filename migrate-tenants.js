import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Fetches all non-system, non-drizzle tenant schemas from the database.
 * @returns {Promise<string[]>} A list of tenant schema names.
 */
async function getTenantSchemas() {
  console.log("Connecting to database to fetch tenant schemas...");
  const pg = postgres(process.env.DATABASE_URL, { max: 1 });
  try {
    // Get all non-system, non-drizzle tenant schemas from the database.
    const schemas = await pg`
      SELECT nspname AS schema_name
      FROM pg_catalog.pg_namespace
      WHERE nspname NOT IN ('public', 'information_schema', 'drizzle') AND nspname NOT LIKE 'pg_%';
    `;
    const schemaNames = schemas.map((s) => s.schema_name);
    console.log(`Found schemas to migrate: ${schemaNames.join(", ")}`);
    return schemaNames;
  } finally {
    await pg.end();
    console.log("Database connection for schema discovery closed.");
  }
}

/**
 * Runs Drizzle ORM migrations for each tenant schema.
 * @returns {Promise<void>}
 * @description
 * This will create a new connection to the database for each tenant schema and run the migrations.
 * This will run the migrations for all tenants, new and old. For new tenants all migrations will be run.
 * For old tenants only the migrations that are not already applied will be run.
 * */
async function runMigrations() {
  const schemas = await getTenantSchemas();

  for (const schema of schemas) {
    console.log(`\n▶️  Running migrations for schema: ${schema}...`);
    const connection = postgres(process.env.DATABASE_URL, { max: 1 });
    const db = drizzle(connection);

    try {
      // This is necessary because the migration file is executed in the public schema by default,
      // and we need to ensure that the migrations are executed in the correct tenant schema.
      // search_path is a postgres connection parameter that allows you to set the schema to use for the current connection.
      await connection.unsafe(`SET search_path TO ${schema}`);

      await migrate(db, {
        migrationsFolder: "drizzle",
        // This ensures the migrations history table is created within the tenant's schema.
        migrationsTable: "__drizzle_migrations",
        migrationsSchema: schema,
      });
      console.log(`✅ Migrations for ${schema} completed successfully.`);
    } catch (error) {
      console.error(`❌ Failed to run migrations for schema ${schema}:`, error);
      process.exit(1); // Exit on first failure
    } finally {
      await connection.end();
    }
  }

  console.log("\n🎉 All schema migrations have been processed successfully.");
}

runMigrations().catch((err) => {
  console.error("\nAn unexpected error occurred during the migration process:", err);
  process.exit(1);
});
