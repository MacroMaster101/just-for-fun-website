import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Runtime queries go through the connection pooler (port 6543).
    // For DDL (`prisma db push`, `prisma migrate`), pass --url with
    // $DIRECT_URL, since the transaction pooler can't run schema
    // transactions: npx prisma db push --url "$DIRECT_URL"
    url: env("DATABASE_URL"),
  },
});
