/**
 * Layer 1 tests for the Commerce Organization Sheet schema, anchored
 * on the corpus artifact (the Nitto organization sheet) rather than a
 * synthetic fixture: the schema's job is to validate the real sheet
 * the vocabulary cites as its worked example.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateOrganizationSheet,
  validateAndLint,
  lintSheet,
  detectSheetType,
} from "../dist/index.js";

const NITTO_SHEET = join(
  dirname(fileURLToPath(import.meta.url)),
  "..", "..", "case-studies", "nitto", "nitto-organization-v0_9.json"
);

function loadNitto() {
  return JSON.parse(readFileSync(NITTO_SHEET, "utf8"));
}

test("the Nitto organization sheet passes Layer 1", () => {
  const result = validateOrganizationSheet(loadNitto());
  assert.deepEqual(result, { valid: true });
});

test("a sheet without pagefront:commerceRole fails Layer 1", () => {
  const sheet = loadNitto();
  delete sheet.data["pagefront:commerceRole"];
  const result = validateOrganizationSheet(sheet);
  assert.equal(result.valid, false);
  assert.ok(
    result.schemaErrors.some(
      (e) => e.keyword === "required" && e.instancePath === "/data"
    )
  );
});

test("a role outside the closed enum fails Layer 1", () => {
  const sheet = loadNitto();
  sheet.data["pagefront:commerceRole"] = ["seller", "retailer"];
  const result = validateOrganizationSheet(sheet);
  assert.equal(result.valid, false);
  assert.ok(result.schemaErrors.some((e) => e.keyword === "enum"));
});

test("an empty commerceRole array fails Layer 1 (one or more roles)", () => {
  const sheet = loadNitto();
  sheet.data["pagefront:commerceRole"] = [];
  const result = validateOrganizationSheet(sheet);
  assert.equal(result.valid, false);
  assert.ok(result.schemaErrors.some((e) => e.keyword === "minItems"));
});

test("a fulfillmentTerms entry that is not OfferShippingDetails fails Layer 1", () => {
  const sheet = loadNitto();
  sheet.data["pagefront:fulfillmentTerms"][0]["@type"] = "ShippingDetails";
  const result = validateOrganizationSheet(sheet);
  assert.equal(result.valid, false);
  assert.ok(result.schemaErrors.some((e) => e.keyword === "const"));
});

test("authorizedResellers: a reseller organization needs @id, or name plus url or address", () => {
  const sheet = loadNitto();
  const block = sheet.data["pagefront:authorizedResellers"];
  assert.ok(Array.isArray(block.reseller) && block.reseller.length > 0);
  // The corpus form: inline name + address.
  assert.deepEqual(validateOrganizationSheet(sheet), { valid: true });
  // Reference stub and inline name + url both validate.
  block.reseller = [
    { organization: { "@type": "Organization", "@id": "https://reseller.example/#org" } },
    { organization: { "@type": "Organization", name: "Boutique", url: "https://boutique.example" } },
  ];
  assert.deepEqual(validateOrganizationSheet(sheet), { valid: true });
  // A name with neither url nor address is not an identifiable reseller.
  block.reseller = [{ organization: { "@type": "Organization", name: "Boutique" } }];
  let result = validateOrganizationSheet(sheet);
  assert.equal(result.valid, false);
  assert.ok(result.schemaErrors.some((e) => e.keyword === "anyOf"));
  // An empty reseller array fails (minItems 1).
  block.reseller = [];
  result = validateOrganizationSheet(sheet);
  assert.equal(result.valid, false);
  assert.ok(result.schemaErrors.some((e) => e.keyword === "minItems"));
  // exhaustive is a boolean.
  block.reseller = [{ organization: { "@type": "Organization", "@id": "https://reseller.example/#org" } }];
  block.exhaustive = "yes";
  result = validateOrganizationSheet(sheet);
  assert.equal(result.valid, false);
  assert.ok(result.schemaErrors.some((e) => e.keyword === "type" && e.instancePath.endsWith("/exhaustive")));
});

test("the envelope is strict: release must be a semver, and format_version is not allowed beside it", () => {
  const sheet = loadNitto();
  sheet.release = "0.3";
  let result = validateOrganizationSheet(sheet);
  assert.equal(result.valid, false);
  // "0.3" names no release: no schema can be resolved for it.
  assert.deepEqual(result.schemaErrors, [
    { instancePath: "/release", message: "names no release this linter knows: 0.3", keyword: "release" },
  ]);

  const both = loadNitto();
  both.format_version = "0.9";
  result = validateOrganizationSheet(both);
  assert.equal(result.valid, false);
  assert.ok(result.schemaErrors.some((e) => e.keyword === "additionalProperties"));
});

test("legacy line: a format_version sheet validates against the frozen v0.9 schema", () => {
  const legacy = loadNitto();
  delete legacy.release;
  legacy.format_version = "0.9";
  legacy.$schema = "https://themachineweb.org/pagefront/spec/commerce/organization/v0.9.json";
  assert.deepEqual(validateOrganizationSheet(legacy), { valid: true });

  // The legacy envelope stays strict: only format 0.9 is the legacy line.
  legacy.format_version = "0.8";
  const result = validateOrganizationSheet(legacy);
  assert.equal(result.valid, false);
  assert.ok(
    result.schemaErrors.some(
      (e) => e.keyword === "const" && e.instancePath === "/format_version"
    )
  );
});

test("identity is @id + name: dropping either fails Layer 1", () => {
  for (const field of ["@id", "name"]) {
    const sheet = loadNitto();
    delete sheet.data[field];
    const result = validateOrganizationSheet(sheet);
    assert.equal(result.valid, false, `missing ${field} should fail`);
  }
});

// ---------------------------------------------------------------------------
// Layer 2 — the organization catalogue (ORG-W-001 … ORG-W-007), corpus-clean
// ---------------------------------------------------------------------------

const CORPUS = [
  ["nitto", "nitto-organization-v0_9.json"],
  ["zalando", "zalando-organization-v0_9.json"],
  ["zalando", "zalando-friboo-organization-v0_9.json"],
];

test("the three corpus organization sheets lint clean end to end", () => {
  for (const [dir, file] of CORPUS) {
    const sheet = JSON.parse(
      readFileSync(
        join(dirname(fileURLToPath(import.meta.url)), "..", "..", "case-studies", dir, file),
        "utf8"
      )
    );
    const result = validateAndLint(sheet, {
      checkedAt: "2026-01-01T00:00:00Z",
      linterVersion: "0.0.0-test",
    });
    assert.equal(result.layer, 2, `${file} should pass Layer 1`);
    assert.deepEqual(
      result.report.summary,
      { errors: 0, warnings: 0, info: 0, rules_fired: [] },
      `${file} should have zero findings`
    );
    assert.equal(result.report.catalogue_version, "0.17.0");
  }
});

test("sheet-type dispatch: product rules never run on org sheets and vice versa", () => {
  // The Nitto org sheet has no product identifier, offers, or images —
  // fields whose absence fires product rules — yet reports zero
  // findings, because only the organization catalogue runs on it
  // (asserted corpus-clean above). The inverse: a product sheet routes
  // to the product catalogue even though it, in turn, satisfies no org
  // rule's trigger.
  const product = JSON.parse(
    readFileSync(
      join(
        dirname(fileURLToPath(import.meta.url)),
        "..", "..", "case-studies", "nitto", "nitto-youri-col-roule-orange-v0_9.json"
      ),
      "utf8"
    )
  );
  assert.equal(detectSheetType(product), "product");
  assert.equal(detectSheetType(loadNitto()), "organization");

  // Fallback detection: no $schema, org-shaped data block. The rules
  // are quiet on an absent $schema; requiring it is the schema's job.
  const OPTS = { checkedAt: "2026-01-01T00:00:00Z", linterVersion: "0.0.0-test" };
  const bare = loadNitto();
  delete bare.$schema;
  assert.equal(detectSheetType(bare), "organization");
  assert.deepEqual(lintSheet(bare, OPTS).summary.rules_fired, []);
  // Layer 1 still resolves the organization schema for it, from the
  // release and the data-block shape, and reports the missing $schema.
  const bareResult = validateOrganizationSheet(bare);
  assert.equal(bareResult.valid, false);
  assert.ok(bareResult.schemaErrors.some((e) => e.keyword === "required" && /\$schema/.test(e.message)));

  // On the legacy line $schema is optional, and the same sheet is clean.
  const legacyBare = loadNitto();
  delete legacyBare.$schema;
  delete legacyBare.release;
  legacyBare.format_version = "0.9";
  assert.equal(detectSheetType(legacyBare), "organization");
  assert.deepEqual(lintSheet(legacyBare, OPTS).summary.rules_fired, []);
});
