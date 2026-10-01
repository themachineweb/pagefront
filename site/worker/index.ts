/**
 * The site's Worker entry: the validator endpoint plus the assets
 * fallback, both in validate.ts. Nothing else is exported here, since
 * the runtime treats named exports of this module as entrypoints.
 */
import { handle, type Env } from './validate.ts';

export default {
  fetch: (request: Request, env: Env) => handle(request, env),
};
