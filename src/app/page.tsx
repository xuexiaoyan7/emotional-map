import Link from "next/link";
import { redirect } from "next/navigation";
import { ensurePublicIdentity, getCurrentUser } from "@/server/auth";
import { db } from "@/server/db";
import { ensureStandardEmotions } from "@/server/emotions";
import { MapShell } from "@/features/map/map-shell";
import { LogoutButton } from "@/features/auth/logout-button";
import { ShareButton } from "@/features/public/share-button";

export default async function HomePage() {
  let user = await getCurrentUser();
  if (!user) return <main className="home-shell"><nav aria-label="Primary navigation" className="navigation"><Link className="wordmark" href="/">Emotional Map</Link><span className="nav-note">A private atlas of feeling</span></nav><section className="hero" aria-labelledby="home-title"><p className="eyebrow">Location × Photo × Emotion × Story</p><h1 id="home-title">Leave a memory<br />where it belongs.</h1><p className="intro">A quiet, personal map for the photographs and feelings you want to find again.</p><div className="actions"><Link className="primary-action" href="/login">Begin with a memory</Link></div></section><aside className="empty-memory"><p className="eyebrow">Your map is waiting</p><p>One meaningful photograph is enough to begin.</p></aside><div className="map-veil" aria-hidden="true"><i className="trace trace-one" /><i className="trace trace-two" /><i className="trace trace-three" /></div></main>;
  if (!user.displayName) redirect("/onboarding");
  user = await ensurePublicIdentity(user);
  const [emotions, memories] = await Promise.all([ensureStandardEmotions(), db.memory.findMany({ where: { userId: user.id }, include: { location: true, emotions: { include: { emotion: true }, orderBy: { intensity: "desc" } } }, orderBy: { createdAt: "desc" } })]);
  return <main className="app-shell"><nav className="journal-masthead" aria-label="Primary navigation"><div className="masthead-brand"><Link className="wordmark" href="/">Emotional Map</Link><p>A map of the places<br />that shaped me</p></div><a className="masthead-map-link" href="#emotional-map">Map</a><div className="nav-actions">{!user.email && <Link className="connect-email-link" href="/login?link=1">Connect email</Link>}{user.publicSlug && <ShareButton path={`/u/${user.publicSlug}`} />}<Link className="desktop-memory-action" href="/memories/new"><span aria-hidden="true">+</span> Leave a memory</Link><LogoutButton /></div></nav><Link className="mobile-memory-action" href="/memories/new"><span aria-hidden="true">+</span> Leave a memory</Link><header className="map-heading"><p className="map-whisper">Different places.<br />Same me.<br />A little more whole.</p><h1 className="sr-only">Your emotional map</h1></header>{memories.length ? <MapShell memories={memories} emotions={emotions} /> : <section className="empty-state"><p>Your map is still quiet.</p><Link className="primary-action" href="/memories/new">Leave your first memory</Link></section>}</main>;
}
