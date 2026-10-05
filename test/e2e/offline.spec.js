'use strict';

const { expect, test } = require('./fixtures');

// The suite blocks service workers elsewhere to keep tests independent; this file needs the real thing.
test.use({ serviceWorkers: 'allow' });

test('after a single visit the whole app still works offline', async ({ page, context, problems }) => {
  await page.goto('/');
  // `ready` resolves once the worker has installed (pre-caching the shell) and activated.
  await page.evaluate(() => navigator.serviceWorker.ready);

  await context.setOffline(true);
  await page.reload();

  await expect(page.locator('#panel-beranda')).toBeVisible();
  // Client-side behaviour proves the scripts loaded from the cache, not just the HTML.
  await page.locator('.bottom-nav-btn[data-tab="edukasi"]').click();
  await expect(page.locator('#panel-edukasi')).toHaveClass(/active/);
  await page.click('#quiz-start-btn');
  await expect(page.locator('#quiz-active')).toBeVisible();

  await page.locator('.bottom-nav-btn[data-tab="simulator"]').click();
  await page.fill('#coach-scenario-input', 'Skenario hoaks tanpa jaringan');
  await page.click('#coach-start-btn');
  await expect(page.locator('#coach-chat-wrap')).toBeVisible();

  await page.locator('.bottom-nav-btn[data-tab="periksa"]').click();
  await page.fill('#message-input', 'pesan saat offline');
  await page.click('#analyze-btn');
  await expect(page.locator('#toast')).toHaveClass(/toast-danger/);
  expect(problems.filter((problem) => !/Failed to load resource|Failed to fetch|net::ERR/.test(problem))).toEqual([]);
});
