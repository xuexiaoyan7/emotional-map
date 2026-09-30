import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { createPrivatePhotoUrl } from "@/server/storage";

export async function GET(_: Request, { params }: { params: Promise<{ memoryId: string }> }) {
  const { memoryId } = await params;
  const [memory, user] = await Promise.all([db.memory.findUnique({ where: { id: memoryId }, select: { photoUrl: true, userId: true, visibility: true } }), getCurrentUser()]);
  if (!memory || (memory.visibility !== "PUBLIC" && memory.userId !== user?.id)) return new NextResponse("Not found", { status: 404 });
  const url = await createPrivatePhotoUrl(memory.photoUrl).catch(() => null);
  if (!url) return new NextResponse("Photo unavailable", { status: 503 });
  return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store" } });
}
