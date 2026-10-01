# Pagefront Governance

This document describes how decisions about the Pagefront specification are
made today, and how that process is expected to change.

## Current phase: founder-led

Pagefront is pre-stable. The specification is small and the contributor pool
is early, so one editor deciding in public costs less than a committee.

While the project is founder-led, the **editor** is the project's founder and
the final decision-maker on spec content. The editor is **Stephane Lee**.

The editor:

- Maintains the specification, its JSON Schema, vocabulary, and case studies.
- Decides which proposals are accepted, modified, or rejected.
- Cuts releases and documents migration paths.
- Mediates disagreements that surface in issues and PRs.

Decisions are made in public. Significant changes are discussed in issues
before they land in a PR. The editor explains the reasoning behind
rejections.

## Future governance

Founder-led governance suits a pre-stable spec written by one person. Once
many parties depend on the specification, it needs shared stewardship.

The editor intends to move Pagefront to shared stewardship (a working group,
foundation, or equivalent vehicle) when adoption warrants it. That point is
set by adoption.

Concerns about this can be raised in an issue, and the editor will respond on
the record.

## Roles

**Editor.** As above.

**Contributors.** Anyone who has had a substantive contribution merged.
Contributors are credited in release notes.

**Implementers and consumers.** Organizations or individuals running the
spec in production: building validators, plugins, MCP servers, agent
connectors, or merchant-facing tooling. Their experience drives spec
evolution and carries the most weight in design discussions.

## Conflict of interest

The editor is the founder of VengaLabs, an early-stage startup studio.
VengaLabs may launch a commercial implementation of Pagefront as one of its
ventures. If it does, a founder other than the editor would lead it, with the
editor holding a minority stake and no operating role. No such venture exists
today, none is funding this specification, and the spec has been written
independently of any implementation.

The commitments below do not depend on that venture existing. They bind the
editor with respect to every implementer:

- Spec changes that benefit only a hosted SaaS implementation will be
  rejected.
- Spec features will not be gated behind a particular implementation.
- No implementer, including any VengaLabs venture, receives advance access to
  drafts, schema changes, or roadmap ahead of public publication.
- Any contributor may flag a proposed change as commercially motivated; the
  editor must respond on the record.
- Should any venture in which the editor holds an interest become a dominant
  implementation of this specification, the editor will move the spec to
  shared stewardship.

The spec is licensed CC BY 4.0 and can be implemented by anyone. The
governance commitment is that the spec serves publishers and agent and tool
builders. No single commercial entity, including any VengaLabs venture, gets
priority over them.

## Trademarks

"Pagefront" is not a registered trademark. Any rights arising from use of the
name accrue to the editor, who intends to transfer them to the
shared-governance body if one is established. The project is hosted at
`themachineweb.org`. You may use the name to describe a conforming
implementation without a license. Using the name in a way that implies
endorsement by the project or the editor requires written permission.

## Amendments

This document is versioned in the repository and changes through PR.
Material amendments to the governance model go through the same public
discussion as spec changes.
