#!/usr/bin/env node

process.argv[2] = "oauth-url";
await import("./bootstrap.mjs");
