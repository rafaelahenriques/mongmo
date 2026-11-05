import type { ComponentType } from 'react';
import * as Sentry from '@sentry/react-native';
import type { Breadcrumb, ErrorEvent } from '@sentry/react-native';

import { env } from '@/lib/env';
import { addLogSink, type LogEntry } from '@/lib/log';
import { scrubText, scrubUrl, scrubValue } from '@/lib/privacy';

/**
 * Crash reporting with Sentry, on when EXPO_PUBLIC_SENTRY_DSN is set.
 *
 * Privacy, by rule: no personal data, no keystrokes, no input values, no
 * passwords. So: sendDefaultPii is off (no IP, no user); no screenshots or
 * view hierarchy (they show what's on screen, typed text included); no
 * session replay; no request bodies; touch breadcrumbs name the component
 * touched but never its text; typing and console breadcrumbs are dropped;
 * and every event is scrubbed by scrubEvent before it leaves the phone.
 */

/** Breadcrumbs never sent: typing, and console output (which could hold anything). */
const DROPPED_BREADCRUMBS = new Set(['ui.input', 'ui.keyboard', 'console']);

/** A breadcrumb with nothing personal left, or null to drop it. */
export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb | null {
  if (crumb.category && DROPPED_BREADCRUMBS.has(crumb.category)) return null;
  const scrubbed: Breadcrumb = { ...crumb };
  if (scrubbed.message) scrubbed.message = scrubText(scrubbed.message);
  if (crumb.category === 'touch') {
    // Only which component was touched, never what it says.
    const path = Array.isArray(crumb.data?.path) ? (crumb.data.path as { name?: unknown }[]) : [];
    scrubbed.data = { path: path.map((element) => ({ name: String(element.name ?? '') })) };
  } else if (crumb.data) {
    const { url, from, to, ...rest } = crumb.data;
    scrubbed.data = {
      ...(scrubValue(rest) as Record<string, unknown>),
      ...(typeof url === 'string' ? { url: scrubUrl(url) } : {}),
      ...(typeof from === 'string' ? { from: scrubUrl(from) } : {}),
      ...(typeof to === 'string' ? { to: scrubUrl(to) } : {}),
    };
  }
  return scrubbed;
}

/** An error report with nothing personal left in it. */
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  const scrubbed: ErrorEvent = { ...event };
  delete scrubbed.user;
  delete scrubbed.server_name;
  if (event.request) scrubbed.request = { url: event.request.url ? scrubUrl(event.request.url) : undefined };
  if (event.message) scrubbed.message = scrubText(event.message);
  if (event.exception?.values) {
    scrubbed.exception = {
      ...event.exception,
      values: event.exception.values.map((value) => ({
        ...value,
        ...(value.value ? { value: scrubText(value.value) } : {}),
      })),
    };
  }
  if (event.breadcrumbs) {
    scrubbed.breadcrumbs = event.breadcrumbs.flatMap((crumb) => scrubBreadcrumb(crumb) ?? []);
  }
  if (event.extra) scrubbed.extra = scrubValue(event.extra) as Record<string, unknown>;
  if (event.contexts?.device) {
    // The device's name is often its owner's ("Rafaela's iPhone").
    const { name: _name, ...device } = event.contexts.device;
    scrubbed.contexts = { ...event.contexts, device };
  }
  return scrubbed;
}

/** Warnings become breadcrumbs on the next report; errors are reported. */
function reportLogEntry(entry: LogEntry): void {
  if (entry.level === 'warn') {
    Sentry.addBreadcrumb({ category: 'log', level: 'warning', message: `[${entry.scope}] ${entry.message}` });
  } else if (entry.level === 'error') {
    if (entry.error) Sentry.captureException(entry.error, { tags: { scope: entry.scope } });
    else Sentry.captureMessage(`[${entry.scope}] ${entry.message}`, { level: 'error', tags: { scope: entry.scope } });
  }
}

let started = false;

/** Starts crash reporting once, if this build has a DSN. Resolves whether it's on. */
export function initCrashReporting(): boolean {
  if (started || !env.sentryDsn) return started;
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.appEnv,
    sendDefaultPii: false,
    attachScreenshot: false,
    attachViewHierarchy: false,
    enableCaptureFailedRequests: false,
    enableUserInteractionTracing: false,
    tracesSampleRate: 0,
    // Session replay stays off. If it's ever turned on, it must mask
    // everything: mobileReplayIntegration({ maskAllText: true,
    // maskAllImages: true, maskAllVectors: true }).
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    maxBreadcrumbs: 50,
    beforeBreadcrumb: scrubBreadcrumb,
    beforeSend: scrubEvent,
  });
  addLogSink(reportLogEntry);
  started = true;
  return true;
}

/** The root layout, wrapped so touches leave breadcrumbs: component names only, never their text. */
export function withCrashReporting<P extends Record<string, unknown>>(Root: ComponentType<P>): ComponentType<P> {
  return Sentry.wrap(Root, { touchEventBoundaryProps: { extractTextFromChildren: false } });
}
