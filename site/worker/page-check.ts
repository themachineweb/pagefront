/**
 * The page check behind the Check endpoint: given a product page's
 * response, read the sheet declaration the page carries, fetch the
 * sheet it declares, and compare the two. Pure functions where
 * possible, so the parsers are unit-tested without a network.
 *
 * What is checked, and in what order, follows "Discovery" in
 * commerce/spec/product.md: the sheet link is selected by
 * rel="alternate" together with type="application/pagefront+json";
 * the Link response header is the primary carrier and the <link>
 * element in the page head the fallback; where both are present the
 * header is authoritative; a sheet served as application/json is still
 * a sheet, and a response is a sheet by its body alone (JSON carrying
 * $schema), whatever its Content-Type says. Nothing here constructs a
 * sheet URL: every URL fetched is one the page declared.
 */
import { buildResult, type RenderModel } from '../src/lib/validate-model.ts';

export const SHEET_MEDIA_TYPE = 'application/pagefront+json';
export const MAX_REDIRECTS = 3;

export type LineStatus = 'pass' | 'warning' | 'fail' | 'info';
export interface Line {
  check: string;
  status: LineStatus;
  detail?: string;
  /** What the publisher does about a failing line, where the check has one answer. */
  remediation?: string;
}

export interface LinkRef {
  href: string;
  params: Record<string, string>;
}

export interface PageCheck {
  kind: 'page-check';
  page_url: string;
  final_url: string;
  redirects: number;
  /** Present when the submitted URL was a bare origin: the entry-point carriers. */
  entry_point?: Line[];
  discovery: Line[];
  hop: Line[];
  coherence: Line[];
  /** The conformance result for the declared sheet; null when no sheet was reached. */
  conformance: RenderModel | null;
  sheet_url?: string;
}

const pass = (check: string, detail?: string): Line => ({ check, status: 'pass', detail });
const warning = (check: string, detail?: string): Line => ({ check, status: 'warning', detail });
const fail = (check: string, detail?: string): Line => ({ check, status: 'fail', detail });
const info = (check: string, detail?: string): Line => ({ check, status: 'info', detail });
/** A check that had nothing to look at: reported as information, never as a pass. */
const skip = info;

/**
 * Parse a Link header field value (RFC 8288). Several headers joined
 * by commas, or one header with several links, parse the same way;
 * commas inside <…> and inside quoted parameter values do not split.
 */
export function parseLinkHeader(value: string | null): LinkRef[] {
  if (!value) return [];
  const refs: LinkRef[] = [];
  let i = 0;
  const n = value.length;
  while (i < n) {
    while (i < n && (value[i] === ' ' || value[i] === ',' || value[i] === '\t')) i++;
    if (i >= n || value[i] !== '<') {
      // Not a link-value: skip to the next comma outside quotes.
      let quoted = false;
      while (i < n && (quoted || value[i] !== ',')) { if (value[i] === '"') quoted = !quoted; i++; }
      continue;
    }
    const close = value.indexOf('>', i);
    if (close < 0) break;
    const href = value.slice(i + 1, close).trim();
    i = close + 1;
    const params: Record<string, string> = {};
    while (i < n) {
      while (i < n && (value[i] === ' ' || value[i] === '\t')) i++;
      if (value[i] === ',') { i++; break; }
      if (value[i] !== ';') { i++; continue; }
      i++;
      while (i < n && (value[i] === ' ' || value[i] === '\t')) i++;
      let name = '';
      while (i < n && /[^=;,\s]/.test(value[i])) name += value[i++];
      while (i < n && (value[i] === ' ' || value[i] === '\t')) i++;
      let val = '';
      if (value[i] === '=') {
        i++;
        while (i < n && (value[i] === ' ' || value[i] === '\t')) i++;
        if (value[i] === '"') {
          i++;
          while (i < n && value[i] !== '"') { if (value[i] === '\\' && i + 1 < n) i++; val += value[i++]; }
          i++;
        } else {
          while (i < n && value[i] !== ';' && value[i] !== ',') val += value[i++];
          val = val.trim();
        }
      }
      const key = name.toLowerCase();
      // RFC 8288: the first occurrence of a parameter wins.
      if (key && !(key in params)) params[key] = val;
    }
    refs.push({ href, params });
  }
  return refs;
}

/**
 * The <link> elements in the page head, as LinkRefs. The caller hands
 * over the head (the endpoint stops reading the page there); anything
 * from </head> or <body> on is ignored in case it was handed more. A
 * regular expression is enough for void elements with quoted
 * attributes, which is what a template emits; this is a checker, not
 * a browser.
 */
