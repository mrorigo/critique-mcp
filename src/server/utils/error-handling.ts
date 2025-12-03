export class VfError extends Error {
  constructor(message: string, public readonly code: string, cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    if (cause) {
      this.stack = cause.stack ?? this.stack;
    }
  }
}

export class SamplingError extends VfError {
  constructor(message: string, cause?: Error) {
    super(message, 'sampling_error', cause);
  }
}

export class ValidationError extends VfError {
  constructor(message: string, cause?: Error) {
    super(message, 'validation_error', cause);
  }
}
