# Architecture

This repository contains only the GitHub App's integration code. GitHub owns App registration and installations; Probot receives signed webhook requests and supplies an installation-scoped Octokit client. Events are normalized into generic envelopes for future adapters.

## Live delivery path (verified Phase 5)

```mermaid
flowchart LR
  GH[GitHub webhook delivery] -->|HTTPS, signed x-hub-signature-256| CF[Cloudflare Quick Tunnel<br/>connected-tahoe-seats-chelsea.trycloudflare.com]
  CF -->|forwards to 127.0.0.1:3100| CFD[cloudflared process<br/>on MacBook]
  CFD --> PB[Probot 14.3.5<br/>/api/github/webhooks]
  PB --> EH[Generic event handler<br/>workflow_run.completed logger]
  EH -.->|intentionally no call| DS[Independent downstream services<br/>signing, Artifactory]
```

GitHub signs each delivery with the App's webhook secret; `cloudflared` on the MacBook forwards the public tunnel URL to Probot's local port unmodified; Probot validates the signature and normalizes the payload; the event handler only logs the envelope and never calls a downstream service.

```mermaid
sequenceDiagram
  participant GH as GitHub
  participant PB as Probot service
  participant API as GitHub API
  participant DS as Independent downstream service
  GH->>PB: Signed workflow_run.completed webhook
  PB->>PB: Validate webhook via Probot and normalize event
  PB->>API: Optional installation-scoped metadata request
  API-->>PB: Repository/workflow metadata
  Note over PB,DS: No downstream dispatch implemented in this scaffold
```

## API-first path (verified, no webhook required)

```mermaid
flowchart LR
  OP[Operator shell<br/>APP_ID + PRIVATE_KEY_PATH] --> CLI[src/cli.ts<br/>Octokit App/getInstallationOctokit]
  CLI -->|JWT then installation token| API[GitHub REST API]
  API --> CLI
  CLI --> OUT[JSON metadata on stdout]
```

`npm run cli -- installations|repos|runs|artifacts` authenticates directly as the App and as the installation, using only local credentials. It needs no Probot process, no Cloudflare Tunnel, no webhook secret, and no public endpoint — verified by running it with both stopped (see `docs/VALIDATION.md`). It is read-only: no artifact bytes are downloaded and no signing/publishing call is made.

## Independence

No signing credentials or Android build logic belongs in this repository. A future adapter must not treat webhook contents as permission to sign or publish. Downstream services verify their own authorization and artifact provenance.

## Delivery

Webhook reception requires a reachable HTTPS endpoint or a development relay. A self-hosted GitHub Actions runner polls GitHub over outbound connections but is a distinct execution model, not a webhook receiver.

## Testing boundaries

Unit tests cover normalization and filtering. They do not by themselves prove live GitHub App registration, webhook delivery, installation permissions, deployment, or multi-repo interoperability — see `docs/VALIDATION.md` for the live evidence that closes that gap.

---

## API-first integration checkpoint — 2026-10-31

The current integration design and verified-versus-pending acceptance gates are in [API-first artifact handoff](API_FIRST_HANDOFF.md). The generic GitHub App (`erikg84/deivice-mobility-github-app`) has passed real installation-scoped read-only API tests without a webhook or Cloudflare. The Python signing service remains independent and retains artifact/provenance/signing/publication responsibility. The dummy app's most recent run `41212205303` was **cancelled with no artifact**, so no new cross-repository handoff or signing test is claimed. Previous POC signing receipts remain historical evidence, not proof of this new API-first integration. Webhook-specific instructions above describe an **optional legacy/event-driven path**, not a prerequisite for API-first usage.

## Registry-driven source verification — 2026-10-31

The Python signer now selects an approved application policy from its signer-owned registry **before** minting an installation token. GitHub provenance lookups, completed-run resolution, artifact access, and qualification metadata paths derive from that approved repository rather than a fixed dummy-repository path. Repository-scoped token issuance accepts the selected repository ID. Unknown repositories and mismatched workflow policies fail closed. The original POC policy remains registered unchanged.

**Scope limit:** The service still has POC-specific command-line entry points, run fixtures, package checks, and signing/publication arrangements. The registry provides a foundation for policy-driven source qualification; registering and fully signing a second application requires separate tests, runner evidence, and an approved signing profile. No signing or publication was triggered by this change. The App JWT package remains required; no dependency removal was justified by the current import analysis. Historical proof reports are intentionally unchanged.

## Current POC architecture and acceptance — 2026-11-01

The authoritative cross-repository architecture, verified evidence, operations and limitations are in [Gabe / Device Availability POC handoff](GABE_DEVICE_AVAILABILITY_POC_HANDOFF.md). Device Availability operates **one GitHub App integration, one signer, and one shared JFrog repository** `mobility-apk-signing-poc-local` for multiple approved Android application producers. The signer-owned registry selects separate prefixes: App 1 `signing-poc/`, App 2 `signing-poc2/`. The GitHub App produces untrusted candidate metadata; independent signer verification and approval are required before use of protected signing credentials. App 1 has historical live signing and publication evidence; App 2's real sign-and-publish transaction is still pending despite verified unsigned CI and 190/190 signing-service tests.
