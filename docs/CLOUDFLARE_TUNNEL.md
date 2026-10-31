# Cloudflare Tunnel — Live Configuration (Phase 5)

This document supersedes the Phase 2–4 reports (`CLOUDFLARE_TUNNEL-PHASE2-REPORT.md`, `-PHASE3-REPORT.md`, `-PHASE4-FINAL-REPORT.md`) with the final, verified state. Those reports are kept for history; this file is the current reference.

## Topology

```
GitHub  --signed webhook-->  Cloudflare Quick Tunnel  --local forward-->  cloudflared (MacBook)  -->  Probot 14.3.5 (127.0.0.1:3100)
```

- **Tunnel type:** Cloudflare Quick Tunnel (`trycloudflare.com`), not a named/persistent tunnel. The public hostname changes if the tunnel process restarts.
- **Current public URL:** `https://connected-tahoe-seats-chelsea.trycloudflare.com`
- **Local target:** `http://127.0.0.1:3100`
- **Probot webhook path:** `/api/github/webhooks`
- **Process:** `cloudflared tunnel --url http://127.0.0.1:3100`, running on the MacBook.

## Verified behavior

| Check | Result |
|---|---|
| Unsigned `POST /api/github/webhooks` to the tunnel URL | `400 {"error":"Required headers missing: x-github-event, x-hub-signature-256, x-github-delivery"}` — correct Probot signature-validation rejection, not a routing failure |
| Real signed GitHub delivery through the tunnel | `200 OK`, correlated with Probot's structured log (see `docs/VALIDATION.md`) |
| Redelivery through the tunnel | `200 OK`, identical payload received again |

## Operational notes

- A Quick Tunnel has no authentication token to leak and is not committed anywhere in this repository.
- Because the hostname is ephemeral, the GitHub App's webhook URL (`https://api.github.com/app/hook/config`, settable only via the GitHub App's own JWT or the web UI) must be re-pointed whenever the tunnel is restarted. As of this report it already matches the current tunnel hostname.
- For a durable deployment, replace the Quick Tunnel with a named Cloudflare Tunnel bound to a Cloudflare-managed DNS record, so the webhook URL no longer changes on restart. That migration is out of scope for this phase.
- Do not modify the Mac Studio Next.js service from this workflow; the tunnel and Probot process here run on the MacBook only.

---

## API-first integration checkpoint — 2026-10-31

The current integration design and verified-versus-pending acceptance gates are in [API-first artifact handoff](API_FIRST_HANDOFF.md). The generic GitHub App (`erikg84/deivice-mobility-github-app`) has passed real installation-scoped read-only API tests without a webhook or Cloudflare. The Python signing service remains independent and retains artifact/provenance/signing/publication responsibility. The dummy app's most recent run `41212205303` was **cancelled with no artifact**, so no new cross-repository handoff or signing test is claimed. Previous POC signing receipts remain historical evidence, not proof of this new API-first integration. Webhook-specific instructions above describe an **optional legacy/event-driven path**, not a prerequisite for API-first usage.

## Registry-driven signing-service integration (2026-10-31)

The TypeScript CLI remains read-only and generic: its candidate descriptor is never signing authority. The independent Python signer now uses a service-owned application registry for approved repository policy, scoped installation tokens, and GitHub provenance/artifact paths. The existing POC is the sole approved entry; another app must be explicitly onboarded and independently qualified. Probot/Cloudflare is optional, not required for API-first operation. See [multi-app onboarding](MULTI_APP_ONBOARDING.md). No new signing or publication is claimed by this update.
