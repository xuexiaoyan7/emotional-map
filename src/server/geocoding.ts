const CITY_COORDINATES: Record<string, [number, number]> = {
  london: [51.5072, -0.1276], paris: [48.8566, 2.3522], tokyo: [35.6762, 139.6503],
  shanghai: [31.2304, 121.4737], beijing: [39.9042, 116.4074], newyork: [40.7128, -74.006],
  "new york": [40.7128, -74.006], reykjavik: [64.1466, -21.9426], iceland: [64.9631, -19.0208],
  rome: [41.9028, 12.4964], seoul: [37.5665, 126.978], sydney: [-33.8688, 151.2093],
};

export function developmentCoordinates(city: string, country: string) {
  return CITY_COORDINATES[city.trim().toLowerCase()] ?? CITY_COORDINATES[country.trim().toLowerCase()] ?? null;
}

type NominatimResult = { display_name?: string; address?: Record<string, string | undefined> };
export type GeocodingCandidate = { label: string; placeName: string; city: string; country: string; latitude: number; longitude: number };

function fromAddress(label: string, latitude: number, longitude: number, address: Record<string, string | undefined> = {}): GeocodingCandidate {
  return { label, placeName: address.amenity ?? address.tourism ?? address.leisure ?? address.park ?? address.attraction ?? address.road ?? label.split(",")[0] ?? "", city: address.city ?? address.town ?? address.village ?? address.state ?? "", country: address.country ?? "", latitude, longitude };
}

export async function searchPlaces(query: string): Promise<GeocodingCandidate[]> {
  const maptilerKey = process.env.MAPTILER_API_KEY;
  if (maptilerKey) {
    try {
      const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${maptilerKey}&limit=5`, { signal: AbortSignal.timeout(4_000) });
      if (response.ok) {
        const payload = await response.json() as { features?: { place_name?: string; text?: string; center?: [number, number]; properties?: { country?: string } }[] };
        return (payload.features ?? []).flatMap((feature) => feature.center ? [{ label: feature.place_name ?? feature.text ?? query, placeName: feature.text ?? feature.place_name ?? query, city: "", country: feature.properties?.country ?? "", latitude: feature.center[1], longitude: feature.center[0] }] : []);
      }
    } catch { /* continue to the development fallback */ }
  }
  try {
    const params = new URLSearchParams({ q: query, format: "jsonv2", addressdetails: "1", limit: "5" });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { "User-Agent": "EmotionalMapLocalDevelopment/0.1" }, signal: AbortSignal.timeout(4_000) });
    if (!response.ok) return [];
    const payload = await response.json() as { display_name?: string; lat?: string; lon?: string; address?: Record<string, string | undefined> }[];
    return payload.flatMap((item) => item.lat && item.lon && item.display_name ? [fromAddress(item.display_name, Number(item.lat), Number(item.lon), item.address)] : []);
  } catch { return []; }
}

export async function reverseGeocodeDevelopment(latitude: number, longitude: number) {
  try {
    const query = new URLSearchParams({ format: "jsonv2", lat: String(latitude), lon: String(longitude), zoom: "16", addressdetails: "1" });
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${query}`, { headers: { "User-Agent": "EmotionalMapLocalDevelopment/0.1" }, signal: AbortSignal.timeout(4_000) });
    if (!response.ok) return null;
    const result = await response.json() as NominatimResult;
    const address = result.address ?? {};
    return fromAddress(result.display_name ?? "", latitude, longitude, address);
  } catch { return null; }
}
