/**
 * Normalize Laravel API error payloads into user-facing messages.
 */
export function formatApiErrorMessage(payload: unknown, status: number): string {
  if (typeof payload === "object" && payload !== null) {
    const record = payload as { message?: unknown; errors?: Record<string, string[]> };
    const errors = record.errors;

    if (errors && typeof errors === "object") {
      const messages = Object.values(errors).flat().filter((m): m is string => Boolean(m));
      if (messages.length === 1) return messages[0];
      if (messages.length > 1) return messages.slice(0, 3).join(" · ");
    }

    if (typeof record.message === "string") {
      const msg = record.message;
      if (msg !== "The given data was invalid.") return msg;
    }
  }

  if (status === 401) return "Please sign in to continue.";
  if (status === 403) return "You do not have permission for this action.";
  if (status === 404) return "We could not find what you requested.";
  if (status === 422) return "Please check the form and try again.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status >= 500) return "Something went wrong on our servers. Please try again shortly.";
  if (status === 0) return "Cannot reach the API. Check your connection and that the server is running.";

  return `Request failed (${status}). Please try again.`;
}
