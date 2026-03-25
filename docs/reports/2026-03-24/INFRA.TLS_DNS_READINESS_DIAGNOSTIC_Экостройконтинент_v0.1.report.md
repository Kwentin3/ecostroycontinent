# INFRA.TLS_DNS_READINESS_DIAGNOSTIC_Экостройконтинент_v0.1

## Purpose

This report captures the factual blocker discovered while attempting to close the public TLS path for `ecostroycontinent.ru`.

The original working assumption was that the remaining obstacle was mainly certificate issuance and installation. The external DNS diagnostics showed that the blocker appears earlier in the chain.

## What Was Checked

### 1. Selectel certificate and DNS API readiness

Attempted:

- discover and use official Selectel Certificate Manager API paths
- discover and use official Selectel DNS API paths
- issue a project-scoped IAM token from the locally documented service-user path

Observed:

- the currently documented local service-user credential path did not issue a valid project-scoped IAM token
- this prevented direct API-side self-service from being completed in this pass

Honest interpretation:

- local secret-pack auth for Selectel API surfaces is currently not trustworthy enough for automated certificate issuance
- this alone would already justify a pause

### 2. Public DNS resolution state

External checks were then executed against public resolvers and against the delegated authority chain.

Observed facts:

- `ecostroycontinent.ru` delegation at the registry level points to Selectel name servers:
  - `a.ns.selectel.ru`
  - `b.ns.selectel.ru`
  - `c.ns.selectel.ru`
  - `d.ns.selectel.ru`
- public recursive resolvers return `SERVFAIL` for apex `A` resolution
- Google DNS-over-HTTPS returns status `SERVFAIL` with the comment:
  - `Name servers refused query (lame delegation?)`
- extended DNS errors show `REFUSED` from the delegated Selectel name servers

## Practical Meaning

This changes the diagnosis materially.

The public TLS path is not blocked only by "self-signed versus proper certificate".

It is blocked first by delegated DNS health:

- the domain is delegated to Selectel
- but the delegated name servers are not currently answering the zone normally for public recursive resolution
- until that is repaired, neither Let's Encrypt nor Selectel Certificate Manager can complete a normal public certificate flow for `ecostroycontinent.ru`

## What Is Already Fine

- the Linux VM runtime is healthy on the floating IP
- self-signed app-side TLS works for operator validation
- the media bucket is public and serves objects
- the CDN resource exists and serves the probe object on HTTP

So the blocker is specifically about the public site-domain readiness branch, not about the baseline runtime contour.

## Required Next Action

The next corrective action should happen in Selectel DNS hosting:

1. verify that the zone `ecostroycontinent.ru` exists and is active;
2. verify that the zone is actually published on the delegated Selectel name servers;
3. verify that the apex `A` record is configured as intended;
4. re-test public resolution until apex queries stop returning `SERVFAIL`;
5. only after that retry public certificate issuance and installation on Traefik.

## Follow-Up Outcome

The original blocker described in this diagnostic was later removed:

- delegated DNS was corrected in Selectel DNS hosting;
- apex and `www` now resolve to `178.72.179.66`;
- a real Let's Encrypt certificate was installed on Traefik;
- the installed certificate covers both `ecostroycontinent.ru` and `www.ecostroycontinent.ru`.

Residual note:

- this Windows Server 2019 operator machine may still show local `schannel` trust oddities during verification;
- that residual signal should not be treated as a server-side TLS blocker by default.

## Honest Status

`public TLS readiness unblocked and materially completed for apex + www`
