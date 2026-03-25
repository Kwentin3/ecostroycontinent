# INFRA.SELECTEL_AUTH_DIAGNOSTICS_Экостройконтинент_v0.1

## Purpose

Этот документ фиксирует узкую диагностику Selectel OpenStack authentication path для проекта «Экостройконтинент».

Задача диагностики:

- понять, почему baseline provisioning execution упёрся в auth failure;
- отличить shell mismatch от credential/permission problem;
- подтвердить, пригоден ли текущий RC file;
- определить минимальный рабочий auth-check path на Windows.

## 1. What Environment Was Found

Фактически найдено на текущей Windows machine:

- `openstack` CLI installed and callable
- `gh` installed and authenticated
- `docker` installed
- `ssh` installed
- Git Bash available:
  - `C:\\Program Files\\Git\\bin\\bash.exe`
- current shell context for the agent: PowerShell

Conclusion:

- neither CLI installation nor shell availability is the blocker
- both PowerShell and Git Bash are available, but they are not equivalent for a bash-style RC file

## 2. What Kind of RC File Was Found

Current `docs/selectel/rc.sh` is a bash-style OpenStack RC file.

Structural facts:

- it contains `export OS_*` lines for normal OpenStack variables
- it contains bash guard logic that tells the user to `source` the script
- it contains an interactive password input step:
  - `read -sr OS_PASSWORD_INPUT`
- it exports `OS_PASSWORD` from that interactive bash variable
- `OS_REGION_NAME` is present

Conclusion:

- RC file structure is valid for bash/OpenStack usage
- RC file is not a PowerShell-native env loader
- RC file expects password input during `source`, not blind execution inside PowerShell

## 3. Why the Previous Auth Attempt Failed

Most likely cause of the previous failure:

- `source rc.sh` was attempted in PowerShell
- PowerShell does not natively execute bash-style RC semantics
- therefore `OS_*` variables were not loaded into the session
- after that, `openstack token issue` failed because required env vars such as auth URL were missing

This explains the earlier “missing auth-url” style failure.

Separate finding from this diagnostic:

- a naive PowerShell parser can also fail if it treats `export OS_PASSWORD=$OS_PASSWORD_INPUT` as a literal string instead of a bash variable flow
- that leads to an apparent auth failure even when the RC file itself is structurally fine

## 4. Diagnostic Classification

### Primary issue

- `shell mismatch`

### Secondary issue

- `missing env vars in the session`

### Not supported by current evidence

- malformed RC file
- broken OpenStack CLI installation
- insufficient project role as the primary blocker

### Not the most likely explanation now

- bad permissions

Credential note:

- current auth path was later verified successfully after loading variables correctly and supplying the actual service-user password
- this makes a raw “bad credentials” explanation unlikely for the current state

## 5. Correct Windows-Side Auth Check Path

Recommended minimal path on the current machine:

- use Git Bash
- `source` the RC file there
- enter the service-user password when prompted
- then run `openstack token issue`

This is the shortest shell-native path because the RC file is already bash-oriented.

Alternative path also works:

- PowerShell can be used only if `OS_*` variables are exported manually and `OS_PASSWORD` is set to the real service-user password
- PowerShell must not treat `OS_PASSWORD=$OS_PASSWORD_INPUT` as a ready literal value

## 6. Verification Result

This diagnostic was able to verify auth successfully.

Confirmed facts:

- auth succeeds after correct variable loading and correct password handling
- `openstack token issue` works
- `openstack server list` also runs successfully
- current result from `server list` is empty, but the command itself succeeds

Practical meaning:

- auth path is now verifiable
- previous blocker was not a proven Selectel permission denial
- current auth blocker from the earlier provisioning pass should be treated as resolved at the auth-path level

## 7. Is Project Role `member` Sufficient?

Current evidence says: `member` is sufficient for the intended OpenStack resource operations baseline.

Why:

- local service user is documented with project role `member`
- auth succeeds with that role
- `openstack server list` succeeds with that role
- Selectel official docs state that a service user with project access and role `member` can be used for OpenStack CLI management, and Selectel role reference describes `member` as full access to services inside the permitted scope

Therefore:

- there is no evidence that role escalation is needed
- current role problem is **not** supported as the root cause

## 8. What Remains Blocked

Auth-path blocker itself is no longer the main blocker.

What still blocks reprovisioning:

- repo still has no runtime/deploy manifests:
  - `Dockerfile`
  - `docker-compose` / `compose`
  - `.github/workflows`

So the correct narrow status is:

- `Selectel auth diagnostics`: successful
- `baseline provisioning`: still not ready to complete end-to-end because runtime artifacts are absent

## 9. Short Diagnostic Verdict

Most likely root cause of the original auth failure:

- PowerShell was used with a bash-style RC file, so env vars were not loaded correctly.

Current state:

- RC file is structurally usable
- OpenStack CLI is usable
- Git Bash is available and is the preferred shell for this RC
- auth is now verifiable
- role `member` appears sufficient
- remaining blocker moved from auth to missing runtime/deploy manifests
