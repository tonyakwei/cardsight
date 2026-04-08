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
const COLOR_FILTER = getArg('color', 'all'); // e.g. "blue-alt" to export only blue with alt theme

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

  // Set color filter
  await page.evaluate((color) => {
    document.getElementById('colorFilter').value = color;
    document.getElementById('colorFilter').dispatchEvent(new Event('change'));
  }, COLOR_FILTER);

  const cardCount = await page.evaluate(() => filteredCards.length);
  const filePrefix = COLOR_FILTER.endsWith('-alt') ? COLOR_FILTER : '';
  console.log(`Exporting ${cardCount} cards as ${FORMAT.toUpperCase()} to ${OUTPUT_DIR}`);

  for (let i = 0; i < cardCount; i++) {
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
      const card = filteredCards[index];
      return { color: card.color, number: card.number, name: card.name };
    }, i);

    const colorLabel = filePrefix || cardInfo.color;
    const safeName = cardInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = `${colorLabel}-${cardInfo.number}-${safeName}.${FORMAT === 'jpeg' ? 'jpg' : 'png'}`;

    // Screenshot just the card element
    const cardEl = await page.$('.card');
    await cardEl.screenshot({
      path: path.join(OUTPUT_DIR, filename),
      type: FORMAT,
      quality: FORMAT === 'jpeg' ? QUALITY : undefined,
    });

    console.log(`  [${i + 1}/${cardCount}] ${filename}`);
  }

  // Export card backs
  const baseColor = COLOR_FILTER.replace('-alt', '');
  const colors = COLOR_FILTER === 'all'
    ? ['red', 'yellow', 'green', 'blue', 'purple', 'white']
    : [baseColor];
  console.log(`\nExporting ${colors.length} card back(s)...`);

  for (const color of colors) {
    // Set the color filter (handles alt themes) and navigate to first card
    const filterValue = COLOR_FILTER.endsWith('-alt') ? COLOR_FILTER : color;
    await page.evaluate((c) => {
      document.getElementById('colorFilter').value = c;
      document.getElementById('colorFilter').dispatchEvent(new Event('change'));
    }, filterValue);

    await new Promise((r) => setTimeout(r, 300));

    // Flip to back
    await page.evaluate(() => document.getElementById('flipBtn').click());
    await new Promise((r) => setTimeout(r, 200));

    const backLabel = COLOR_FILTER.endsWith('-alt') ? COLOR_FILTER : color;
    const filename = `${backLabel}-back.${FORMAT === 'jpeg' ? 'jpg' : 'png'}`;
    const cardEl = await page.$('.card');
    await cardEl.screenshot({
      path: path.join(OUTPUT_DIR, filename),
      type: FORMAT,
      quality: FORMAT === 'jpeg' ? QUALITY : undefined,
    });

    // Flip back to front
    await page.evaluate(() => document.getElementById('flipBtn').click());

    console.log(`  ${filename}`);
  }

  await browser.close();
  console.log(`\nDone! ${cardCount} fronts + ${colors.length} back(s) exported to ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
