// Renders the mockups in design/mockups/ and the live site to PNGs in
// docs/design/screens/, using the system Chrome (no browser download).
//   npm run screens
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';

const OUT = fileURLToPath(new URL('../docs/design/screens/', import.meta.url));
const CHROME = process.env.CHROME_PATH ?? '/usr/bin/google-chrome';
mkdirSync(OUT, { recursive: true });

const server = await serve(0);
const base = `http://localhost:${server.address().port}/crew/`;

/** name, path (under /crew/), viewport, options */
const shots = [
  ['hero', 'mockups/hero.html', { width: 1600, height: 900 }, { scheme: 'dark' }],
  ['terminal-init', 'mockups/terminal-init.html', { width: 1200, height: 760 }, {}],
  ['terminal-doctor', 'mockups/terminal-doctor.html', { width: 1200, height: 820 }, {}],
  ['site-light', '', { width: 1440, height: 900 }, { scheme: 'light' }],
  ['site-dark', '', { width: 1440, height: 900 }, { scheme: 'dark' }],
  ['site-full', '', { width: 1440, height: 900 }, { scheme: 'light', fullPage: true }],
  ['site-mobile', '', { width: 390, height: 844 }, { scheme: 'dark', scale: 2, fullPage: true }],
  ['demo-light', 'demo.html', { width: 1440, height: 960 }, { scheme: 'light', demo: true }],
  ['demo-dark', 'demo.html', { width: 1440, height: 960 }, { scheme: 'dark', demo: true }],
  [
    'demo-mobile',
    'demo.html',
    { width: 390, height: 844 },
    { scheme: 'light', scale: 2, demo: true, fullPage: true },
  ],
  [
    'demo-files',
    'demo.html',
    { width: 1440, height: 960 },
    { scheme: 'dark', demo: true, element: '#workspace' },
  ],
  ['og', 'mockups/og.html', { width: 1200, height: 630 }, {}],
];

const browser = await chromium.launch({ executablePath: CHROME });
const errors = [];
try {
  for (const [name, path, viewport, opts] of shots) {
    const page = await browser.newPage({
      viewport,
      deviceScaleFactor: opts.scale ?? 2,
      colorScheme: opts.scheme ?? 'dark',
      reducedMotion: 'reduce',
    });
    page.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
    page.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text()}`));
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (opts.demo) {
      await page.getByRole('button', { name: /run crew init/i }).click();
      await page.locator('[data-file=".claude/agents/qa.md"]').first().click();
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(200);
    const file = `${OUT}${name}.png`;
    if (opts.element) await page.locator(opts.element).screenshot({ path: file });
    else await page.screenshot({ path: file, fullPage: Boolean(opts.fullPage) });
    console.log(`  + ${file.replace(OUT, 'docs/design/screens/')}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
if (errors.length) {
  console.error(`\n  ✗ ${errors.length} page error(s):\n  ${errors.join('\n  ')}`);
  process.exitCode = 1;
}
