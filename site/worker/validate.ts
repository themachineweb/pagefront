/**
 * The Check endpoint behind the site's Worker (index.ts exports the
 * handler and nothing else: the runtime reads every named export of the
 * entry module as an entrypoint). Static assets serve everything except
 * one route, /pagefront/commerce/validate.json, which returns the checker's
 * result as JSON: for the Check page, whose URL inputs it serves because
 * a page's Link header is not readable cross-origin, and for callers
 * that cannot run a page: AI assistants, CI jobs, scripts. It covers
 * every commerce sheet type the pinned linter bundles a schema for, and
 * the body names the type the sheet was judged as (sheet_type). The two
 * former paths (/pagefront/validate.json and
 * /pagefront/commerce/product/validate.json) keep answering so
 * published instructions that name them still work. Three forms:
 *
 *   GET  ?url=<URL>           fetches the URL: a JSON body is a sheet and
 *                             gets the conformance result; an HTML body
 *                             is a page and gets the page check (see
 *                             page-check.ts): discovery, the hop to the
 *                             sheet, coherence, conformance. A bare
 *                             origin is normalised first (its / is
 *                             fetched and the site's own redirects
 *                             followed; the landing host is the origin)
 *                             and then asked for its entry point
 *                             (/.well-known/pagefront, then the
 *                             Pagefront: line in robots.txt, then the
 *                             DNS TXT record at _pagefront.<domain>,
 *                             resolved over DNS-over-HTTPS); a root
 *                             sheet it declares gets the hop and the
 *                             conformance result, and an origin without
 *                             one is checked as a page
 *   GET  ?sheet=<JSON>        validates the sheet carried in the URL,
 *                             for a draft that is not served yet and a
 *                             caller that can only follow links; the
 *                             edge accepts URLs up to somewhere between
 *                             61 and 71 KB (observed 2026-09-08), so
 *                             sheets beyond about 60 KB encoded need
 *                             the POST form
 *   POST <JSON body>          the same, for callers that can send a body
 *
 * It is the same pipeline as the page (src/lib/validate-model.ts), so
 * the two never disagree.
 *
 * The route is a checker, not a fetcher, and these limits keep it so:
 *
 *   - it returns the report only, never the fetched bytes;
 *   - it fetches https URLs only, without credentials in the URL, and
 *     every URL beyond the submitted one is one the page declared;
 *   - each fetch is bounded in time (FETCH_TIMEOUT_MS) and follows at
 *     most MAX_REDIRECTS redirects; a sheet body is bounded in size
 *     (SHEET_MAX_BYTES); a page is read only to the end of its <head>,
 *     where the declaration lives, and the rest of the body is never
 *     downloaded; the body decides what was fetched (a sheet is JSON
 *     carrying $schema, everything else takes the page path), and the
 *     report shows at most the first bytes of a body whose label and
 *     content disagree;
 *   - calls are rate-limited per target host and in total, through
 *     the rate-limit bindings in wrangler.jsonc (optional at runtime so
 *     local development works without them).
 *
 * A sheet on this site's own hostname (the case studies) is read through
 * the assets binding: a Worker fetching its own public hostname loops
 * back to itself and Cloudflare answers 522/523.
 *
 * Everything else is answered by the assets binding. wrangler.jsonc's
 * run_worker_first lists these three paths, so no other request pays
 * for the Worker.
 */
import { buildResult, type RenderModel } from '../src/lib/validate-model.ts';
import { checkPage, classifyBody, fetchFollowing, labelMismatch, probeEntryPoint, txtRecordValue, type EntryPoint, type Fetcher, type Followed, type Line, type PageCheck, type TxtResolver } from './page-check.ts';

export const VALIDATE_PATH = '/pagefront/commerce/validate.json';
/** The paths the endpoint had before it became the site-wide checker. */
export const FORMER_VALIDATE_PATHS = ['/pagefront/validate.json', '/pagefront/commerce/product/validate.json'];

/** Provisional limits, to be confirmed against real traffic. */
export const FETCH_TIMEOUT_MS = 10_000;
export const SHEET_MAX_BYTES = 1_048_576;

interface RateLimiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Per target host: protects the publisher being validated. */
  VALIDATE_RATE_PER_HOST?: RateLimiter;
  /** In total: protects this site. */
  VALIDATE_RATE_TOTAL?: RateLimiter;
}

