import { describe, expect, it } from "vitest";
import { groupNearbyMemories, visualOffsetPosition } from "./map-overlap";

const london = { latitude: 51.5072, longitude: -0.1276 };

describe("map overlap rendering", () => {
  it("groups identical and very close London coordinates without changing source data", () => {
    const memories = [
      { id: "london-identical-1", ...london }, { id: "london-identical-2", ...london }, { id: "london-identical-3", ...london },
      { id: "london-near-1", latitude: london.latitude + 0.00025, longitude: london.longitude + 0.0002 }, { id: "london-near-2", latitude: london.latitude - 0.0002, longitude: london.longitude + 0.00018 }, { id: "london-near-3", latitude: london.latitude + 0.00016, longitude: london.longitude - 0.00022 },
      { id: "london-far-1", latitude: london.latitude + 0.02, longitude: london.longitude + 0.02 }, { id: "london-far-2", latitude: london.latitude + 0.0202, longitude: london.longitude + 0.0201 },
    ];
    const groups = groupNearbyMemories(memories);
    expect(groups).toHaveLength(2);
    expect(groups.map((group) => group.memories.length).sort((left, right) => left - right)).toEqual([2, 6]);
    expect(memories[0]).toMatchObject(london);
  });

  it("creates stable, distinct rendering positions for identical coordinates", () => {
    const first = { id: "same-a", ...london };
    const second = { id: "same-b", ...london };
    expect(visualOffsetPosition(first, 0, 3)).toEqual(visualOffsetPosition(first, 0, 3));
    expect(visualOffsetPosition(first, 0, 3)).not.toEqual(visualOffsetPosition(second, 1, 3));
    expect(first).toMatchObject(london);
  });
});
