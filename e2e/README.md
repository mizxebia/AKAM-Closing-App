# Browser-level tests (Playwright Component Testing)

This folder holds **Playwright Component Tests** (`*.ct.spec.tsx`), run via:

```
npm run test:e2e        # headless
npm run test:e2e:ui     # interactive UI mode
```

## Why component tests instead of whole-app navigation E2E

This app is a **Power Platform "code app"**. Every Dataverse call made
through `@microsoft/power-apps` (`getClient(...).retrieveMultipleRecordsAsync`,
etc.) is routed through `window.parent.postMessage` to a host bridge —
see `node_modules/@microsoft/power-apps/dist/internal/plugins/DefaultPowerAppsBridge.js`.
That bridge is only implemented by the real Power Apps player that embeds
this app in an iframe when it's launched from make.powerapps.com. It is not
an HTTP call, so there's nothing for Playwright to intercept with
`page.route(...)`, and there's no local/offline fallback in the SDK.

Concretely, that means:

- Running `vite dev` standalone and navigating to it with Playwright would
  leave every data-loading component spinning forever — `window.parent` is
  just `window` in that context, so the bridge handshake never completes.
- Standing up a fake host bridge that speaks this internal, undocumented
  postMessage protocol was judged too risky/brittle for the value it'd add.
- The `prod` / UAT / Production environment IDs in `power.config.json` must
  never be hit by an automated test run — there is no "test" Dataverse
  environment configured for this app.

So instead of whole-app navigation E2E, this folder uses **Playwright
Component Testing** (`@playwright/experimental-ct-react`): it mounts real
feature components (the same components the app renders) in an actual
Chromium tab, with props supplied directly — no data layer involved. This
still catches real-browser issues that the jsdom-based Vitest component
tests (`src/**/*.test.tsx`) can't: real layout/CSS, real pointer and
keyboard event dispatch, real focus order.

## What's covered here vs. in `src/**/*.test.tsx`

| Layer | Tool | Talks to Dataverse? | Runs in |
|---|---|---|---|
| Business logic (`validateForm`, `toPayload`, formatters, filters...) | Vitest | No — pure functions | Node (jsdom) |
| Component behavior with mocked services (`NewOwnerTicketTab`, etc.) | Vitest + Testing Library | No — `vi.mock`'d | Node (jsdom) |
| Component rendering/interaction in a real browser | Playwright CT (this folder) | No — props only | Real Chromium |

If a future engagement adds a Dataverse test environment plus a
service-principal (client-credentials) login, the natural next step is a
Node script under a new `scripts/` folder that authenticates directly via
the Dataverse Web API (bypassing the Power Apps SDK/bridge entirely) and
runs the same `validateForm`/`toPayload` logic against real records —
extending the fixture-based approach in
`src/test/fixtures/newOwnerTicketFormStates.ts` to live data. That was
explicitly scoped out for this pass (see conversation) in favor of the
fixture-based approach.