export function parseHeadLinks(html: string): LinkRef[] {
  const headEnd = html.search(/<\/head\s*>|<body[\s>]/i);
  const head = headEnd < 0 ? html : html.slice(0, headEnd);
  const refs: LinkRef[] = [];
  for (const tag of head.matchAll(/<link\b([^>]*)>/gi)) {
    const params: Record<string, string> = {};
    for (const attr of tag[1].matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      const key = attr[1].toLowerCase();
      if (!(key in params)) params[key] = (attr[2] ?? attr[3] ?? attr[4] ?? '').trim();
    }
    const href = params.href;
    if (href === undefined) continue;
    delete params.href;
    refs.push({ href, params });
  }
  return refs;
}

const relTokens = (ref: LinkRef): string[] => (ref.params.rel ?? '').toLowerCase().split(/\s+/).filter(Boolean);
const mediaType = (value: string | undefined): string => (value ?? '').split(';')[0].trim().toLowerCase();

/** rel="alternate" together with the sheet media type: the spec's selector. */
export const isSheetLink = (ref: LinkRef): boolean =>
  relTokens(ref).includes('alternate') && mediaType(ref.params.type) === SHEET_MEDIA_TYPE;

/** An alternate whose type is JSON of some other kind: the near miss worth naming. */
const isJsonAlternate = (ref: LinkRef): boolean =>
  relTokens(ref).includes('alternate') && /\bjson\b/.test(mediaType(ref.params.type)) && !isSheetLink(ref);

/**
 * What a fetched body is, read from the body alone ("Serving" in
 * core/spec/discovery.md): a sheet is a body that parses as JSON and
 * carries `$schema`; the Content-Type is advisory in both directions.
 * The other kinds name what the body is instead, for the finding.
 */
export type BodyKind = 'sheet' | 'HTML' | 'not JSON' | 'JSON without $schema';
export function classifyBody(text: string): BodyKind {
  if (/^\s*</.test(text)) return 'HTML';
  try {
    const parsed = JSON.parse(text) as unknown;
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) && typeof (parsed as Record<string, unknown>).$schema === 'string'
      ? 'sheet'
      : 'JSON without $schema';
  } catch {
    return 'not JSON';
  }
}

/** The Content-Types that claim a JSON body. */
const JSON_LABELS = [SHEET_MEDIA_TYPE, 'application/json'];

/**
 * The finding for a response whose Content-Type claims a sheet while
 * its body is something else: a server that echoes the Accept header
 * does exactly this. Undefined when the label and the body agree, or
 * when the label never claimed JSON. The first bytes are the one place
 * the report shows fetched content, and only this much of it.
 */
export function labelMismatch(url: string, contentType: string | null | undefined, text: string, kind: BodyKind = classifyBody(text)): Line | undefined {
  const served = mediaType(contentType ?? undefined);
  if (kind === 'sheet' || !JSON_LABELS.includes(served)) return undefined;
  const firstBytes = text.trim().replace(/\s+/g, ' ').slice(0, 40);
  const echo = kind === 'JSON without $schema' ? '' : ' The server appears to echo the Accept header.';
  return {
    check: 'Content-Type matches the body',
    status: 'warning',
    detail: `Response at ${url} is labelled ${served} but the body is ${kind} (begins with \`${firstBytes}\`).${echo}`,
    remediation: 'Serve HTML with its own Content-Type regardless of Accept, or implement negotiation properly: return the sheet, or a 303 to it, only when it exists.',
  };
}

function resolve(href: string, base: string): string | undefined {
  try { return new URL(href, base).href; } catch { return undefined; }
}

/** A URL for comparison: resolved, without its fragment. */
function comparable(href: string, base: string): string | undefined {
  try {
    const url = new URL(href, base);
    url.hash = '';
    return url.href;
  } catch {
    return undefined;
  }
}

/**
 * robots.txt (RFC 9309), the part a checker needs: does the group for
 * user agent `*` allow this path? Longest match wins, allow wins a tie,
 * `*` and `$` in patterns, a missing or empty group allows everything.
 */
