import { exportFileName } from '@/services/dataExport';

it('names the file after the day it was made', () => {
  expect(exportFileName(new Date('2026-11-05T21:00:00Z'))).toBe('mongmo-data-2026-11-05.json');
});
