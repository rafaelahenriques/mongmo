// Accessibility pass over every screen of the web build.
//
//   APP_URL=http://localhost:8081 node tests/a11y/run.mjs
//   (owner screens too: OWNER_EMAIL=… OWNER_PASSWORD=… on an owner account)
//
// It signs up a fresh account through the app (the Supabase project must let
// new accounts in without confirming their email), then walks every screen
// the way a person would, tapping through, and on each one checks:
//   image-alt      every <img> has alt (alt="" when decorative)
//   name           every button, link, switch, tab and field has a name
//   field-label    every text field has a label (a placeholder isn't one)
//   heading        exactly one h1, and no level skipped below it
//   target-size    every control is at least 24 × 24 CSS px (WCAG 2.5.8)
//   keyboard       every control can be reached with Tab, and nothing traps focus
//   focus-visible  the focused control shows a focus ring
//   reflow         no sideways scrolling at 320 px wide (200%–400% zoom)
//   text-200       with every font at twice its size (the phone's largest
//                  text settings; display sizes the app caps at 1.3× stay
//                  capped), no text is cut off and nothing scrolls sideways
//   axe            axe-core's rules for WCAG 2.0, 2.1 and 2.2, levels A and AA
//   csp            nothing the page loads is blocked by the security headers
//                  (serve the build with scripts/serve-web.mjs to apply them)
// It prints what it found per screen and exits 1 if anything failed or a
// screen couldn't be reached.

import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const axeSource = require('fs').readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
/** What the Content-Security-Policy blocked since the last screen was checked. */
let cspBlocked = [];

const APP = process.env.APP_URL ?? 'http://localhost:8081';
const WAIT = Number(process.env.A11Y_WAIT_MS ?? 2500);
const results = [];

/** Runs in the page: the static checks. */
function staticChecks() {
  const out = [];
  const hiddenByAria = (el) => el.closest('[aria-hidden="true"], [inert]');
  const shown = (el) => {
    if (hiddenByAria(el)) return false;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  };
  const describe = (el) =>
    `${el.tagName.toLowerCase()}${el.getAttribute('role') ? `[role=${el.getAttribute('role')}]` : ''} "${(
      el.getAttribute('aria-label') ||
      el.innerText ||
      el.getAttribute('placeholder') ||
      ''
    )
      .trim()
      .slice(0, 40)}"`;
  const nameOf = (el) => {
    const labelledBy = el.getAttribute('aria-labelledby');
    const byId = labelledBy
      ? labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.innerText ?? '')
          .join(' ')
      : '';
    const imgAlts = [...el.querySelectorAll('img[alt]')].map((img) => img.alt).join(' ');
    return (el.getAttribute('aria-label') || byId || el.innerText || el.getAttribute('title') || imgAlts || '').trim();
  };

  for (const img of document.querySelectorAll('img')) {
    if (shown(img) && !img.hasAttribute('alt')) out.push({ rule: 'image-alt', target: img.src.slice(-50) });
  }

  const controls = [
    ...document.querySelectorAll(
      'button, a[href], input, select, textarea, [role=button], [role=link], [role=switch], [role=checkbox], [role=radio], [role=tab], [role=slider], [role=adjustable]',
    ),
  ].filter(shown);
  for (const el of controls) {
    const field = el.matches('input, textarea, select');
    if (field && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby') && !el.labels?.length) {
      out.push({ rule: 'field-label', target: describe(el) });
    } else if (!field && !nameOf(el)) {
      out.push({ rule: 'name', target: describe(el) });
    }
    const rect = el.getBoundingClientRect();
    if (rect.width < 24 || rect.height < 24) {
      out.push({
        rule: 'target-size',
        target: `${describe(el)} is ${Math.round(rect.width)}×${Math.round(rect.height)}`,
      });
    }
  }

  const headings = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6, [role=heading]')]
    .filter((el) => !hiddenByAria(el) && getComputedStyle(el).display !== 'none' && el.getClientRects().length)
    .map((el) => ({
      level: /^H\d$/.test(el.tagName) ? Number(el.tagName[1]) : Number(el.getAttribute('aria-level') ?? 2),
      text: el.innerText.trim().slice(0, 40),
    }));
  const ones = headings.filter((heading) => heading.level === 1);
  if (ones.length !== 1) {
    out.push({
      rule: 'heading',
      target: `${ones.length} h1 (${ones.map((h) => `"${h.text}"`).join(', ')})`,
    });
  }
  let previous = 0;
  for (const heading of headings) {
    if (previous && heading.level > previous + 1) {
      out.push({
        rule: 'heading',
        target: `h${heading.level} "${heading.text}" after h${previous}`,
      });
    }
    previous = heading.level;
  }
  return { violations: out, controls: controls.length };
}

