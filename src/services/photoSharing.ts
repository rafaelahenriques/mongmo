import { confirm } from '@/services/confirm';

/**
 * Asked right after a challenge photo is taken. Keeping it private is the
 * default answer (closing the dialog keeps it private too), and both
 * buttons carry the same weight.
 */
export function askToSharePhotos(count: number): Promise<boolean> {
  const them = count === 1 ? 'your photo' : 'your photos';
  return confirm(
    'Share in Photos of the week?',
    `Other members will see ${them} on Home for a week, without your name. Only you and Mongmo staff see it otherwise. You can stop sharing any time from Account → Your photos.`,
    'Share',
    { cancelLabel: 'Keep private' },
  );
}
