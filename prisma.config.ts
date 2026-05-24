import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Runtime queries go through the connection pooler (port 6543).
    url: env("DATABASE_URL"),
    // DDL (`prisma db push`, `prisma migrate`) needs a direct/session-mode
    // connection (port 5432) because the transaction pooler can't run
    // multi-statement schema transactions.
    directUrl: env("DIRECT_URL"),
  },
});
