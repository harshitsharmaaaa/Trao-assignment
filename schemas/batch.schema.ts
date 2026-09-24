import { z } from "zod";
import { KitSchema } from "./kit.schema";

export const BatchInputCaseSchema = z.object({
  id: z.string(),
  jd: z.string(),
  company_url: z.string(),
  days: z.number().int().positive(),
});
export type BatchInputCase = z.infer<typeof BatchInputCaseSchema>;

export const BatchInputSchema = z.array(BatchInputCaseSchema);
export type BatchInput = z.infer<typeof BatchInputSchema>;

export const BatchErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
});
export type BatchError = z.infer<typeof BatchErrorSchema>;

export const BatchKitResultSchema = z.discriminatedUnion("status", [
  z.object({
    id: z.string(),
    status: z.literal("ok"),
    kit: KitSchema,
    error: z.null(),
  }),
  z.object({
    id: z.string(),
    status: z.literal("failed"),
    kit: z.null(),
    error: BatchErrorSchema,
  }),
]);
export type BatchKitResult = z.infer<typeof BatchKitResultSchema>;

export const BatchOutputSchema = z.object({
  version: z.string(),
  generated_at: z.string(),
  kits: z.array(BatchKitResultSchema),
});
export type BatchOutput = z.infer<typeof BatchOutputSchema>;
