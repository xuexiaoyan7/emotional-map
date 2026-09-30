import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { createMemorySchema } from "@/features/memory/schema";
import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";
import { searchPlaces } from "@/server/geocoding";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to leave a memory." }, { status: 401 });
  const parsed = createMemorySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Please complete the required memory details." }, { status: 400 });
  const data = parsed.data;
  const fallback = data.location.latitude === undefined || data.location.longitude === undefined
    ? (await searchPlaces([data.location.placeName, data.location.city, data.location.country].filter(Boolean).join(", ")))[0] : null;
  if (data.location.latitude === undefined && !fallback) return NextResponse.json({ error: "Choose a place suggestion so this memory can be placed on your map." }, { status: 422 });
  const memory = await db.memory.create({
    data: {
      user: { connect: { id: user.id } }, photoUrl: data.photoUrl, photoMetadata: data.photoMetadata as Prisma.InputJsonValue | undefined, capturedAt: data.capturedAt,
      story: data.story, visibility: data.visibility,
      location: { create: { ...data.location, placeName: fallback?.placeName || data.location.placeName, city: fallback?.city || data.location.city, country: fallback?.country || data.location.country, latitude: data.location.latitude ?? fallback?.latitude, longitude: data.location.longitude ?? fallback?.longitude } },
      emotions: { create: data.emotions.map((emotion) => ({ emotionId: emotion.emotionId, intensity: emotion.intensity, customExpression: emotion.customExpression || null })) },
    },
  });
  return NextResponse.json({ id: memory.id }, { status: 201 });
}
