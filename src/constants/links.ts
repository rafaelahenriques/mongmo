import { Linking } from 'react-native';

/** Mongmo's catering page: the food truck and catering for events, to book. */
export const CATERING_URL = 'https://bestel.mongmo-store.com/nl/catering';

/** Mongmo on Instagram: where the pop-ups are announced first. */
export const INSTAGRAM_URL = 'https://www.instagram.com/mongmo_store/';
export const INSTAGRAM_HANDLE = '@mongmo_store';

/**
 * Opens a web page in the browser (or Instagram in its app, when it's
 * installed). A phone with nothing to open it with does nothing.
 */
export function openLink(url: string): void {
  Linking.openURL(url).catch(() => undefined);
}
