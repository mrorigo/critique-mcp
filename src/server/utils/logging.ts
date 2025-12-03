type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const serializeMeta = (meta?: Record<string, unknown>): string =>
  meta && Object.keys(meta).length > 0 ? ` metadata=${JSON.stringify(meta)}` : '';

const log = (level: LogLevel, message: string, meta?: Record<string, unknown>): void => {
  const timestamp = new Date().toISOString();
  console.error(`[VF:${timestamp}] [${level.toUpperCase()}] ${message}${serializeMeta(meta)}`);
};

export const vfLogger = {
  info: (message: string, meta?: Record<string, unknown>): void => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>): void => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>): void => log('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>): void => log('debug', message, meta)
};