export function robotsAllows(robots: string, path: string, agent = '*'): boolean {
  type Rule = { allow: boolean; pattern: string };
  const groups: { agents: string[]; rules: Rule[] }[] = [];
  let current: { agents: string[]; rules: Rule[] } | null = null;
  let lastWasAgent = false;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    if (!line) continue;
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const field = m[1].toLowerCase();
    const value = m[2].trim();
    if (field === 'user-agent') {
      if (!lastWasAgent || !current) { current = { agents: [], rules: [] }; groups.push(current); }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((field === 'allow' || field === 'disallow') && current) {
      lastWasAgent = false;
      if (value === '') continue;
      current.rules.push({ allow: field === 'allow', pattern: value });
    } else {
      lastWasAgent = false;
    }
  }
  const wanted = agent.toLowerCase();
  const group = groups.find((g) => g.agents.includes(wanted)) ?? groups.find((g) => g.agents.includes('*'));
  if (!group) return true;
  const matches = (pattern: string): number | null => {
    const anchored = pattern.endsWith('$');
    const body = anchored ? pattern.slice(0, -1) : pattern;
    const re = new RegExp('^' + body.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + (anchored ? '$' : ''));
    return re.test(path) ? body.length : null;
  };
  let best: { allow: boolean; length: number } | null = null;
  for (const rule of group.rules) {
    const length = matches(rule.pattern);
    if (length === null) continue;
    if (!best || length > best.length || (length === best.length && rule.allow && !best.allow)) {
      best = { allow: rule.allow, length };
    }
  }
  return best ? best.allow : true;
}

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

/** The `Pagefront:` line in a robots.txt: the root Sheet's absolute URL, or undefined. */
export function robotsPagefrontLine(robots: string): string | undefined {
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const m = /^pagefront\s*:\s*(\S+)\s*$/i.exec(line);
    if (m) return m[1];
  }
  return undefined;
}

/**
 * The character-strings of one TXT record as a DNS-over-HTTPS JSON
 * answer renders them: each string in double quotes, several strings
 * separated by a space, `"` and `\` escaped with a backslash. Returns
 * the record's value with the strings concatenated (RFC 7208 section
 * 3.3 reads a multi-string TXT record that way). A value without quotes
 * is returned trimmed, as it is.
 */
export function txtRecordValue(data: string): string {
  const trimmed = data.trim();
  if (!trimmed.startsWith('"')) return trimmed;
  let out = '';
  let inside = false;
  for (let i = 0; i < trimmed.length; i++) {
    const c = trimmed[i];
    if (inside) {
      if (c === '\\' && i + 1 < trimmed.length) { out += trimmed[++i]; continue; }
      if (c === '"') { inside = false; continue; }
      out += c;
    } else if (c === '"') {
      inside = true;
    }
  }
  return out;
}

/**
 * Resolves the TXT records of a name. Returns the records' values, an
 * empty array when the name has none, and undefined when resolution
 * itself failed, so that the probe can say which.
 */
export type TxtResolver = (name: string) => Promise<string[] | undefined>;

export type EntryCarrier = 'well-known' | 'robots' | 'dns';

export interface EntryPoint {
  lines: Line[];
  /** The origin the carriers were read on: the host reached after the site's own redirects for `/`. */
  origin: string;
  /** The root Sheet's URL, when a carrier declared one. */
  sheetUrl?: string;
  carrier?: EntryCarrier;
}

/** The carrier, as the report names it. */
export function describeCarrier(carrier: EntryCarrier, origin: string): string {
  if (carrier === 'robots') return 'the Pagefront: line in robots.txt';
  if (carrier === 'dns') return `the TXT record at _pagefront.${new URL(origin).hostname}`;
  return '/.well-known/pagefront';
}

/**
 * The entry point of an origin ("Entry point" in core/spec/discovery.md):
 * `/.well-known/pagefront`, then the `Pagefront:` line in `/robots.txt`,
 * then the TXT record at `_pagefront.<domain>`. All three are read; the
 * well-known URI is the one tried first, so its answer is the one
 * followed when more than one declares a root. None present is
 * information, never a finding: a publisher is not required to provide an
 * entry point. `origin` is the normalised one: the host reached after the
 * site's own redirects for `/`. The well-known URI and the robots line
 * resolve on that origin; a pointer to another host fails and is not
 * followed. A TXT record is the one carrier that may name a root on
 * another host ("Delegation by DNS"); the report says so and follows it.
 */
