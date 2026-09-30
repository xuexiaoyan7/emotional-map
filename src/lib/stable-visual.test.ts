import { describe, expect, it } from "vitest";
import { stableHash, stableIndex } from "./stable-visual";

describe("stable visual values", () => {
  it("returns the same result for the same memory id", () => {
    expect(stableHash("memory-tromso")).toBe(stableHash("memory-tromso"));
    expect(stableIndex("memory-tromso", 5)).toBe(stableIndex("memory-tromso", 5));
  });

  it("always maps into the provided visual collection", () => {
    expect(stableIndex("memory-yunnan", 5)).toBeGreaterThanOrEqual(0);
    expect(stableIndex("memory-yunnan", 5)).toBeLessThan(5);
  });
});