/** Tabs through the page: what's reachable, whether focus shows, whether it gets stuck. */
async function keyboardChecks(page) {
  const out = [];
  // Start tabbing from the top of the page: Chrome otherwise carries on
  // from wherever the last click was.
  await page.evaluate(() => {
    const start = document.createElement('a');
    start.id = '__a11y_start';
    start.href = '#';
    start.textContent = 'start';
    document.body.prepend(start);
    start.focus();
    window.scrollTo(0, 0);
  });
  const reached = new Set();
  let same = 0;
  let last = null;
  for (let i = 0; i < 120; i += 1) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el.id === '__a11y_start') return null;
      if (!el.dataset.a11yId) el.dataset.a11yId = String(Math.random()).slice(2);
      const style = getComputedStyle(el);
      const ring = (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) || style.boxShadow !== 'none';
      return {
        id: el.dataset.a11yId,
        ring,
        label: (el.getAttribute('aria-label') || el.innerText || '').trim().slice(0, 40),
      };
    });
    if (!info) {
      if (reached.size) break; // focus left the page: the end of the tab order
      continue;
    }
    if (!info.ring) out.push({ rule: 'focus-visible', target: `"${info.label}"` });
    if (info.id === last) same += 1;
    else same = 0;
    if (same >= 3) {
      out.push({ rule: 'keyboard', target: `focus stuck on "${info.label}"` });
      break;
    }
    if (reached.has(info.id) && reached.size > 1) break; // wrapped around
    reached.add(info.id);
    last = info.id;
  }
  await page.evaluate(() => document.getElementById('__a11y_start')?.remove());
  const unreachable = await page.evaluate(
    (ids) => {
      const seen = new Set(ids);
      const shown = (el) => {
        if (el.closest('[aria-hidden="true"], [inert]')) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      };
      return [
        ...document.querySelectorAll(
          'button, a[href], input, select, textarea, [role=button], [role=link], [role=switch], [role=checkbox], [role=radio], [role=tab]',
        ),
      ]
        .filter(shown)
        .filter((el) => !el.disabled && el.getAttribute('aria-disabled') !== 'true')
        .filter((el) => !seen.has(el.dataset.a11yId))
        .map((el) => (el.getAttribute('aria-label') || el.innerText || el.tagName).trim().slice(0, 40));
    },
    [...reached],
  );
  for (const label of unreachable) out.push({ rule: 'keyboard', target: `can't Tab to "${label}"` });
  return out;
}

/**
 * Large text: double every font size (and line height) on screen, as the
 * phone's biggest text settings do, then look for text cut off by a box
 * that clips (overflow hidden) or a page that now scrolls sideways. Text
 * set to one line with an ellipsis on purpose doesn't count.
 */
