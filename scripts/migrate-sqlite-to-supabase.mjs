import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const backup = path.join(root, ".local-backups/phase-2-5-pre-postgres");
const sqlitePath = path.join(backup, "dev.db");
const bucket = "memory-media";
const connectionString = process.env.DATABASE_URL?.replace("sslmode=require", "sslmode=no-verify");
const secret = process.env.SUPABASE_SECRET_KEY?.replace(/\s/g, "");
if (!connectionString || !process.env.SUPABASE_URL || !secret) throw new Error("Production database and Supabase Storage environment variables are required.");

const sqlite = (table) => JSON.parse(execFileSync("sqlite3", ["-json", sqlitePath, `SELECT * FROM "${table}"`], { encoding: "utf8" }) || "[]");
const mimeFor = (filename) => ({ jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" })[filename.split(".").pop()?.toLowerCase() ?? ""] ?? "application/octet-stream";
const asDate = (value) => typeof value === "number" || (typeof value === "string" && /^\d{12,}$/.test(value)) ? new Date(Number(value)) : value;

async function connectWithRetry() {
  let error;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const client = new Client({ connectionString, connectionTimeoutMillis: 15_000 });
    try { await client.connect(); return client; }
    catch (reason) { error = reason; await client.end().catch(() => undefined); if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1_000)); }
  }
  throw error;
}

const users = sqlite("User");
const locations = sqlite("Location");
const emotions = sqlite("Emotion");
const memories = sqlite("Memory");
const memoryEmotions = sqlite("MemoryEmotion");
const comments = sqlite("Comment");
const likes = sqlite("Like");
const reactions = sqlite("Reaction");
const client = await connectWithRetry();
const storage = createClient(process.env.SUPABASE_URL, secret, { auth: { persistSession: false, autoRefreshToken: false } });

try {
  const existing = await client.query('SELECT count(*)::int AS count FROM "Memory"');
  if (existing.rows[0].count === 0) {
    await client.query("BEGIN");
    try {
      for (const row of users) await client.query('INSERT INTO "User" ("id","phone","email","displayName","publicSlug","avatarUrl","handle","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [row.id,row.phone,row.email,row.displayName,row.publicSlug,row.avatarUrl,row.handle,asDate(row.createdAt),asDate(row.updatedAt)]);
      for (const row of locations) await client.query('INSERT INTO "Location" ("id","placeName","city","country","latitude","longitude","providerId","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', [row.id,row.placeName,row.city,row.country,row.latitude,row.longitude,row.providerId,asDate(row.createdAt)]);
      for (const row of emotions) await client.query('INSERT INTO "Emotion" ("id","canonicalName","category","color","createdAt") VALUES ($1,$2,$3,$4,$5)', [row.id,row.canonicalName,row.category,row.color,asDate(row.createdAt)]);
      for (const row of memories) await client.query('INSERT INTO "Memory" ("id","userId","photoUrl","photoMetadata","locationId","capturedAt","story","visibility","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [row.id,row.userId,row.photoUrl,row.photoMetadata ? JSON.parse(row.photoMetadata) : null,row.locationId,asDate(row.capturedAt),row.story,row.visibility,asDate(row.createdAt),asDate(row.updatedAt)]);
      for (const row of memoryEmotions) await client.query('INSERT INTO "MemoryEmotion" ("memoryId","emotionId","intensity","customExpression") VALUES ($1,$2,$3,$4)', [row.memoryId,row.emotionId,row.intensity,row.customExpression]);
      for (const row of comments) await client.query('INSERT INTO "Comment" ("id","memoryId","userId","content","createdAt") VALUES ($1,$2,$3,$4,$5)', [row.id,row.memoryId,row.userId,row.content,asDate(row.createdAt)]);
      for (const row of likes) await client.query('INSERT INTO "Like" ("id","memoryId","userId","createdAt") VALUES ($1,$2,$3,$4)', [row.id,row.memoryId,row.userId,asDate(row.createdAt)]);
      for (const row of reactions) await client.query('INSERT INTO "Reaction" ("id","memoryId","userId","kind","createdAt") VALUES ($1,$2,$3,$4,$5)', [row.id,row.memoryId,row.userId,row.kind,asDate(row.createdAt)]);
      await client.query("COMMIT");
      console.log(`Imported ${memories.length} memories and ${users.length} users into PostgreSQL.`);
    } catch (error) { await client.query("ROLLBACK").catch(() => undefined); throw error; }
  } else console.log("PostgreSQL already has memory data; skipping relational import.");

  const records = await client.query('SELECT "id", "userId", "photoUrl" FROM "Memory" ORDER BY "createdAt"');
  let uploaded = 0;
  for (const record of records.rows) {
    if (!record.photoUrl.startsWith("/uploads/")) continue;
    const filename = path.basename(record.photoUrl);
    const localFile = path.join(backup, "public/uploads", filename);
    if (!existsSync(localFile)) throw new Error(`Missing local photo backup: ${filename}`);
    const objectPath = `users/${record.userId}/memories/${record.id}.${filename.split(".").pop()}`;
    const { error } = await storage.storage.from(bucket).upload(objectPath, await readFile(localFile), { contentType: mimeFor(filename), upsert: true });
    if (error) throw error;
    await client.query('UPDATE "Memory" SET "photoUrl" = $1 WHERE "id" = $2', [`supabase://${bucket}/${objectPath}`, record.id]);
    uploaded += 1;
  }
  const counts = await client.query('SELECT (SELECT count(*)::int FROM "User") AS users, (SELECT count(*)::int FROM "Memory") AS memories, (SELECT count(*)::int FROM "MemoryEmotion") AS memory_emotions');
  console.log(`Uploaded ${uploaded} private photos. Verification: users=${counts.rows[0].users}, memories=${counts.rows[0].memories}, memory_emotions=${counts.rows[0].memory_emotions}.`);
} finally { await client.end(); }
