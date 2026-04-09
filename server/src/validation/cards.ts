import { z } from "zod";

export const scanSchema = z.object({
  sessionHash: z.string().optional(),
  userAgent: z.string().optional(),
});

export const examineSchema = z.object({
  sessionHash: z.string().optional(),
});

export const answerSchema = z.object({
  answer: z.union([
    z.string(),
    z.array(z.string()),
    z.record(z.string(), z.string()),
  ]),
  sessionHash: z.string().optional(),
});
