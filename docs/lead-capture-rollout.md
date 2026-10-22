# Generic lead capture: staged rollout

## Changes

- Generic WhatsApp and homepage contact forms require city and model/need; a recommendation request is valid and budget is optional. Product-specific messages prefill the known model.
- Model/need and city remain together in column D (`Producto de interés`) as `… | Destino: …`. No historical rows, commercial columns U:Z, catalog, prices, advertisements or budgets are changed.
- Generic forms assign a UUID once per normalized inquiry during a 30-minute browser session window. Only a SHA-256 digest plus outcome metadata is kept in sessionStorage. A synchronous guard and shared pending promise suppress double clicks/concurrent submissions. Unconfirmed writes are never automatically retried.
- `lead_id` is passed to saved-lead conversion tracking; an opening of WhatsApp is not a saved-lead conversion. Existing consent checks remain in MarketingTracker.
- Apps Script uses its existing AA column as the durable ID ledger and ScriptLock around read/append/flush. Same ID with different phone or inquiry is rejected, never merged. Different IDs and no-ID legacy requests remain distinct. Formula-like new cell values (including +51 phones) are stored as literal text.

## Limits and publication order

This PR is preparation, not proof the live script or website has changed. After explicit publication approval:

1. Update the existing Apps Script deployment from `google-apps-script/Code.gs`, preserving the existing spreadsheet, sheet, deployment URL and commercial columns. No new credentials or infrastructure are needed.
2. Publish the web commit through the normal reviewed merge/deployment path.
3. Verify the deployed versions and configuration using read-only evidence. Any production synthetic submission or conversion test requires separate explicit agreement; local tests below send no live traffic.

The client window is not cross-device deduplication. Session storage disabled means protection lasts only for the current loaded page. The durable script guard applies only after its deployment and only to requests carrying the same ID. Never claim all similar inquiries or historic duplicates are eliminated. Existing historic phone cells/formulas are not repaired by this change.

## Verification

Run `node --test tests/*.test.mjs` and `npm run build` on the final commit. Mocks cover lost responses, repeated requests, different inquiries, locked writer, failed append, consent and Apps Script formula safety. No real lead, WhatsApp message or advertising conversion is sent.

The existing `npm run lint` invokes `next lint`, which is unsupported by the repository's Next.js 16 version. This is a pre-existing lint configuration issue; this narrowly scoped change does not replace the lint toolchain. Interactive visual browser QA is separate from mocked behavior and build verification.
