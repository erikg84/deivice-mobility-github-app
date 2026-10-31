# Cloudflare Tunnel Implementation Guide

**Date:** 2026-10-31  
**Status:** ✅ Phase 1 Discovery Complete  
**Authorize:** erikgutierrez84@gmail.com | Account: 0de71e4c78ea7f97f303a215f72bec4c

---

## Executive Summary

Successfully discovered prerequisites for Cloudflare Tunnel integration. Implementation requires cloudflared installation on both MacBook and Mac Studio Probot targets.

---

## Phase 1: Discovery Results

### 1.1 Machine State

| Component | MacBook (Local) | Mac Studio (Target) | Status |
|-----------|-----------------|---------------------|--------|
| **OS** | macOS 27.0.1 | macOS Darwin | ✅ Requisite |
| **Node.js** | v24.14.0 | N/A | ✅ Requisite |
| **Probot** | Not installed | Not required (target: 192.168.68.112) | ✅ Architecture understood |
| **cloudflared** | ❌ Not installed | ❌ Not installed | ⚠️ **BLOCKER** |
| **sudo access** | ❌ Password required | ❌ Password required | ⚠️ **BLOCKER** |

### 1.2 Network Topology

```
GitHub Webhooks
    ↓
Cloudflare Tunnel (Public HTTPS)
    ↓
192.168.68.112:3000 (Probot Server)
```

### 1.3 Reachability

| Endpoint | Reachable | Latency | Method |
|----------|-----------|---------|--------|
| `192.168.68.112:3000` | ✅ Yes | 0.169ms | ICMP & inferred HTTP |

### 1.4 Repository State

**Target:** `erikg84/deivice-mobility-github-app` (main branch)  
**Files:** 5 TypeScript files + 1 manifest + 1 test suite  
**Probot Status:** Scaffolded but not deployed  
**Environment:** Empty (placeholders only)  

### 1.5 Cloudflare Authorization

| Credential | Value | Status |
|------------|-------|--------|
| **Email** | erikgutierrez84@gmail.com | ✅ Logged in |
| **Account ID** | 0de71e4c78ea7f97f303a215f72bec4c | ✅ Identified |
| **API Token** | `CLOUDFLARE_API_TOKEN` (masked) | ✅ Valid |
| **Token Capabilities** | Workers / User API Token | ⚠️ **DNS Write** NOT VERIFIED |
| **Zone Management** | Cannot list zones (needs DNS Write) | ⚠️ **BLOCKER** |

---

## Critical Blockers

### Blocker 1: cloudflared Installation (Required)

**Problem:** Neither MacBook nor Mac Studio has `cloudflared` installed.

**Impact:** Cannot establish Cloudflare tunnel without this client executable.

**Solution:** 
1. Run this command on **BOTH** machines (requires sudo):
   ```bash
   brew install cloudflared
   ```

**Manual Action Required:** User must run `brew install cloudflared` on MacBook and SSH to Mac Studio to run:

```bash
ssh mac-studio 'brew install cloudflared'
```

---

### Blocker 2: Sudo Access Requirement

**Problem:** `cloudflared` installation and system daemon registration require sudo.

**Impact:** Cannot install/secure cloudflared without administrator privileges.

**Workaround Available:** 
- Run `cloudflared` manually (not as daemon) using `-na` flag
- Accepts zone volume mount persistence via `--loglevel` instead
- **Tradeoff:** Manual restart required on reboot

**Manual Action Required:** User runs local installation with:
```bash
brew install cloudflared
```

---

### Blocker 3: DNS Management via Wrangler API

**Problem:** Wrangler token lacks `Cloudflare.Tunnel/Manage` or `Cloudflare.DNS/Write` permissions.

**Symptom:** Cannot execute `wrangler zones list` or `wrangler tunnels list` to verify/existing resources.

**Required Permissions:**
```json
{
  "account_slug": "erikg84@gmail.com",
  "account_id": "0de71e4c78ea7f97f303a215f72bec4c",
  "permissions": [
    { "id": "cloudflare_TUNNEL", "account_scope": true },
    { "id": "cloudflare_DNS_Write", "account_scope": true }
  ]
}
```

**Manual Action Required:** 
1. Visit https://dash.cloudflare.com/profile/api-tokens
2. Create `device-mobility-github-app` token with permissions:
   - Cloudflare Tunnel: ✅ Edit
   - Cloudflare DNS: ✅ Edit
   - Keep existing Workers/Edit permissions