export interface ValidateOptions {
  /** Defaults to https only; tests relax it to reach a local server. */
  allowedProtocols?: string[];
  fetchTimeoutMs?: number;
  maxBytes?: number;
  /** This site's host: targets on it are read through the assets binding. */
  selfHost?: string;
  /** Resolves TXT records; defaults to DNS-over-HTTPS (DOH_ENDPOINT). Tests inject one. */
  resolveTxt?: TxtResolver;
}

/**
 * The resolver behind the entry point's DNS step. A Worker has no stub
 * resolver, so TXT records are read over DNS-over-HTTPS in its JSON
 * form (RFC 8484 transport, the JSON API the resolver documents): GET
 * dns-query?name=<name>&type=TXT with Accept: application/dns-json. The
 * answer's Status is the DNS RCODE (0 NOERROR, 3 NXDOMAIN), Answer lists
 * the records with type 16 for TXT, and each record's data carries its
 * character-strings quoted. The request goes through the same fetcher
 * as every other hop, so the timeout applies to it too.
 */
export const DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query';
export function dohTxtResolver(fetcher: Fetcher, endpoint = DOH_ENDPOINT): TxtResolver {
  return async (name) => {
    try {
      const url = `${endpoint}?name=${encodeURIComponent(name)}&type=TXT`;
      const res = await fetcher(url, { headers: { accept: 'application/dns-json' } });
      if (!res.ok) { await res.body?.cancel(); return undefined; }
      const body = (await res.json()) as { Status?: number; Answer?: Array<{ type?: number; data?: string }> };
      if (body.Status === 3) return [];
      if (body.Status !== 0) return undefined;
      return (body.Answer ?? []).filter((a) => a.type === 16 && typeof a.data === 'string').map((a) => txtRecordValue(a.data!));
    } catch {
      return undefined;
    }
  };
}

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'accept, content-type',
};

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'cache-control': 'no-store',
};

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

type Outcome = RenderModel | PageCheck | { kind: 'bad-request'; detail: string } | { kind: 'rate-limited' };

/**
 * Read at most `maxBytes` of a body as text. Returns undefined when the
 * body is larger: the sheet is refused, never truncated and parsed as
 * if complete.
 */
async function readCapped(response: Request | Response, maxBytes: number): Promise<string | undefined> {
  const declared = Number(response.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) return undefined;
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      return undefined;
    }
    chunks.push(value);
  }
  const joined = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
}

/** Where a page's head ends: the declaration cannot come after this. */
const HEAD_END = /<\/head\s*>|<body[\s>]/i;

type Document =
  | { kind: 'page'; head: string; mismatch?: Line }
  | { kind: 'sheet'; text: string }
  | { kind: 'too-large' };

/**
 * Read a fetched URL as the document it is. The body decides, never the
 * Content-Type ("Serving" in core/spec/discovery.md): a body that
 * begins with `<` is a page, read only to the end of its <head> with
 * the rest cancelled, since the declaration lives in the response
 * headers or the head and nowhere else. Any other body is read whole,
 * up to `maxSheetBytes`, and is a sheet when it parses as JSON and
 * carries `$schema`. Everything else goes down the page path too (its
 * headers may still carry a Link), with the label-versus-body finding
 * attached when the Content-Type claimed a sheet. A JSON body beyond the
 * cap is refused rather than truncated.
 */
