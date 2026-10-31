# POC acceptance and execution plan

## Source checks

The `Validate GitHub App` workflow runs installation, TypeScript typecheck, unit tests, and build on pushes to main. A workflow definition alone is not proof of success: inspect the actual run result and logs.

## Live test: development GitHub App

1. Create a GitHub App owned by the test account, with Actions read permission and `workflow_run` subscription. Use the reference manifest only after replacing placeholder URLs.
2. Install the App on **selected repositories**, initially only `erikg84/apk-signing-poc-app`.
3. Set `APP_ID`, `PRIVATE_KEY_PATH`, and `WEBHOOK_SECRET` on the host. Store the downloaded key outside version control.
4. For development, create a Smee relay and configure `WEBHOOK_PROXY_URL` on the host; configure the same relay URL as the GitHub App webhook URL. Run `npm start`.
5. Trigger a real workflow run in the installed dummy app repository, and verify that Probot logs a `workflow_run.completed` event with the expected repository ID, run ID, attempt, workflow ID, commit SHA, and installation ID.
6. Redeliver the webhook in GitHub and verify it is observable. No downstream signing or publishing should occur.
7. Confirm an uninstalled repository cannot cause an authorized downstream operation. This initial service has no downstream operation.

## Evidence ledger

| Gate | State | Evidence |
|---|---|---|
| Source committed to main | COMPLETE | Repository commit history |
| Build, typecheck, tests pass | COMPLETE | `npm run typecheck` clean; `npm test` 3/3 passing |
| App registered | COMPLETE | App ID `5554493`, owner `erikg84` (private key never committed) |
| Installation restricted to selected test repo | COMPLETE | Installation `177191086` scoped to exactly `erikg84/apk-signing-poc-app` and `erikg84/deivice-mobility-github-app` (verified via `GET /installation/repositories` with an installation token, `total_count: 2`) |
| Genuine webhook event observed | COMPLETE | GitHub delivery `380260b0-d53c-11f1-8f81-e69615cdda5d` (id `3851423886876868608`), event `workflow_run` action `completed`, `status_code 200`, delivered 2026-10-31T15:03:25Z. Probot log line `"Workflow completion received"` carries the identical guid and payload (installationId 177191086, repositoryId 1437716718, runId 41212205303, attempt 1, headSha `ceb4c97e6435ef7221eda87c6a00ac7081eb1ccf`, workflowId 399993624) |
| Duplicate event observed | COMPLETE | Same guid redelivered via `POST /app/hook/deliveries/{id}/attempts`, new delivery id `3851424002736136192`, `redelivery: true`, `status_code 200`; Probot logged a second identical "Workflow completion received" entry |
| Integration with separate signing service | NOT STARTED | Out of scope of first gate; `src/events.ts`/`src/index.ts` contain no signing or Artifactory calls |

There is no direct GitHub App registration action exposed in this repository. An operator must register and install the App through GitHub; never add its private key to the repo.

## Live acceptance test (Phase 5, 2026-10-31)

- **Runner limitation:** the test repo's workflow (`Build unsigned POC APK`) targets a self-hosted runner (`macstudio-apk-signing-poc`) that was offline during this test, so GitHub Actions never executed the build job itself (run `41212205303` ended `cancelled` after being manually cancelled while queued). This is independent of webhook delivery — GitHub emits `workflow_run` events (`requested`, `in_progress`, `completed`) regardless of whether a runner picks up the job, and all three were delivered successfully.
- **Webhook delivery:** fully verified end-to-end — GitHub → Cloudflare Quick Tunnel (`https://connected-tahoe-seats-chelsea.trycloudflare.com`) → `cloudflared` on the MacBook → Probot 14.3.5 on `127.0.0.1:3100` → generic event handler. Every delivery, including the redelivery, returned HTTP 200.
- **No side effects:** the handler only logs a generic envelope; no signing or Artifactory calls exist in the codebase.
