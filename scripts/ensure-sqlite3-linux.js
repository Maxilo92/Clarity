#!/usr/bin/env node

const { execSync } = require('node:child_process');

if (process.platform !== 'linux') {
  process.exit(0);
}

const commands = [
  'npm rebuild sqlite3 --update-binary',
  'npm rebuild sqlite3 --build-from-source'
];

for (const cmd of commands) {
  try {
    console.log(`[ensure-sqlite3-linux] Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
    console.log('[ensure-sqlite3-linux] sqlite3 rebuild succeeded.');
    process.exit(0);
  } catch (err) {
    console.warn(`[ensure-sqlite3-linux] Command failed: ${cmd}`);
  }
}

console.error('[ensure-sqlite3-linux] Failed to rebuild sqlite3 for Linux.');
process.exit(1);
