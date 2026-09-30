"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Item = { id: string; photoUrl: string; story: string; capturedAt?: Date | null; location: { placeName: string; city: string }; emotions: { intensity: number; emotion: { canonicalName: string } }[] };
export function RandomMemory({ memories }: { memories: Item[] }) {
  const [index, setIndex] = useState(0); const [isOpen, setIsOpen] = useState(false); const memory = memories[index];
  const place = memory.location.placeName || memory.location.city;
  const date = memory.capturedAt ? new Date(memory.capturedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;
  const rotation = [-1.4, -.6, .45, 1.15, 1.75][[...memory.id].reduce((total, character) => total + character.charCodeAt(0), 0) % 5];
  return <aside className={`random-memory ${isOpen ? "is-open" : ""}`} aria-label="A random memory from your map"><button className="random-toggle" type="button" aria-expanded={isOpen} aria-label={isOpen ? "Hide this memory" : "Show a random memory"} onClick={() => setIsOpen((current) => !current)}><span aria-hidden="true">{isOpen ? "×" : "◧"}</span></button><figure className="memory-fragment" style={{ transform: `rotate(${rotation}deg)` }}><p className="fragment-label">A memory from {place}</p><Link href={`/memories/${memory.id}`} className="fragment-photo"><Image src={`/api/media/${memory.id}`} unoptimized alt={`A remembered moment from ${place}`} width={360} height={270} /></Link><figcaption><p className="fragment-place">{place}{date && <><span aria-hidden="true"> · </span><time dateTime={new Date(memory.capturedAt!).toISOString()}>{date}</time></>}</p><p className="fragment-story">{memory.story || "A moment left without words."}</p><p className="fragment-feeling">{memory.emotions.slice(0, 2).map((item) => `${item.emotion.canonicalName} ${item.intensity}`).join(" · ")}</p><Link className="fragment-link" href={`/memories/${memory.id}`}>Return to it →</Link></figcaption></figure>{memories.length > 1 && <button className="random-cycle" onClick={() => setIndex((current) => (current + 1) % memories.length)}>Show another memory →</button>}</aside>;
}
