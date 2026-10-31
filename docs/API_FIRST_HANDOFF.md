# GitHub App API-first artifact handoff — Version 1

**Status:** Metadata handoff contract documented; cross-service runtime orchestration **not yet integrated**. This document describes the boundary across three separate repositories:

- GitHub integration: `erikg84/deivice-mobility-github-app` (TypeScript/Octokit)
- Protected signer: `erikg84/mobility-apk-signing-service` (Python)
- Unsigned producer: `erikg84/apk-signing-poc-app` (Android)

## Division of responsibility

The generic integration discovers installation access, completed runs and artifacts using GitHub App read-only permissions. It may pass a **credential-free candidate descriptor** to the signer. It must never supply arbitrary signing keys, artifact bytes, Artifactory paths or installation tokens to the caller. The signer independently re-fetches all GitHub metadata, checks its own allowlist, obtains an appropriately scoped token, retrieves the exact artifact and validates APK integrity before any signing or publishing. The producer only builds and uploads unsigned input.

No inbound webhook, Cloudflare Tunnel, permanently running Probot service, or public URL is required for the API-first discovery path. Probot remains optional for event-driven operation.

## Candidate descriptor (metadata only)

```json
{
  "schema_version": "1",
  "source": "github_actions",
  "installation_id": 177191086,
  "repository_id": 1437716718,
  "repository": "erikg84/apk-signing-poc-app",
  "workflow_run_id": 41212205303,
  "run_attempt": 1,
  "artifact_id": 1234567890
}
```

The example artifact ID is a **placeholder**. Run `41212205303` was cancelled without building an APK and had zero artifacts; it is **not** a qualified signing candidate.

The descriptor is a lookup hint, **not** an authorization decision. For example, an installation ID, run ID, or artifact ID from a caller cannot override signer policy. The signer determines expected workflow path/ID, ref, commit, run conclusion, artifact name, application ID and digest from independently checked sources and local policy. Unknown versions or ambiguous run/artifact matches must be rejected.

## Candidate export command

For a **successful** completed run with an actual unexpired artifact, use:

```bash
npm run cli -- candidate --installation 177191086 --repo erikg84/apk-signing-poc-app --run <successful-run-id> --artifact <real-artifact-id>
```

The command queries the repository, run and artifact with installation-scoped credentials. It refuses cancelled/unsuccessful runs and mismatched or expired artifacts, and prints only the credential-free descriptor. It does **not** authorize signing or dispatch to the Python signer. The signer must re-verify everything independently.

## Current capabilities and gaps

- **Verified:** App JWT and installation-token authentication; read-only installations, repositories, runs and artifacts queries; GitHub App CLI without Cloudflare/Probot; tests and CI.
- **Previously proven in independent signing POC:** protected GitHub artifact retrieval, provenance validation, APK signing, and JFrog readback.
- **Now implemented:** manual read-only candidate descriptor export, including successful-run and artifact/run checks. **Not yet implemented:** automated metadata transfer between these repositories, invocation by the TypeScript CLI, and a fresh end-to-end demonstration on one newly built APK. Do not interpret the descriptor example as an executed handoff.
- **Operational dependency:** a successful, non-expired unsigned APK workflow artifact is needed for the next live test. The Mac Studio runner assigned to the dummy app's latest attempt was offline.

## Next acceptance

1. Restore/replace the dummy app build runner without modifying unrelated services, or use a separately approved existing successful artifact.
2. Identify a completed successful run and its unique, unexpired unsigned APK artifact.
3. Produce a candidate descriptor without secrets.
4. Have the protected signer independently verify the exact repository/workflow/run/artifact/identity and download bytes using its own installation token.
5. Prove digest, APK identity, signature and Artifactory verification separately; record actual receipts.

The signer retains final authority; no cross-repository trust is implicit.

## API-first verified artifact checkpoint — 2026-10-31

A **real successful October 29 workflow artifact** has been located and downloaded: run `40799940323`, artifact `12865143006`. Its ZIP digest matches GitHub, and the enclosed unsigned APK digest matches both included checksum and metadata. See [artifact qualification evidence](API_FIRST_ARTIFACT_QUALIFICATION_20261031.md). This resolves the **missing-artifact discovery** blocker, but does **not** prove a newly executed TypeScript CLI handoff, independent Android binary validation, additional signing, or JFrog publication.


## Final qualification checkpoint — 2026-10-31

