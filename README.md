# The Diamond Dealer

A public, synthetic-data product demo for an independent second look at engagement-ring and diamond listings.

The concept turns a listing, supporting documents, and customer questions into a traceable report: what agrees, what conflicts, what remains unknown, how the price sits within a dated comparison set, and what to ask next.

> Public demo only. Every person, seller, listing, document, event, and price is fictional. The demo does not accept orders or payment.

## Product principles

- Cite evidence at the point of conclusion.
- Keep unknowns visible.
- Record material changes as lifecycle events instead of silent edits.
- Show caveats, corrections, appeals, extensions, voids, and revocations.
- Separate revenue from seller commissions and ranking payments.
- Model a proposed $49 review with a 24-hour target and clear remedies.

## Demo states

Fixtures cover issued-consistent, issued-with-caveats, not-assessable/refunded, superseded upgrade, voided listing change, revoked fraud signal, revoked reviewer error, extension available, and appeal pending. All names and evidence are fictional.

## Content map

- `src/content/site.ts`: UI-ready product copy.
- `src/fixtures/reviews.ts`: typed reports and lifecycle histories.
- `docs/METHODOLOGY.md`: evidence rules, outcomes, and quality checks.
- `docs/INDEPENDENCE.md`: financial and reviewer separation.
- `docs/POLICIES.md`: turnaround, refund, appeal, extension, void, and revoke behavior.
- `docs/LEGAL.md`: public-demo limits.
- `SECURITY.md`: private reporting and synthetic-data rules.

## Development

Requires Node.js 22. Run `npm install`, then `npm run dev` for the local demo. Use `npm run check` to run lint, the deterministic domain tests, and the production build.

## Contributing

Keep examples synthetic. Do not add real customer records, private correspondence, transaction documents, credentials, or unsupported performance claims. Preserve visible uncertainty and append-only report history.

## License

[MIT](./LICENSE)
