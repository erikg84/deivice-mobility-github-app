# Changelog

## API-first final acceptance (2026-10-31)

- Fast-forwarded `main` to pick up the API-first Octokit CLI (`src/cli.ts`) added since Phase 5 (reference commit `7c69d3235a732affe371927642a4c6b0ac475e57`).
- Repaired `package-lock.json`: `@octokit/app` and its transitive dependencies (`@octokit/auth-app`, `@octokit/core`, `@octokit/webhooks`, etc.) were missing from the committed lockfile; `npm install --package-lock-only` restored them. `npm ci`, `npm run typecheck`, `npm test` (7/7), and `npm run build` all pass.
- Authenticated as the real GitHub App (`5554493`) and installation (`177191086`) and ran all four CLI commands (`installations`, `repos`, `runs`, `artifacts`) against live GitHub data; both authorized repositories were returned correctly, and the `artifacts` query correctly returned an empty array for run `41212205303` (no build job ever executed for that run).
- Verified webhook independence directly: stopped the Probot process and the Cloudflare Quick Tunnel and unset the webhook-related env vars, then re-ran the CLI — identical results, confirming no dependency on the webhook listener, tunnel, secret, or any public endpoint.
- Updated `README.md` (carried over from the CLI commits), `docs/API_FIRST.md`, `docs/ARCHITECTURE.md`, and `docs/VALIDATION.md` with the verified evidence.
- No artifact download, APK signing, or Artifactory publishing occurred or is implemented in this repository.

## Phase 5 — Live webhook integration verified (2026-10-31)

- Resolved the webhook secret locally (pre-existing, gitignored `.env`/`.secrets`); no new secret generation or GitHub-side rotation was required — the value and the GitHub App's configured webhook URL already matched.
- Started Probot 14.3.5 on the MacBook (`127.0.0.1:3100`) using the `PRIVATE_KEY_PATH` / `WEBHOOK_SECRET` / `APP_ID` / `PORT` / `WEBHOOK_PATH` env contract supported by the installed Probot version.
- Verified the existing Cloudflare Quick Tunnel (`https://connected-tahoe-seats-chelsea.trycloudflare.com`) forwards to Probot; an unsigned request correctly returns `400` (signature validation working), not a routing failure.
- Added the test repository `erikg84/apk-signing-poc-app` to the GitHub App installation (installation `177191086`), alongside the existing `erikg84/deivice-mobility-github-app`, via the account owner's interactive GitHub session — confirmed independently afterward via the Apps API (`total_count: 2`).
- Triggered the `Build unsigned POC APK` workflow in the test repository. Its self-hosted runner (`macstudio-apk-signing-poc`) was offline, so the job itself never ran (run `41212205303`, manually cancelled while queued) — this is a runner-availability limitation, independent of webhook delivery.
- Confirmed a real, GitHub-signed `workflow_run.completed` webhook delivery (guid `380260b0-d53c-11f1-8f81-e69615cdda5d`) reached Probot through the tunnel with `HTTP 200`, and correlated GitHub's delivery record with Probot's log line (installation ID, repository ID, run ID, attempt, commit SHA, workflow ID all match).
- Redelivered the same event via the GitHub Apps API and confirmed Probot received and logged it again with `HTTP 200`, with no additional side effects.
- Confirmed the event handler (`src/index.ts`, `src/events.ts`) performs no APK signing or Artifactory calls — it only logs a generic envelope.
- Updated `README.md`, `docs/ARCHITECTURE.md`, `docs/VALIDATION.md`, and added `docs/CLOUDFLARE_TUNNEL.md` with the live-verified architecture and evidence.

**Known limitation:** the APK build itself did not execute in this test because the self-hosted runner for the test repository was offline. The webhook integration (GitHub → Cloudflare → Probot) is independently verified regardless of runner availability.

---

## API-first integration checkpoint — 2026-10-31

The current integration design and verified-versus-pending acceptance gates are in [API-first artifact handoff](docs/API_FIRST_HANDOFF.md). The generic GitHub App (`erikg84/deivice-mobility-github-app`) has passed real installation-scoped read-only API tests without a webhook or Cloudflare. The Python signing service remains independent and retains artifact/provenance/signing/publication responsibility. The dummy app's most recent run `41212205303` was **cancelled with no artifact**, so no new cross-repository handoff or signing test is claimed. Previous POC signing receipts remain historical evidence, not proof of this new API-first integration. Webhook-specific instructions above describe an **optional legacy/event-driven path**, not a prerequisite for API-first usage.
