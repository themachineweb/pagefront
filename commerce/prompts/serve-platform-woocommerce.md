### WooCommerce

- Documentation: https://developer.wordpress.org/plugins/hooks/ and https://developer.wordpress.org/apis/rewrite/
- Link prompt, the next phase: https://themachineweb.org/pagefront/publish/link/woocommerce
- **Signs**: the homepage's head has `<link rel="https://api.w.org/">`, and
  that REST index lists `wc/store/v1`. Without it (a storefront served by
  another application) there is no WordPress to forward from: say so and
  stop. A homepage showing a password form or a coming-soon page a plugin
  put in place of the shop: closed, as "A closed shop" says.
- **Sheet path**: `/pagefront`.
- **Forwarding**: a Code Snippets snippet, the file `pagefront-snippet.txt`:
  plain PHP for the shop's WordPress version, no opening tag, names
  prefixed `pagefront_`, short comments, the Worker's address in one
  constant at the top for the merchant to fill in.
  - It forwards `/pagefront/<rest>` to the Worker as `/<rest>`, same method,
    and returns the Worker's status, body, `Content-Type` and
    `Access-Control-Allow-Origin` unchanged.
  - It follows no redirect. If the Worker does not answer: `502`, never the
    theme's page.
  - It uses the rewrite API and answers on `template_redirect` before
    `redirect_canonical`, so no trailing slash is added.
- **Admin, in English, as shown on 2026-10-29**:
  1. Plugins › Add Plugin (beside the Plugins title). Search "Code
     Snippets"; "Install Now", then "Activate", on "Code Snippets" by Code
     Snippets Pro, not a look-alike (WPCode, FluentSnippets, Header Footer
     Code Manager). Not the WooCommerce Marketplace tab on that page, nor
     WooCommerce › Extensions: Code Snippets is not there.
  2. Snippets › All Snippets: leave the four sample snippets off.
  3. "Add Snippet" (blue, top right).
  4. "Enter snippet title": `Pagefront: sheet server`; type PHP; paste all
     of `pagefront-snippet.txt` into Snippet Content (the `<?php` above it
     is the editor's); put the Worker's address at the top; Location: Run
     everywhere; Priority unchanged; "Save and Activate", not "Save
     Snippet".
  5. Settings › Permalinks: "Save Changes", changing nothing.
- Only if the merchant says they are running this phase again: replace the
  code of the existing snippet rather than add one.
