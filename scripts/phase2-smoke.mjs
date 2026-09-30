import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const base = "http://127.0.0.1:3000";
const suffix = "phase2-smoke";
const aliceEmail = `${suffix}-alice@example.test`;
const bobEmail = `${suffix}-bob@example.test`;
const readEnv = async () => Object.fromEntries((await readFile(".env", "utf8")).split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => { const [key, ...rest] = line.split("="); return [key, rest.join("=").replace(/^"|"$/g, "")]; }));
const env = await readEnv(); const secret = process.env.SESSION_SECRET ?? env.SESSION_SECRET;
const cookieFor = (id) => `emotional_map_session=${id}.${createHmac("sha256", secret).update(id).digest("base64url")}`;
const jsonPost = (path, body, headers = {}) => fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

async function developmentEmailLogin(email) {
  const requested = await jsonPost("/api/auth/request-code", { email }); if (!requested.ok) throw new Error(`OTP request failed: ${await requested.text()}`);
  const requestBody = await requested.json(); if (!requestBody.developmentCode) throw new Error("Development OTP was not returned in development mode.");
  const verified = await jsonPost("/api/auth/verify", { email, code: requestBody.developmentCode }); if (!verified.ok) throw new Error(`OTP verification failed: ${await verified.text()}`);
  return db.user.findUniqueOrThrow({ where: { email } });
}

try {
  await db.emailOtp.deleteMany({ where: { email: { in: [aliceEmail, bobEmail] } } });
  await db.user.deleteMany({ where: { email: { in: [aliceEmail, bobEmail] } } });
  const alice = await developmentEmailLogin(aliceEmail);
  await db.user.update({ where: { id: alice.id }, data: { displayName: "Alice Phase Two", publicSlug: "alice-phase-two" } });
  const joy = await db.emotion.findUniqueOrThrow({ where: { canonicalName: "Joy" } });
  const [privateMemory, publicMemory] = await Promise.all(["Private cove", "Shared coast"].map((placeName, index) => db.memory.create({ data: { user: { connect: { id: alice.id } }, photoUrl: "/uploads/phase2-smoke.jpg", story: index ? "A public memory for the map." : "A private memory that must never be public.", visibility: index ? "PUBLIC" : "PRIVATE", location: { create: { placeName, city: "Test City", country: "Test Country", latitude: 51 + index, longitude: -1 - index } }, emotions: { create: { emotionId: joy.id, intensity: 5 + index } } } })));
  const publicMap = await fetch(`${base}/u/alice-phase-two`); const publicMapText = await publicMap.text(); if (!publicMap.ok || !publicMapText.includes("Shared coast") || publicMapText.includes("Private cove")) throw new Error("Public map visibility filter failed.");
  const publicDetail = await fetch(`${base}/u/alice-phase-two/memory/${publicMemory.id}`); if (!publicDetail.ok || !(await publicDetail.text()).includes("A public memory for the map.")) throw new Error("Guest could not read the public memory.");
  const privateDetail = await fetch(`${base}/u/alice-phase-two/memory/${privateMemory.id}`); if (privateDetail.status !== 404) throw new Error("Private memory was reachable through a public URL.");
  const bob = await developmentEmailLogin(bobEmail);
  const bobHeaders = { Cookie: cookieFor(bob.id) };
  const editAttempt = await fetch(`${base}/api/memories/${publicMemory.id}`, { method: "PUT", headers: { "content-type": "application/json", ...bobHeaders }, body: JSON.stringify({}) }); if (editAttempt.status !== 404) throw new Error("A second user could edit another user's memory.");
  const deleteAttempt = await fetch(`${base}/api/memories/${publicMemory.id}`, { method: "DELETE", headers: bobHeaders }); if (deleteAttempt.status !== 404) throw new Error("A second user could delete another user's memory.");
  const aliceHeaders = { Cookie: cookieFor(alice.id) }; const ownerPrivate = await fetch(`${base}/memories/${privateMemory.id}`, { headers: aliceHeaders }); if (!ownerPrivate.ok) throw new Error("Owner could not read their private memory.");
  console.log("Phase 2 smoke test passed: Email OTP → public map/detail → private denial → cross-user edit/delete denial → owner private access.");
} finally {
  await db.emailOtp.deleteMany({ where: { email: { in: [aliceEmail, bobEmail] } } });
  await db.user.deleteMany({ where: { email: { in: [aliceEmail, bobEmail] } } });
  await db.location.deleteMany({ where: { placeName: { in: ["Private cove", "Shared coast"] } } });
  await db.$disconnect();
}
