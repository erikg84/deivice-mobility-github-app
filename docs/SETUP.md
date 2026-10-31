# Development registration

1. Create a **development** GitHub App under the intended GitHub account or organization. Use `config/app-manifest.json` as a reference, replacing placeholder URLs with actual reachable endpoints.
2. Grant Actions: read and Metadata: read. Subscribe to workflow_run (and installation if desired). Limit installation to selected private POC repositories.
3. Create a webhook secret and download the GitHub App private key. Store both outside the repository.
4. Install Node.js 22+ and run `npm install && npm run typecheck && npm test && npm run build`.
5. Create a local `.env` from `.env.example`, populate `APP_ID`, `PRIVATE_KEY`, and `WEBHOOK_SECRET`. Probot accepts the private key value or path according to its runtime configuration.
6. Run `npm start`. Deliver webhook events through your configured HTTPS endpoint or a development relay. Trigger a workflow run in the installed private test repository.
7. Verify logged normalized workflow completion. The first scaffold has **no signing or publishing side effects**.

Never commit private keys, installation tokens, or webhook secrets. Do not substitute a test event for proof of a real installation webhook.

---

## API-first integration checkpoint — 2026-10-31

The current integration design and verified-versus-pending acceptance gates are in [API-first artifact handoff](API_FIRST_HANDOFF.md). The generic GitHub App (`erikg84/deivice-mobility-github-app`) has passed real installation-scoped read-only API tests without a webhook or Cloudflare. The Python signing service remains independent and retains artifact/provenance/signing/publication responsibility. The dummy app's most recent run `41212205303` was **cancelled with no artifact**, so no new cross-repository handoff or signing test is claimed. Previous POC signing receipts remain historical evidence, not proof of this new API-first integration. Webhook-specific instructions above describe an **optional legacy/event-driven path**, not a prerequisite for API-first usage.
