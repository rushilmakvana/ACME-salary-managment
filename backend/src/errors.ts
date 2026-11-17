// Errors that carry an HTTP status, so the error handler can reply
// with a clear message instead of a generic 500.
export class AppError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly field?: string,
  ) {
    super(message);
  }
}

export const notFound = (message: string) => new AppError(404, message);
export const conflict = (message: string, field?: string) => new AppError(409, message, field);
export const invalid = (message: string, field?: string) => new AppError(400, message, field);
