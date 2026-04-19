# ENTITY_OPS_WINDOWS_IO_HARDENING Экостройконтинент v0.1

## Summary

A small follow-up hardening pass was applied to `entity-ops` after the bounded runtime-surface refactor.

Goal: make the operator/agent CLI more reliable on Windows and in mixed shell environments without changing any domain behavior or widening runtime authority.

## Why this pass was needed

The previous refactor already aligned `entity-ops` with the real bounded runtime routes.

A remaining tail stayed in the CLI I/O layer:

- batch files generated on Windows could arrive in UTF-8 with BOM or UTF-16 variants;
- the CLI only read input as plain UTF-8;
- stdout was only human-readable text, which is less reliable for automation and shell-capture scenarios;
- the engineering doc still contained mojibake inside Russian JSON examples.

This was not treated as a server-runtime regression.
It was a tool-ergonomics and interoperability gap.

## What changed

### Code

Added `lib/entity-ops/io.js` and moved the bounded CLI I/O responsibilities there:

- safe input decoding for UTF-8, UTF-8 with BOM, UTF-16LE, and UTF-16BE;
- heuristic fallback for UTF-16 text without BOM;
- explicit UTF-8 stdout/stderr writes;
- text and JSON stdout serialization from one shared seam.

Updated `scripts/entity-ops.mjs`:

- `--json` flag added;
- `--format text|json` added;
- input file loading now goes through the new decoding seam;
- report output now goes through the shared serializer/writer.

### Tests

Added `tests/entity-ops.io.test.js` covering:

- UTF-8 BOM decoding;
- UTF-16LE decoding;
- UTF-16 heuristic decoding without BOM;
- output-format resolution;
- text-report serialization;
- JSON stdout serialization.

### Docs

Rewrote `docs/engineering/ENTITY_OPS_OPERATOR_CLI_v1.md` with:

- corrected Russian examples;
- explicit Windows encoding notes;
- machine-readable stdout usage.

## What did not change

This pass did not:

- change auth or permissions;
- add publish/review actions;
- widen route surface;
- bypass graph safety;
- change server-side behavior.

## Verification

Local verification completed:

- `node --experimental-specifier-resolution=node --test tests/entity-ops.test.js tests/entity-ops.client.test.js tests/entity-ops.runner.test.js tests/entity-ops.io.test.js`
- `node --check scripts/entity-ops.mjs`
- `npm test`
- `npm run build`

Live dry-run verification completed against `https://ecostroycontinent.ru`:

- UTF-16 batch input was accepted by the CLI without manual recoding;
- `--json` stdout returned a valid machine-readable report;
- text stdout rendered Russian label content correctly;
- no mutation was applied because the live run stayed in dry-run mode.

## Judgement

The remaining operator-facing I/O tail is now materially smaller.

`entity-ops` is better aligned with real Windows usage and with agent automation needs, while still staying inside the project’s bounded control model.
