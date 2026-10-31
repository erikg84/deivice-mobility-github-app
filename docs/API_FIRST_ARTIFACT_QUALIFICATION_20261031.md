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
