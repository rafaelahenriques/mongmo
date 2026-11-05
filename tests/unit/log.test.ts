import { addLogSink, log, setLogLevel, type LogEntry } from '@/lib/log';

let printed: jest.SpyInstance[];

beforeEach(() => {
  setLogLevel('debug');
  printed = (['log', 'info', 'warn', 'error'] as const).map((method) =>
    jest.spyOn(console, method).mockImplementation(() => undefined),
  );
});
afterEach(() => jest.restoreAllMocks());

it('prints scrubbed messages and details, with their scope', () => {
  log.warn('auth', 'sign-in failed for a@b.co', { email: 'a@b.co', status: 400 });
  expect(console.warn).toHaveBeenCalledWith('[auth] sign-in failed for [email]', { email: '[redacted]', status: 400 });
});

it('drops levels below the minimum, as staging and production do with debug and info', () => {
  setLogLevel('warn');
  log.debug('geofencing', 'watching 3 regions');
  log.info('geofencing', 'watching 3 regions');
  for (const spy of printed) expect(spy).not.toHaveBeenCalled();
});

it('hands sinks the scrubbed entry, and the original error to report', () => {
  const entries: LogEntry[] = [];
  const stop = addLogSink((entry) => entries.push(entry));
  const error = new Error('order 3f2a9c1e-1b2c-4d5e-8f90-123456789abc failed');
  log.error('order', 'could not place', error);
  stop();
  log.error('order', 'not seen by the stopped sink');

  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatchObject({
    level: 'error',
    scope: 'order',
    message: 'could not place',
    detail: 'Error: order [id] failed',
  });
  expect(entries[0]!.error).toBe(error);
});
