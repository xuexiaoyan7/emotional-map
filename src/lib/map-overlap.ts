import { stableHash } from "./stable-visual";

export type CoordinateMemory = { id: string; latitude: number; longitude: number };
export type CoordinateGroup<T extends CoordinateMemory> = { id: string; latitude: number; longitude: number; memories: T[] };

const NEARBY_METERS = 180;

function approximateDistanceMeters(left: CoordinateMemory, right: CoordinateMemory) {
  const latitudeRadians = ((left.latitude + right.latitude) / 2) * (Math.PI / 180);
  const northSouth = (left.latitude - right.latitude) * 111_320;
  const eastWest = (left.longitude - right.longitude) * 111_320 * Math.cos(latitudeRadians);
  return Math.hypot(northSouth, eastWest);
}

/** Groups are only used for map rendering; saved coordinates are never altered. */
export function groupNearbyMemories<T extends CoordinateMemory>(memories: T[]) {
  const groups: CoordinateGroup<T>[] = [];
  for (const memory of [...memories].sort((left, right) => left.id.localeCompare(right.id))) {
    const group = groups.find((candidate) => approximateDistanceMeters(memory, { id: candidate.id, latitude: candidate.latitude, longitude: candidate.longitude }) <= NEARBY_METERS);
    if (group) {
      group.memories.push(memory);
      group.latitude = group.memories.reduce((total, item) => total + item.latitude, 0) / group.memories.length;
      group.longitude = group.memories.reduce((total, item) => total + item.longitude, 0) / group.memories.length;
    } else {
      groups.push({ id: memory.id, latitude: memory.latitude, longitude: memory.longitude, memories: [memory] });
    }
  }
  return groups.map((group) => ({ ...group, id: group.memories.map((memory) => memory.id).sort().join(":"), memories: [...group.memories].sort((left, right) => left.id.localeCompare(right.id)) }));
}

/** A small deterministic ring separates memories when the user zooms in. */
export function visualOffsetPosition(memory: CoordinateMemory, index: number, count: number): [number, number] {
  if (count < 2) return [memory.latitude, memory.longitude];
  const ring = Math.floor(index / 6);
  const radiusMeters = 42 + ring * 24;
  const angle = ((index % 6) / Math.min(count, 6)) * Math.PI * 2 + (stableHash(memory.id) % 29) * (Math.PI / 180);
  const latitudeOffset = (Math.sin(angle) * radiusMeters) / 111_320;
  const longitudeOffset = (Math.cos(angle) * radiusMeters) / (111_320 * Math.max(Math.cos(memory.latitude * (Math.PI / 180)), 0.2));
  return [memory.latitude + latitudeOffset, memory.longitude + longitudeOffset];
}
