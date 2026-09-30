import { z } from "zod";

export const memoryEmotionSchema = z.object({
  emotionId: z.string().min(1),
  intensity: z.number().int().min(1).max(10),
  customExpression: z.string().trim().max(120).optional(),
});

export const createMemorySchema = z.object({
  photoUrl: z.string().min(1),
  photoMetadata: z.record(z.string(), z.unknown()).optional(),
  location: z.object({
    placeName: z.string().trim().min(1).max(160),
    city: z.string().trim().min(1).max(120),
    country: z.string().trim().min(1).max(120),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  }),
  capturedAt: z.coerce.date().optional(),
  emotions: z.array(memoryEmotionSchema).min(1).max(8),
  story: z.string().trim().max(10_000),
  visibility: z.enum(["PRIVATE", "PUBLIC"]).default("PRIVATE"),
});

export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
