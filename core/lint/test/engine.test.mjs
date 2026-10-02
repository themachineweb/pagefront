import test from "node:test";
import assert from "node:assert/strict";
import { lint, fieldAbsentOrEmpty } from "../dist/index.js";

const sheet = {
  $schema: "https://themachineweb.org/pagefront/spec/commerce/product/v0.9.0.json",
  release: "0.3.0",
  canonical_url: "https://merchant.example/widget",
  sheet_url: "https://merchant.example/widget.pagefront.json",
  generated_at: "2026-08-10T00:00:00Z",
  data: {
    name: "Widget",
    items: [
      { label: "a", flagged: true },
      { label: "b", flagged: false },
      { label: "c", flagged: true },
    ],
  },
};

// Two synthetic rules over the same target. Catalogue order (X-002 before
// X-001) deliberately disagrees with sorted order, to exercise the sort.
const ruleFlagged = {
  id: "X-002",
  title: "Item is flagged",
  severity: "warning",
  target: "$.data.items[*]",
  check: (m) => (m.value.flagged ? { values: { label: m.value.label, count: 1 } } : null),
  messageTemplate: "Item {label} ({count}) flagged at {path}.",
  remediation: "Unflag the item.",
  introduced: "v0.8",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "spec.md#flags",
};

const ruleEveryItem = {
  id: "X-001",
  title: "Every item, severity varies",
  severity: "warning",
  target: "$.data.items[*]",
  check: (m) => (m.value.flagged ? {} : { severity: "info" }),
  messageTemplate: "Item at {path}.",
  remediation: "None.",
  introduced: "v0.8",
  appliesFrom: "0.3.0",
  appliesToLegacy: true,
  specReference: "spec.md#items",
};

const catalogue = {
  vertical: "test",
  releases: ["0.3.0"],
  catalogueVersion: "0.0.1",
  rules: [ruleFlagged, ruleEveryItem],
};

const OPTS = { checkedAt: "2026-01-01T00:00:00Z", linterVersion: "9.9.9" };

test("template rendering substitutes rule values and implicit {path}; values excludes path", () => {
  const report = lint(sheet, catalogue, OPTS);
  const flagged = report.findings.filter((f) => f.rule === "X-002");
  assert.equal(flagged.length, 2);
  assert.equal(
    flagged[0].message,
    "Item a (1) flagged at $['data']['items'][0]."
  );
  // numbers stringified; implicit path not duplicated into values
  assert.deepEqual(flagged[0].values, { label: "a", count: "1" });
});

test("missing placeholder value throws an engine error", () => {
  const broken = {
    ...ruleFlagged,
    id: "X-009",
    messageTemplate: "Needs {nonexistent} at {path}.",
  };
  assert.throws(
    () => lint(sheet, { ...catalogue, rules: [broken] }, OPTS),
    /X-009.*\{nonexistent\}/
  );
});

test("CheckHit severity overrides the rule default", () => {
  const report = lint(sheet, catalogue, OPTS);
  const everyItem = report.findings.filter((f) => f.rule === "X-001");
  assert.deepEqual(
    everyItem.map((f) => f.severity),
    ["warning", "info", "warning"]
  );
  assert.deepEqual(report.summary, {
    errors: 0,
    warnings: 4,
    info: 1,
    rules_fired: ["X-001", "X-002"],
  });
});

test("findings sort by path then rule ID, regardless of catalogue order", () => {
  const report = lint(sheet, catalogue, OPTS);
  assert.deepEqual(
    report.findings.map((f) => [f.path, f.rule]),
    [
      ["$['data']['items'][0]", "X-001"],
      ["$['data']['items'][0]", "X-002"],
      ["$['data']['items'][1]", "X-001"],
      ["$['data']['items'][2]", "X-001"],
      ["$['data']['items'][2]", "X-002"],
    ]
  );
});

test("rules_fired deduplicates in first-fired order after sorting", () => {
  const report = lint(sheet, catalogue, OPTS);
  assert.deepEqual(report.summary.rules_fired, ["X-001", "X-002"]);
});

