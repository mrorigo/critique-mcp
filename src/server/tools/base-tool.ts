import type { ZodType } from 'zod';

export abstract class BaseTool<
  InputSchema extends ZodType,
  OutputSchema extends ZodType
> {
  protected constructor(
    public readonly name: string,
    protected readonly inputSchema: InputSchema,
    protected readonly outputSchema: OutputSchema
  ) {}

  protected parseInput(value: unknown): ReturnType<InputSchema['parse']> {
    return this.inputSchema.parse(value);
  }

  protected validateOutput(value: unknown): ReturnType<OutputSchema['parse']> {
    return this.outputSchema.parse(value);
  }
}