export async function probeEntryPoint(origin: string, fetcher: Fetcher, allowedProtocols: string[], readCapped: (r: Response, n: number) => Promise<string | undefined>, resolveTxt: TxtResolver): Promise<EntryPoint> {
  const lines: Line[] = [];
  const result: EntryPoint = { lines, origin };
  const originHost = new URL(origin).host;
  const wellKnownUrl = new URL('/.well-known/pagefront', origin).href;
  const offOrigin = (carrier: string, url: string): Line => ({
    check: carrier === '/.well-known/pagefront' ? '/.well-known/pagefront declares the root sheet' : 'robots.txt declares the root sheet',
    status: 'fail',
    detail: `Entry point at ${carrier} points to ${new URL(url).host}; the well-known URI and the robots.txt line must resolve on the origin that serves them.`,
    remediation: `Serve the root sheet on ${origin}, or publish the pointer as a _pagefront DNS TXT record, the one carrier that may delegate to another host.`,
  });
  const absolute = (href: string, base: string): string | undefined => {
    const u = resolve(href, base);
    if (!u) return undefined;
    try { return allowedProtocols.includes(new URL(u).protocol) ? u : undefined; } catch { return undefined; }
  };

  let wellKnown: string | undefined;
  try {
    const res = await fetcher(wellKnownUrl, { headers: { accept: `${SHEET_MEDIA_TYPE}, application/json;q=0.9` }, redirect: 'manual' });
    const location = res.headers.get('location');
    if ([301, 302, 303, 307, 308].includes(res.status) && location) {
      wellKnown = absolute(location, wellKnownUrl);
      if (!wellKnown) {
        lines.push(fail('/.well-known/pagefront declares the root sheet', `HTTP ${res.status} to ${location}, which is not an absolute URL on an allowed protocol`));
      } else if (new URL(wellKnown).host !== originHost) {
        lines.push(offOrigin('/.well-known/pagefront', wellKnown));
        wellKnown = undefined;
      } else if (res.status === 303) {
        lines.push(pass('/.well-known/pagefront declares the root sheet', `303 See Other to ${wellKnown}`));
      } else {
        lines.push(warning('/.well-known/pagefront declares the root sheet', `HTTP ${res.status} to ${wellKnown}; the spec says 303 See Other`));
      }
      await res.body?.cancel();
    } else if (res.ok) {
      const served = mediaType(res.headers.get('content-type') ?? undefined);
      if (served === SHEET_MEDIA_TYPE || served === 'application/json') {
        wellKnown = wellKnownUrl;
        lines.push(pass('/.well-known/pagefront declares the root sheet', `serves the root sheet directly as ${served}; a 303 redirect is preferred, so that the sheet has one address`));
      } else {
        lines.push(fail('/.well-known/pagefront declares the root sheet', `HTTP ${res.status} with Content-Type ${served || 'absent'}; expected a 303 to the root sheet or the sheet itself`));
      }
      await res.body?.cancel();
    } else {
      lines.push(info('/.well-known/pagefront declares the root sheet', `not present (HTTP ${res.status})`));
      await res.body?.cancel();
    }
  } catch (error) {
    lines.push(info('/.well-known/pagefront declares the root sheet', `could not be read (${(error as Error).message || 'fetch failed'})`));
  }

  let fromRobots: string | undefined;
  try {
    const robotsUrl = new URL('/robots.txt', origin).href;
    const res = await fetcher(robotsUrl, { headers: { accept: 'text/plain' } });
    if (res.status === 404 || res.status === 410) {
      lines.push(info('robots.txt declares the root sheet', 'no robots.txt'));
    } else if (!res.ok) {
      lines.push(info('robots.txt declares the root sheet', `robots.txt answered HTTP ${res.status}`));
    } else {
      const body = (await readCapped(res, 512 * 1024)) ?? '';
      const value = robotsPagefrontLine(body);
      if (value === undefined) {
        lines.push(info('robots.txt declares the root sheet', 'no Pagefront: line'));
      } else {
        fromRobots = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? absolute(value, robotsUrl) : undefined;
        if (fromRobots && new URL(fromRobots).host !== originHost) {
          lines.push(offOrigin('the robots.txt Pagefront: line', fromRobots));
          fromRobots = undefined;
        } else {
          lines.push(fromRobots
            ? pass('robots.txt declares the root sheet', `Pagefront: ${fromRobots}`)
            : fail('robots.txt declares the root sheet', `Pagefront: ${value}; the value must be the root sheet's absolute URL`));
        }
      }
    }
  } catch {
    lines.push(info('robots.txt declares the root sheet', 'robots.txt could not be read'));
  }

  // DNS: the TXT record at _pagefront.<domain>. The record is a
  // statement by the domain's controller and may delegate the root to
  // another host; that is reported as what it is, never as a finding.
  let fromDns: string | undefined;
  const txtName = `_pagefront.${new URL(origin).hostname}`;
  const txtCheck = `DNS TXT record at ${txtName} declares the root sheet`;
  const isAbsolute = (value: string) => /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
  try {
    const records = await resolveTxt(txtName);
    if (records === undefined) {
      lines.push(info(txtCheck, 'could not be resolved'));
    } else if (records.length === 0) {
      lines.push(info(txtCheck, `no record at ${txtName}`));
    } else {
      const values = records.map((r) => r.trim());
      const first = values.find((v) => isAbsolute(v) && absolute(v, origin) !== undefined);
      fromDns = first !== undefined ? absolute(first, origin) : undefined;
      const several = values.length > 1 ? `; ${values.length} records, the first well-formed one is used` : '';
      if (!fromDns) {
        lines.push(fail(txtCheck, `${values[0]}; the value must be the root sheet's absolute URL${several}`));
      } else {
        const host = new URL(fromDns).host;
        const where = host === new URL(origin).host ? '' : `; delegated to ${host}`;
        lines.push(pass(txtCheck, `${fromDns}${where}${several}`));
      }
    }
  } catch {
    lines.push(info(txtCheck, 'could not be resolved'));
  }

  const declared: Array<[string, string]> = [];
  if (wellKnown) declared.push(['well-known', wellKnown]);
  if (fromRobots) declared.push(['robots.txt', fromRobots]);
  if (fromDns) declared.push(['DNS', fromDns]);
  if (declared.length > 1) {
    const urls = new Set(declared.map(([, url]) => url));
    lines.push(urls.size === 1
      ? pass('The carriers name the same root sheet', declared[0][1])
      : warning('The carriers name the same root sheet', `${declared.map(([c, url]) => `${c}: ${url}`).join('; ')}; ${declared[0][0] === 'well-known' ? 'the well-known URI' : declared[0][0]} is tried first and was followed`));
  }
  if (wellKnown) {
    result.sheetUrl = wellKnown;
    result.carrier = 'well-known';
  } else if (fromRobots) {
    result.sheetUrl = fromRobots;
    result.carrier = 'robots';
  } else if (fromDns) {
    result.sheetUrl = fromDns;
    result.carrier = 'dns';
  } else {
    lines.push(info('Entry point', 'no carrier declares a root sheet; the origin\'s page is checked as a page'));
  }
  return result;
}

