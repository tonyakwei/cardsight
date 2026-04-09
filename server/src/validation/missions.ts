import { z } from "zod";

export const missionScanSchema = z.object({
  houseId: z.string().uuid().optional(),
  sessionHash: z.string().optional(),
});

export const missionAnswerSchema = z.object({
  answer: z.union([
    z.string(),
    z.array(z.string()),
    z.record(z.string(), z.string()),
  ]),
  houseId: z.string().uuid().optional(),
  sessionHash: z.string().optional(),
});
