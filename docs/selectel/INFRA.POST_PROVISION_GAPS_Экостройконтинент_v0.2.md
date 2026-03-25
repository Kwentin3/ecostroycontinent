# INFRA.POST_PROVISION_GAPS_Экостройконтинент_v0.2

## Summary

Retry-pass закрыл минимальный VM/runtime/deploy contour, storage baseline и off-host backup path, но не закрыл CDN/DNS branch. Ниже перечислены остаточные gaps после provisioning.

## 1. Gaps That Do Not Block Basic Work Right Now

### Public domain already wired

- Runtime already отвечает через floating IP `178.72.179.66`
- public DNS now resolves for both apex and `www`
- public Let's Encrypt certificate is installed on the VM runtime
- Linux VM-side validation was still completed honestly as the first canonical Docker environment

### Traefik is adjacent, not folded into the canonical compose file

- this is allowed by the accepted contracts
- runtime is operational and traceable in the current shape

## 2. Gaps That Should Be Closed Before More Serious Exploitation

### CDN baseline

Still missing:

- final decision whether phase 1 should stay on the provider default CDN hostname or later move to a project-owned CDN hostname

Storage baseline is already real:

- `ecostroycontinent-media-ru3-20260324`
- `ecostroycontinent-backups-ru3-20260324`
- `media` bucket type is already `public`

Current factual CDN state:

- CDN resource `ecostroycontinent-media-cdn` already exists
- default CDN domain already assigned:
  - `fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net`
- resource status at the time of this update:
  - `active`
- HTTP object fetch already works:
  - `http://fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net/cdn-probe.txt`
- HTTPS object fetch also works:
  - `https://fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net/cdn-probe.txt`

### Backup hardening beyond the first off-host baseline

Still missing:

- restore drill from the uploaded S3 artifact
- remote lifecycle / retention policy for the backups bucket
- optional backup integrity check beyond successful upload logging

### Public DNS cutover

Still missing:

- no DNS-side blocker remains for the current apex + `www` public path

Current factual state:

- `ecostroycontinent.ru` resolves to `178.72.179.66`
- `www.ecostroycontinent.ru` resolves to `178.72.179.66`
- both names are covered by the installed Let's Encrypt certificate

Practical implication:

- public site-domain TLS is now materially closed on the server side
- any remaining verification oddities from this Windows machine should be treated as local client-path issues unless contradicted by external checks

## 3. Recommended Next Step

Next best step is **not** redesign.

Next best step is a narrow corrective pass:

1. record the final factual media delivery path as operational in all remaining docs;
2. run one restore-oriented backup drill from S3;
3. add remote lifecycle/retention on the backups bucket.

## 4. Additional Hygiene Follow-Ups

- bump GitHub actions used in workflows away from Node 20-era action versions
- decide whether the host repo checkout should remain root-owned or be normalized for easier operator maintenance
- later tighten Traefik dashboard access posture if the dashboard is kept

## 5. Current Honest State

### Completed baseline areas

- VM
- host runtime
- Traefik
- app + sql runtime
- GHCR pull
- self-hosted runner
- manual deploy trigger
- local backup/logging/cleanup hooks
- S3 storage
- off-host backup upload

### Partial baseline areas

- forensic / retention
- local Windows-side verification quirks if they appear again

### Open baseline areas

- backup hardening
