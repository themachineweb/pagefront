import type { Rule } from "@pagefront/lint-core";

/**
 * PDP-W-012 — Video missing accessibility metadata.
 * Transcribed from commerce/spec/rules.md (normative).
 *
 * Severity is context-dependent: warning for videos with role
 * `overview` or `tutorial`, info for other roles — realized as the
 * CheckHit severity override, with the rule's declared severity staying
 * the catalogue's stronger default. Two readings:
 *
 * - The check is the literal "has neither `caption` nor `transcript`"
 *   (key presence); a present-but-empty caption does not fire.
 * - The video's role lives in `additionalProperty` (`name: "role"`),
 *   mirroring the image-role pattern. A video with no declared role is
 *   not overview/tutorial, so it downgrades to info, and `{role}`
 *   renders as `none`.
 */
export const pdpW012: Rule = {
  id: "PDP-W-012",
  title: "Video missing accessibility metadata",
  severity: "warning",
  target: "$.data.video[*]",
  check: (match) => {
    const video = match.value;
    if (typeof video !== "object" || video === null) return null;
    const v = video as Record<string, unknown>;
    if (v["caption"] !== undefined || v["transcript"] !== undefined) return null;

    let role = "none";
    if (Array.isArray(v["additionalProperty"])) {
      for (const p of v["additionalProperty"] as unknown[]) {
        if (
          typeof p === "object" &&
          p !== null &&
          (p as Record<string, unknown>)["name"] === "role" &&
          typeof (p as Record<string, unknown>)["value"] === "string"
        ) {
          role = (p as Record<string, unknown>)["value"] as string;
          break;
        }
      }
    }
    const isPrimaryRole = role === "overview" || role === "tutorial";
    return {
      values: { role },
      ...(isPrimaryRole ? {} : { severity: "info" as const }),
    };
  },
  messageTemplate: "Video at `{path}` with role `{role}` has no caption or transcript.",
  remediation:
    "Add a `caption` field with a 1–3 sentence summary of the video's content, or a `transcript` field with the full spoken content. For overview and tutorial videos, at least one is strongly recommended.",
  introduced: "v0.6",
  specReference: "product.md#accessibility",
};
