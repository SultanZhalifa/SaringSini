'use strict';

const fs = require('node:fs');
const { analysisFixture } = require('../helpers/harness');
const { analyze, expect, test } = require('./fixtures');

const toast = (page) => page.locator('#toast');
const stubAnalysis = (page, overrides) =>
  page.route('**/api/analyze', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(analysisFixture(overrides)) }),
  );

test('a high-risk result shows score, badge, category, links and the three reply templates', async ({ page, problems }) => {
  await analyze(page, 'pesan berisiko tinggi');

  await expect(page.locator('#gauge-value-text')).toHaveText('90%');
  await expect(page.locator('#res-badge')).toHaveText('Indikasi AI: Hoaks Parah');
  await expect(page.locator('#res-badge')).toHaveClass(/danger/);
  await expect(page.locator('#res-status-title')).toHaveText('Indikasi Risiko Tinggi');
  await expect(page.locator('#res-category')).toHaveText('Scam/Penipuan');

  await expect(page.locator('#res-mitigation-box')).toBeVisible();
  const links = page.locator('#res-mitigation-actions a');
  await expect(links).toHaveText([
    /Verifikasi Nomor Rekening/,
    /Lapor Patroli Siber POLRI/,
    /Laporkan Hoaks Kominfo/,
    /Cek di TurnBackHoax\.id/,
  ]);
  for (const link of await links.all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('href', /^https:\/\//);
  }

  await expect(page.locator('#sopan-text')).toHaveText('Balasan sopan');
  await expect(page.locator('#santai-text')).toHaveText('Balasan santai');
  await expect(page.locator('#humor-text')).toHaveText('Balasan humor');
  expect(problems).toEqual([]);
});

test('a low-risk result is labelled safe and offers no mitigation links', async ({ page }) => {
  await stubAnalysis(page, { hoaxPercentage: 10, statusBadge: 'Aman', category: 'Faktual', claims: [] });
  await page.goto('/?tab=periksa');
  await page.fill('#message-input', 'pesan aman');
  await page.click('#analyze-btn');

  await expect(page.locator('#gauge-value-text')).toHaveText('10%');
  await expect(page.locator('#res-badge')).toHaveClass(/safe/);
  await expect(page.locator('#res-status-title')).toHaveText('Indikasi Risiko Rendah');
  await expect(page.locator('#res-mitigation-box')).toBeHidden();
  await expect(page.locator('#res-claims-list')).toHaveText('Tidak ditemukan klaim spesifik.');
});

test('a medium-risk health result links to the health ministry', async ({ page }) => {
  await stubAnalysis(page, { hoaxPercentage: 50, statusBadge: 'Waspada', category: 'Kesehatan' });
  await page.goto('/?tab=periksa');
  await page.fill('#message-input', 'pesan kesehatan');
  await page.click('#analyze-btn');

  await expect(page.locator('#res-badge')).toHaveClass(/warning/);
  await expect(page.locator('#res-status-title')).toHaveText('Indikasi Perlu Verifikasi');
  await expect(page.locator('#res-mitigation-actions a').first()).toContainText('Cari Info Sehat Kemenkes');
});

test('a score of 0 and a result without a summary use their fallbacks', async ({ page }) => {
  await stubAnalysis(page, { hoaxPercentage: 0, summary: '', category: '' });
  await page.goto('/?tab=periksa');
  await page.fill('#message-input', 'pesan nol');
  await page.click('#analyze-btn');

  await expect(page.locator('#gauge-value-text')).toHaveText('0%');
  await expect(page.locator('#res-summary')).toHaveText('Hasil analisis selesai.');
  await expect(page.locator('#res-category')).toHaveText('Berita');
});

test('copying a reply puts it on the clipboard and carries it to the simulator', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await analyze(page, 'pesan untuk disalin');

  await page.locator('#sopan-text').click();
  await expect(toast(page)).toHaveText('Balasan disalin & dipindah ke Simulator');
  await expect(page.locator('#panel-simulator')).toHaveClass(/active/);
  await expect(page.locator('#chat-simulator-input')).toHaveValue('Balasan sopan');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Balasan sopan');
});

test('copying is skipped while a template is still a placeholder', async ({ page }) => {
  await page.goto('/?tab=periksa');
  await page.evaluate(() => {
    document.getElementById('sopan-text').textContent = 'Memuat template...';
  });
  await page.locator('#sopan-text').dispatchEvent('click');
  await expect(page.locator('#panel-periksa')).toHaveClass(/active/);
});

test('sharing a reply opens WhatsApp with the template', async ({ page, context }) => {
  await context.route('https://wa.me/**', (route) => route.fulfill({ body: 'ok' }));
  await analyze(page, 'pesan untuk dibagikan');

  const opened = context.waitForEvent('page');
  await page.locator('.wa-share-btn[data-target="santai-text"]').click();
  const popup = await opened;
  expect(decodeURIComponent(popup.url())).toBe('https://wa.me/?text=Halo, ini info verifikasi dari SaringSini:\n\nBalasan santai');
});

test('sharing is refused until there is a reply to share', async ({ page }) => {
  await page.goto('/?tab=periksa');
  await page.evaluate(() => {
    document.getElementById('humor-text').textContent = 'Memuat template...';
  });
  await page.locator('.wa-share-btn[data-target="humor-text"]').dispatchEvent('click');
  await expect(toast(page)).toHaveText('Hasilkan template balasan dulu.');
});

