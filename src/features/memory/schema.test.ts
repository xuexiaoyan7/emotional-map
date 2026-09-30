import { describe, expect, it } from "vitest";
import { createMemorySchema } from "./schema";

const draft = {
  photoUrl: "/uploads/moment.jpg",
  location: { placeName: "Hyde Park", city: "London", country: "United Kingdom" },
  emotions: [{ emotionId: "freedom", intensity: 9 }],
  story: "A quiet afternoon.",
};

describe("createMemorySchema", () => {
  it("keeps new memories private by default", () => {
    expect(createMemorySchema.parse(draft).visibility).toBe("PRIVATE");
  });

  it("rejects emotion intensity outside the authored 1–10 range", () => {
    expect(createMemorySchema.safeParse({ ...draft, emotions: [{ emotionId: "peace", intensity: 11 }] }).success).toBe(false);
  });
});