async function textScaleCheck(page) {
  const found = await page.evaluate(async () => {
    const changed = [];
    for (const el of document.querySelectorAll('body *')) {
      if (![...el.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim())) continue;
      const style = getComputedStyle(el);
      // Display sizes stop at 1.3× on phones (data-text-cap), like the app does.
      const scale = Number(el.closest('[data-text-cap]')?.dataset.textCap ?? 2);
      changed.push([el, el.style.fontSize, el.style.lineHeight]);
      el.style.fontSize = `${parseFloat(style.fontSize) * scale}px`;
      if (style.lineHeight !== 'normal') el.style.lineHeight = `${parseFloat(style.lineHeight) * scale}px`;
    }
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const out = [];
    const wide = document.documentElement.scrollWidth;
    if (wide > innerWidth + 2) out.push(`page is ${wide}px wide at ${innerWidth}px`);
    for (const [el] of changed) {
      if (el.closest('[aria-hidden="true"], [inert]') || !el.getClientRects().length) continue;
      const own = getComputedStyle(el);
      // One line with an ellipsis (numberOfLines) is a choice, not a clip.
      if (own.textOverflow === 'ellipsis' || own.webkitLineClamp !== 'none') continue;
      const box = el.getBoundingClientRect();
      // The nearest box that clips, on each axis; one that scrolls on an axis
      // doesn't cut anything off on that axis (you scroll to it).
      const clips = (value) => value === 'hidden' || value === 'clip';
      let cut = false;
      for (let up = el.parentElement; up && up !== document.body && !cut; up = up.parentElement) {
        const clip = getComputedStyle(up);
        const edge = up.getBoundingClientRect();
        if (clips(clip.overflowY) && (box.bottom > edge.bottom + 2 || box.top < edge.top - 2)) cut = true;
        if (clips(clip.overflowX) && (box.right > edge.right + 2 || box.left < edge.left - 2)) cut = true;
        if (clip.overflowX !== 'visible' || clip.overflowY !== 'visible') break;
      }
      if (cut) out.push(`"${el.innerText.trim().slice(0, 30)}" is cut off`);
    }
    for (const [el, size, line] of changed) {
      el.style.fontSize = size;
      el.style.lineHeight = line;
    }
    return [...new Set(out)].slice(0, 8);
  });
  return found.map((target) => ({ rule: 'text-200', target }));
}

async function reflowCheck(page) {
  const size = page.viewportSize();
  await page.setViewportSize({ width: 320, height: 640 });
  await page.waitForTimeout(400);
  const wide = await page.evaluate(() => document.documentElement.scrollWidth);
  await page.setViewportSize(size);
  await page.waitForTimeout(200);
  return wide > 322 ? [{ rule: 'reflow', target: `page is ${wide}px wide at 320px` }] : [];
}

async function axeChecks(page) {
  // As an argument, not a <script> tag: the security headers don't allow
  // scripts added to the page.
  await page.evaluate(axeSource);
  const result = await page.evaluate(async () =>
    // eslint-disable-next-line no-undef
    axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      },
    }),
  );
  const found = result.violations.flatMap((violation) =>
    violation.nodes.map((node) => ({
      rule: `axe:${violation.id}`,
      target: node.target.join(' '),
    })),
  );
  // A11Y_DETAIL=1: each element's name and visible text, to see what differs.
  if (process.env.A11Y_DETAIL) {
    for (const item of found) {
      const detail = await page
        .evaluate((selector) => {
          const el = document.querySelector(selector);
          return el ? `name="${el.getAttribute('aria-label')}" text="${el.innerText.replace(/\s+/g, ' ').trim()}"` : '';
        }, item.target)
        .catch(() => '');
      item.target = `${item.target} ${detail}`;
    }
  }
  return found;
}

