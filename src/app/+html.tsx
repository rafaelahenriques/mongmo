import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * A tab that isn't showing stays in the page, behind the one that is,
 * hidden from screen readers only: the Tab key would still walk through
 * every button on it before reaching what's on screen. This takes those
 * screens out of the keyboard's way too. Only hidden containers with
 * controls in them are touched; decorative bits hidden from screen readers
 * (icons, the chapter numbers) hold none and stay as they are.
 */
const HIDDEN_SCREENS = `[aria-hidden="true"]:has(a[href], button, input, textarea, select, [tabindex]) { visibility: hidden; }`;

/**
 * The web page around the app (web only, rendered in Node at build time).
 * Expo's template, plus a title: each screen then sets its own from its
 * heading (useDocumentTitle), so a tab or a screen reader names the page.
 */
export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();

  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>Mongmo</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: HIDDEN_SCREENS }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
