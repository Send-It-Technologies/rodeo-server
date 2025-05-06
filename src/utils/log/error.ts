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
  // Log client errors for monitoring purposes
  const logger = c.env?.logger || console;
  const errorId = crypto.randomUUID();
  
  logger.warn({
    event: "CLIENT_ERROR",
    errorId,
    code,
    message,
    details,
    path: c.req.path,
    method: c.req.method,
  });
  
  return c.json<ErrorResponse>(
    {
      error: {
        code,
        message,
        details: { ...details, referenceId: errorId },
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
  const errorStack = error instanceof Error ? error.stack : String(error);
  const durationMs = Date.now() - reqStart;

  // Log detailed error information for server-side debugging
  logger.error({
    event: "API_ERROR",
    errorId,
    error: errorStack,
    message: errorMessage,
    durationMs,
    path: c.req.path,
    method: c.req.method,
  });

  // Return a user-friendly error response with an error reference ID
  return c.json<ErrorResponse>(
    {
      error: {
        code: "SERVER_ERROR",
        message: "Internal server error occurred",
        details: {
          referenceId: errorId,
          message: errorMessage,
        },
      },
    },
    500
  );
}
