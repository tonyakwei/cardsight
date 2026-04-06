import { z } from "zod";

export const slotSubmitSchema = z.object({
  slotId: z.string().uuid(),
  value: z.string().min(1),
});