async function readDocument(response: Response, maxSheetBytes: number, url: string): Promise<Document> {
  const contentType = response.headers.get('content-type');
  const asPage = (head: string): Document => ({ kind: 'page', head, mismatch: labelMismatch(url, contentType, head) });
  if (!response.body) return asPage('');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let mode: 'page' | 'candidate' | undefined;
  let text = '';
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    text += decoder.decode(value, { stream: true });
    if (mode === undefined) {
      const lead = text.trimStart();
      if (lead === '') continue;
      mode = lead.startsWith('<') ? 'page' : 'candidate';
    }
    if (mode === 'page') {
      const end = text.search(HEAD_END);
      if (end >= 0) {
        await reader.cancel();
        return asPage(text.slice(0, end));
      }
    } else if (received > maxSheetBytes) {
      await reader.cancel();
      // A JSON body beyond the cap is refused; anything else is not a sheet and is read as a page from what is in hand.
      return /^\s*[[{]/.test(text) ? { kind: 'too-large' } : asPage(text);
    }
  }
  text += decoder.decode();
  if (mode === 'page') return asPage(text);
  if (classifyBody(text) === 'sheet') return { kind: 'sheet', text };
  return asPage(text);
}

export async function validateSheetUrl(
  raw: string,
  env: Partial<Env>,
  options: ValidateOptions = {}
): Promise<{ status: number; body: Outcome & { sheet_url?: string } }> {
  const allowed = options.allowedProtocols ?? ['https:'];
  const timeoutMs = options.fetchTimeoutMs ?? FETCH_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? SHEET_MAX_BYTES;

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return { status: 400, body: { kind: 'bad-request', detail: 'url is not an absolute URL' } };
  }
  if (!allowed.includes(target.protocol)) {
    return { status: 400, body: { kind: 'bad-request', detail: `url must use ${allowed.join(' or ')}` } };
  }
  if (target.username || target.password) {
    return { status: 400, body: { kind: 'bad-request', detail: 'url must not carry credentials' } };
  }

  const sheet_url = target.href;
  const admit = async (host: string): Promise<boolean> =>
    !env.VALIDATE_RATE_PER_HOST || (await env.VALIDATE_RATE_PER_HOST.limit({ key: host })).success;
  if (env.VALIDATE_RATE_TOTAL && !(await env.VALIDATE_RATE_TOTAL.limit({ key: 'total' })).success) {
    return { status: 429, body: { kind: 'rate-limited', sheet_url } };
  }
  if (!(await admit(target.host))) {
    return { status: 429, body: { kind: 'rate-limited', sheet_url } };
  }

  const headers = {
    accept: 'application/pagefront+json, application/json;q=0.9, text/html;q=0.8',
    'user-agent': 'pagefront-validator (+https://themachineweb.org/pagefront/commerce/validate)',
  };
  // One fetcher for every hop: the assets binding for this site's own
  // host, the network otherwise, each request on its own timeout.
  const fetcher = (url: string, init: RequestInit): Promise<Response> => {
    const withTimeout: RequestInit = { ...init, headers: { ...headers, ...(init.headers as Record<string, string> | undefined) }, signal: AbortSignal.timeout(timeoutMs) };
    const host = new URL(url).host;
    const viaAssets = options.selfHost !== undefined && host === options.selfHost && env.ASSETS;
    return viaAssets ? env.ASSETS!.fetch(new Request(url, withTimeout)) : fetch(url, withTimeout);
  };

  // A bare origin: normalise it, then the entry point ("Entry point" in
  // core/spec/discovery.md). The origin's / is fetched and the site's own
  // redirects followed (http to https, apex to www); the landing host is
  // the origin the carriers are read on, and the TXT name is built from
  // it. A root sheet a carrier declares is followed as the sheet; an
  // origin that declares none is checked as a page below, from the
  // response already in hand, with the entry-point lines carried along.
  let entry: EntryPoint | undefined;
  let followed: Followed | undefined;
  let followError: unknown;
  if (target.pathname === '/' && target.search === '') {
    try {
      followed = await fetchFollowing(sheet_url, {}, fetcher, allowed);
    } catch (error) {
      followError = error;
    }
    const landing = followed ? new URL(followed.finalUrl) : target;
    entry = await probeEntryPoint(landing.origin, fetcher, allowed, readCapped, options.resolveTxt ?? dohTxtResolver(fetcher));
    const hops = followed?.redirects ?? 0;
    entry.lines.unshift({
      check: 'Origin',
      status: 'info',
      detail: followed === undefined
        ? `${landing.origin}; its / could not be fetched, so the submitted origin is used`
        : landing.origin === target.origin
          ? `${landing.origin}, no redirect to another host`
          : `${landing.origin}, reached from ${sheet_url} after ${hops} redirect${hops === 1 ? '' : 's'}; the carriers are read there`,
    });
    if (entry.sheetUrl) {
      const check = await checkPage({
        pageUrl: sheet_url,
        finalUrl: followed?.finalUrl ?? sheet_url,
        redirects: hops,
        response: new Response(null),
        head: '',
        fetcher,
        allowedProtocols: allowed,
        maxSheetBytes: maxBytes,
        readCapped,
        admit,
        entry: entry as EntryPoint & { sheetUrl: string },
      });
      return { status: 200, body: check };
    }
  }

  // A bare origin's entry-point lines travel with whatever outcome follows.
  const withEntry = entry ? { entry_point: entry.lines } : {};
  let response: Response;
  let finalUrl: string;
  let redirects: number;
  try {
    if (followError !== undefined) throw followError;
    ({ response, finalUrl, redirects } = followed ?? await fetchFollowing(sheet_url, {}, fetcher, allowed));
  } catch (error) {
    const detail = (error as Error).name === 'TimeoutError' ? `no response within ${timeoutMs} ms` : ((error as Error).message || 'the URL could not be fetched');
    return { status: 200, body: { kind: 'fetch-error', detail, sheet_url, ...withEntry } };
  }
  if (!response.ok) {
    return { status: 200, body: { kind: 'no-sheet', detail: `HTTP ${response.status}`, sheet_url, ...withEntry } };
  }
  let document: Document;
  try {
    document = await readDocument(response, maxBytes, finalUrl);
  } catch (error) {
    const detail = (error as Error).name === 'TimeoutError' || (error as Error).name === 'AbortError' ? `no response within ${timeoutMs} ms` : 'the response could not be read';
    return { status: 200, body: { kind: 'fetch-error', detail, sheet_url, ...withEntry } };
  }
  if (document.kind === 'too-large') {
    return { status: 200, body: { kind: 'no-sheet', detail: `the response is larger than ${maxBytes} bytes`, sheet_url, ...withEntry } };
  }

  // A page: check what its headers and head declare, and follow it.
  if (document.kind === 'page') {
    const check = await checkPage({
      pageUrl: sheet_url,
      finalUrl,
      redirects,
      response,
      head: document.head,
      mismatch: document.mismatch,
      fetcher,
      allowedProtocols: allowed,
      maxSheetBytes: maxBytes,
      readCapped,
      admit,
    });
    if (entry) check.entry_point = entry.lines;
    return { status: 200, body: check };
  }

  // A sheet by its body: JSON carrying $schema. Its content is never
  // echoed beyond what the report names.
  const result = buildResult(document.text, 'url');
  if (result.kind === 'scope-error') {
    // The declared value is the document's own; keep the echo short.
    result.declared = result.declared.slice(0, 200);
  }
  return { status: 200, body: { ...result, sheet_url, ...withEntry } };
}

