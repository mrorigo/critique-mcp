# Critique MCP – Verification-First Iterative Server

This repository contains a TypeScript implementation of an Iterative Verification-First (Iter-VF) MCP server that offloads large-language-model sampling to an MCP host. The workflow is inspired by the verification-first reasoning strategy described in the paper [*Asking LLMs to Verify First is Almost Free Lunch*](https://arxiv.org/pdf/2511.21734), which demonstrates that having LLMs check a candidate answer before generating their own reasoning path dramatically improves consistency without heavy computation.

## Theory & Origins

The Iter-VF workflow relies on reverse reasoning: at every iteration, the host model verifies the previous candidate answer, critiques it, and then emits a corrected answer while obeying a structured JSON schema. This Markovian approach prevents context bloat by keeping only the latest answer (`A_{i-1}`) between steps, while the MCP server handles scheduling, Zod-based validation, and resilient logging.

Original authors from Department of Electronic Engineering, Tsinghua University:

- **Shiguang Wu** – (`wsg23@mails.tsinghua.edu.cn`)
- **Quanming Yao** –  (`qyaoaa@tsinghua.edu.cn`)


## Project Layout

```
src/
├── config/           # shared constants & prompt templates
├── server/
│   ├── schemas/       # Zod schemas for tool input/output
│   ├── tools/         # Iter-VF tool & helpers
│   └── utils/         # Logging + error helpers
├── types/             # Reusable MCP + VF types
└── index.ts           # MCP server bootstrapper
tests/
├── iter-vf-tool.test.ts # Unit coverage for tool behavior
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the MCP server locally (connects via STDIO):
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Run linting or tests with coverage thresholds configured in `vitest.config.ts`:
   ```bash
   npm run lint
   npm test
   ```

## Iter-VF Tool Details

- `IterVFWorkflowTool` wraps a reusable `runSingleVFStep` runner and optionally accepts a custom step function (useful for unit tests or mocking hosts).
- Each iteration generates structured JSON that includes:
  - `is_a_prime_correct`
  - `verification_critique`
  - `newly_generated_answer`
- The server maintains a history of each step with timestamps, validates input with Zod, and logs progress/debug messages via `vfLogger`.
- Sampling requests are made with `sampling/createMessage`; the MCP host is responsible for presenting the prompt to a users and returning structured output.

## Testing & Coverage

- Tests live in `tests/iter-vf-tool.test.ts` and mock the sampling runner to cover happy/exceptional paths.
- Vitest (with the V8 coverage provider) ensures statements, branches, functions, and lines stay within the 70–80% target.

```bash
npm test
```

## Contribution & Extension

If you build upon this implementation, reference the original paper and authors above. The project is structured so additional MCP tools, logging, or transport layers can be added with minimal friction. Future work might include integration tests with real MCP hosts or richer prompt crafting heuristics derived from later iterations of Iter-VF.

## Support my work

You can support my work by signing up for;

- [Sinay.ai](https://sl1nk.com/origo-ref)