async function audit(page, screen) {
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => undefined);
  // Every screen names itself with an h1 once it has loaded; give it a while.
  await page
    .waitForFunction(
      () =>
        [...document.querySelectorAll('h1, [role=heading][aria-level="1"]')].some(
          (el) => !el.closest('[aria-hidden="true"], [inert]') && el.getClientRects().length,
        ),
      undefined,
      { timeout: 15000 },
    )
    .catch(() => undefined);
  await page.waitForTimeout(WAIT);
  const { violations, controls } = await page.evaluate(staticChecks);
  const all = [
    ...violations,
    ...(await keyboardChecks(page)),
    ...(await reflowCheck(page)),
    ...(await textScaleCheck(page)),
    ...(await axeChecks(page)),
    ...cspBlocked.splice(0).map((blocked) => ({ rule: 'csp', target: blocked })),
  ];
  results.push({ screen, controls, violations: all });
  console.log(`${all.length ? '✗' : '✓'} ${screen} (${controls} controls)`);
  for (const v of all) console.log(`    ${v.rule}: ${v.target}`);
}

/** One step: do it, audit the screen, carry on if a step can't be done. */
async function step(page, screen, action) {
  try {
    await action();
    await audit(page, screen);
  } catch (error) {
    results.push({
      screen,
      violations: [],
      skipped: String(error.message ?? error).split('\n')[0],
    });
    console.log(`- ${screen}: skipped (${String(error.message ?? error).split('\n')[0]})`);
    // What was on screen instead, to tell a missing control from a broken step.
    const onScreen = await page
      .evaluate(() =>
        [...document.querySelectorAll('[role=button], [role=link], [role=tab], button, a[href]')]
          .filter((el) => !el.closest('[aria-hidden="true"], [inert]') && el.getClientRects().length)
          .map((el) => (el.getAttribute('aria-label') || el.innerText || '').trim().slice(0, 30))
          .filter(Boolean)
          .slice(0, 12),
      )
      .catch(() => []);
    console.log(`    on screen: ${onScreen.join(' | ') || '(nothing)'}`);
  }
}

// Screens under the top one stay in the page, so only match what's on screen.
const button = (page, name) => page.getByRole('button', { name }).filter({ visible: true }).first();
const tab = (page, name) => page.getByRole('tab', { name, exact: true }).filter({ visible: true }).first();
/** Back out of a pushed screen, if one is showing. */
const back = async (page) => {
  const control = button(page, /^(Back|Go back)/);
  if (await control.count()) await control.click();
  await page.waitForTimeout(600);
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  geolocation: { latitude: 50.8279, longitude: 3.2649 },
  permissions: ['geolocation'],
});
const page = await context.newPage();
page.on('dialog', (dialog) => dialog.accept());
await context.exposeFunction('reportCspBlock', (blocked) => cspBlocked.push(blocked));
await context.addInitScript(() =>
  document.addEventListener('securitypolicyviolation', (event) =>
    // eslint-disable-next-line no-undef
    reportCspBlock(`${event.violatedDirective} blocked ${event.blockedURI || 'inline'}`),
  ),
);

