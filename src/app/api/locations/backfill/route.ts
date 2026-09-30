import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { searchPlaces } from "@/server/geocoding";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in to update your map." }, { status: 401 });
  const locations = await db.location.findMany({ where: { memories: { some: { userId: user.id } }, OR: [{ latitude: null }, { longitude: null }] } });
  let updated = 0;
  for (const location of locations) {
    const candidate = (await searchPlaces([location.placeName, location.city, location.country].filter(Boolean).join(", ")))[0];
    if (candidate) { await db.location.update({ where: { id: location.id }, data: { latitude: candidate.latitude, longitude: candidate.longitude } }); updated += 1; }
  }
  return NextResponse.json({ updated, remaining: locations.length - updated });
}
