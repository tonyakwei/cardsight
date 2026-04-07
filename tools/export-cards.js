/**
 * Export all 54 card previews as high-quality JPGs using Puppeteer.
 *
 * Usage:
 *   npm install puppeteer   (or pnpm add puppeteer)
 *   node tools/export-cards.js
 *
 * Options:
 *   --output <dir>    Output directory (default: ./card-exports)
 *   --format <fmt>    "jpeg" or "png" (default: jpeg)
 *   --quality <n>     JPEG quality 0-100 (default: 95)
 *
 * Prerequisites:
 *   The card preview HTML must be accessible. The script serves it
 *   via a local file:// URL, so no dev server needed.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const OUTPUT_DIR = path.resolve(getArg('output', './card-exports'));
const FORMAT = getArg('format', 'jpeg');
const QUALITY = parseInt(getArg('quality', '95'), 10);

const PREVIEW_PATH = path.resolve(__dirname, 'card-preview.html');

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Card is 1050x1725 — deviceScaleFactor 2 = 2100x3450 (600 DPI at 3.5"x5.75")
  await page.setViewport({ width: 1200, height: 1900, deviceScaleFactor: 2 });

  const fileUrl = `file://${PREVIEW_PATH}`;
  await page.goto(fileUrl, { waitUntil: 'networkidle0', timeout: 30000 });

  // Wait for fonts to load and initial render
  await page.waitForFunction(() => document.fonts.ready.then(() => true), { timeout: 15000 });
  await page.waitForSelector('.card');

  // Get total card count
  const totalCards = await page.evaluate(() => CARDS.length);
  console.log(`Exporting ${totalCards} cards as ${FORMAT.toUpperCase()} to ${OUTPUT_DIR}`);

  // Set filter to "all" so filteredCards = all cards
  await page.evaluate(() => {
    document.getElementById('colorFilter').value = 'all';
    document.getElementById('colorFilter').dispatchEvent(new Event('change'));
  });

  for (let i = 0; i < totalCards; i++) {
    // Navigate to card by index
    await page.evaluate((index) => {
      const select = document.getElementById('cardSelect');
      select.value = index;
      select.dispatchEvent(new Event('change'));
    }, i);

    // Wait for QR code canvas to render
    await page.waitForFunction(
      () => document.querySelector('.card-qr canvas') !== null,
      { timeout: 5000 }
    );
    // Small delay for any animations/reflows
    await new Promise((r) => setTimeout(r, 300));

    // Get card info for filename
    const cardInfo = await page.evaluate((index) => {
      const card = CARDS[index];
      return { color: card.color, number: card.number, name: card.name };
    }, i);

    const safeName = cardInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = `${cardInfo.color}-${cardInfo.number}-${safeName}.${FORMAT === 'jpeg' ? 'jpg' : 'png'}`;

    // Screenshot just the card element
    const cardEl = await page.$('.card');
    await cardEl.screenshot({
      path: path.join(OUTPUT_DIR, filename),
      type: FORMAT,
      quality: FORMAT === 'jpeg' ? QUALITY : undefined,
    });

    console.log(`  [${i + 1}/${totalCards}] ${filename}`);
  }

  // Export card backs — one per color, no text/icon/QR/spades
  const colors = ['red', 'yellow', 'green', 'blue', 'purple', 'white'];
  console.log(`\nExporting ${colors.length} card backs...`);

  for (const color of colors) {
    // Navigate to the first card of this color
    await page.evaluate((c) => {
      const index = CARDS.findIndex((card) => card.color === c);
      const select = document.getElementById('cardSelect');
      select.value = index;
      select.dispatchEvent(new Event('change'));
    }, color);

    await new Promise((r) => setTimeout(r, 300));

    // Hide front-only elements
    await page.evaluate(() => {
      document.querySelector('.card-name-box').style.visibility = 'hidden';
      document.querySelector('#cardIcon').style.visibility = 'hidden';
      document.querySelector('.card-qr').style.visibility = 'hidden';
      document.querySelectorAll('.corner-spade').forEach((el) => {
        el.style.visibility = 'hidden';
      });
    });

    await new Promise((r) => setTimeout(r, 100));

    const filename = `${color}-back.${FORMAT === 'jpeg' ? 'jpg' : 'png'}`;
    const cardEl = await page.$('.card');
    await cardEl.screenshot({
      path: path.join(OUTPUT_DIR, filename),
      type: FORMAT,
      quality: FORMAT === 'jpeg' ? QUALITY : undefined,
    });

    // Restore visibility
    await page.evaluate(() => {
      document.querySelector('.card-name-box').style.visibility = '';
      document.querySelector('#cardIcon').style.visibility = '';
      document.querySelector('.card-qr').style.visibility = '';
      document.querySelectorAll('.corner-spade').forEach((el) => {
        el.style.visibility = '';
      });
    });

    console.log(`  ${filename}`);
  }

  await browser.close();
  console.log(`\nDone! ${totalCards} fronts + ${colors.length} backs exported to ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
