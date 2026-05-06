#!/usr/bin/env node

// Wrapper inherits redacted bootstrap output. Do not print OAuth tokens,
// client secret or auth code here; see SEO/Yandex handoff.
process.argv[2] = "bootstrap-goals";
await import("./bootstrap.mjs");
