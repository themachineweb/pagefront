### Shopify

- Documentation: https://shopify.dev/docs/apps/build/online-store/app-proxies and https://shopify.dev/docs/apps/build/dev-dashboard
- Link prompt, the next phase: https://themachineweb.org/pagefront/publish/link/shopify
- **Signs**: `<origin>/products/<handle>.js` answers with the product as
  JSON (Shopify's Ajax API). Every address redirecting to `/password`: the
  store is closed. Go on with the setup; tell the merchant the sheets answer
  publicly only once the store is open; the shop's signs and CHECKS wait
  until they say it is open. A product address with no `.js` answer: a
  storefront served by another application, with no app proxy; say so and
  stop.
- **Sheet path**: `/apps/pagefront`.
- **Forwarding**: an app proxy on a custom app, made in the Dev Dashboard
  by the store owner or staff with app development access: prefix `apps`,
  subpath `pagefront`, Proxy URL the Worker's address, scope
  `write_app_proxy`. Shopify forwards `<origin>/apps/pagefront/<rest>` to
  `<Worker>/<rest>`, follows redirects itself and adds query parameters,
  which the server ignores.
- **Dev Dashboard, as shown on 2026-10-30**:
  1. Store admin: Settings › Apps › Develop apps › "Build apps in Dev
     Dashboard".
  2. "Create app" (top right) › "Create app manually", not "Create with
     Shopify CLI" (a terminal command, despite "Recommended").
  3. The "Create an app" form: App name `Pagefront sheets`; App URL
     `https://shopify.dev/apps/default-app-home` (Shopify's page for an app
     with no screen); "Embed app in Shopify admin" unticked; Scopes:
     "Select from list", `write_app_proxy`; the rest unchanged. "Create
     app" (top right), then "Release" in the window. This form has no app
     proxy.
  4. Versions › "Create version" (top right). At the bottom, App proxy:
     Subpath prefix `apps`, Subpath `pagefront`, Proxy URL the Worker's
     address alone. Check Scopes still holds `write_app_proxy`. "Release"
     (bottom right), "Release" again; the version shows Active.
  5. Overview, Installs card: on a development store, "Test app", then the
     store. Installing on a live store was not walked: say so. The approval
     screen lists "View and edit store data: Online Store" (lets the app
     add its path to the store) and "View staff and contributor data: Store
     owner": explain both. After "Install", a page "Find this app in the
     pages where you work" is expected (the app has no screen); close it.
- Tell the merchant not to rename the proxy's prefix or subpath in the
  store admin: it would move every sheet's address.
