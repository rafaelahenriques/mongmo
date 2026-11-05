import * as Sentry from '@sentry/react-native';
import type { ErrorEvent } from '@sentry/react-native';

import { scrubBreadcrumb, scrubEvent } from '@/lib/crashReporting';

describe('breadcrumbs', () => {
  it('drops typing and console output', () => {
    expect(scrubBreadcrumb({ category: 'ui.input', message: 'hunter2' })).toBeNull();
    expect(scrubBreadcrumb({ category: 'console', message: 'anything' })).toBeNull();
  });

  it('keeps which component was touched, never its text', () => {
    expect(
      scrubBreadcrumb({
        category: 'touch',
        data: { path: [{ name: 'Pressable', label: 'HEY RAFAELA!', file: 'Home.tsx' }] },
      }),
    ).toEqual({ category: 'touch', data: { path: [{ name: 'Pressable' }] } });
  });

  it('scrubs navigation and request URLs', () => {
    expect(
      scrubBreadcrumb({
        category: 'navigation',
        data: { from: '/(profile)/order/3f2a9c1e-1b2c-4d5e-8f90-123456789abc', to: '/wallet?ref=a@b.co' },
      }),
    ).toEqual({ category: 'navigation', data: { from: '/(profile)/order/[id]', to: '/wallet' } });
  });
});

describe('error reports', () => {
  it('leave nothing personal: no user, no request details, no device name, scrubbed text', () => {
    const event = {
      type: undefined,
      message: 'failed for a@b.co',
      user: { id: 'user-1', email: 'a@b.co', ip_address: '1.2.3.4' },
      server_name: "Rafaela's iPhone",
      request: { url: 'https://x.supabase.co/rest/v1/orders?user_id=eq.1', headers: { Authorization: 'Bearer x' } },
      exception: { values: [{ type: 'Error', value: 'no order 3f2a9c1e-1b2c-4d5e-8f90-123456789abc' }] },
      breadcrumbs: [
        { category: 'ui.input', message: 'typed' },
        { category: 'log', message: 'call +32 56 94 43 81' },
      ],
      extra: { password: 'hunter2', step: 2 },
      contexts: { device: { name: "Rafaela's iPhone", model: 'iPhone17,1' } },
    } as ErrorEvent;

    expect(scrubEvent(event)).toEqual({
      type: undefined,
      message: 'failed for [email]',
      request: { url: 'https://x.supabase.co/rest/v1/orders' },
      exception: { values: [{ type: 'Error', value: 'no order [id]' }] },
      breadcrumbs: [{ category: 'log', message: 'call [phone]' }],
      extra: { password: '[redacted]', step: 2 },
      contexts: { device: { model: 'iPhone17,1' } },
    });
  });
});

describe('starting crash reporting', () => {
  afterEach(() => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    jest.clearAllMocks();
  });

  it('stays off without a DSN', () => {
    jest.isolateModules(() => {
      const { initCrashReporting } = require('@/lib/crashReporting');
      expect(initCrashReporting()).toBe(false);
    });
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('starts with every privacy setting on, and reports logged errors', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://key@o1.ingest.sentry.io/2';
    jest.isolateModules(() => {
      const { initCrashReporting } = require('@/lib/crashReporting');
      const { log } = require('@/lib/log');
      jest.spyOn(console, 'error').mockImplementation(() => undefined);
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);

      expect(initCrashReporting()).toBe(true);
      expect(initCrashReporting()).toBe(true);
      expect(Sentry.init).toHaveBeenCalledTimes(1);
      expect(Sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({
          dsn: 'https://key@o1.ingest.sentry.io/2',
          environment: 'development',
          sendDefaultPii: false,
          attachScreenshot: false,
          attachViewHierarchy: false,
          enableCaptureFailedRequests: false,
          replaysSessionSampleRate: 0,
          replaysOnErrorSampleRate: 0,
          beforeSend: expect.any(Function),
          beforeBreadcrumb: expect.any(Function),
        }),
      );

      const error = new Error('boom');
      log.error('render', 'Unhandled render error', error);
      log.warn('query', '["orders"] failed');
      expect(Sentry.captureException).toHaveBeenCalledWith(error, { tags: { scope: 'render' } });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: 'log',
        level: 'warning',
        message: '[query] ["orders"] failed',
      });
    });
  });
});
