# API-first artifact qualification — 2026-10-31

## Verified read-only evidence

GitHub Actions successful completed workflow `40799940323`, attempt `1`, repository `erikg84/apk-signing-poc-app` (ID `1437716718`), workflow ID `399993624`, commit `d46f235b20f8bbcda40be0b714083d5172213637`, event `workflow_dispatch`, branch `main`.

The live GitHub artifact listing returned one unexpired artifact:

- Artifact ID: `12865143006`
- Artifact name: `unsigned-apk-d46f235b20f8bbcda40be0b714083d5172213637`
- Artifact ZIP size: `617358` bytes
- GitHub ZIP digest: `sha256:c36e64add8ad2236c07ea45e16f698e7dabe27a4c1fa7137079b75c67bcbaab6`

The actual ZIP was downloaded through GitHub and examined without executing the APK:

- Downloaded ZIP SHA-256: `c36e64add8ad2236c07ea45e16f698e7dabe27a4c1fa7137079b75c67bcbaab6` — **matches GitHub**.
- Exactly one APK entry: `app/build/outputs/apk/release/app-release-unsigned.apk`.
- APK bytes: `620953`.
- APK SHA-256: `81ac155b3a8730780fc4eb607dc949f352cb55fb2f0558b19ec6374a35c347a7` — **matches both** `app-release-unsigned.sha256` and `apk-metadata.json`.
- Metadata application ID claim: `com.example.signingpoc`. This is **not** independent binary manifest/package verification.
- ZIP entries: one APK, one checksum text file, and one metadata JSON file.

## Credential-free candidate descriptor

```json
{
  "schema_version": "1",
  "source": "github_actions",
  "installation_id": 177191086,
  "repository_id": 1437716718,
  "repository": "erikg84/apk-signing-poc-app",
  "workflow_run_id": 40799940323,
  "run_attempt": 1,
  "artifact_id": 12865143006
}
```

This descriptor is a lookup hint, **not** authorization to sign. Signer-side `live_poc.py` already pins the exact successful run, commit, artifact identity, and expected ZIP/APK digests, so this is an existing historically qualified POC input rather than a freshly built APK.

## Outcome and boundaries

**VERIFIED:** Successful GitHub run/artifact identity, unexpired artifact, actual artifact download, ZIP digest consistency, single APK entry, and APK hash agreement with bundled metadata.

**NOT VERIFIED IN THIS PHASE:** Running the TypeScript candidate CLI with the private key; protected signer host execution of the handoff; Android binary package/signature verification; new signing operation; JFrog publishing/reconciliation; and fresh new APK build. Existing older signing evidence is separate.

The current TypeScript candidate command only exports metadata. The Python signer independently obtains authorized GitHub access and validates the source. Do not pass installation tokens or signing keys across the handoff. Keep the Python service separate from the GitHub integration app.

## Next controlled acceptance

Execute the candidate CLI against the above IDs using the MacBook's local GitHub App private key, then independently re-run signer qualification against the existing pinned successful artifact on its protected host. Signing and publishing are separate explicit acceptance gates. Do not reuse this artifact for a second signing/publishing transaction without evaluating the signer's replay ledger.

## Final qualification — 2026-10-31 (API-first, real artifact)

Executed the full chain end-to-end with real credentials, on the real App/installation, against the real pinned successful artifact:

**TypeScript candidate CLI** (`erikg84/deivice-mobility-github-app`, commit `3829cb5387726cd770a8834e7227df56a571ce64` baseline, candidate feature added there):
```json
{
  "schema_version": "1",
  "source": "github_actions",
  "installation_id": 177191086,
  "repository_id": 1437716718,
  "repository": "erikg84/apk-signing-poc-app",
  "workflow_run_id": 40799940323,
  "run_attempt": 1,
  "artifact_id": 12865143006
}
```
Running the same command against the previously cancelled run `41212205303` fails closed with `RUN_NOT_SUCCESSFUL` (no descriptor emitted). No installation token, private key, or signing authorization appears anywhere in this output.

**Protected signer qualification** (`erikg84/mobility-apk-signing-service`), run on the MacBook using the GitHub App private key only (no signing keystore touched):
- `tools/check_github_app.py --key-file ~/Downloads/device-mobility-github-app.2026-10-31.private-key.pem` → `{"app_read_access":"PASS","repository":"erikg84/apk-signing-poc-app","workflow_id":399993624,"run_id":40799940323,"artifact_id":12865143006,"signing_authorized":false}`
- `tools/qualify_live_artifact.py` (same key) → `{"qualified":true,"signing_authorized":false,"run_id":40799940323,"artifact_id":12865143006,"apk_sha256":"81ac155b3a8730780fc4eb607dc949f352cb55fb2f0558b19ec6374a35c347a7","apk_size":620953}`
- A mismatched App ID/installation pair (`5554493` with installation `176398485`) fails closed on both tools with no qualification and `signing_authorized: false`, confirming the allowlist enforcement.
- Independent read of the artifact metadata confirms GitHub ZIP digest `sha256:c36e64add8ad2236c07ea45e16f698e7dabe27a4c1fa7137079b75c67bcbaab6`, `workflow_run.id=40799940323`, `head_sha=d46f235b20f8bbcda40be0b714083d5172213637`, `expired=false` — all matching the pinned POC identifiers.
- Full test suites pass: TypeScript 10/10; Python 112/112 (`PYTHONPATH=src python3 -m unittest discover -s tests`), including `test_qualification_cli`, `test_github_app_auth`, `test_github_provenance`, `test_qualification`, `test_artifact_integrity`, and `test_artifact_redirect` individually.

**Replay ledger:** no new signing/publication was attempted. Per `docs/report/POC_E2E_PROOF_20261029.md`, this exact run/artifact pair was already signed and published once, on 2026-10-29, on the Dell XPS protected host, under the then-approved GitHub App `5520293`/installation `176398485` — that record states "Replay ledger SIGNED." No SQLite ledger file exists on this MacBook (none was ever created here, since `qualify_readonly` never reserves or signs). Given the existing SIGNED record, **no new signing transaction is proposed for this artifact**; a repeat signing attempt against the same identity would be expected to fail closed as a duplicate reservation on the host that holds that ledger.

**Boundaries preserved:** no APK signing, no Artifactory publication, no modification to the dummy app's runner or any Mac Studio service occurred in this qualification pass.
