"use client";
import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import type { MapMemory } from "./emotional-map";
const EmotionalMap = dynamic(() => import("./emotional-map").then((module) => module.EmotionalMap), { ssr: false, loading: () => <div className="map-loading">Finding the places you have left something behind…</div> });
const loadingMap = <div className="map-loading">Finding the places you have left something behind…</div>;
const subscribeToHydration = () => () => undefined;
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;

export function MapShell(props: { memories: MapMemory[]; emotions: { id: string; canonicalName: string }[]; readOnly?: boolean; publicSlug?: string }) {
  // The server and the client's first render must be identical. Leaflet creates and mutates
  // browser DOM nodes, so it only mounts after hydration has completed.
  const hasHydrated = useSyncExternalStore(subscribeToHydration, hydratedSnapshot, serverSnapshot);

  return hasHydrated ? <EmotionalMap {...props} /> : loadingMap;
}
