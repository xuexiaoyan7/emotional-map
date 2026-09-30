/**
 * Stable, platform-independent visual choices for records that appear in both
 * server data and client-only interfaces. Never use a render-time random value.
 */
export function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function stableIndex(value: string, length: number) {
  if (length < 1) throw new Error("A stable visual collection must not be empty.");
  return stableHash(value) % length;
}
