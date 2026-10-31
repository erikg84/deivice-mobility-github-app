# Multi-application onboarding — signer-owned registry

## Scope (2026-10-31)

The Python signer owns a strict, explicit repository-ID keyed application registry in `src/mobility_signer/application_registry.py`. It currently contains **one approved application** (`erikg84/apk-signing-poc-app`, repository ID `1437716718`). Existing POC behavior and pinned artifact/run identities remain unchanged.

Each entry fixes the approved repository ID/name, workflow ID/path, Android application ID, signer-owned profile and publication prefix. Unknown/mismatched repositories, duplicate repository IDs or publication prefixes, malformed identifiers and unsafe prefixes fail closed. A caller's GitHub App candidate descriptor **cannot create, modify or authorize a registry entry**.

The prior `production_poc_policy()` resolves this existing entry. This is an incremental foundation; the source-specific GitHub API reader, artifact downloader, and workflow resolution remain pinned to the POC. Therefore, **adding a second registry entry alone does not enable a second app end-to-end**. Multi-repository capability must explicitly parameterize and test those components first, with signer-owned allowlists and real provenance verification.

## Onboarding acceptance sequence

1. Obtain repository ID and full name and approve workflow ID/path, package ID, signing profile and publication prefix independently.
2. Add an explicit reviewed registry entry, with unique repository ID and destination.
3. Parameterize signer-side GitHub token scope, provenance reader, completed-run resolver, downloader and artifact/package policy **without accepting caller-chosen values as authority**.
4. Add positive and negative tests for both repositories, cross-repository swaps, duplicate destinations, missing artifacts, replay and unexpected package IDs.
5. Run local tests on the Mac Studio runner and independently verify a successful real unsigned artifact for the new repository.
6. Separately authorize signing and publishing and capture signer-side receipts.

## Current verification boundary

The registry foundation and unit tests are added; the Mac Studio self-hosted workflow will validate them. This milestone does **not** invoke a signing backend, change key custody, trigger a new APK build, or publish to JFrog. Existing GitHub App API-first read-only qualification of the original repository stays the historical baseline.