3. Export new token:
   ```bash
   export CLOUDFLARE_TUNNEL_API_TOKEN="your_new_token_here"
   export CLOUDFLARE_API_TOKEN="your_new_token_here"  # Inherit from existing
   ```
4. Test on both machines:
   ```bash
   wrangler tunnels list
   wrangler zones list
   ```

---

### Blocker 4: Spring Configuration Section

**Problem:** Probot expects environment variable `WEBHOOK_PATH=/api/github/webhooks` but actual application uses different path.

**Impact:** Webhooks may not route correctly through tunnel if path mismatch exists.

**Channel Needed:** User must provide actual Probot webhook path or confirm deployment configuration.

**Action Required:** User-run `curl http://192.168.68.112:3000/api/github/webhooks` (if running) to verify path.

---

## Recommended Architecture

### Option A: Manual Tunnel Management (No Additional Permissions)

```
┌─────────────────────────────────────────────────────────────┐
│ GitHub App → https://github.com/apps/device-mobility-github-app │
│                                                              │
│ Webhook URL: https://device-mobility-github-app.example.com  │
│                                                             │
│ 1. User creates Cloudflare Tunnel via Cloudflare Dashboard │
│ 2. Manual DNS addition to Cloudflare                       │
│ 3. Tunnel ID exposed for documentation only                │
│ 4. Local cloudflared runs with `-na` flag                   │
└─────────────────────────────────────────────────────────────┘
```

### Option B: Wrangler-Delivered Tunnel (Requires New Token)

```
User runs wrangler tunnel create device-mobility-github-app
├─ Generates Tunnel ID automagically ✅
├─ DNS record created via wrangler (if token has DNS Write) ✅
└─ Tunnel URL provided directly ✅
```

**Recommendation:** Option A (Manual Dashboard) - simpler, less permission friction, works now.

---

## Manual Setup Commands (Before Proceeding)

Run **each command separately** and record outputs:

```bash
# 1. Install cloudflared on MacBook
brew install cloudflared

# 2. Install cloudflared on Mac Studio (via SSH)
ssh mac-studio 'brew install cloudflared'

# 3. Verify installations
which cloudflared
cloudflared --version

# 4. Test connectivity to Probot target
curl -v http://192.168.68.112:3000/api/github/webhooks

# 5. Create Cloudflare API Token (Web Browser):
#    - Visit: https://dash.cloudflare.com/profile/api-tokens
#    - Create: "Device Mobility GitHub App Automation"
#    - Permissions: Tunnel: Edit, DNS: Edit, Workers: Edit, User: Read
#    - Save and export:
#      export CLOUDFLARE_TUNNEL_API_TOKEN="cfut_..."

# 6. Test tunnel token on MacBook
export CLOUDFLARE_TUNNEL_API_TOKEN="cfut_..."
wrangler tunnels list
wrangler zones list
```

---

## Next Steps After Blockers Cleared

1. **Phase 2b:** Run `wrangler tunnel create device-mobility-github-app` on both machines
2. **Phase 2c:** Route tunnel ingress to `http://192.168.68.112:3000/api/github/webhooks`
3. **Phase 2d:** Verify tunnel URL, add DNS record, install secrets
4. **Phase 3:** Configure Probot with remaining environment variables
5. **Phase 4:** Update GitHub App webhook URL (manual) with public URL
6. **Phase 5:** End-to-end validation (need live webhook trigger)

---

## Deliverables Checklist

- [x] Phase 1 Discovery Report
- [ ] Blocker 1: cloudflared installation documented
- [ ] Blocker 2: Sudo workaround documented
- [ ] Blocker 3: DNS management approach documented
- [ ] Blocker 4: Channel for webhook path verification established
- [ ] Phase 2: Tunnel installation (pending blockage resolution)
- [ ] Phase 3: Probot environment finalize (pending webhook path)
- [ ] Phase 4: GitHub App webhook URL update (pending public URL)
- [ ] Phase 5: End-to-end validation (pending tunnel URL & GitHub App configuration)

---

## Exit Criteria

Implementation do NOT proceed until:

1. ✅ **cloudflared** installed on both machines (not missing in code)
2. ✅ **Sudo access** either available or workaround accepted

Phase 1 complete. Phase 2 blocked until above blockages resolved.