test('the infographic downloads as a PNG', async ({ page }) => {
  await analyze(page, 'pesan untuk infografis');

  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#download-card-btn')]);
  expect(download.suggestedFilename()).toBe('SaringSini_Indikasi_Awal.png');
  expect(fs.readFileSync(await download.path()).subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
});

test('PDF export asks for a check first', async ({ page }) => {
  await page.goto('/?tab=periksa');
  await page.locator('#download-pdf-btn').dispatchEvent('click');
  await expect(toast(page)).toHaveText('Lakukan pemeriksaan dulu sebelum ekspor PDF.');
});

test.describe('regional language conversion', () => {
  test('is only available once there is a result and a non-default language', async ({ page }) => {
    await page.goto('/?tab=periksa');
    await expect(page.locator('#regen-lang-btn')).toBeDisabled();

    await analyze(page, 'pesan untuk bahasa daerah');
    await expect(page.locator('#regen-lang-btn')).toBeDisabled();
    await page.selectOption('#lang-selector', 'sunda');
    await expect(page.locator('#regen-lang-btn')).toBeEnabled();
    await page.selectOption('#lang-selector', 'indonesia');
    await expect(page.locator('#regen-lang-btn')).toBeDisabled();
  });

  test('replaces the templates and tells the user which language was used', async ({ page }) => {
    await analyze(page, 'pesan untuk bahasa daerah');
    await page.selectOption('#lang-selector', 'minang');
    await page.click('#regen-lang-btn');

    await expect(page.locator('#santai-text')).toHaveText('Santai Jawa');
    await expect(toast(page)).toHaveText('Balasan dikonversi ke Bahasa Minang');
    await expect(page.locator('#regen-lang-btn')).toBeEnabled();
  });

  test('reports a failure and re-enables the button', async ({ page }) => {
    await analyze(page, 'pesan untuk bahasa daerah');
    await page.route('**/api/translate-replies', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Kuota layanan AI sedang penuh.' }) }),
    );
    await page.selectOption('#lang-selector', 'batak');
    await page.click('#regen-lang-btn');

    await expect(toast(page)).toHaveText('Kuota layanan AI sedang penuh.');
    await expect(page.locator('#sopan-text')).toHaveText('Balasan sopan');
    await expect(page.locator('#regen-lang-btn')).toBeEnabled();
  });

  test('converted replies are the ones exported later', async ({ page }) => {
    await analyze(page, 'pesan untuk bahasa daerah');
    await page.selectOption('#lang-selector', 'jawa');
    await page.click('#regen-lang-btn');
    await expect(page.locator('#sopan-text')).toHaveText('Sopan Jawa');

    const [download] = await Promise.all([page.waitForEvent('download'), page.click('#download-pdf-btn')]);
    expect(fs.readFileSync(await download.path()).subarray(0, 5).toString()).toBe('%PDF-');
  });
});

test.describe('tone slider', () => {
  const moveSlider = (page, value) =>
    page.evaluate((tone) => {
      const slider = document.getElementById('tone-slider');
      slider.value = String(tone);
      slider.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);

  test('regenerates the reply, honouring the most formal position (0)', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await analyze(page, 'pesan untuk nada');

    const retone = page.waitForRequest('**/api/retone');
    await moveSlider(page, 0);

    expect((await retone).postDataJSON()).toMatchObject({ originalReply: 'Balasan sopan', tone: 0 });
    await expect(page.locator('#tone-slider-current')).toHaveText('Tone: Sangat Formal (Surat Resmi)');
    await expect(page.locator('#tone-result-text')).toHaveText('Balasan nada baru');
    await expect(page.locator('#tone-result-label')).toContainText('SANGAT FORMAL');
    await expect(page.locator('#tone-result-wa')).toHaveAttribute('href', 'https://wa.me/?text=Balasan%20nada%20baru');

    await page.click('#tone-result-copy');
    await expect(toast(page)).toHaveText('Balasan tone tersalin. Tempel di WhatsApp keluarga.');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Balasan nada baru');
  });

  test('labels every band of the slider', async ({ page }) => {
    await page.goto('/?tab=periksa');
    const labels = [
      [10, 'Sangat Formal (Surat Resmi)'],
      [30, 'Sopan Tradisional'],
      [50, 'Sopan Hangat'],
      [70, 'Akrab Santai'],
      [100, 'Bercanda Ringan'],
    ];
    for (const [value, label] of labels) {
      await moveSlider(page, value);
      await expect(page.locator('#tone-slider-current')).toHaveText(`Tone: ${label}`);
    }
  });

  test('does nothing until there is a reply to adjust, and reports failures', async ({ page }) => {
    await page.goto('/?tab=periksa');
    await page.evaluate(() => {
      document.getElementById('sopan-text').textContent = 'Memuat template...';
    });
    await moveSlider(page, 20);
    await page.waitForTimeout(900);
    await expect(page.locator('#tone-result-card')).toBeHidden();

    await analyze(page, 'pesan untuk nada');
    await page.route('**/api/retone', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
    await moveSlider(page, 90);
    await expect(page.locator('#tone-result-text')).toHaveText('Gagal memuat balasan baru. Coba lagi.');
  });
});
