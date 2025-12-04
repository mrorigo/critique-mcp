import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { IterVFWorkflowTool } from './tools/iter-vf-tool.js';
import {
  ITER_VF_TOOL_DESCRIPTION,
  ITER_VF_TOOL_NAME,
  SERVER_NAME,
  SERVER_VERSION
} from '../config/server-config.js';
import { vfLogger } from './utils/logging.js';
import { iterVfInputSchema } from './schemas/input-schemas.js';
import { iterVfResultSchema } from './schemas/output-schemas.js';

export async function bootstrapServer(): Promise<McpServer> {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION
  });

  const sampler = server.server;
  const tool = new IterVFWorkflowTool(sampler);
  server.registerTool(
    ITER_VF_TOOL_NAME,
    {
      description: ITER_VF_TOOL_DESCRIPTION,
      inputSchema: iterVfInputSchema,
      outputSchema: iterVfResultSchema
    },
    async (args) => {
      const result = await tool.execute(args);
      return {
        content: [],
        structuredContent: result as unknown as Record<string, unknown>
      };
    }
  );

  return server;
}

export async function startServer(): Promise<void> {
  const server = await bootstrapServer();
  const transport = new StdioServerTransport();
  vfLogger.info('Connecting VF server to STDIO transport.');
  await server.connect(transport);
  vfLogger.info('VF workflow server is live.');
}
