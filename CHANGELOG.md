# Changelog

## Second-application (mock-android-2) onboarding evidence (2026-10-31)

- Extended GitHub App installation `177191086` (App ID `5554493`) to include `erikg84/mock-android-2` (repository ID `1441266259`) via the GitHub web UI; verified installation-scoped API access afterward.
- Ran the candidate CLI against real run `41245117223` / artifact `13059381426` for this repository: emitted the correct credential-free descriptor; the same command against this repo's own cancelled run `41243533281` correctly fails closed with `RUN_NOT_SUCCESSFUL`.
- Confirmed the protected signer (`erikg84/mobility-apk-signing-service`) added an isolated second registry entry and independently re-verified this artifact end-to-end (`qualified: true, signing_authorized: false`), with the original application's registry entry and policy unchanged.
- No artifact download, APK signing, or Artifactory publishing occurred for either application in this checkpoint.

## Mac Studio self-hosted runner live (2026-10-31)

- Registered and brought online a dedicated self-hosted runner `macstudio-device-mobility-app` on the Mac Studio (repository-scoped, own `_work` dir, persistent `launchd` service).
- `Validate GitHub App` ran for real on this runner: run 41234543755, commit 0fddfaee1092cbfda1fc2bf7e58c77f2d0a5f5f2, conclusion success.
- Verified restart recovery (killed the listener process, launchd restarted it, GitHub reported it online again).

## Cross-repository artifact qualification (2026-10-31)

- Ran the real `candidate` CLI command against run `40799940323` / artifact `12865143006`: emitted the exact credential-free descriptor; the same command against cancelled run `41212205303` correctly fails closed with `RUN_NOT_SUCCESSFUL`.
- Confirmed the protected signer (`erikg84/mobility-apk-signing-service`) independently re-verified this artifact end-to-end (see that repo's changelog and `docs/API_FIRST_ARTIFACT_QUALIFICATION_20261031.md`). No signing or publishing occurred from this repository.

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

## Multi-application registry foundation — 2026-10-31

- Added shared `docs/MULTI_APP_ONBOARDING.md` with explicit onboarding and fail-closed acceptance gates.
- Python signer now has an immutable signer-owned repository registry and tests; existing POC policy is resolved through its approved entry. No additional repository is approved and no new signing/publishing is performed.
- Preserved API-first candidate descriptor semantics and independent signer-side provenance verification.

## Registry-driven source verification — 2026-10-31

The Python signer now selects an approved application policy from its signer-owned registry **before** minting an installation token. GitHub provenance lookups, completed-run resolution, artifact access, and qualification metadata paths derive from that approved repository rather than a fixed dummy-repository path. Repository-scoped token issuance accepts the selected repository ID. Unknown repositories and mismatched workflow policies fail closed. The original POC policy remains registered unchanged.

**Scope limit:** The service still has POC-specific command-line entry points, run fixtures, package checks, and signing/publication arrangements. The registry provides a foundation for policy-driven source qualification; registering and fully signing a second application requires separate tests, runner evidence, and an approved signing profile. No signing or publication was triggered by this change. The App JWT package remains required; no dependency removal was justified by the current import analysis. Historical proof reports are intentionally unchanged.
