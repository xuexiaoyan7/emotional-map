import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, completeCurrentUserProfile } from "@/server/auth";

const bodySchema = z.object({ displayName: z.string().trim().min(1, "Name your map to continue.").max(60, "Use a name shorter than 60 characters.") });
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Name your map to continue." }, { status: 400 });
  const updated = await completeCurrentUserProfile(user.id, parsed.data.displayName);
  return NextResponse.json({ displayName: updated.displayName, publicSlug: updated.publicSlug });
}
