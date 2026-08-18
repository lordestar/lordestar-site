import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const corePath = process.env.PLAYWRIGHT_CORE_PATH;
let chromium;
try {
  ({ chromium } = require(corePath ?? 'playwright-core'));
} catch {
  try {
    ({
      chromium,
    } = require('C:/Users/21957/AppData/Local/npm-cache/_npx/31e32ef8478fbf80/node_modules/playwright-core'));
  } catch {
    console.error('playwright-core not found. Set PLAYWRIGHT_CORE_PATH to the module directory.');
    process.exit(1);
  }
}

const out = 'output/playwright';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_PATH ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto('http://localhost:4321/about', { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
await page.screenshot({ path: `${out}/about-desktop.png`, fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(1400);
await page.screenshot({ path: `${out}/about-mobile.png`, fullPage: true });

await page.goto('http://localhost:4321/works', { waitUntil: 'networkidle' });
await page.setViewportSize({ width: 1440, height: 900 });
await page.waitForTimeout(2600);
await page.screenshot({ path: `${out}/works-desktop.png`, fullPage: true });

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(1800);
await page.screenshot({ path: `${out}/works-mobile.png`, fullPage: true });

await browser.close();
console.log('screenshots saved');
