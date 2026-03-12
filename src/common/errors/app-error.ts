export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;
  readonly retryable: boolean;

  constructor(code: string, message: string, status = 400, details?: unknown, retryable = false) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.retryable = retryable;
  }
}

export class ValidationError extends AppError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, 422, details, false);
  }
}

export class UnauthorizedError extends AppError {
  constructor(code = "AUTH_UNAUTHORIZED", message = "Unauthorized") {
    super(code, message, 401, undefined, false);
  }
}

export class ForbiddenError extends AppError {
  constructor(code = "PERM_FORBIDDEN", message = "Forbidden") {
    super(code, message, 403, undefined, false);
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, 409, details, false);
  }
}

export class RetryableError extends AppError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, 503, details, true);
  }
}
