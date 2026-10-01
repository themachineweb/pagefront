/**
 * The validator endpoint behind the site's Worker (index.ts exports the
 * handler and nothing else: the runtime reads every named export of the
 * entry module as an entrypoint). Static assets serve everything except
 * one route, /pagefront/commerce/product/validate.json, which returns
 * the validator's result as JSON for callers that cannot run the
 * browser page: AI assistants, CI jobs, scripts. Three forms:
 *
 *   GET  ?url=<sheet URL>     fetches a published sheet and validates it
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
 * The route is a validator, not a fetcher, and these limits keep it so:
 *
 *   - it returns the report only, never the fetched bytes;
 *   - it fetches https URLs only, without credentials in the URL;
 *   - the fetch is bounded in time (FETCH_TIMEOUT_MS) and size
 *     (SHEET_MAX_BYTES), and anything that is not JSON is "no sheet";
 *   - calls are rate-limited per target host and in total, through
 *     the rate-limit bindings in wrangler.jsonc (optional at runtime so
 *     local development works without them).
 *
 * A sheet on this site's own hostname (the case studies) is read through
 * the assets binding: a Worker fetching its own public hostname loops
 * back to itself and Cloudflare answers 522/523.
 *
 * Everything else is answered by the assets binding. wrangler.jsonc's
 * run_worker_first lists this one path, so no other request pays for
 * the Worker.
 */
import { buildResult, type RenderModel } from '../src/lib/validate-model.ts';

export const VALIDATE_PATH = '/pagefront/commerce/product/validate.json';

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

type Outcome = RenderModel | { kind: 'bad-request'; detail: string } | { kind: 'rate-limited' };

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
  for (const [limiter, key] of [
    [env.VALIDATE_RATE_TOTAL, 'total'],
    [env.VALIDATE_RATE_PER_HOST, target.host],
  ] as const) {
    if (limiter && !(await limiter.limit({ key })).success) {
      return { status: 429, body: { kind: 'rate-limited', sheet_url } };
    }
  }

  const init: RequestInit = {
    headers: {
      accept: 'application/json',
      'user-agent': 'pagefront-validator (+https://themachineweb.org/pagefront/commerce/product/validate)',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(timeoutMs),
  };
  const viaAssets = options.selfHost !== undefined && target.host === options.selfHost && env.ASSETS;
  let response: Response;
  try {
    response = viaAssets
      ? await env.ASSETS!.fetch(new Request(sheet_url, init))
      : await fetch(sheet_url, init);
  } catch (error) {
    const detail = (error as Error).name === 'TimeoutError' ? `no response within ${timeoutMs} ms` : 'the URL could not be fetched';
    return { status: 200, body: { kind: 'fetch-error', detail, sheet_url } };
  }
  if (response.url && !allowed.includes(new URL(response.url).protocol)) {
    return { status: 200, body: { kind: 'fetch-error', detail: 'the URL redirected to a disallowed protocol', sheet_url } };
  }
  if (!response.ok) {
    return { status: 200, body: { kind: 'no-sheet', detail: `HTTP ${response.status}`, sheet_url } };
  }
  const text = await readCapped(response, maxBytes);
  if (text === undefined) {
    return { status: 200, body: { kind: 'no-sheet', detail: `the response is larger than ${maxBytes} bytes`, sheet_url } };
  }
  const result = buildResult(text, 'url');
  if (result.kind === 'scope-error') {
    // The declared value is the document's own; keep the echo short.
    result.declared = result.declared.slice(0, 200);
  }
  return { status: 200, body: { ...result, sheet_url } };
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
  if (url.pathname !== VALIDATE_PATH) return env.ASSETS.fetch(request);

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
    return json({ kind: 'bad-request', detail: 'pass either ?url= (a served sheet) or ?sheet= (the sheet JSON, URL-encoded)' }, 400);
  }
  if (inline !== null) {
    const { status, body } = await validateSheetText(inline, env, options);
    return json(body, status);
  }
  const { status, body } = await validateSheetUrl(raw!, env, { selfHost: url.host, ...options });
  return json(body, status);
}
