export type EmotionVisualToken = { primary: string; secondary: string; trace: "radiant" | "ripple" | "diffused" | "warm" };

const fallback: EmotionVisualToken = { primary: "#9b7a55", secondary: "#d8bf94", trace: "warm" };
export const emotionVisualTokens: Record<string, EmotionVisualToken> = {
  Joy: { primary: "#c88a2b", secondary: "#f2cf78", trace: "radiant" },
  Excitement: { primary: "#c97958", secondary: "#edb18a", trace: "radiant" },
  Hope: { primary: "#a8ae79", secondary: "#d6d9a7", trace: "radiant" },
  Peace: { primary: "#698d82", secondary: "#b8d1c3", trace: "ripple" },
  Calm: { primary: "#879da3", secondary: "#c8d5d7", trace: "ripple" },
  Freedom: { primary: "#6f9da0", secondary: "#b5d4d3", trace: "ripple" },
  Wonder: { primary: "#647fa1", secondary: "#b9cde4", trace: "ripple" },
  Relief: { primary: "#789d8d", secondary: "#bdd8c9", trace: "ripple" },
  Loneliness: { primary: "#747a9e", secondary: "#c1c4d9", trace: "diffused" },
  Longing: { primary: "#98738b", secondary: "#dbbdc9", trace: "diffused" },
  Love: { primary: "#b97982", secondary: "#e5bbc0", trace: "warm" },
  Gratitude: { primary: "#aa8351", secondary: "#e0c89e", trace: "warm" },
  Curiosity: { primary: "#7d83aa", secondary: "#c4c7e0", trace: "diffused" },
  Uncertainty: { primary: "#92899f", secondary: "#d2c9d8", trace: "diffused" },
  Tiredness: { primary: "#958a7e", secondary: "#d0c3b5", trace: "diffused" },
  Surprise: { primary: "#bf927f", secondary: "#e6c5b8", trace: "warm" },
  Sadness: { primary: "#71889e", secondary: "#bacbd9", trace: "ripple" },
  Regret: { primary: "#8d6f7d", secondary: "#cfb4bd", trace: "warm" },
  Anxiety: { primary: "#9c8a65", secondary: "#d8caab", trace: "diffused" },
  Fear: { primary: "#5f7185", secondary: "#aebcca", trace: "diffused" },
  Frustration: { primary: "#a96e55", secondary: "#ddae95", trace: "warm" },
  Anger: { primary: "#9e5c4c", secondary: "#d99b83", trace: "radiant" },
  Disappointment: { primary: "#947b87", secondary: "#d2bec6", trace: "diffused" },
  Courage: { primary: "#a65142", secondary: "#df9d81", trace: "radiant" },
};
export function visualForEmotion(name?: string) { return name ? emotionVisualTokens[name] ?? fallback : fallback; }
