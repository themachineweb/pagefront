/**
 * The Pagefront Property Registry, served at
 * /pagefront/commerce/registry/properties.json, the address the Product
 * Sheet spec states under "Variant dimensions" and the file's own $id.
 *
 * The source is commerce/spec/registry/properties.json, served verbatim.
 * The registry is versioned inside the file (registry_version) and is
 * additive only, so one URL carries the current version; consumers that
 * want a fixed snapshot pin a copy, as the spec allows.
 *
 * In production the file is a static asset: the media type and the open
 * CORS header come from public/_headers. The headers below are what the
 * dev server sends.
 */
import body from '../../../../../../commerce/spec/registry/properties.json?raw';

export function GET() {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
