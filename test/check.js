#!/usr/bin/env node
/**
 * Syntax checker lintas platform untuk SaringSini.
 *
 * Menelusuri semua file .js dalam proyek (kecuali node_modules dan folder
 * tersembunyi) lalu menjalankan `node --check` pada masing-masing untuk
 * memastikan tidak ada syntax error. Berfungsi sebagai "lint" ringan tanpa
 * dependensi tambahan.
 *
 * Keluar dengan kode 0 bila semua lulus, 1 bila ada yang gagal.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const IGNORE_DIRS = new Set(['node_modules', '.git', 'uploads', 'data']);

/** Kumpulkan semua file .js secara rekursif. */
function collectJsFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.isDirectory()) continue;
    if (IGNORE_DIRS.has(entry.name)) continue;

    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectJsFiles(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      acc.push(full);
    }
  }
  return acc;
}

function main() {
  const files = collectJsFiles(ROOT).sort();
  let failed = 0;

  console.log(`[check] Memeriksa syntax ${files.length} file JavaScript...`);

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    try {
      execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
      console.log(`  ✅ ${rel}`);
    } catch (err) {
      failed++;
      console.error(`  ❌ ${rel}`);
      const output = (err.stderr || err.stdout || '').toString().trim();
      if (output) console.error(output.split('\n').map((l) => `     ${l}`).join('\n'));
    }
  }

  if (failed > 0) {
    console.error(`\n[check] ❌ GAGAL — ${failed} file memiliki syntax error.`);
    process.exit(1);
  }
  console.log('\n[check] ✅ LULUS — semua file JavaScript valid.');
}

main();
