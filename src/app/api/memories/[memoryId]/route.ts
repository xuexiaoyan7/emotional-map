import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { createMemorySchema } from "@/features/memory/schema";
import type { Prisma } from "@prisma/client";
import { removeLocalPhoto } from "@/server/storage";

export async function DELETE(_: Request, { params }: { params: Promise<{ memoryId: string }> }) {
  const user = await getCurrentUser(); const { memoryId } = await params;
  const memory = user && await db.memory.findFirst({ where: { id: memoryId, userId: user.id } });
  if (!memory) return NextResponse.json({ error: "Memory not found." }, { status: 404 });
  await db.memory.delete({ where: { id: memory.id } });
  await removeLocalPhoto(memory.photoUrl);
  return NextResponse.json({ ok: true });
}

export async function PUT(request: Request, { params }: { params: Promise<{ memoryId: string }> }) {
  const user = await getCurrentUser(); const { memoryId } = await params;
  const existing = user && await db.memory.findFirst({ where: { id: memoryId, userId: user.id }, include: { location: true } });
  if (!existing) return NextResponse.json({ error: "Memory not found." }, { status: 404 });
  const parsed = createMemorySchema.safeParse(await request.json());
  if (!parsed.success || parsed.data.photoUrl !== existing.photoUrl) return NextResponse.json({ error: "Please keep the existing photo and complete the memory details." }, { status: 400 });
  const data = parsed.data;
  await db.$transaction([
    db.location.update({ where: { id: existing.locationId }, data: { ...data.location } }),
    db.memoryEmotion.deleteMany({ where: { memoryId } }),
    db.memory.update({ where: { id: memoryId }, data: { capturedAt: data.capturedAt, story: data.story, visibility: data.visibility, photoMetadata: data.photoMetadata as Prisma.InputJsonValue | undefined, emotions: { create: data.emotions.map((emotion) => ({ emotionId: emotion.emotionId, intensity: emotion.intensity, customExpression: emotion.customExpression || null })) } } }),
  ]);
  return NextResponse.json({ id: memoryId });
}