export interface Followed {
  response: Response;
  finalUrl: string;
  redirects: number;
}

/**
 * Fetch with at most MAX_REDIRECTS redirects, each resolved against the
 * URL that issued it and checked against the allowed protocols. Throws
 * on the fourth redirect, a redirect without Location, or a disallowed
 * protocol; the caller turns that into a line.
 */
export async function fetchFollowing(
  url: string,
  init: RequestInit,
  fetcher: Fetcher,
  allowedProtocols: string[],
  maxRedirects = MAX_REDIRECTS
): Promise<Followed> {
  let current = url;
  for (let redirects = 0; ; redirects++) {
    const response = await fetcher(current, { ...init, redirect: 'manual' });
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return { response, finalUrl: current, redirects };
    }
    const location = response.headers.get('location');
    if (!location) throw new Error(`HTTP ${response.status} without a Location header`);
    if (redirects >= maxRedirects) throw new Error(`more than ${maxRedirects} redirects`);
    const next = resolve(location, current);
    if (!next) throw new Error('a redirect to an unparsable URL');
    if (!allowedProtocols.includes(new URL(next).protocol)) throw new Error('a redirect to a disallowed protocol');
    current = next;
  }
}

export interface PageCheckInput {
  /** The URL the caller submitted. */
  pageUrl: string;
  /** Where the page actually came from, after its own redirects. */
  finalUrl: string;
  redirects: number;
  response: Response;
  /** The page's <head>, as far as the endpoint read it. */
  head: string;
  fetcher: Fetcher;
  allowedProtocols: string[];
  maxSheetBytes: number;
  readCapped: (response: Response, maxBytes: number) => Promise<string | undefined>;
  /** Called before the sheet and robots.txt fetches; false means rate-limited. */
  admit?: (host: string) => Promise<boolean>;
  /** Set when the sheet was reached through the entry point rather than a page's carriers. */
  entry?: EntryPoint & { sheetUrl: string };
  /** The finding for a page response labelled as a sheet, when the caller found one. */
  mismatch?: Line;
}

