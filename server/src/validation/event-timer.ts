import { z } from "zod";

export const setDaySchema = z.object({
  day: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

export const overrideTimeSchema = z.object({
  remainingMs: z.number().int().min(0),
});

export const overrideTextSchema = z.object({
  text: z.string().min(1).nullable(),
});
