import { ApiError } from "../api/client";

// The backend (Zod) is the only place validation rules live.
// These helpers put its error messages under the matching form field.

/** The server's message for one field, e.g. "email" or "newSalary.amount". */
export function fieldError(error: unknown, field: string): string | undefined {
  if (!(error instanceof ApiError)) return undefined;
  return error.details.find((d) => d.field === field)?.message;
}

/** A message for the top of the form, when the error isn't tied to a field we show. */
export function formError(error: unknown, shownFields: string[]): string | undefined {
  if (!error) return undefined;
  if (!(error instanceof ApiError)) return "Couldn't reach the server. Please try again.";
  const unshown = error.details.filter((d) => !shownFields.includes(d.field));
  if (error.details.length > 0 && unshown.length === 0) return "Please fix the highlighted fields.";
  return unshown[0]?.message ?? error.message;
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export const SALARY_CHANGE_REASONS = ["Annual raise", "Promotion", "Market adjustment", "Relocation", "Correction"];
