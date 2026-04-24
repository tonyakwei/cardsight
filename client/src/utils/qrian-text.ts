/**
 * Pre-process markdown content to convert {{{TEXT}}} syntax
 * into HTML spans that render in the QRian glyph font.
 *
 * Usage in card/mission descriptions:
 *   "The wheel reads {{{PURGE THE FLOOR}}}"
 *
 * Becomes:
 *   "The wheel reads <span class="qrian-glyph">PURGE THE FLOOR</span>"
 *
 * Requires rehype-raw on the ReactMarkdown component to render the HTML.
 */
export function processQrianText(markdown: string): string {
  return markdown.replace(
    /\{\{\{(.+?)\}\}\}/g,
    '<span class="qrian-glyph">$1</span>',
  );
}
