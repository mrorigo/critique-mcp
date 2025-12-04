import type {
  CreateMessageRequestParams,
  CreateMessageResult,
  CreateMessageResultWithTools,
  LoggingMessageNotification
} from '@modelcontextprotocol/sdk/types.js';
import type { RequestOptions } from '@modelcontextprotocol/sdk/shared/protocol.js';

export type McpSampler = {
  createMessage(
    request: CreateMessageRequestParams,
    options?: RequestOptions
  ): Promise<CreateMessageResult | CreateMessageResultWithTools>;
  sendLoggingMessage(params: LoggingMessageNotification['params'], sessionId?: string): Promise<void>;
};
