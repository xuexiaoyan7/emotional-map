export const STANDARD_EMOTIONS = [
  { canonicalName: "Joy", category: "positive", color: "#c88a2b" },
  { canonicalName: "Excitement", category: "positive", color: "#c97958" },
  { canonicalName: "Gratitude", category: "positive", color: "#aa8351" },
  { canonicalName: "Freedom", category: "positive", color: "#6f9da0" },
  { canonicalName: "Relief", category: "positive", color: "#789d8d" },
  { canonicalName: "Hope", category: "positive", color: "#a8ae79" },
  { canonicalName: "Love", category: "positive", color: "#b97982" },
  { canonicalName: "Peace", category: "neutral", color: "#698d82" },
  { canonicalName: "Calm", category: "neutral", color: "#879da3" },
  { canonicalName: "Curiosity", category: "neutral", color: "#7d83aa" },
  { canonicalName: "Uncertainty", category: "neutral", color: "#92899f" },
  { canonicalName: "Tiredness", category: "neutral", color: "#958a7e" },
  { canonicalName: "Surprise", category: "neutral", color: "#bf927f" },
  { canonicalName: "Sadness", category: "negative", color: "#71889e" },
  { canonicalName: "Loneliness", category: "negative", color: "#747a9e" },
  { canonicalName: "Regret", category: "negative", color: "#8d6f7d" },
  { canonicalName: "Anxiety", category: "negative", color: "#9c8a65" },
  { canonicalName: "Fear", category: "negative", color: "#5f7185" },
  { canonicalName: "Frustration", category: "negative", color: "#a96e55" },
  { canonicalName: "Anger", category: "negative", color: "#9e5c4c" },
  { canonicalName: "Disappointment", category: "negative", color: "#947b87" },
] as const;

export const DEFAULT_EMOTION_NAMES = STANDARD_EMOTIONS.map((emotion) => emotion.canonicalName);
const defaultEmotionSet = new Set<string>(DEFAULT_EMOTION_NAMES);

export function isDefaultEmotion(name: string) {
  return defaultEmotionSet.has(name);
}

export function orderEmotions<T extends { canonicalName: string }>(emotions: T[]) {
  const order = new Map<string, number>(DEFAULT_EMOTION_NAMES.map((name, index) => [name, index]));
  return [...emotions].sort((left, right) => {
    const leftOrder = order.get(left.canonicalName) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = order.get(right.canonicalName) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder || left.canonicalName.localeCompare(right.canonicalName);
  });
}

export const WRITING_PROMPTS = [
  "What were you thinking when you took this photo?",
  "What do you remember most clearly?",
  "Who were you with?",
  "If you could return to that moment, what would you tell yourself?",
  "Why did you take this photo?",
] as const;
