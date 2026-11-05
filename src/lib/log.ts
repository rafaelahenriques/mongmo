import { scrubText, scrubValue } from '@/lib/privacy';

/**
 * The app's logger: use it instead of console. Every message and detail is
 * scrubbed of personal data first (see privacy.ts), so a stray email or
 * user id never reaches a log or a crash report.
 *
 *   log.warn('geofencing', 'could not start', error)
 *
 * Development prints everything; staging and production print warnings
 * and errors only, and crash reporting (when it's on) receives them.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** One scrubbed log line, as sinks receive it, with the original error to report. */
export type LogEntry = {
  level: LogLevel;
  scope: string;
  message: string;
  detail?: unknown;
  error?: Error;
};

const RANK: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

let minimumLevel: LogLevel = typeof __DEV__ !== 'undefined' && __DEV__ ? 'debug' : 'warn';
const sinks = new Set<(entry: LogEntry) => void>();

/** Logs below this level are dropped. */
export function setLogLevel(level: LogLevel): void {
  minimumLevel = level;
}

/** Also sends each log entry somewhere else (crash reporting). Returns a function that stops it. */
export function addLogSink(sink: (entry: LogEntry) => void): () => void {
  sinks.add(sink);
  return () => sinks.delete(sink);
}

function write(level: LogLevel, scope: string, message: string, detail?: unknown): void {
  if (RANK[level] < RANK[minimumLevel]) return;
  const entry: LogEntry = {
    level,
    scope,
    message: scrubText(message),
    ...(detail === undefined ? {} : { detail: scrubValue(detail) }),
    ...(detail instanceof Error ? { error: detail } : {}),
  };
  const print = level === 'debug' ? console.log : console[level];
  print(`[${scope}] ${entry.message}`, ...(entry.detail === undefined ? [] : [entry.detail]));
  for (const sink of sinks) sink(entry);
}

export const log = {
  debug: (scope: string, message: string, detail?: unknown) => write('debug', scope, message, detail),
  info: (scope: string, message: string, detail?: unknown) => write('info', scope, message, detail),
  warn: (scope: string, message: string, detail?: unknown) => write('warn', scope, message, detail),
  error: (scope: string, message: string, detail?: unknown) => write('error', scope, message, detail),
};
