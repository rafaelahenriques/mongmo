import { useEffect } from 'react';

const APP_NAME = 'Mongmo';

/** The visible h1's text: every screen has exactly one (the accessibility test checks it). */
function visibleHeading(): string | null {
  for (const heading of document.querySelectorAll('h1, [role="heading"][aria-level="1"]')) {
    if (heading.closest('[aria-hidden="true"], [inert]') || !heading.getClientRects().length) continue;
    const text = heading.textContent?.trim();
    if (text) return text;
  }
  return null;
}

/**
 * Keeps the browser tab's title in step with the screen: "Wallet · Mongmo".
 * Screen readers announce it when the page changes, and it tells tabs and
 * history entries apart. Follows the h1 whenever the page changes.
 */
export function useDocumentTitle(): void {
  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const heading = visibleHeading();
        const title =
          heading && heading.toLowerCase() !== APP_NAME.toLowerCase() ? `${heading} · ${APP_NAME}` : APP_NAME;
        if (document.title !== title) document.title = title;
      });
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);
}
