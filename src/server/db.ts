import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const connectionString = process.env.DATABASE_URL?.replace("sslmode=require", "sslmode=no-verify");

if (!connectionString) throw new Error("DATABASE_URL is required.");

// Supabase's pooler presents a certificate chain that is not available in all
// local trust stores. The driver adapter is used consistently in development
// and production, instead of falling back to a mock or local database.
const adapter = new PrismaPg(connectionString);
export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
