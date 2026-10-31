# Changelog

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
