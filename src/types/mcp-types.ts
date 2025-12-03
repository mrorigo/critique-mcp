import type {
  CreateMessageRequest,
  CreateMessageResult,
  CreateMessageResultWithTools,
  LoggingMessageNotification,
  RequestOptions
} from '@modelcontextprotocol/sdk/types.js';

export type McpSampler = {
  createMessage(
    request: CreateMessageRequest,
    options?: RequestOptions
  ): Promise<CreateMessageResult | CreateMessageResultWithTools>;
  sendLoggingMessage(params: LoggingMessageNotification['params']): Promise<void>;
};
