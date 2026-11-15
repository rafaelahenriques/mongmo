import { confirm } from '@/services/confirm';

/**
 * Asked right after a challenge photo is taken. Sharing offers the photo
 * to Mongmo, who pick which ones show in Photos of the week. Keeping it
 * private is the default answer (closing the dialog keeps it private
 * too), and both buttons carry the same weight.
 */
export function askToSharePhotos(count: number): Promise<boolean> {
  const yours = count === 1 ? 'yours' : 'one of yours';
  const it = count === 1 ? 'it' : 'them';
  return confirm(
    'Share for Photos of the week?',
    `Mongmo picks from the photos members share. If ${yours} is picked, other members see it on Home for a week, without your name. Only you and Mongmo staff see ${it} otherwise. You can stop sharing any time from Account → Your photos.`,
    'Share',
    { cancelLabel: 'Keep private' },
  );
}
