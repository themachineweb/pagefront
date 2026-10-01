/**
 * The published commerce JSON Schemas, served at
 * /pagefront/spec/commerce/{type}/v{version}.json.
 *
 * The source is the frozen store, commerce/schemas/{type}/v{version}.json:
 * one route per file present, each served verbatim, byte for byte. The
 * store is append-only, so every schema URL ever published stays
 * resolvable; a version with no file has no route and answers 404. The
 * editable heads (commerce/spec/{type}.json) are not served: a schema
 * gets a URL when it is released.
 *
 * In production the files are static assets: the media type
 * (application/schema+json) and the open CORS header come from
 * public/_headers. The headers below are what the dev server sends.
 */
const RAW = import.meta.glob('../../../../../../../commerce/schemas/*/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const STORE_PATH = /\/commerce\/schemas\/([a-z]+)\/(v\d+(?:\.\d+)*)\.json$/;

export function getStaticPaths() {
  return Object.entries(RAW).map(([file, body]) => {
    const match = STORE_PATH.exec(file);
    if (match === null) throw new Error(`${file} is not a commerce/schemas/<type>/v<version>.json file`);
    return { params: { schema: match[1], version: match[2] }, props: { body } };
  });
}

export function GET({ props }: { props: { body: string } }) {
  return new Response(props.body, {
    headers: {
      'Content-Type': 'application/schema+json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
