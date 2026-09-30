import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth";
import { searchPlaces } from "@/server/geocoding";

const input = z.object({ query: z.string().trim().min(2).max(180) });
export async function POST(request: Request) {
  if (!await getCurrentUser()) return NextResponse.json({ error: "Please sign in to search places." }, { status: 401 });
  const parsed = input.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Enter at least two characters to search." }, { status: 400 });
  return NextResponse.json({ candidates: await searchPlaces(parsed.data.query) });
}