/**
 * Validate sheet text the caller supplied itself (the ?sheet= form or a
 * POST body). Nothing is fetched; the total rate limit and the size cap
 * still apply.
 */
export async function validateSheetText(
  text: string | undefined,
  env: Partial<Env>,
  options: ValidateOptions = {}
): Promise<{ status: number; body: Outcome }> {
  const maxBytes = options.maxBytes ?? SHEET_MAX_BYTES;
  if (env.VALIDATE_RATE_TOTAL && !(await env.VALIDATE_RATE_TOTAL.limit({ key: 'total' })).success) {
    return { status: 429, body: { kind: 'rate-limited' } };
  }
  if (text === undefined || new TextEncoder().encode(text).byteLength > maxBytes) {
    return { status: 413, body: { kind: 'bad-request', detail: `the sheet is larger than ${maxBytes} bytes` } };
  }
  const result = buildResult(text, 'paste');
  if (result.kind === 'scope-error') result.declared = result.declared.slice(0, 200);
  return { status: 200, body: result };
}

export async function handle(request: Request, env: Env, options?: ValidateOptions): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname !== VALIDATE_PATH && !FORMER_VALIDATE_PATHS.includes(url.pathname)) return env.ASSETS.fetch(request);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (request.method === 'POST') {
    const text = await readCapped(request, options?.maxBytes ?? SHEET_MAX_BYTES);
    const { status, body } = await validateSheetText(text, env, options);
    return json(body, status);
  }
  if (request.method !== 'GET') {
    return json({ kind: 'bad-request', detail: 'GET or POST only' }, 405);
  }
  const raw = url.searchParams.get('url');
  const inline = url.searchParams.get('sheet');
  if ((raw === null) === (inline === null)) {
    return json({ kind: 'bad-request', detail: 'pass either ?url= (a page or a served sheet) or ?sheet= (the sheet JSON, URL-encoded)' }, 400);
  }
  if (inline !== null) {
    const { status, body } = await validateSheetText(inline, env, options);
    return json(body, status);
  }
  const { status, body } = await validateSheetUrl(raw!, env, { selfHost: url.host, ...options });
  return json(body, status);
}
