import { z } from "zod";

const assessmentTypeSchema = z.enum([
  "MOOD",
  "ANXIETY",
  "STRESS",
  "SLEEP",
  "SOCIAL",
]);

const assessmentAnswersSchema = z.array(z.number().min(0).max(3));

export const assessmentSubmitSchema = z.object({
  type: assessmentTypeSchema,
  answers: assessmentAnswersSchema,
});

export const assessmentPrepareSchema = assessmentSubmitSchema;

export const assessmentConfirmSchema = z.object({
  assessmentId: z.string().uuid(),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "txHash format is invalid"),
});
