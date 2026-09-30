import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { CreateMapLink } from "@/features/public/create-map-link";
import { getCurrentUser } from "@/server/auth";

type Params = { publicSlug: string; memoryId: string };
async function findPublicMemory(publicSlug: string, memoryId: string) { return db.memory.findFirst({ where: { id: memoryId, visibility: "PUBLIC", user: { publicSlug } }, include: { user: { select: { displayName: true, publicSlug: true } }, location: true, emotions: { include: { emotion: true }, orderBy: { intensity: "desc" } } } }); }
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> { const { publicSlug, memoryId } = await params; const memory = await findPublicMemory(publicSlug, memoryId); if (!memory) return { title: "Memory not found | Emotional Map" }; return { title: `${memory.location.placeName} | Emotional Map`, description: memory.story.slice(0, 150) || `A memory from ${memory.location.placeName}.` }; }
export default async function PublicMemoryPage({ params }: { params: Promise<Params> }) {
  const { publicSlug, memoryId } = await params; const [memory, viewer] = await Promise.all([findPublicMemory(publicSlug, memoryId), getCurrentUser()]); if (!memory || !memory.user.publicSlug) notFound();
  return <main className="detail-page public-memory-page"><nav className="navigation"><Link className="wordmark" href={`/u/${publicSlug}`}>Emotional Map</Link><Link href={`/u/${publicSlug}`}>← Back to {memory.user.displayName ?? "the map"}&apos;s map</Link></nav><article className="memory-detail"><div className="detail-photo"><Image className="detail-image" src={`/api/media/${memory.id}`} unoptimized alt={`Memory from ${memory.location.placeName}`} width={1440} height={1800} sizes="(max-width: 700px) 100vw, 60vw" priority /></div><section className="detail-copy"><p className="eyebrow">Shared memory</p><h1>{memory.location.placeName}</h1><p className="location-line">{memory.location.city} · {memory.location.country}</p>{memory.capturedAt && <time dateTime={memory.capturedAt.toISOString()}>{memory.capturedAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time>}<div className="detail-emotions">{memory.emotions.map(({ emotion, intensity, customExpression }) => <div key={emotion.id}><strong>{emotion.canonicalName} <span>{intensity}/10</span></strong>{customExpression && <p>“{customExpression}”</p>}</div>)}</div>{memory.story ? <p className="detail-story">{memory.story}</p> : <p className="quiet-note">No words were left with this moment.</p>}<CreateMapLink signedIn={Boolean(viewer)} /></section></article></main>;
}
