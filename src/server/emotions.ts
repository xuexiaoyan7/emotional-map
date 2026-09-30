import { orderEmotions, STANDARD_EMOTIONS } from "@/lib/emotions";
import { db } from "./db";

export async function ensureStandardEmotions() {
  await Promise.all(STANDARD_EMOTIONS.map((emotion) => db.emotion.upsert({
    where: { canonicalName: emotion.canonicalName }, update: { category: emotion.category, color: emotion.color }, create: emotion,
  })));
  return orderEmotions(await db.emotion.findMany({ orderBy: { canonicalName: "asc" } }));
}
