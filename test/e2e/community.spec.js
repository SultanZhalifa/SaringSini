'use strict';

const { expect, test } = require('./fixtures');

const toast = (page) => page.locator('#toast');
const items = (page) => page.locator('#community-feed-container .community-item');

test.describe('community feed', () => {
  test('search and category filters narrow the feed, and an empty result says so', async ({ page, problems }) => {
    await page.goto('/?tab=komunitas');
    await expect(items(page).first()).toBeVisible();
    const total = await items(page).count();
    expect(total).toBeGreaterThanOrEqual(3);

    await page.fill('#community-search', 'APK');
    await expect(items(page)).toHaveCount(1);
    await expect(items(page).first()).toContainText('APK');

    await page.fill('#community-search', 'buster #3004');
    await expect(items(page)).toHaveCount(1);

    await page.fill('#community-search', '');
    await expect(items(page)).toHaveCount(total);

    await page.click('.comm-tab[data-cat="Kesehatan"]');
    await expect(page.locator('.comm-tab[data-cat="Kesehatan"]')).toHaveClass(/active/);
    await expect(page.locator('.comm-tab[data-cat="all"]')).not.toHaveClass(/active/);
    await expect(items(page).first()).toContainText('air kelapa');

    await page.fill('#community-search', 'zzzz-tidak-ada');
    await expect(page.locator('#community-feed-container')).toHaveText('Tidak ada laporan hoaks yang cocok.');
    expect(problems).toEqual([]);
  });

  test('each entry shows its author, risk badge, age and support count', async ({ page }) => {
    await page.goto('/?tab=komunitas');
    const seeded = items(page).filter({ hasText: 'Buster #4928' });
    await expect(seeded.locator('.community-badge')).toHaveText('98% Hoaks Parah');
    await expect(seeded.locator('.community-badge')).toHaveClass(/danger/);
    await expect(seeded.locator('.community-date')).toHaveText(/lalu|Baru saja/);
    await expect(seeded.locator('.community-upvote-btn')).toContainText('Dukung Klarifikasi');
  });

  test('a refused upvote shows the reason and changes nothing', async ({ page }) => {
    await page.route('**/api/community/*/upvote', (route) =>
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Anda sudah memberikan dukungan untuk laporan ini.' }),
      }),
    );
    await page.goto('/?tab=komunitas');
    await page.locator('.community-upvote-btn:not([disabled])').first().click();

    await expect(toast(page)).toHaveText('Anda sudah memberikan dukungan untuk laporan ini.');
    await expect(toast(page)).toHaveClass(/toast-warning/);
    await expect(page.locator('.community-upvote-btn.upvoted')).toHaveCount(0);
  });

  test('supporting a report updates its count and confirms with a toast', async ({ page }) => {
    await page.goto('/?tab=komunitas');
    const target = items(page).filter({ hasText: 'Buster #1209' });
    const before = Number((await target.locator('.community-upvote-btn').innerText()).match(/\d+/)[0]);

    await target.locator('.community-upvote-btn').click();
    await expect(toast(page)).toHaveText('Dukungan verifikasi berhasil ditambahkan');
    await expect(target.locator('.community-upvote-btn')).toContainText(`${before + 1} Sudah Didukung`);
  });

  test('the page keeps working when the feed cannot be loaded', async ({ page }) => {
    await page.route('**/api/community', (route) => route.abort());
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/?tab=komunitas');
    await page.fill('#community-search', 'apa saja');
    await page.locator('.bottom-nav-btn[data-tab="beranda"]').click();
    await expect(page.locator('#panel-beranda')).toHaveClass(/active/);
    expect(errors).toEqual([]);
  });
});

test.describe('analytics and map', () => {
  test('the dashboard summarises the feed', async ({ page, problems }) => {
    await page.goto('/?tab=edukasi');

    await expect(page.locator('#stat-total-hoax')).toHaveText(/^[1-9]\d*$/);
    await expect(page.locator('#stat-avg-danger')).toHaveText(/^\d+%$/);
    await expect(page.locator('#stat-top-category')).not.toBeEmpty();
    await expect(page.locator('#stat-top-category-pct')).toHaveText(/^\d+% dari total laporan$/);
    await expect(page.locator('#stat-families')).toHaveText(/^[\d.]+$/);

    const bars = page.locator('#chart-category-bars .chart-bar-row');
    await expect(bars.first()).toBeVisible();
    expect(await bars.count()).toBeLessThanOrEqual(5);
    await expect(bars.first().locator('.chart-bar-fill')).toHaveCSS('width', /^[1-9]/);
    await expect(page.locator('#ai-daily-insight')).toHaveText(/^Kategori .+ dengan \d+% dari total laporan\./);
    expect(problems).toEqual([]);
  });

  test('map regions expose button semantics and describe their demo data', async ({ page }) => {
    await page.goto('/?tab=edukasi');
    const jawa = page.locator('.map-region[data-region="Jawa"]');
    await expect(jawa).toHaveAttribute('role', 'button');
    await expect(jawa).toHaveAttribute('tabindex', '0');
    await expect(jawa).toHaveAttribute('aria-label', 'Wilayah Jawa');
    await expect(page.locator('.map-region[data-region="Bali-NTB-NTT"]')).toHaveAttribute('aria-label', 'Wilayah Bali NTB NTT');

    await jawa.dispatchEvent('click');
    await expect(jawa).toHaveClass(/active-region/);
    await expect(page.locator('#map-detail-panel .map-detail-region')).toHaveText('Jawa');
    await expect(page.locator('#map-detail-panel .map-detail-count')).toHaveText(/entri demo|Belum ada entri demo/);

    await page.locator('.map-region[data-region="Bali-NTB-NTT"]').dispatchEvent('click');
    await expect(jawa).not.toHaveClass(/active-region/);
    await expect(page.locator('#map-detail-panel .map-detail-region')).toHaveText('Bali / NTB / NTT');
  });

  test('every region carries an intensity class derived from the feed', async ({ page }) => {
    await page.goto('/?tab=edukasi');
    await expect(page.locator('.map-region.intensity-low, .map-region.intensity-mid, .map-region.intensity-high, .map-region.intensity-critical')).toHaveCount(7);
    const counts = await page.locator('.map-region').evaluateAll((regions) => regions.map((region) => Number(region.dataset.count)));
    expect(counts.reduce((sum, count) => sum + count, 0)).toBeGreaterThanOrEqual(3);
  });
});

