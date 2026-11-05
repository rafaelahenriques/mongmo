/**
 * Screens that fill the whole screen with their own bottom action (a block
 * button or a camera), so the tab bar steps aside: the order flow after
 * the menu, check-in, the owner's editors.
 * Matched on the pathname, which leaves out route groups.
 */
const FULL_SCREEN = [
  /^\/order\/(item|cart|checkout|location)/,
  /^\/check-in/,
  /^\/owner\/(event\/new|challenge\/|order\/)/,
];

export function isTabBarHidden(pathname: string): boolean {
  return FULL_SCREEN.some((pattern) => pattern.test(pathname));
}
