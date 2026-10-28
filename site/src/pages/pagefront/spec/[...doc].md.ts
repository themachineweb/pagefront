/**
 * Every published specification document as markdown, the repository
 * file byte for byte, beside its rendered page: /pagefront/spec/{route}.md.
 * The pages are for people; these are the files a model reads, and the
 * ones /llms.txt points at. Routes come from SPEC_DOCS, as for the pages.
 * A document's design notes are served the same way at their own route,
 * so the relative links inside the served spec resolve; the notes have
 * no page of their own.
 */
import { SPEC_DOCS } from '../../../lib/spec-routes.mjs';

const RAW = import.meta.glob(['../../../../../commerce/spec/*.md', '../../../../../core/spec/*.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

function bodyOf(source: string): string {
  const key = Object.keys(RAW).find((k) => k.endsWith(`/${source}`));
  if (!key) throw new Error(`spec document not found in repository: ${source}`);
  return RAW[key];
}

export function getStaticPaths() {
  return Object.values(SPEC_DOCS).flatMap((meta) => {
    const twins = [{ params: { doc: meta.route }, props: { body: bodyOf(meta.source) } }];
    if (meta.notes) {
      twins.push({ params: { doc: meta.notes.route }, props: { body: bodyOf(meta.notes.source) } });
    }
    return twins;
  });
}

export function GET({ props }: { props: { body: string } }) {
  return new Response(props.body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
}
