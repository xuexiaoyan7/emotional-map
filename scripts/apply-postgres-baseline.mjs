import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Client } from "pg";

const migrationName = "20260917160000_production_baseline";
const migrationPath = new URL(`../prisma/migrations/${migrationName}/migration.sql`, import.meta.url);
const sourceUrl = process.env.DATABASE_URL;

if (!sourceUrl) throw new Error("DATABASE_URL is required.");

const connectionString = sourceUrl.replace("sslmode=require", "sslmode=no-verify");
const sql = await readFile(migrationPath, "utf8");
const checksum = createHash("sha256").update(sql).digest("hex");

async function connectWithRetry() {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const client = new Client({ connectionString, connectionTimeoutMillis: 15_000 });
    try {
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => undefined);
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }
  throw lastError;
}

const client = await connectWithRetry();
try {
  await client.query(`CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id" VARCHAR(36) PRIMARY KEY,
    "checksum" VARCHAR(64) NOT NULL,
    "finished_at" TIMESTAMPTZ,
    "migration_name" VARCHAR(255) NOT NULL,
    "logs" TEXT,
    "rolled_back_at" TIMESTAMPTZ,
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "applied_steps_count" INTEGER NOT NULL DEFAULT 0
  )`);

  const existing = await client.query(
    'SELECT 1 FROM "_prisma_migrations" WHERE "migration_name" = $1 AND "finished_at" IS NOT NULL',
    [migrationName],
  );
  if (existing.rowCount) {
    console.log("PostgreSQL baseline is already applied.");
  } else {
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        'INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count") VALUES ($1, $2, now(), $3, now(), 1)',
        [randomUUID(), checksum, migrationName],
      );
      await client.query("COMMIT");
      console.log("PostgreSQL baseline applied.");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    }
  }
} finally {
  await client.end();
}