test.describe('education', () => {
  test('the literacy accordion keeps at most one item open', async ({ page }) => {
    await page.goto('/?tab=edukasi');
    const items = page.locator('.accordion-item');
    const triggers = page.locator('.accordion-trigger');

    await triggers.nth(0).click();
    await expect(items.nth(0)).toHaveClass(/active/);
    await triggers.nth(1).click();
    await expect(items.nth(0)).not.toHaveClass(/active/);
    await expect(items.nth(1)).toHaveClass(/active/);
    await triggers.nth(1).click();
    await expect(page.locator('.accordion-item.active')).toHaveCount(0);
  });

  test('the quiz scores answers, explains them and can be retaken', async ({ page, context, problems }) => {
    await context.route('https://wa.me/**', (route) => route.fulfill({ body: 'ok' }));
    await page.goto('/?tab=edukasi');

    await expect(page.locator('#quiz-intro')).toBeVisible();
    await page.click('#quiz-start-btn');
    await expect(page.locator('#quiz-active')).toBeVisible();
    await expect(page.locator('#quiz-intro')).toBeHidden();
    await expect(page.locator('#quiz-total-num')).toHaveText('10');

    for (let question = 1; question <= 10; question += 1) {
      await expect(page.locator('#quiz-current-num')).toHaveText(String(question));
      await expect(page.locator('#quiz-explanation')).toBeHidden();
      await page.click('.quiz-answer-btn[data-answer="hoax"]');
      await expect(page.locator('#quiz-explanation')).toBeVisible();
      await expect(page.locator('#quiz-explanation-header')).toHaveText(/^(Tepat!|Belum tepat\.)$/);
      await expect(page.locator('.quiz-answer-btn').first()).toBeDisabled();
      await page.click('#quiz-next-btn');
    }

    await expect(page.locator('#quiz-result')).toBeVisible();
    const correct = Number(await page.locator('#quiz-result-correct').innerText());
    expect(correct).toBe(6);
    await expect(page.locator('#quiz-result-score')).toHaveText('60');
    await expect(page.locator('#quiz-result-percent')).toHaveText('60%');
    await expect(page.locator('#quiz-result-title')).toHaveText('Sedang Berlatih');

    const opened = context.waitForEvent('page');
    await page.click('#quiz-share-btn');
    expect(decodeURIComponent((await opened).url())).toContain('Saya berhasil deteksi 6/10 hoaks (skor 60 - 60%)');

    await page.click('#quiz-retry-btn');
    await expect(page.locator('#quiz-active')).toBeVisible();
    await expect(page.locator('#quiz-current-num')).toHaveText('1');
    await expect(page.locator('#quiz-current-score')).toHaveText('0');
    expect(problems).toEqual([]);
  });

  test('answering every question correctly earns the top title', async ({ page, problems }) => {
    // Four statements in the question bank are true; every other one is a hoax.
    const factStarts = ['WHO merekomendasikan', 'UU ITE Pasal 28', 'Mafindo (Masyarakat', 'Aplikasi WhatsApp menyediakan'];
    await page.goto('/?tab=edukasi');
    await page.click('#quiz-start-btn');

    for (let question = 1; question <= 10; question += 1) {
      const text = await page.locator('#quiz-question-text').innerText();
      const answer = factStarts.some((start) => text.startsWith(start)) ? 'fact' : 'hoax';
      await page.click(`.quiz-answer-btn[data-answer="${answer}"]`);
      await expect(page.locator('#quiz-explanation-header')).toHaveText('Tepat!');
      await page.click('#quiz-next-btn');
    }

    await expect(page.locator('#quiz-result-correct')).toHaveText('10');
    await expect(page.locator('#quiz-result-score')).toHaveText('100');
    await expect(page.locator('#quiz-result-title')).toHaveText('Master Pahlawan Fakta!');
    await expect(page.locator('#quiz-result-message')).toHaveText('Luar biasa! Kamu siap menjadi penjaga kebenaran keluarga Indonesia.');
    expect(problems).toEqual([]);
  });
});
