import "dotenv/config";

export default {
  schema: "./src/schema/index.js",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  schemaFilter: ["!public.*"],
};
