export interface IterVFInput {
  problem_q: string;
  max_iterations: number;
  initial_answer_a0?: string;
}

export interface VFStepAnalysis {
  is_a_prime_correct: boolean;
  verification_critique: string;
  newly_generated_answer: string;
}

export interface VFStepHistoryEntry extends VFStepAnalysis {
  step_index: number;
  verified_candidate: string;
  timestamp: string;
}

export interface IterVFResult {
  final_answer: string;
  total_steps: number;
  history: VFStepHistoryEntry[];
}

export type VFStepRunner = (params: {
  problem: string;
  candidate: string;
  stepIndex: number;
}) => Promise<VFStepAnalysis>;
