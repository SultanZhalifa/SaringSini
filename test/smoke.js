#!/usr/bin/env node
/**
 * Smoke test sederhana untuk SaringSini.
 *
 * Menyalakan server pada port acak, memanggil endpoint /api/health,
 * lalu memverifikasi respons berstatus "healthy" dan endpoint /api/stats.
 * Tidak membutuhkan
 * GEMINI_API_KEY — server tetap boot tanpanya (fitur AI dinonaktifkan),
 * sehingga aman dijalankan di CI.
 *
 * Keluar dengan kode 0 bila lulus, 1 bila gagal.
 */
'use strict';

const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.SMOKE_PORT || 3999;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const TIMEOUT_MS = 15000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth() {
  const deadline = Date.now() + TIMEOUT_MS;
  let lastErr;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        return res.json();
      }
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastErr = err;
    }
    await wait(400);
  }
  throw lastErr || new Error('Timeout menunggu server siap');
}

async function fetchJson(pathname) {
  const res = await fetch(`${BASE_URL}${pathname}`);
  if (!res.ok) {
    throw new Error(`${pathname} mengembalikan HTTP ${res.status}`);
  }
  return res.json();
}

async function main() {
  console.log(`[smoke] Menyalakan server di port ${PORT}...`);

  const server = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  let exitCode = 1;
  try {
    const health = await waitForHealth();
    console.log('[smoke] Respons /api/health:', JSON.stringify(health));

    if (health.status !== 'healthy') {
      throw new Error(`status bukan "healthy": ${health.status}`);
    }
    if (!health.version) {
      throw new Error('field "version" tidak ada pada respons health');
    }

    const stats = await fetchJson('/api/stats');
    console.log('[smoke] Respons /api/stats:', JSON.stringify(stats));

    if (typeof stats.totalChecks !== 'number') {
      throw new Error('field "totalChecks" tidak ada atau bukan angka pada respons stats');
    }
    if (typeof stats.totalUpvotes !== 'number') {
      throw new Error('field "totalUpvotes" tidak ada atau bukan angka pada respons stats');
    }
    if (typeof stats.familiesSaved !== 'number') {
      throw new Error('field "familiesSaved" tidak ada atau bukan angka pada respons stats');
    }
    if (typeof stats.target !== 'number') {
      throw new Error('field "target" tidak ada atau bukan angka pada respons stats');
    }

    console.log('[smoke] LULUS — server sehat dan endpoint publik merespons dengan benar.');
    exitCode = 0;
  } catch (err) {
    console.error('[smoke] ❌ GAGAL —', err.message);
    exitCode = 1;
  } finally {
    server.kill('SIGTERM');
    // Beri waktu proses untuk mati dengan bersih.
    await wait(300);
    if (!server.killed) {
      server.kill('SIGKILL');
    }
  }

  process.exit(exitCode);
}

main();
