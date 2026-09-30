import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { MemoryActions } from "@/features/memory/memory-actions";

export default async function MemoryDetail({ params }: { params: Promise<{ memoryId: string }> }) {
  const user = await getCurrentUser(); if (!user) redirect("/login"); const { memoryId } = await params;
  const memory = await db.memory.findFirst({ where: { id: memoryId, userId: user.id }, include: { location: true, emotions: { include: { emotion: true }, orderBy: { intensity: "desc" } } } });
  if (!memory) notFound();
  return <main className="detail-page"><nav className="navigation"><Link className="wordmark" href="/">Emotional Map</Link><Link href="/">← Back to map</Link></nav><article className="memory-detail"><div className="detail-photo"><Image className="detail-image" src={`/api/media/${memory.id}`} unoptimized alt={`Memory from ${memory.location.placeName}`} width={1440} height={1800} sizes="(max-width: 700px) 100vw, 60vw" priority /></div><section className="detail-copy"><p className="eyebrow">{memory.visibility === "PRIVATE" ? "Private memory" : "Public memory"}</p><h1>{memory.location.placeName}</h1><p className="location-line">{memory.location.city} · {memory.location.country}</p>{memory.capturedAt && <time dateTime={memory.capturedAt.toISOString()}>{memory.capturedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time>}<div className="detail-emotions">{memory.emotions.map(({ emotion, intensity, customExpression }) => <div key={emotion.id}><strong>{emotion.canonicalName} <span>{intensity}/10</span></strong>{customExpression && <p>“{customExpression}”</p>}</div>)}</div>{memory.story ? <p className="detail-story">{memory.story}</p> : <p className="quiet-note">No words were left with this moment.</p>}<MemoryActions memoryId={memory.id} /></section></article></main>;
}
