import type {
  CreateMessageRequestParams,
  CreateMessageResult,
  CreateMessageResultWithTools
} from '@modelcontextprotocol/sdk/types.js';
import { iterVfInputSchema } from '../schemas/input-schemas.js';
import { iterVfResultSchema, vfStepAnalysisSchema } from '../schemas/output-schemas.js';
import { vfLogger } from '../utils/logging.js';
import { SamplingError, ValidationError } from '../utils/error-handling.js';
import { BaseTool } from './base-tool.js';
import type { McpSampler } from '../../types/mcp-types.js';
import type {
  IterVFInput,
  IterVFResult,
  VFStepAnalysis,
  VFStepHistoryEntry,
  VFStepRunner
} from '../../types/vf-types.js';
import {
  DEFAULT_INTELLIGENCE_PRIORITY,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  ITER_VF_TOOL_NAME,
  PROMPT_TEMPLATE
} from '../../config/server-config.js';

type SamplingResponse = CreateMessageResult | CreateMessageResultWithTools;

export const buildVfPrompt = ({ problem, candidate }: { problem: string; candidate: string }): string =>
  PROMPT_TEMPLATE.replace(/\{problem\}/g, problem).replace(/\{candidate\}/g, candidate);

const isTextBlock = (block: unknown): block is { type: 'text'; text: string } =>
  typeof block === 'object' &&
  block !== null &&
  'type' in block &&
  block.type === 'text' &&
  'text' in block &&
  typeof (block as { text?: unknown }).text === 'string';

const normalizeContent = (content: SamplingResponse['content']): unknown[] =>
  Array.isArray(content) ? content : [content];

export const extractStepText = (response: SamplingResponse): string => {
  const blocks = normalizeContent(response.content);
  const textBlock = blocks.find((block) => isTextBlock(block));
  if (!textBlock) {
    throw new SamplingError('Sampling response did not include a text block.');
  }
  return textBlock.text;
};

export const parseStepAnalysis = (text: string): VFStepAnalysis => {
  try {
    return vfStepAnalysisSchema.parse(JSON.parse(text));
  } catch (error) {
    throw new ValidationError('Failed to parse structured VF analysis.', error instanceof Error ? error : undefined);
  }
};

export async function runSingleVFStep(
  sampler: McpSampler,
  problem: string,
  candidate: string,
  stepIndex: number
): Promise<VFStepAnalysis> {
  vfLogger.info('Requesting sampling for VF step.', { stepIndex, candidate });
  const prompt = buildVfPrompt({ problem, candidate });
  const request: CreateMessageRequestParams = {
    messages: [
      {
        role: 'user',
        content: { type: 'text', text: prompt }
      }
    ],
    maxTokens: DEFAULT_MAX_TOKENS,
    temperature: DEFAULT_TEMPERATURE,
    systemPrompt:
      'You are a rigorous verification engine. Critique the candidate answer, then supply the corrected result following the schema.',
    modelPreferences: {
      intelligencePriority: DEFAULT_INTELLIGENCE_PRIORITY,
      hints: [{ name: 'claude' }, { name: 'gpt' }]
    }
  };

  try {
    const response = await sampler.createMessage(request);
    const extracted = extractStepText(response);
    return parseStepAnalysis(extracted);
  } catch (error) {
    vfLogger.error('Sampling failed during VF step.', {
      stepIndex,
      errorMessage: error instanceof Error ? error.message : 'unknown'
    });
    throw new SamplingError('Unable to complete sampling for VF step.', error instanceof Error ? error : undefined);
  }
}

export interface IterVFWorkflowToolOptions {
  stepRunner?: VFStepRunner;
}

export class IterVFWorkflowTool extends BaseTool<typeof iterVfInputSchema, typeof iterVfResultSchema> {
  private readonly stepRunner: VFStepRunner;

  constructor(private readonly sampler: McpSampler, options: IterVFWorkflowToolOptions = {}) {
    super(ITER_VF_TOOL_NAME, iterVfInputSchema, iterVfResultSchema);
    this.stepRunner =
      options.stepRunner ??
      ((params) => runSingleVFStep(this.sampler, params.problem, params.candidate, params.stepIndex));
  }

  public async execute(rawInput: IterVFInput | unknown): Promise<IterVFResult> {
    const input = this.parseInput(rawInput) as IterVFInput;
    const history: VFStepHistoryEntry[] = [];
    let candidate = input.initial_answer_a0 ?? '';

    if (!candidate) {
      vfLogger.warn('Received empty initial answer; defaulting to fallback.', { fallback: '1' });
      candidate = '1';
    }

    vfLogger.info('Starting Iter-VF workflow.', { problem: input.problem_q, budget: input.max_iterations });

    for (let stepIndex = 1; stepIndex <= input.max_iterations; stepIndex += 1) {
      vfLogger.debug('Executing VF iteration.', { stepIndex, candidate });
      try {
        const analysis = await this.stepRunner({
          problem: input.problem_q,
          candidate,
          stepIndex
        });

        const record: VFStepHistoryEntry = {
          ...analysis,
          step_index: stepIndex,
          verified_candidate: candidate,
          timestamp: new Date().toISOString()
        };

        history.push(record);
        candidate = analysis.newly_generated_answer;
      } catch (error) {
        vfLogger.error('Workflow halted because of an error.', {
          stepIndex,
          originalMessage: error instanceof Error ? error.message : 'unknown'
        });
        break;
      }
    }

    const lastHistoryEntry = history.at(-1);
    const finalAnswer = lastHistoryEntry?.newly_generated_answer ?? candidate;

    const result: IterVFResult = this.validateOutput({
      final_answer: finalAnswer,
      total_steps: history.length,
      history
    });

    vfLogger.info('Iter-VF workflow completed.', {
      totalSteps: result.total_steps,
      finalAnswer: result.final_answer
    });

    return result;
  }
}
