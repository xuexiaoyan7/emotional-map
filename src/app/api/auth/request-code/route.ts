import { NextResponse } from "next/server";
import { z } from "zod";
import { MagicLinkError, requestMagicLink } from "@/server/magic-link";

const bodySchema = z.object({ email: z.string().trim().email("Enter a valid email address."), linkCurrentUser: z.boolean().optional() });
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  try {
    const configuredAppUrl = process.env.APP_URL?.trim();
    const origin = configuredAppUrl || new URL(request.url).origin;
    const callback = new URL("/auth/callback", origin);
    if (parsed.data.linkCurrentUser) callback.searchParams.set("link", "1");
    await requestMagicLink(parsed.data.email, callback.toString());
    return NextResponse.json({ message: "Check your inbox for a secure sign-in link." });
  } catch (error) {
    if (error instanceof MagicLinkError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error("Magic link request failed", { error });
    return NextResponse.json({ error: "Unable to send a sign-in link right now." }, { status: 500 });
  }
}
