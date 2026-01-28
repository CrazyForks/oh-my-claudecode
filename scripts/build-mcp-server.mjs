#!/usr/bin/env node
/**
 * Build script for standalone MCP server bundle
 * Bundles the MCP server into a standalone JS file for plugin distribution
 */

import * as esbuild from 'esbuild';
import { mkdir } from 'fs/promises';

// Output to bridge/ directory (not gitignored) for plugin distribution
const outfile = 'bridge/mcp-server.cjs';

// Ensure output directory exists
await mkdir('bridge', { recursive: true });

await esbuild.build({
  entryPoints: ['src/mcp/standalone-server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  outfile,
  // Externalize Node.js built-ins and native modules
  external: [
    'fs', 'path', 'os', 'util', 'stream', 'events',
    'buffer', 'crypto', 'http', 'https', 'url',
    'child_process', 'assert', 'module', 'net', 'tls',
    'dns', 'readline', 'tty', 'worker_threads',
    // Native modules that can't be bundled
    '@ast-grep/napi',
    'better-sqlite3',
  ],
});

console.log(`Built ${outfile}`);
