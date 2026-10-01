/**
 * Every published specification document as markdown, the repository
 * file byte for byte, beside its rendered page: /pagefront/spec/{route}.md.
 * The pages are for people; these are the files a model reads, and the
 * ones /llms.txt points at. Routes come from SPEC_DOCS, as for the pages.
 */
import { SPEC_DOCS } from '../../../lib/spec-routes.mjs';

const RAW = import.meta.glob(['../../../../../commerce/spec/*.md', '../../../../../core/spec/*.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export function getStaticPaths() {
  return Object.values(SPEC_DOCS).map((meta) => {
    const key = Object.keys(RAW).find((k) => k.endsWith(`/${meta.source}`));
    if (!key) throw new Error(`spec document not found in repository: ${meta.source}`);
    return { params: { doc: meta.route }, props: { body: RAW[key] } };
  });
}

export function GET({ props }: { props: { body: string } }) {
  return new Response(props.body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
