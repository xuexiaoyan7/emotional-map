import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getCurrentUser } from "@/server/auth";
import { ensureStandardEmotions } from "@/server/emotions";
import { MapShell } from "@/features/map/map-shell";
import { ShareButton } from "@/features/public/share-button";
import { CreateMapLink } from "@/features/public/create-map-link";

type Params = { publicSlug: string };
async function findPublicUser(publicSlug: string) { return db.user.findUnique({ where: { publicSlug }, select: { displayName: true, publicSlug: true, avatarUrl: true, memories: { where: { visibility: "PUBLIC" }, include: { location: true, emotions: { include: { emotion: true }, orderBy: { intensity: "desc" } } }, orderBy: { createdAt: "desc" } } } }); }
export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> { const { publicSlug } = await params; const user = await findPublicUser(publicSlug); if (!user) return { title: "Map not found | Emotional Map" }; return { title: `${user.displayName ?? "A private"}'s Emotional Map`, description: "A collection of memories shared across places." }; }
export default async function PublicMapPage({ params }: { params: Promise<Params> }) {
  const { publicSlug } = await params; const [author, viewer, emotions] = await Promise.all([findPublicUser(publicSlug), getCurrentUser(), ensureStandardEmotions()]); if (!author || !author.publicSlug) notFound();
  const initials = (author.displayName ?? "M").split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(); const isOwner = viewer?.id && author.publicSlug === viewer.publicSlug;
  return <main className="app-shell public-map-shell"><nav className="journal-masthead public-masthead"><div className="masthead-brand"><Link className="wordmark" href="/">Emotional Map</Link><p>Memories shared by</p></div><div className="public-author"><span className="avatar-fallback" aria-hidden="true">{initials}</span><span>{author.displayName ?? "Memory keeper"}</span></div><div className="nav-actions"><ShareButton path={`/u/${author.publicSlug}`} />{isOwner ? <Link className="journal-action" href="/">Your map</Link> : <CreateMapLink signedIn={Boolean(viewer)} />}</div></nav><header className="public-map-heading"><p className="eyebrow">{author.memories.length ? "A public emotional map" : "A quiet map"}</p><h1>{author.displayName ?? "A memory keeper"}&apos;s map</h1></header>{author.memories.length ? <MapShell memories={author.memories} emotions={emotions} readOnly publicSlug={author.publicSlug} /> : <section className="public-empty-state"><p>There are no memories shared here yet.</p><CreateMapLink signedIn={Boolean(viewer)} /></section>}<footer className="public-map-footer"><CreateMapLink signedIn={Boolean(viewer)} /></footer></main>;
}
