# Development registration

1. Create a **development** GitHub App under the intended GitHub account or organization. Use `config/app-manifest.json` as a reference, replacing placeholder URLs with actual reachable endpoints.
2. Grant Actions: read and Metadata: read. Subscribe to workflow_run (and installation if desired). Limit installation to selected private POC repositories.
3. Create a webhook secret and download the GitHub App private key. Store both outside the repository.
4. Install Node.js 22+ and run `npm install && npm run typecheck && npm test && npm run build`.
5. Create a local `.env` from `.env.example`, populate `APP_ID`, `PRIVATE_KEY`, and `WEBHOOK_SECRET`. Probot accepts the private key value or path according to its runtime configuration.
6. Run `npm start`. Deliver webhook events through your configured HTTPS endpoint or a development relay. Trigger a workflow run in the installed private test repository.
7. Verify logged normalized workflow completion. The first scaffold has **no signing or publishing side effects**.

Never commit private keys, installation tokens, or webhook secrets. Do not substitute a test event for proof of a real installation webhook.
