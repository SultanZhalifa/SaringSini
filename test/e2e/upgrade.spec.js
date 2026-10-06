'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const express = require('express');
const { expect, test } = require('./fixtures');
const { createTestApp } = require('./app-under-test');

// Needs the real service worker, and the same origin for the old and the new release.
test.use({ serviceWorkers: 'allow' });

const LEGACY_SHELL = path.join(__dirname, 'legacy-shell');
const OLD_CACHES = ['saringsini-v2.3.1-shell', 'saringsini-v2.3.1-runtime'];
const currentShellCache = () => {
  const source = fs.readFileSync(path.join(__dirname, '../../public/sw.js'), 'utf8');
  return `${/const VERSION = '([^']+)'/.exec(source)[1]}-shell`;
};

const cacheNames = (page) => page.evaluate(() => caches.keys());

/** One origin that can be switched from the old release to the current one, like a deploy. */
const startDeployableServer = async () => {
  const current = createTestApp();
  const legacy = express().use(express.static(LEGACY_SHELL));
  let release = 'legacy';

  const server = http.createServer((req, res) => (release === 'legacy' ? legacy : current.app)(req, res));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  return {
    origin: `http://127.0.0.1:${server.address().port}`,
    deploy: () => {
      release = 'current';
    },
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      current.cleanup();
    },
  };
};

test('a browser with the pre-module service worker moves to the current release and works offline', async ({
  page,
  context,
  problems,
}) => {
  const site = await startDeployableServer();
  try {
    // A returning visitor of the old release: worker installed, page controlled, lazy script cached.
    await page.goto(`${site.origin}/`);
    await expect(page.locator('#legacy-marker')).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    expect(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    expect(await page.evaluate(() => window.__legacyExtra)).toBe(true);
    expect(await cacheNames(page)).toContain(OLD_CACHES[0]);

    // A deploy. The next visit may still show the old page, but the new worker installs, takes over
    // and removes what the old one cached.
    site.deploy();
    await page.reload();
    await expect
      .poll(
        async () => {
          const names = await cacheNames(page);
          return names.includes(currentShellCache()) && !OLD_CACHES.some((name) => names.includes(name));
        },
        { timeout: 15_000 },
      )
      .toBe(true);
    problems.length = 0;

    // The visit after that runs the current release.
    await page.reload();
    await expect(page.locator('#panel-beranda')).toBeVisible();
    expect(await page.evaluate(() => window.__legacyExtra)).toBeUndefined();
    await expect(page.locator('script[type="module"][src="js/main.js"]')).toHaveCount(1);
    await page.locator('.bottom-nav-btn[data-tab="edukasi"]').click();
    await expect(page.locator('#panel-edukasi')).toHaveClass(/active/);

    // And the new worker's precache is complete: the app starts with the network gone.
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('#panel-beranda')).toBeVisible();
    await page.locator('.bottom-nav-btn[data-tab="edukasi"]').click();
    await page.click('#quiz-start-btn');
    await expect(page.locator('#quiz-active')).toBeVisible();
    expect(problems.filter((problem) => !/Failed to load resource|Failed to fetch|net::ERR/.test(problem))).toEqual([]);
  } finally {
    await context.setOffline(false);
    await site.close();
  }
});