export async function checkPage(input: PageCheckInput): Promise<PageCheck> {
  const { pageUrl, finalUrl, redirects, response, head, entry } = input;
  const discovery: Line[] = [];
  const hop: Line[] = [];
  const coherence: Line[] = [];
  const result: PageCheck = { kind: 'page-check', page_url: pageUrl, final_url: finalUrl, redirects, discovery, hop, coherence, conformance: null };
  if (entry) result.entry_point = entry.lines;
  if (input.mismatch) discovery.push(input.mismatch);

  // Discovery: the two carriers, read as the spec selects them. A sheet
  // reached through the entry point has no page to read them from.
  const headerRefs = entry ? [] : parseLinkHeader(response.headers.get('link'));
  const headRefs = entry ? [] : parseHeadLinks(head);
  if (entry) {
    discovery.push(info('Page carriers', `not read: the root sheet was reached through ${describeCarrier(entry.carrier ?? 'well-known', entry.origin)}`));
  }
  const headerSheet = headerRefs.filter(isSheetLink);
  const headSheet = headRefs.filter(isSheetLink);
  const headerJson = headerRefs.filter(isJsonAlternate);
  const headJson = headRefs.filter(isJsonAlternate);

  const describe = (refs: LinkRef[]) => refs.map((r) => r.href).join(', ');
  let headerUrl: string | undefined;
  let headUrl: string | undefined;
  if (!entry) {
  discovery.push(headerSheet.length > 0
    ? pass('Link response header declares the sheet', `rel="alternate"; type="${SHEET_MEDIA_TYPE}": ${describe(headerSheet)}`)
    : fail('Link response header declares the sheet', headerJson.length > 0
      ? `an alternate link is present with type "${mediaType(headerJson[0].params.type)}"; the sheet's type is "${SHEET_MEDIA_TYPE}"`
      : headerRefs.length > 0 ? 'the header carries no alternate link of the sheet media type' : 'no Link header'));
  discovery.push(headSheet.length > 0
    ? pass('<link> element in the page head declares the sheet', describe(headSheet))
    : fail('<link> element in the page head declares the sheet', headJson.length > 0
      ? `an alternate link is present with type "${mediaType(headJson[0].params.type)}"; the sheet's type is "${SHEET_MEDIA_TYPE}"`
      : 'no <link rel="alternate" type="application/pagefront+json"> in the head'));
  discovery.push(headerSheet.length > 0 && headSheet.length > 0
    ? pass('Both carriers present (recommended)')
    : headerSheet.length + headSheet.length === 0
      ? fail('Both carriers present (recommended)', 'neither carrier declares the sheet')
      : warning('Both carriers present (recommended)', 'one carrier declares the sheet; the spec recommends both'));

  const anySheet = headerSheet.length > 0 || headSheet.length > 0;
  const nearMiss = headerJson.length > 0 || headJson.length > 0;
  discovery.push(anySheet
    ? pass(`type="${SHEET_MEDIA_TYPE}" on the declaration`)
    : nearMiss
      ? fail(`type="${SHEET_MEDIA_TYPE}" on the declaration`, 'the alternate link found carries another type; consumers select by rel and type together')
      : skip(`type="${SHEET_MEDIA_TYPE}" on the declaration`, 'no declaration to check'));

  const counts = `header: ${headerSheet.length}, head: ${headSheet.length}`;
  discovery.push(headerSheet.length > 1 || headSheet.length > 1
    ? fail('Exactly one such link per carrier', `${counts}; a page declares at most one sheet link, and a consumer cannot choose between two`)
    : anySheet
      ? pass('Exactly one such link per carrier', counts)
      : skip('Exactly one such link per carrier', 'no declaration to check'));
  discovery.push(info('Selection used rel and type only', `rel="alternate" together with type="${SHEET_MEDIA_TYPE}"; title and href shape were not consulted`));

  headerUrl = headerSheet[0] ? resolve(headerSheet[0].href, finalUrl) : undefined;
  headUrl = headSheet[0] ? resolve(headSheet[0].href, finalUrl) : undefined;
  const declared = [headerSheet[0]?.href, headSheet[0]?.href].filter((h): h is string => h !== undefined);
  if (declared.length === 0) {
    discovery.push(skip('href is absolute, or resolves to an absolute URL', 'no declaration to check'));
  } else if ((headerSheet[0] && !headerUrl) || (headSheet[0] && !headUrl)) {
    discovery.push(fail('href is absolute, or resolves to an absolute URL', `could not resolve: ${declared.join(', ')}`));
  } else {
    const absolute = declared.every((h) => /^https?:\/\//i.test(h));
    discovery.push(pass('href is absolute, or resolves to an absolute URL', absolute ? 'absolute' : `relative, resolved against ${finalUrl}`));
  }

  if (headerUrl && headUrl) {
    discovery.push(headerUrl === headUrl
      ? pass('Header and element point at the same URL', headerUrl)
      : fail('Header and element point at the same URL', `header: ${headerUrl}; element: ${headUrl}; the header is authoritative`));
  } else {
    discovery.push(skip('Header and element point at the same URL', anySheet ? 'only one carrier present' : 'no declaration to check'));
  }

  }

  // The hop: the header is authoritative where both are present.
  const sheetUrl = entry ? entry.sheetUrl : (headerUrl ?? headUrl);
  if (!sheetUrl) {
    hop.push(skip('Sheet URL fetches', 'no sheet declared'));
    coherence.push(skip('canonical_url equals the page URL', 'no sheet reached'));
    coherence.push(skip('sheet_url, where present, equals the URL the sheet was fetched from', 'no sheet reached'));
    return result;
  }
  result.sheet_url = sheetUrl;

  let sheetProtocolOk = true;
  try {
    sheetProtocolOk = input.allowedProtocols.includes(new URL(sheetUrl).protocol);
  } catch {
    sheetProtocolOk = false;
  }
  if (!sheetProtocolOk) {
    hop.push(fail('Sheet URL fetches', `${sheetUrl} does not use ${input.allowedProtocols.join(' or ')}`));
    coherence.push(skip('canonical_url equals the page URL', 'no sheet reached'));
    coherence.push(skip('sheet_url, where present, equals the URL the sheet was fetched from', 'no sheet reached'));
    return result;
  }

  const sheetHost = new URL(sheetUrl).host;
  const pageHost = new URL(finalUrl).host;
  if (input.admit && sheetHost !== pageHost && !(await input.admit(sheetHost))) {
    hop.push(fail('Sheet URL fetches', `rate limit reached for ${sheetHost}; try again in a minute`));
    coherence.push(skip('canonical_url equals the page URL', 'no sheet reached'));
    coherence.push(skip('sheet_url, where present, equals the URL the sheet was fetched from', 'no sheet reached'));
    return result;
  }

  const init: RequestInit = { headers: { accept: `${SHEET_MEDIA_TYPE}, application/json;q=0.9` } };
  let followed: Followed;
  try {
    followed = await fetchFollowing(sheetUrl, init, input.fetcher, input.allowedProtocols);
  } catch (error) {
    hop.push(fail('Sheet URL fetches', (error as Error).name === 'TimeoutError' ? 'no response in time' : (error as Error).message || 'the URL could not be fetched'));
    coherence.push(skip('canonical_url equals the page URL', 'no sheet reached'));
    coherence.push(skip('sheet_url, where present, equals the URL the sheet was fetched from', 'no sheet reached'));
    return result;
  }
  const { response: sheetResponse, finalUrl: sheetFinalUrl } = followed;
  const redirectNote = followed.redirects === 0 ? 'no redirects' : `${followed.redirects} redirect${followed.redirects === 1 ? '' : 's'} followed, now at ${sheetFinalUrl}`;
  hop.push(sheetResponse.ok
    ? pass('Sheet URL fetches', `HTTP ${sheetResponse.status}; ${redirectNote}`)
    : fail('Sheet URL fetches', `HTTP ${sheetResponse.status}; ${redirectNote}`));

  const served = mediaType(sheetResponse.headers.get('content-type') ?? undefined);
  hop.push(served === SHEET_MEDIA_TYPE
    ? pass('Content-Type is the sheet media type', served)
    : served === 'application/json'
      ? warning('Content-Type is the sheet media type', `served as application/json, which consumers accept; ${SHEET_MEDIA_TYPE} is recommended where you control headers`)
      : fail('Content-Type is the sheet media type', served ? `served as ${served}` : 'no Content-Type header'));

  const text = sheetResponse.ok ? await input.readCapped(sheetResponse, input.maxSheetBytes) : undefined;
  if (sheetResponse.ok) {
    hop.push(text === undefined
      ? fail('Size', `larger than ${input.maxSheetBytes} bytes`)
      : pass('Size', `${new TextEncoder().encode(text).byteLength} bytes`));
    // The body decides what was fetched; a sheet label on something else is the echo finding.
    const mismatch = text !== undefined ? labelMismatch(sheetFinalUrl, sheetResponse.headers.get('content-type'), text) : undefined;
    if (mismatch) hop.push(mismatch);
  } else {
    hop.push(skip('Size', 'the sheet did not fetch'));
  }

  // robots.txt on the sheet's origin.
  try {
    const robotsUrl = new URL('/robots.txt', sheetFinalUrl).href;
    const robots = await input.fetcher(robotsUrl, { headers: { accept: 'text/plain' } });
    if (robots.status === 404 || robots.status === 410) {
      hop.push(pass('Not blocked by robots.txt', 'no robots.txt'));
    } else if (!robots.ok) {
      hop.push(skip('Not blocked by robots.txt', `robots.txt answered HTTP ${robots.status}`));
    } else {
      const body = (await input.readCapped(robots, 512 * 1024)) ?? '';
      const path = new URL(sheetFinalUrl).pathname + new URL(sheetFinalUrl).search;
      hop.push(robotsAllows(body, path)
        ? pass('Not blocked by robots.txt')
        : fail('Not blocked by robots.txt', `a Disallow rule for user agent * matches ${path}`));
    }
  } catch {
    hop.push(skip('Not blocked by robots.txt', 'robots.txt could not be read'));
  }

  const acao = sheetResponse.headers.get('access-control-allow-origin');
  hop.push(acao === '*'
    ? pass('Access-Control-Allow-Origin present on the sheet response', 'Access-Control-Allow-Origin: *')
    : acao
      ? warning('Access-Control-Allow-Origin present on the sheet response', `Access-Control-Allow-Origin: ${acao}; browser-based consumers on other origins cannot read the sheet`)
      : warning('Access-Control-Allow-Origin present on the sheet response', 'absent; browser-based consumers cannot read the sheet cross-origin'));

  if (text === undefined) {
    coherence.push(skip('canonical_url equals the page URL', 'no sheet reached'));
    coherence.push(skip('sheet_url, where present, equals the URL the sheet was fetched from', 'no sheet reached'));
    return result;
  }

  // Coherence: the envelope against where things actually were. The
  // page's own <link rel="canonical">, when it has one, says which URL
  // is the canonical page; the submitted URL is then only the way in.
  const pageCanonical = headRefs.filter((r) => relTokens(r).includes('canonical')).map((r) => comparable(r.href, finalUrl)).find((u): u is string => u !== undefined);
  const pageUrlForComparison = comparable(finalUrl, finalUrl) ?? finalUrl;
  const canonicalPage = pageCanonical ?? pageUrlForComparison;
  const viaNote = redirects > 0 ? ` (after ${redirects} redirect${redirects === 1 ? '' : 's'})` : '';
  if (pageCanonical !== undefined && pageCanonical !== pageUrlForComparison) {
    coherence.push(info('Submitted URL is the canonical page', `the page names ${pageCanonical} as canonical; you submitted ${pageUrlForComparison}${viaNote}; canonical_url is compared with the page's canonical`));
  }
  let envelope: Record<string, unknown> | null = null;
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) envelope = parsed as Record<string, unknown>;
  } catch {
    envelope = null;
  }
  if (!envelope) {
    coherence.push(fail('canonical_url equals the page URL', 'the sheet is not a JSON object'));
    coherence.push(skip('sheet_url, where present, equals the URL the sheet was fetched from', 'the sheet is not a JSON object'));
  } else {
    const canonical = envelope.canonical_url;
    if (typeof canonical !== 'string') {
      coherence.push(fail('canonical_url equals the page URL', 'canonical_url is missing'));
    } else if (entry) {
      coherence.push(info('canonical_url equals the page URL', `no page was submitted; the root sheet names ${canonical} as its page`));
    } else {
      const same = comparable(canonical, finalUrl) === canonicalPage;
      coherence.push(same
        ? pass('canonical_url equals the page URL', pageCanonical !== undefined ? `${canonical}, the page's declared canonical` : canonical)
        : fail('canonical_url equals the page URL', pageCanonical !== undefined
          ? `canonical_url: ${canonical}; the page names ${pageCanonical} as canonical`
          : `canonical_url: ${canonical}; page: ${pageUrlForComparison}${viaNote}; the page declares no rel="canonical"`));
    }
    const declaredSheetUrl = envelope.sheet_url;
    if (declaredSheetUrl === undefined) {
      coherence.push(info('sheet_url, where present, equals the URL the sheet was fetched from', 'sheet_url is not declared; it is optional'));
    } else if (typeof declaredSheetUrl !== 'string') {
      coherence.push(info('sheet_url, where present, equals the URL the sheet was fetched from', 'sheet_url is not a string; the schema reports it under Conformance'));
    } else {
      coherence.push(resolve(declaredSheetUrl, sheetFinalUrl) === sheetFinalUrl
        ? pass('sheet_url, where present, equals the URL the sheet was fetched from', declaredSheetUrl)
        : info('sheet_url, where present, equals the URL the sheet was fetched from', `sheet_url: ${declaredSheetUrl}; fetched from: ${sheetFinalUrl}; sheet_url is informational and the page's declaration is authoritative`));
    }
  }

  // Conformance: the existing pipeline, unchanged.
  const conformance = buildResult(text, 'url');
  if (conformance.kind === 'scope-error') conformance.declared = conformance.declared.slice(0, 200);
  result.conformance = conformance;
  return result;
}
