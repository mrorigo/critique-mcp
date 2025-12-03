export const SERVER_NAME = 'vf-reasoning-expert';
export const SERVER_VERSION = '1.0.0';

export const ITER_VF_TOOL_NAME = 'execute_iter_vf_workflow';
export const ITER_VF_TOOL_DESCRIPTION =
  'Execute the Iterative Verification-First workflow, refining the answer using host-supplied LLM samples.';

export const DEFAULT_INITIAL_ANSWER = '1';
export const DEFAULT_MAX_ITERATIONS = 3;

export const PROMPT_TEMPLATE = `
Problem (Q): "{problem}"
A possible answer of Q is A'. First verify if A' is correct, then think step by step to find the answer.
Candidate Answer (A'): {candidate}

Please emit only valid JSON conforming to the schema provided:
{
  "is_a_prime_correct": boolean,
  "verification_critique": string,
  "newly_generated_answer": string
}
`;

export const DEFAULT_MAX_TOKENS = 900;
export const DEFAULT_TEMPERATURE = 0.2;
export const DEFAULT_INTELLIGENCE_PRIORITY = 0.9;
