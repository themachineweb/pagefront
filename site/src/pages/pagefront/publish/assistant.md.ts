/**
 * The assistant prompt as a markdown file, the repository file
 * commerce/prompts/draft-product-from-page-chat.md byte for byte and the
 * page's copy. The route is prerendered to dist/, so the Content-Type
 * below never reaches production; the type the static host sends comes
 * from public/_headers.
 */
import { promptBody } from '../../../lib/prompts';

export async function GET() {
  return new Response(await promptBody('draft-product-from-page-chat'), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
