import { z } from 'zod';

export const vfStepAnalysisSchema = z.object({
  is_a_prime_correct: z.boolean().describe('Whether the candidate answer was verified as correct.'),
  verification_critique: z.string().describe('Reverse reasoning critique of the candidate answer.'),
  newly_generated_answer: z.string().describe('The corrected answer produced by this step.')
});

export const vfStepHistorySchema = vfStepAnalysisSchema.extend({
  step_index: z.number().int().describe('Iteration index starting from 1.'),
  verified_candidate: z.string().describe('Candidate answer that was inspected in this step.'),
  timestamp: z.string().datetime().describe('ISO-8601 timestamp for when the step completed.')
});

export const iterVfResultSchema = z.object({
  final_answer: z.string(),
  total_steps: z.number().int(),
  history: z.array(vfStepHistorySchema)
});
