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
| Build, typecheck, tests pass | PENDING | Successful executed validation run |
| App registered | PENDING | App ID and owner (never private key) |
| Installation restricted to selected test repo | PENDING | App installation settings |
| Genuine webhook event observed | PENDING | Redacted host logs and matching GitHub delivery |
| Duplicate event observed | PENDING | GitHub redelivery and logs |
| Integration with separate signing service | NOT STARTED | Out of scope of first gate |

There is no direct GitHub App registration action exposed in this repository. An operator must register and install the App through GitHub; never add its private key to the repo.