test("options inject checked_at and linter_version; defaults otherwise", () => {
  const injected = lint(sheet, catalogue, OPTS);
  assert.equal(injected.checked_at, "2026-01-01T00:00:00Z");
  assert.equal(injected.linter_version, "9.9.9");
  assert.equal(injected.sheet, "https://merchant.example/widget");
  assert.equal(injected.release, "0.3.0");
  assert.equal(injected.sheet_spec_version, "0.9.0");
  assert.equal(injected.catalogue_version, "0.0.1");

  const defaulted = lint(sheet, catalogue);
  assert.equal(defaulted.linter_version, "0.3.0"); // package version
  assert.ok(!Number.isNaN(Date.parse(defaulted.checked_at)));
});

test("a check may return multiple hits, each with its own path override", () => {
  const multi = {
    ...ruleEveryItem,
    id: "X-007",
    target: "$.data",
    check: (m) =>
      m.value.items.map((item, i) => ({
        path: `$['data']['items'][${i}]`,
        values: { label: item.label },
      })),
    messageTemplate: "Entry {label} at {path}.",
  };
  const report = lint(sheet, { ...catalogue, rules: [multi] }, OPTS);
  assert.deepEqual(
    report.findings.map((f) => [f.path, f.message]),
    [
      ["$['data']['items'][0]", "Entry a at $['data']['items'][0]."],
      ["$['data']['items'][1]", "Entry b at $['data']['items'][1]."],
      ["$['data']['items'][2]", "Entry c at $['data']['items'][2]."],
    ]
  );
});

test("checks receive the resolved checkedAt via RuleContext", () => {
  let seen;
  const probe = {
    ...ruleEveryItem,
    id: "X-005",
    check: (m, ctx) => {
      seen = ctx.checkedAt;
      return null;
    },
  };
  lint(sheet, { ...catalogue, rules: [probe] }, OPTS);
  assert.equal(seen, OPTS.checkedAt);
});

test("fieldAbsentOrEmpty fires on absent, empty-array, and whitespace fields only", () => {
  const check = fieldAbsentOrEmpty("image");
  const ctx = { sheet, allMatches: [] };
  const fire = (value) => check({ path: "$['data']", value }, ctx);
  assert.deepEqual(fire({}), { values: { field: "image" } });
  assert.deepEqual(fire({ image: [] }), { values: { field: "image" } });
  assert.deepEqual(fire({ image: "   " }), { values: { field: "image" } });
  assert.deepEqual(fire({ image: null }), { values: { field: "image" } });
  assert.equal(fire({ image: ["x.jpg"] }), null);
  assert.equal(fire({ image: "x.jpg" }), null);
});

test("release falls back to a legacy format_version; both report fields are null when undeclared", () => {
  const { release: _r, $schema: _s, ...bare } = sheet;
  const legacy = lint(
    { ...bare, format_version: "0.9", $schema: "https://themachineweb.org/pagefront/spec/commerce/product/v0.9.json" },
    catalogue,
    OPTS
  );
  assert.equal(legacy.release, "0.9");
  assert.equal(legacy.sheet_spec_version, "0.9");

  const undeclared = lint(bare, catalogue, OPTS);
  assert.equal(undeclared.release, null);
  assert.equal(undeclared.sheet_spec_version, null);

  const unversioned = lint({ ...bare, release: "0.3.0", $schema: "https://example.org/schema.json" }, catalogue, OPTS);
  assert.equal(unversioned.sheet_spec_version, null);
});

test("release gating: a rule runs from its appliesFrom release, and on legacy sheets only when flagged", () => {
  const { release: _r, ...bare } = sheet;
  const gated = { ...ruleEveryItem, id: "X-003", appliesFrom: "0.4.0", appliesToLegacy: false };
  const cat = { ...catalogue, rules: [ruleFlagged, gated] };
  const fired = (s) => lint(s, cat, OPTS).summary.rules_fired;

  assert.deepEqual(fired({ ...bare, release: "0.3.0" }), ["X-002"]); // below appliesFrom
  assert.deepEqual(fired({ ...bare, release: "0.4.0" }), ["X-002", "X-003"]);
  assert.deepEqual(fired({ ...bare, release: "0.10.0" }), ["X-002", "X-003"]); // numeric, not lexical
  assert.deepEqual(fired({ ...bare, release: "1.0.0" }), ["X-002", "X-003"]);
  assert.deepEqual(fired({ ...bare, format_version: "0.9" }), ["X-002"]); // legacy: flagged rules only
  // A sheet that cannot be gated (no declaration, or not a semver) gets every rule.
  assert.deepEqual(fired(bare), ["X-002", "X-003"]);
  assert.deepEqual(fired({ ...bare, release: "next" }), ["X-002", "X-003"]);
});
