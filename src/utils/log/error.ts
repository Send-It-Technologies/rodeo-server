import { Context } from "hono";

type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

export function logError400(
  c: Context,
  code: string,
  message: string,
  details?: any
): Response {
  return c.json<ErrorResponse>(
    {
      error: {
        code,
        message,
        details,
      },
    },
    400
  );
}

export function logError500(
  c: Context,
  logger: any,
  error: unknown,
  reqStart: number
): Response {
  // Error handling
  const errorId = crypto.randomUUID();
  const errorMessage = error instanceof Error ? error.message : "Unknown error";

  logger.error({
    event: "API_ERROR",
    errorId,
    error: error instanceof Error ? error.stack : error,
    durationMs: Date.now() - reqStart,
  });

  return c.json<ErrorResponse>(
    {
      error: {
        code: "SERVER_ERROR",
        message: "Internal server error",
        details: {
          referenceId: errorId,
          message: errorMessage,
        },
      },
    },
    500
  );
}
