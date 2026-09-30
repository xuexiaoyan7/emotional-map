import { describe, expect, it } from "vitest";
import { DEFAULT_EMOTION_NAMES, isDefaultEmotion } from "./emotions";
import { visualForEmotion } from "./emotion-visual-tokens";

describe("default emotion vocabulary", () => {
  it("contains the requested 21 core emotions without promoting legacy feelings", () => {
    expect(DEFAULT_EMOTION_NAMES).toHaveLength(21);
    expect(DEFAULT_EMOTION_NAMES).toEqual(expect.arrayContaining(["Joy", "Peace", "Uncertainty", "Tiredness", "Sadness", "Regret", "Anxiety", "Anger"]));
    expect(isDefaultEmotion("Longing")).toBe(false);
    expect(isDefaultEmotion("Wonder")).toBe(false);
  });

  it("gives the requested vocabulary distinct muted visual tokens", () => {
    const names = ["Joy", "Peace", "Uncertainty", "Tiredness", "Sadness", "Regret", "Anxiety", "Anger"];
    expect(new Set(names.map((name) => visualForEmotion(name).primary)).size).toBe(names.length);
  });
});
