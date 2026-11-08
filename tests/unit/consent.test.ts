import * as Sentry from '@sentry/react-native';

/** Crash reporting with a DSN, as in a staging or production build. */
function withDsn<T>(load: () => T): T {
  process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://key@o1.ingest.sentry.io/2';
  let loaded!: T;
  jest.isolateModules(() => {
    loaded = load();
  });
  return loaded;
}

afterEach(() => {
  delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  jest.clearAllMocks();
});

describe('crash reports follow the answer', () => {
  it('sends nothing before the person answers, or when they say no', () => {
    const { applyCrashReportsChoice } = withDsn(() => require('@/lib/crashReporting'));
    applyCrashReportsChoice('unasked');
    applyCrashReportsChoice('off');
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('starts on yes, and stops when they change their mind', async () => {
    const { applyCrashReportsChoice } = withDsn(() => require('@/lib/crashReporting'));
    applyCrashReportsChoice('on');
    expect(Sentry.init).toHaveBeenCalledTimes(1);
    applyCrashReportsChoice('off');
    await Promise.resolve();
    expect(Sentry.close).toHaveBeenCalledTimes(1);
  });
});
