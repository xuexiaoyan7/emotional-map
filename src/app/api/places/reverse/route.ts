import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth";
import { reverseGeocodeDevelopment } from "@/server/geocoding";

const coordinates = z.object({ latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180) });
export async function POST(request: Request) {
  if (!await getCurrentUser()) return NextResponse.json({ error: "Please sign in to use location suggestions." }, { status: 401 });
  const parsed = coordinates.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid photo coordinates." }, { status: 400 });
  return NextResponse.json({ place: await reverseGeocodeDevelopment(parsed.data.latitude, parsed.data.longitude) });
}
