/**
 * The case studies' sheets, served on this domain next to their writeups
 * (/pagefront/commerce/case-studies/{case}/{file}). Read at build time
 * from the repository folder each case names; the file list comes from
 * the registry, so a sheet not listed there is not served.
 */
import { CASE_STUDIES } from '../../../../../lib/case-study-routes.mjs';

const RAW = import.meta.glob('../../../../../../../commerce/case-studies/*/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const rawFor = (folder: string, file: string): string => {
  const key = Object.keys(RAW).find((k) => k.endsWith(`/${folder}/${file}`));
  if (!key) throw new Error(`case-study sheet not found in repository: ${folder}/${file}`);
  return RAW[key];
};

export function getStaticPaths() {
  return Object.values(CASE_STUDIES).flatMap((c) =>
    c.sheets.map((s) => ({
      params: { cs: c.route, file: s.file },
      props: { body: rawFor(c.folder, s.file) },
    }))
  );
}

export function GET({ props }: { props: { body: string } }) {
  return new Response(props.body, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
