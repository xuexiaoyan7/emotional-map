import { NextResponse } from "next/server";
import { ensureStandardEmotions } from "@/server/emotions";
export async function GET() { return NextResponse.json(await ensureStandardEmotions()); }
