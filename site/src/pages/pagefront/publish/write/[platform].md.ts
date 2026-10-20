/**
 * Each write prompt as a markdown file, the repository file
 * commerce/prompts/write-<platform>-chat.md byte for byte, beside its page.
 * The route is prerendered to dist/, so the Content-Type below never
 * reaches production; the type the static host sends comes from
 * public/_headers.
 */
import { WRITE_PLATFORMS, promptBody } from '../../../../lib/prompts';

export async function getStaticPaths() {
  const paths = [];
  for (const platform of Object.keys(WRITE_PLATFORMS)) {
    paths.push({ params: { platform }, props: { body: await promptBody(`write-${platform}-chat`) } });
  }
  return paths;
}

export function GET({ props }: { props: { body: string } }) {
  return new Response(props.body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
