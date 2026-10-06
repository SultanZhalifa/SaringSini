'use strict';

const fs = require('node:fs');
const { HOSTILE_TEXT, analyze, expect, test } = require('./fixtures');

test('boots under the strict CSP with no script errors or violations', async ({ page, problems }) => {
  await page.goto('/');
  await expect(page.locator('#community-feed-container .community-item').first()).toBeAttached();

  expect(await page.evaluate(() => document.querySelectorAll('script[src^="http"]').length)).toBe(0);
  expect(problems).toEqual([]);
});

test('model output containing markup is rendered as inert text', async ({ page, problems }) => {
  await analyze(page, 'pesan biasa untuk dianalisis');

  await expect(page.locator('#res-claims-list .claim-card').first()).toContainText(`[Perlu verifikasi] ${HOSTILE_TEXT}`);
  await expect(page.locator('#res-summary')).toHaveText('Ringkasan <b>tebal</b> aman.');
  await expect(page.locator('#res-claims-list img, #res-summary b, #res-claims-list script')).toHaveCount(0);
  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  expect(problems).toEqual([]);
});

test('a stored-XSS payload submitted through the API is inert for every visitor', async ({ page, request, problems }) => {
  const response = await request.post('/api/analyze', { data: { message: HOSTILE_TEXT } });
  expect(response.status()).toBe(200);

  await page.goto('/?tab=komunitas');
  await expect(page.locator('.community-text', { hasText: HOSTILE_TEXT }).first()).toBeVisible();

  await expect(page.locator('#community-feed-container img')).toHaveCount(0);
  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  expect(problems).toEqual([]);
});

test('supporting a report is remembered for this browser only', async ({ page, problems }) => {
  await page.goto('/?tab=komunitas');
  const supported = page.locator('.community-upvote-btn.upvoted');
  await expect(supported).toHaveCount(0);

  await page.locator('.community-upvote-btn:not([disabled])').first().click();
  await expect(supported).toHaveCount(1);
  await expect(supported).toBeDisabled();
  await expect(supported).toContainText('Sudah Didukung');

  await page.reload();
  await expect(page.locator('.community-upvote-btn.upvoted')).toHaveCount(1);
  expect(problems).toEqual([]);
});

test('PDF export builds a real PDF with the self-hosted library', async ({ page, problems }) => {
  await analyze(page, 'pesan untuk laporan PDF yang cukup panjang untuk dianalisis');

  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#download-pdf-btn')]);

  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  expect(fs.readFileSync(await download.path()).subarray(0, 5).toString()).toBe('%PDF-');
  expect(problems).toEqual([]);
});

test('the chat simulator echoes typed text without interpreting it', async ({ page, problems }) => {
  await page.goto('/?tab=simulator');
  await page.fill('#chat-simulator-input', '<b id="injected">halo</b>');
  await page.click('#chat-send-btn');

  await expect(page.locator('#chat-box .chat-bubble.sent').last()).toContainText('<b id="injected">halo</b>');
  await expect(page.locator('#injected')).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('Bahasa Mama Mode shows the scenario and the AI reply as text', async ({ page, problems }) => {
  await page.goto('/?tab=simulator');
  await page.fill('#coach-scenario-input', '<i id="injected">Air kelapa menyembuhkan semua penyakit</i>');
  await page.click('#coach-start-btn');
  await expect(page.locator('#coach-messages')).toContainText('<i id="injected">');

  await page.fill('#coach-input', 'Ma, boleh dicek dulu sumbernya?');
  await page.click('#coach-send-btn');
  await expect(page.locator('#coach-messages')).toContainText('Mama dapat dari grup arisan lho');

  await expect(page.locator('#injected')).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('the DNA fingerprint appears after an analysis', async ({ page }) => {
  await analyze(page, 'pesan untuk membuat DNA hoaks');
  await expect(page.locator('#hoax-dna-canvas svg')).toBeVisible();
});

test('regional-language conversion and tone adjustment use the AI endpoints', async ({ page, problems }) => {
  await analyze(page, 'pesan untuk konversi bahasa daerah');

  await page.selectOption('#lang-selector', 'jawa');
  await page.click('#regen-lang-btn');
  await expect(page.locator('#sopan-text')).toHaveText('Sopan Jawa');
  expect(problems).toEqual([]);
});
