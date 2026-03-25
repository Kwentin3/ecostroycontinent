# INFRA.SELECTEL_AUTH_DIAGNOSTICS.WINDOWS_CHECKLIST_Экостройконтинент_v0.1

## Purpose

Короткий Windows-specific checklist для правильной проверки Selectel OpenStack auth на текущей машине.

## Recommended Path: Git Bash

### 1. Open Git Bash

Use:

- `C:\\Program Files\\Git\\bin\\bash.exe`

### 2. Go to the repo directory

```bash
cd /d/Users/Roman/Desktop/Проекты/сайт\ Армен
```

### 3. Load the RC file correctly

```bash
source docs/selectel/rc.sh
```

Expected:

- bash asks for the OpenStack password
- enter the current Selectel service-user password

### 4. Verify auth

```bash
openstack token issue -f value -c id
```

Expected if auth is working:

- command returns a token value

Indicates auth is still broken:

- `HTTP 401`
- auth-url missing
- command not found

### 5. Optional extra check

```bash
openstack server list
```

Expected if auth and project access are working:

- command completes successfully
- list may be empty, and that is still acceptable

## PowerShell Warning

Do **not** use this pattern:

```powershell
source .\rc.sh
```

Reason:

- current `rc.sh` is a bash-style RC file, not a PowerShell env script

## If You Must Use PowerShell

Only use PowerShell if you manually load the `OS_*` variables and set `OS_PASSWORD` to the real service-user password.

Do not treat:

- `OS_PASSWORD=$OS_PASSWORD_INPUT`

as a ready literal PowerShell value.

## Short Result Interpretation

- `token issue` works: auth path is good
- `token issue` fails with missing auth-url: RC/env vars were not loaded
- `token issue` fails with `401`: password/credential path is still wrong
- `server list` works: role/path is sufficient for baseline OpenStack operations
