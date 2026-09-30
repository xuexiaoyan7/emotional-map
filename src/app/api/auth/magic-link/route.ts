import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, signInEmailUser } from "@/server/auth";
import { db } from "@/server/db";
import { MagicLinkError, verifyMagicLinkAccessToken } from "@/server/magic-link";

const bodySchema = z.object({
  accessToken: z.string().min(20),
  linkCurrentUser: z.boolean().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "That sign-in link is incomplete. Request a new one." }, { status: 400 });
  }

  try {
    const email = await verifyMagicLinkAccessToken(parsed.data.accessToken);
    const currentUser = parsed.data.linkCurrentUser ? await getCurrentUser() : null;

    if (parsed.data.linkCurrentUser && !currentUser) {
      return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });
    }

    if (currentUser) {
      const existingOwner = await db.user.findUnique({ where: { email }, select: { id: true } });
      if (existingOwner && existingOwner.id !== currentUser.id) {
        return NextResponse.json({ error: "That email is already connected to another map." }, { status: 409 });
      }
      const user = await db.user.update({ where: { id: currentUser.id }, data: { email } });
      return NextResponse.json({ user: { id: user.id, displayName: user.displayName, publicSlug: user.publicSlug }, needsOnboarding: !user.displayName || !user.publicSlug });
    }

    const user = await signInEmailUser(email);
    return NextResponse.json({ user: { id: user.id, displayName: user.displayName, publicSlug: user.publicSlug }, needsOnboarding: !user.displayName || !user.publicSlug });
  } catch (error) {
    if (error instanceof MagicLinkError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Magic link callback failed", { error });
    return NextResponse.json({ error: "Unable to complete sign-in right now." }, { status: 500 });
  }
}
