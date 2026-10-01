import { isFullAbsoluteUrl } from "@pagefront/lint-core";

/**
 * Shared helper for the organization-reference rules (PDP-E-005,
 * PDP-E-006, PDP-W-031): the *host* of a value per the catalogue's
 * Definitions section — the host a WHATWG URL parser yields (lowercased,
 * default port dropped) for a full absolute URL, or `null` when the
 * value is not a full absolute URL, does not parse, or parses with an
 * empty host (`urn:…`).
 */
export function hostOf(value: unknown): string | null {
  if (!isFullAbsoluteUrl(value)) return null;
  try {
    const host = new URL(value as string).host;
    return host === "" ? null : host;
  } catch {
    return null;
  }
}

/** The rendered form of a host placeholder: the host, or `(none)`. */
export const renderHost = (host: string | null): string => host ?? "(none)";
