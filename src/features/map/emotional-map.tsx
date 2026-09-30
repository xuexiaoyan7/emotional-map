"use client";

import "leaflet/dist/leaflet.css";
import { divIcon } from "leaflet";
import Link from "next/link";
import { Marker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { visualForEmotion } from "@/lib/emotion-visual-tokens";
import { isDefaultEmotion } from "@/lib/emotions";
import { groupNearbyMemories, visualOffsetPosition } from "@/lib/map-overlap";
import { stableIndex } from "@/lib/stable-visual";

export type MapMemory = { id: string; photoUrl: string; capturedAt?: Date | null; story?: string; location: { id: string; placeName: string; city: string; country: string; latitude: number | null; longitude: number | null }; emotions: { intensity: number; emotion: { id: string; canonicalName: string; color: string | null } }[] };
type MapEmotion = { id: string; canonicalName: string };
type EmotionEntry = MapMemory["emotions"][number];

const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const tileSource = maptilerKey
  ? { url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerKey}`, attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noopener noreferrer">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>' }
  : { url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>' };

const traceShapes = ["M49 4C69 0 95 18 96 42c2 22-16 46-40 52C31 101 5 82 3 57 1 32 25 8 49 4Z", "M50 5c17-7 43 5 47 25 8 22-11 50-33 62-25 12-55-3-61-29C-4 37 25 12 50 5Z", "M47 4c24-3 43 11 49 32 6 23-9 50-34 59-21 10-51-4-58-28C-4 44 20 9 47 4Z", "M51 3c21 2 42 17 44 39 3 24-18 48-43 54C27 101 3 80 4 56 5 31 26 1 51 3Z"];
const markerRotations = [-1.8, -.8, .2, 1.1, 1.7];

function traceIcon(memoryId: string, emotionName: string | undefined, intensity: number, count?: number) {
  const token = visualForEmotion(emotionName);
  // 15–27.5px replaces the previous 27–46.5px range: about 43% smaller.
  const size = 14 + intensity * 1.25;
  const variant = stableIndex(memoryId, traceShapes.length);
  return divIcon({ className: "emotion-trace-icon", iconSize: [size, size], iconAnchor: [size / 2, size / 2], html: `<span class="emotion-trace trace-${token.trace}" style="--trace:${token.primary};--trace-secondary:${token.secondary};--trace-size:${size}px"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="${traceShapes[variant]}" /></svg><i></i>${count && count > 1 ? `<b class="trace-count">${count}</b>` : ""}</span>` });
}

function strongestEmotion(memory: MapMemory, selectedName?: string) {
  if (selectedName) return memory.emotions.find((item) => item.emotion.canonicalName === selectedName) ?? memory.emotions[0];
  return memory.emotions.reduce<EmotionEntry | undefined>((strongest, current) => !strongest || current.intensity > strongest.intensity ? current : strongest, undefined);
}

function MemoryPreview({ memory, publicSlug }: { memory: MapMemory; publicSlug?: string }) {
  const rotation = markerRotations[stableIndex(memory.id, markerRotations.length)];
  const memoryHref = publicSlug ? `/u/${publicSlug}/memory/${memory.id}` : `/memories/${memory.id}`;
  return <article className="map-memory-fragment" style={{ transform: `rotate(${rotation}deg)` }}><Link className="popup-photo" href={memoryHref}><img className="popup-thumb" src={`/api/media/${memory.id}`} alt={`Memory from ${memory.location.placeName}`} /></Link><div className="preview-copy"><p className="preview-place">{memory.location.placeName}</p><p className="preview-meta">{memory.location.city} · {memory.location.country}{memory.capturedAt ? ` · ${new Date(memory.capturedAt).getUTCFullYear()}` : ""}</p><p className="preview-emotions">{memory.emotions.map((item) => `${item.emotion.canonicalName} ${item.intensity}`).join(" · ")}</p>{memory.story && <p className="preview-story">“{memory.story.slice(0, 100)}{memory.story.length > 100 ? "…" : ""}”</p>}<Link href={memoryHref}>Open memory →</Link></div></article>;
}

function NearbyMemoryPreview({ memories, publicSlug }: { memories: MapMemory[]; publicSlug?: string }) {
  const [selectedId, setSelectedId] = useState(memories[0]?.id);
  const selected = memories.find((memory) => memory.id === selectedId) ?? memories[0];
  if (!selected) return null;
  return <div className="nearby-memory-picker"><p className="nearby-memory-label">{memories.length} memories nearby</p><div className="nearby-memory-options" role="group" aria-label="Choose a nearby memory">{memories.map((memory, index) => <button type="button" key={memory.id} className={memory.id === selected.id ? "nearby-selected" : ""} onClick={() => setSelectedId(memory.id)} aria-label={`Show memory ${index + 1} from ${memory.location.placeName}`}>{index + 1}</button>)}</div><MemoryPreview memory={selected} publicSlug={publicSlug} /></div>;
}

function MemoryTraces({ groups, selectedName, publicSlug }: { groups: ReturnType<typeof groupNearbyMemories<MapMemory & { latitude: number; longitude: number }>>; selectedName?: string; publicSlug?: string }) {
  const map = useMap();
  const [zoom, setZoom] = useState(() => map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const clustered = zoom < 8;

  return <>{groups.flatMap((group) => {
    const primary = strongestEmotion(group.memories[0], selectedName);
    if (clustered && group.memories.length > 1) {
      return <Marker key={group.id} title={`Choose one of ${group.memories.length} nearby memories`} position={[group.latitude, group.longitude]} icon={traceIcon(group.id, primary?.emotion.canonicalName, Math.max(...group.memories.map((memory) => strongestEmotion(memory, selectedName)?.intensity ?? 1)), group.memories.length)} eventHandlers={{ mouseover: (event) => event.target.openPopup() }}><Popup className="memory-preview nearby-popup" autoPanPadding={[28, 28]}><NearbyMemoryPreview memories={group.memories} publicSlug={publicSlug} /></Popup></Marker>;
    }
    return group.memories.map((memory, index) => {
      const current = strongestEmotion(memory, selectedName);
      const position = visualOffsetPosition({ id: memory.id, latitude: memory.location.latitude!, longitude: memory.location.longitude! }, index, group.memories.length);
      return <Marker key={memory.id} title={`Open memory from ${memory.location.placeName}`} position={position} icon={traceIcon(memory.id, current?.emotion.canonicalName, current?.intensity ?? 1)} eventHandlers={{ mouseover: (event) => event.target.openPopup() }}><Popup className="memory-preview" autoPanPadding={[28, 28]}><MemoryPreview memory={memory} publicSlug={publicSlug} /></Popup></Marker>;
    });
  })}</>;
}

export function EmotionalMap({ memories, emotions, readOnly = false, publicSlug }: { memories: MapMemory[]; emotions: MapEmotion[]; readOnly?: boolean; publicSlug?: string }) {
  const [mode, setMode] = useState<"footprints" | "emotions">("footprints"); const [emotionId, setEmotionId] = useState(""); const [railExpanded, setRailExpanded] = useState(false); const [backfilling, setBackfilling] = useState(false); const [message, setMessage] = useState(""); const router = useRouter();
  const selectedName = emotions.find((emotion) => emotion.id === emotionId)?.canonicalName;
  const visible = useMemo(() => mode === "emotions" && emotionId ? memories.filter((memory) => memory.emotions.some((item) => item.emotion.id === emotionId)) : memories, [memories, mode, emotionId]);
  const placed = visible.filter((memory): memory is MapMemory & { location: MapMemory["location"] & { latitude: number; longitude: number } } => memory.location.latitude !== null && memory.location.longitude !== null);
  const groups = useMemo(() => groupNearbyMemories(placed.map((memory) => ({ ...memory, latitude: memory.location.latitude, longitude: memory.location.longitude }))), [placed]);
  const defaultEmotions = emotions.filter((emotion) => isDefaultEmotion(emotion.canonicalName));
  const legacyEmotions = emotions.filter((emotion) => !isDefaultEmotion(emotion.canonicalName));
  const railEmotions = railExpanded ? [...defaultEmotions, ...legacyEmotions] : defaultEmotions.slice(0, 6);
  const selectEmotion = (id: string) => { setMode("emotions"); setEmotionId(id); };
  return <section className="map-section" id="emotional-map" aria-label="Your emotional map">
    <div className="map-toolbar"><div className="map-mode-links" role="group" aria-label="Map mode"><button className={mode === "footprints" ? "selected" : ""} onClick={() => { setMode("footprints"); setEmotionId(""); }}>Map</button><button className={mode === "emotions" ? "selected" : ""} onClick={() => setMode("emotions")}>Emotions</button></div>{mode === "emotions" && <label className="emotion-filter"><span>Trace a feeling</span><select value={emotionId} onChange={(event) => selectEmotion(event.target.value)}><option value="">All feelings</option>{[...defaultEmotions, ...legacyEmotions].map((emotion) => <option value={emotion.id} key={emotion.id}>{emotion.canonicalName}</option>)}</select></label>}</div>
    <aside className="emotion-rail" aria-label="Filter memories by emotion"><button className={!emotionId ? "rail-selected" : ""} onClick={() => { setMode("footprints"); setEmotionId(""); }}><span aria-hidden="true">◎</span>All</button>{railEmotions.map((emotion) => <button className={emotionId === emotion.id ? "rail-selected" : ""} key={emotion.id} onClick={() => selectEmotion(emotion.id)}><i style={{ background: visualForEmotion(emotion.canonicalName).primary }} aria-hidden="true" />{emotion.canonicalName}</button>)}{(defaultEmotions.length > 6 || legacyEmotions.length > 0) && <button className="rail-more" onClick={() => setRailExpanded((current) => !current)}>{railExpanded ? "Less" : "More"}</button>}</aside>
    <MapContainer center={[25, 12]} zoom={2} scrollWheelZoom className="leaflet-map"><TileLayer attribution={tileSource.attribution} url={tileSource.url} /><MemoryTraces groups={groups} selectedName={selectedName} publicSlug={publicSlug} /></MapContainer>
    {visible.length === 0 && <p className="map-empty">No memories with this feeling yet.</p>}
    {!readOnly && visible.some((memory) => memory.location.latitude === null || memory.location.longitude === null) && <div className="coordinate-retry"><p>Some places are still waiting to be found on your map.</p><button className="secondary-action" disabled={backfilling} onClick={async () => { setBackfilling(true); const response = await fetch("/api/locations/backfill", { method: "POST" }); const result = await response.json(); setBackfilling(false); setMessage(response.ok ? `${result.updated} place${result.updated === 1 ? "" : "s"} placed on the map.` : result.error); router.refresh(); }}>{backfilling ? "Finding places…" : "Place them on your map"}</button>{message && <p aria-live="polite">{message}</p>}</div>}
  </section>;
}
