import { Redirect } from 'expo-router';

/**
 * A link to a page that doesn't exist (a typo, an old notification) opens
 * Home. Native tabs can't show a screen outside the tab bar, and Expo's own
 * "Unmatched Route" page is pure black, off-brand.
 */
export default function NotFound() {
  return <Redirect href="/(home)" />;
}