The candidate CLI was run with the real IDs above (not the placeholder) and emitted exactly the descriptor shown; the same command against cancelled run `41212205303` fails closed with `RUN_NOT_SUCCESSFUL`. The protected signer independently re-verified this artifact on its own host using only the GitHub App private key (`tools/check_github_app.py` and `tools/qualify_live_artifact.py`, both PASS/`qualified:true`, `signing_authorized:false`), and rejected a mismatched App/installation pair. See [artifact qualification evidence](API_FIRST_ARTIFACT_QUALIFICATION_20261031.md) for full output. This artifact was already signed and published once on 2026-10-29 (Dell host, replay ledger SIGNED); no new signing or publication was attempted or is proposed here.

## Registry-driven signing-service integration (2026-10-31)

The TypeScript CLI remains read-only and generic: its candidate descriptor is never signing authority. The independent Python signer now uses a service-owned application registry for approved repository policy, scoped installation tokens, and GitHub provenance/artifact paths. The existing POC is the sole approved entry; another app must be explicitly onboarded and independently qualified. Probot/Cloudflare is optional, not required for API-first operation. See [multi-app onboarding](MULTI_APP_ONBOARDING.md). No new signing or publication is claimed by this update.

**Superseded by the checkpoint below:** "the existing POC is the sole approved entry" no longer holds — a second application has since been onboarded and independently qualified read-only.

## Second application checkpoint — 2026-10-31 (later same day)

The checkpoints above cover the first application (`erikg84/apk-signing-poc-app`). This section documents that the **same API-first candidate-descriptor flow was now exercised end-to-end for a second real application**, `erikg84/mock-android-2` (repository ID `1441266259`), using the same generic, repo-agnostic code path — no application-specific logic was added to this integration service.

- **GitHub App installation extended:** installation `177191086` (App ID `5554493`) was extended, via the GitHub web UI (Settings → Installed GitHub Apps → Configure → Repository access), to include `erikg84/mock-android-2` alongside the existing repositories. Installation-scoped API access to this repository's runs/artifacts was independently verified afterward.
- **Real successful run and artifact:** run `41245117223` (commit `961fa907c6d5c8c88d40e46fc6230f6dd8b312ba`), conclusion `success`, executed on a new repository-scoped Mac Studio runner (`macstudio-mock-android-2`). Real artifact `13059381426` (`unsigned-apk-961fa907c6d5c8c88d40e46fc6230f6dd8b312ba`, 616911 bytes, unexpired).
- **Candidate CLI run against the real success:**

  ```bash
  npm run cli -- candidate --installation 177191086 --repo erikg84/mock-android-2 --run 41245117223 --artifact 13059381426
  ```

  emitted the correct credential-free descriptor (`repository_id: 1441266259`, `workflow_run_id: 41245117223`, `artifact_id: 13059381426`), with no secrets, keys, or artifact bytes included.
- **Candidate CLI correctly rejects the cancelled run:** the same command run against this repository's own cancelled run `41243533281` fails closed with `RUN_NOT_SUCCESSFUL`, exactly as the first application's cancelled-run case did.
- **Independent signer qualification:** the Python signer service (`erikg84/mobility-apk-signing-service`) added a second, isolated registry entry (`repository_id=1441266259`, `application_id="com.example.signingpoc2"`, disposable placeholder `signing_profile="poc2-disposable"` / `destination_prefix="signing-poc2/"`) and independently re-verified this exact real artifact end-to-end against the live GitHub App: `qualify_readonly()` returned `qualified: true, signing_authorized: false`, with the computed `apk_sha256` matching the independently re-hashed artifact (`dfc04118e6c6e58ac75110aacab978214946e6cbb64cb1d25d1495ed6b06a2b4`). A mismatched App/installation pair was correctly rejected. **The original application's (`apk-signing-poc-app`) registry entry and policy are completely unchanged.**
- **No signing or publication occurred for either application in this checkpoint.** This second application has no signing key or Artifactory destination; `ProtectedSigningAdapter` in the signer service still only recognizes the original POC application's profile/application_id. Only read-only candidate-descriptor generation and read-only signer qualification were exercised.

Full evidence for this second application's repository/CI/artifact state lives in `erikg84/mock-android-2`'s own `docs/ONBOARDING.md`; this section records only the cross-repository API-first handoff behavior that is this repository's responsibility.
