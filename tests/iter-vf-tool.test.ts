import { describe, expect, it } from 'vitest';
import type {
  CreateMessageResult,
  CreateMessageResultWithTools
} from '@modelcontextprotocol/sdk/types.js';
import { buildVfPrompt, extractStepText, IterVFWorkflowTool, parseStepAnalysis } from '../src/server/tools/iter-vf-tool.js';
import { ValidationError } from '../src/server/utils/error-handling.js';
import type { McpSampler } from '../src/types/mcp-types.js';
import type { VFStepRunner } from '../src/types/vf-types.js';

describe('VF tool helpers', () => {
  it('builds a prompt that references problem and candidate', () => {
    const prompt = buildVfPrompt({ problem: 'What is 2+2?', candidate: '4' });
    expect(prompt).toContain('What is 2+2?');
    expect(prompt).toContain('Candidate Answer (A\'): 4');
  });

  it('parses step analysis JSON', () => {
    const analysis = parseStepAnalysis(
      JSON.stringify({
        is_a_prime_correct: true,
        verification_critique: 'looks good',
        newly_generated_answer: '4'
      })
    );
    expect(analysis.is_a_prime_correct).toBe(true);
    expect(analysis.newly_generated_answer).toBe('4');
  });

  it('throws when provided invalid analysis JSON', () => {
    expect(() => parseStepAnalysis('not a json')).toThrow(ValidationError);
  });

  it('extracts text from single content responses', () => {
    const response = {
      model: 'test',
      role: 'assistant',
      content: {
        type: 'text',
        text: '{ "foo": "bar" }'
      }
    } satisfies CreateMessageResult;

    expect(extractStepText(response)).toBe('{ "foo": "bar" }');
  });

  it('extracts text from array responses', () => {
    const response = {
      model: 'test',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: 'first'
        }
      ]
    } satisfies CreateMessageResultWithTools;

    expect(extractStepText(response)).toBe('first');
  });
});

describe('IterVFWorkflowTool', () => {
  const stubSampler: McpSampler = {
    createMessage: async () => {
      throw new Error('Unexpected createMessage call');
    },
    sendLoggingMessage: async () => {}
  };

  it('runs through iterations until budget', async () => {
    const runner: VFStepRunner = async ({ candidate }) => ({
      is_a_prime_correct: true,
      verification_critique: 'critique',
      newly_generated_answer: `${candidate}-next`
    });
    const tool = new IterVFWorkflowTool(stubSampler, { stepRunner: runner });
    const result = await tool.execute({
      problem_q: 'sum',
      max_iterations: 2,
      initial_answer_a0: '1'
    });

    expect(result.total_steps).toBe(2);
    expect(result.final_answer).toBe('1-next-next');
    expect(result.history[0].verified_candidate).toBe('1');
  });

  it('stops early when runner throws', async () => {
    const runner: VFStepRunner = async ({ candidate, stepIndex }) => {
      if (stepIndex === 2) {
        throw new Error('boom');
      }
      return {
        is_a_prime_correct: true,
        verification_critique: 'ok',
        newly_generated_answer: `${candidate}-next`
      };
    };

    const tool = new IterVFWorkflowTool(stubSampler, { stepRunner: runner });
    const result = await tool.execute({
      problem_q: 'sum',
      max_iterations: 3,
      initial_answer_a0: '1'
    });

    expect(result.total_steps).toBe(1);
    expect(result.final_answer).toBe('1-next');
  });
});
