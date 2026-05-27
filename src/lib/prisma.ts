import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const DB_CONNECT_TIMEOUT_MS = 3000;
const DB_QUERY_TIMEOUT_MS = 10000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: DB_CONNECT_TIMEOUT_MS,
  query_timeout: DB_QUERY_TIMEOUT_MS,
  statement_timeout: DB_QUERY_TIMEOUT_MS,
});
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
