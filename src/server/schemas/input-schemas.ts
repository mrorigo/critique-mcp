import { z } from 'zod';
import { DEFAULT_INITIAL_ANSWER, DEFAULT_MAX_ITERATIONS } from '../../config/server-config.js';

export const iterVfInputSchema = z.object({
  problem_q: z
    .string()
    .min(1, 'problem_q must be a non-empty string')
    .describe('The complex logical or computational problem (Q).'),
  max_iterations: z
    .number()
    .int()
    .min(1, 'max_iterations must be at least 1')
    .default(DEFAULT_MAX_ITERATIONS)
    .describe('Computation budget (B).'),
  initial_answer_a0: z
    .string()
    .optional()
    .default(DEFAULT_INITIAL_ANSWER)
    .describe('Starting candidate answer (A0) for verification.')
});
