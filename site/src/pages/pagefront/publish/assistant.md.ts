/**
 * The assistant prompt as a markdown file, byte-identical to the page's copy.
 * The route is prerendered to dist/, so the Content-Type below never reaches
 * production; the type the static host sends comes from public/_headers.
 */
import prompt from '../../../content/assistant-prompt.md?raw';

export function GET() {
  return new Response(prompt, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
