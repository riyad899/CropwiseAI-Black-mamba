import { z } from "zod";
import { ORDERED_CLASS_NAMES } from "./ml/class-mapping.js";

export const RiceDiseaseValidation = {
  historyQuery: z.object({
    page: z.string().optional().transform((val) => (val ? Math.max(1, parseInt(val, 10)) : 1)),
    limit: z.string().optional().transform((val) => (val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 20)),
    disease: z.enum(ORDERED_CLASS_NAMES as [string, ...string[]]).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
};

