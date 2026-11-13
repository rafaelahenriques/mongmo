import { handleStripeRedirect } from '@/services/payments';

/**
 * Links that open the app (Expo Router's native intent). A bank page
 * (Bancontact, 3-D Secure) sends people back to mongmo://stripe-redirect:
 * that's handed to Stripe's payment sheet, which is still open, and the
 * app stays where it is instead of opening a page that doesn't exist.
 * Every other link opens as usual.
 */
export function redirectSystemPath({ path }: { path: string; initial: boolean }): string | null {
  try {
    if (path.includes('stripe-redirect')) {
      void handleStripeRedirect(path).catch(() => false);
      return null;
    }
    return path;
  } catch {
    // Throwing here can crash the app; open the link unchanged instead.
    return path;
  }
}
