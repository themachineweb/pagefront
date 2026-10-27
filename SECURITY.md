# Security policy

## Reporting a vulnerability

Report security issues to `security@themachineweb.org`. Do not open a
public issue for them.

Include what you found, where (a URL, a package version, a file), and how to
reproduce it. You will get an acknowledgement within five working days, and
a reply with what we intend to do once we have assessed the report. We ask
that you give us a reasonable time to fix the issue before you publish it.

## Scope

- The site at themachineweb.org and the Worker that serves its Check
  endpoint (`site/`).
- The npm packages `@pagefront/lint-core` and `@pagefront/lint-commerce`
  (`core/lint/`, `commerce/lint/`) and the schemas they bundle.
- The specification documents, where a wording would lead an implementer
  into an unsafe practice.

Out of scope: the merchant sites the case studies describe, which belong to
their merchants, and third-party services the site uses.

## Supported versions

The current commerce release and the latest published version of each npm
package receive fixes. Earlier releases stay available but are not patched.
