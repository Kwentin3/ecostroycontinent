#!/usr/bin/env node

process.argv[2] = "bootstrap-goals";
await import("./bootstrap.mjs");
