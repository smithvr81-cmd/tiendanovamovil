# Lead capture safety corrections

- All three UI paths wait for a confirmed save before offering or opening WhatsApp. Unconfirmed writes keep entered data and display an explicit failure instead of reporting success.
- The homepage native capture listener owns the entire submission and suppresses the old competing page handler. Confirmed continuations bypass recapture and retain a manual link when popups are blocked.
- The API rejects malformed Peruvian mobile numbers and inquiries without a meaningful model/need and destination before calling Sheets. Existing product and cart interest encoding remains compatible.
- Upstream `duplicate: true` survives the API and client helper; confirmed duplicates can continue to WhatsApp but do not emit another saved conversion.
- Apps Script writes every phone as literal text, including leading zeros, while preserving formula escaping and all column positions.

## Verification

Run `node --test tests/*.test.mjs` and `npm run build`. Tests use synthetic in-memory mocks, not production contacts. `npm run lint` is an existing unsupported `next lint` command under Next 16 and does not constitute a lint pass.

## Deployment boundaries

The Next.js deployment does not deploy Apps Script. Update the existing Apps Script deployment separately without changing its URL or access settings. Until that is done, durable deduplication and explicit script phone preservation are not verified in production. Do not retry ambiguous writes while deployment status is unknown. No ad settings, campaign budget, credentials, historical lead values or commercial summaries are changed by this patch.

Browser interaction, real Ads receipt and end-to-end live verification remain separate checks requiring available authorized access. No new real test lead was submitted for these code changes.
