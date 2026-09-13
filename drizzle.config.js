export default {
  dialect: "postgresql",
  schema: "./src/utils/schema.jsx",
  out: "./drizzle",
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_isJbITZR9WU1@ep-snowy-shape-a46up580-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    connectionString:
      "postgresql://neondb_owner:npg_isJbITZR9WU1@ep-snowy-shape-a46up580-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  },
};
