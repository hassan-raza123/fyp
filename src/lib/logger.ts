/**
 * Structured logging.
 *
 * The codebase had ~300 bare `console.error` calls. On a hosted platform those
 * land as unstructured text: you cannot filter by route, correlate the lines
 * belonging to one request, or alert on a rate. This emits JSON instead, so the
 * same lines are queryable wherever they are shipped.
 *
 * It deliberately does not pull in a logging library or an APM SDK. Those are a
 * deployment decision — an account, a DSN, a sampling policy — and this file is
 * the seam to add one: implement `reportError` and every existing call site
 * starts reporting without being touched again.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  /** Route or module the entry came from, e.g. 'api/students'. */
  scope?: string;
  /** Ties together every line emitted while handling one request. */
  requestId?: string;
  userId?: number;
  [key: string]: unknown;
}

/** Never let a secret reach the log because it happened to be in scope. */
const REDACTED_KEYS =
  /password|token|secret|otp|authorization|cookie|session|hash/i;

function redact(context: LogContext): LogContext {
  const safe: LogContext = {};
  for (const [key, value] of Object.entries(context)) {
    safe[key] = REDACTED_KEYS.test(key) ? '[redacted]' : value;
  }
  return safe;
}

function serialiseError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      // Prisma attaches a code (P2002, P2003, …) that says far more about what
      // went wrong than the message does.
      code: (error as { code?: string }).code,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    };
  }
  return { message: String(error) };
}

function emit(level: LogLevel, message: string, context: LogContext = {}): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...redact(context),
  };

  // One JSON object per line: the format every log platform can parse without
  // a custom rule.
  const line = JSON.stringify(entry);

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: LogContext) =>
    process.env.NODE_ENV !== 'production' && emit('debug', message, context),
  info: (message: string, context?: LogContext) => emit('info', message, context),
  warn: (message: string, context?: LogContext) => emit('warn', message, context),

  /**
   * Log an error and hand it to the error tracker.
   *
   * Returns a short correlation id. Give that id to the client in the error
   * response — it is what turns "something went wrong" into a support request
   * somebody can actually trace, without leaking the exception itself.
   */
  error(message: string, error: unknown, context: LogContext = {}): string {
    const correlationId = Math.random().toString(36).slice(2, 10);

    emit('error', message, {
      ...context,
      correlationId,
      error: serialiseError(error),
    });

    reportError(error, { ...context, message, correlationId });

    return correlationId;
  },
};

/**
 * The seam for an error tracker (Sentry, Rollbar, …).
 *
 * Left as a no-op on purpose: wiring one needs a DSN and an environment
 * decision that belongs to whoever deploys this, not to the code. When that
 * exists, the whole integration is the body of this function — every caller
 * already routes through it.
 *
 *   import * as Sentry from '@sentry/nextjs';
 *   Sentry.captureException(error, { extra: context });
 */
function reportError(error: unknown, context: LogContext): void {
  void error;
  void context;
}

/**
 * Wrap a route handler's error path.
 *
 * Logs the failure with context and returns the correlation id to put in the
 * response, so the client gets something traceable and nothing internal.
 */
export function logRouteError(
  scope: string,
  error: unknown,
  context: LogContext = {}
): string {
  return logger.error(`Unhandled error in ${scope}`, error, {
    scope,
    ...context,
  });
}
