import type { CombinedError } from "urql";

/**
 * Extracts a user-facing message from a urql CombinedError.
 * Returns null when there is no error (so callers can use it directly as a
 * conditional render: `{msg && <Text role="alert">{msg}</Text>}`).
 */
export function getErrorMessage(
  error: CombinedError | undefined,
): string | null {
  if (!error) return null;
  return (
    error.graphQLErrors[0]?.message ?? "Something went wrong. Please try again."
  );
}
