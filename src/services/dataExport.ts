import { Platform, Share } from 'react-native';
import { File, Paths } from 'expo-file-system';

import { exportMyData } from '@/api/privacy';

/** "mongmo-data-2026-11-05.json" */
export function exportFileName(now = new Date()): string {
  return `mongmo-data-${now.toISOString().slice(0, 10)}.json`;
}

/**
 * Downloads everything the app holds about you as a JSON file: in the
 * browser a download, on a phone the share sheet (save to Files, mail it
 * to yourself…). The file only exists on your device.
 */
export async function downloadMyData(): Promise<void> {
  const json = JSON.stringify(await exportMyData(), null, 2);
  const name = exportFileName();

  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }

  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.create();
  file.write(json);
  // iOS shares the file itself; Android's share sheet takes text.
  await Share.share(Platform.OS === 'ios' ? { url: file.uri, title: name } : { message: json, title: name });
}
