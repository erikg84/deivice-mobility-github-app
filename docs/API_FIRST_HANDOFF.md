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