await step(page, 'Opening', () => page.goto(APP, { waitUntil: 'load' }));
await step(page, 'Join us', () => button(page, 'Get started').click());
await step(page, 'Sign in', () => button(page, /^Already have an account/).click());
await step(page, 'Reset password', () => button(page, 'Forgot your password?').click());
await step(page, 'Join us again', async () => {
  await button(page, 'Back to sign in').click();
  await button(page, /^New to Mongmo/).click();
});
const email = `a11y-${Date.now()}@mongmo.test`;
await step(page, 'Permissions', async () => {
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder(/Password/).fill('accessible-1');
  await button(page, 'Create account').click();
});
await step(page, 'Home', () => button(page, 'Not now').click());
await step(page, 'Notifications', () => button(page, /^Notifications/).click());
await back(page); // Home again, so the pop-up hero is there when we come back to it.
await step(page, 'Pop-ups (map)', () => tab(page, 'Pop-ups').click());
await step(page, 'Pop-ups (list)', () =>
  page.getByRole('tab', { name: 'List' }).filter({ visible: true }).first().click(),
);
await step(page, 'Pop-up page', async () => {
  await tab(page, 'Home').click();
  await back(page);
  await page.waitForTimeout(2500);
  // On the web a card's name is its visible text: "Live now Mongmo Nights…".
  const hero = button(page, /^(live now|coming up)/i);
  if (await hero.count()) await hero.click();
  else await button(page, /pop-up in /).click();
});
await step(page, 'Challenges', () =>
  page
    .getByRole('link', { name: /^See all/ })
    .or(page.getByRole('button', { name: /^See all/ }))
    .filter({ visible: true })
    .first()
    .click(),
);
await step(page, 'Order: menu', async () => {
  await tab(page, 'Order').click();
});
// A section reads "Bánh mì 10,50", a product "Chicken lemongrass … 10,50".
await step(page, 'Order: section', () => button(page, /^bánh mì\s+\d+,\d\d$/i).click());
await step(page, 'Order: product', () => button(page, /\d+,\d\d$/).click());
await step(page, 'Cart', async () => {
  await button(page, /to cart/).click();
  await page.waitForTimeout(800);
  await page
    .getByRole('button', { name: /^View cart/ })
    .filter({ visible: true })
    .last()
    .click();
});
await step(page, 'Checkout', () => button(page, /^Checkout/).click());
await step(page, 'Order status', () => button(page, /^Place order/).click());
await step(page, 'Wallet', () => tab(page, 'Wallet').click());
await step(page, 'Points history', () => button(page, 'Points history').click());
await step(page, 'Membership card', async () => {
  await page.goBack();
  await page.waitForTimeout(1200);
  await button(page, 'Show your membership card').click();
});
await step(page, 'Levels', async () => {
  await page.goBack();
  await page.waitForTimeout(1200);
  await button(page, /^Your level/).click();
});
await step(page, 'Achievements: badges', async () => {
  await back(page);
  await button(page, 'Achievements').click();
});
await step(page, 'Achievements: leaderboard', () => page.getByRole('tab', { name: 'Leaderboard' }).click());
await step(page, 'Account', async () => {
  await back(page);
  await button(page, 'Account').click();
});
await step(page, 'My orders', () => button(page, 'My orders').click());
await step(page, 'Edit profile', async () => {
  await page.goBack();
  await page.waitForTimeout(1200);
  await button(page, 'Edit profile').click();
});
await step(page, 'Settings', async () => {
  await page.goBack();
  await page.waitForTimeout(1200);
  await button(page, 'Settings').click();
});
await step(page, 'Change password', () => button(page, 'Change password').click());

if (process.env.OWNER_EMAIL && process.env.OWNER_PASSWORD) {
  const owner = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  owner.on('dialog', (dialog) => dialog.accept());
  await owner.goto(APP, { waitUntil: 'load' });
  await owner.waitForTimeout(WAIT);
  await button(owner, 'I already have an account').click();
  await owner.getByPlaceholder('Email').fill(process.env.OWNER_EMAIL);
  await owner.getByPlaceholder('Password').fill(process.env.OWNER_PASSWORD);
  await button(owner, 'Sign in').click();
  await owner.waitForTimeout(WAIT);
  await step(owner, 'Owner tools', async () => {
    await button(owner, 'Account').click();
    await owner.waitForTimeout(1200);
    await button(owner, /^Owner tools/).click();
  });
  await step(owner, 'Owner: orders', () => button(owner, /^Orders/).click());
  await step(owner, 'Owner: pop-ups', async () => {
    await owner.goBack();
    await owner.waitForTimeout(1200);
    await button(owner, /pop-ups/i).click();
  });
  await step(owner, 'Owner: new pop-up', () => button(owner, /New pop-up/).click());
}

await browser.close();

const failed = results.filter((result) => result.violations.length);
const skipped = results.filter((result) => result.skipped);
console.log(
  `\n${results.length} screens: ${results.length - failed.length - skipped.length} clean, ${failed.length} with problems, ${skipped.length} skipped.`,
);
process.exit(failed.length || skipped.length ? 1 : 0);
