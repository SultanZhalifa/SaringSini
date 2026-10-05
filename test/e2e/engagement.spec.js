'use strict';

const { analyze, expect, firstVisit, test } = require('./fixtures');

const toast = (page) => page.locator('#toast');

test.describe('family chat simulator', () => {
  const send = async (page, text) => {
    await page.fill('#chat-simulator-input', text);
    await page.click('#chat-send-btn');
  };
  const received = (page) => page.locator('#chat-box .chat-bubble.received');

  test('starts with a forwarded hoax and a current timestamp', async ({ page }) => {
    await page.goto('/?tab=simulator');
    await expect(received(page)).toHaveCount(1);
    await expect(received(page).first()).toContainText('kangkung');
    await expect(page.locator('#sim-time-1')).toHaveText(/^\d{2}:\d{2}$/);
  });

  test('the family answers greetings in character', async ({ page }) => {
    await page.goto('/?tab=simulator');
    const cases = [
      ['p', 'Papa', 'jangan cuma huruf P saja'],
      ['woi', 'Mama', 'Astagfirullah nak'],
      ['Assalamualaikum', 'Mama', 'Waalaikumsalam warahmatullah'],
      ['halo', 'Tante Rosa', 'Halo juga keponakanku'],
    ];
    for (const [text, sender, reply] of cases) {
      await send(page, text);
      await expect(page.locator('#chat-box .chat-bubble.sent').last()).toContainText(text);
      await expect(page.locator('#chat-simulator-input')).toHaveValue('');
      const bubble = received(page).filter({ hasText: reply });
      await expect(bubble).toHaveCount(1, { timeout: 5000 });
      await expect(bubble.locator('.sender-name')).toHaveText(sender);
    }
  });

  test('shows who is typing before answering', async ({ page }) => {
    await page.goto('/?tab=simulator');
    await send(page, 'halo');
    const typing = page.locator('#chat-box .chat-typing-indicator');
    await expect(typing).toContainText('Mama sedang mengetik');
    await expect(typing).toContainText('Papa sedang mengetik', { timeout: 3000 });
    await expect(typing).toHaveCount(0, { timeout: 4000 });
  });

  test('generic replies rotate instead of repeating', async ({ page }) => {
    await page.goto('/?tab=simulator');
    const senders = [];
    for (const text of ['oke', 'siap', 'baik']) {
      const before = await received(page).count();
      await send(page, text);
      await expect(received(page)).toHaveCount(before + 1, { timeout: 5000 });
      senders.push(await received(page).last().locator('.sender-name').innerText());
    }
    expect(senders).toEqual(['Papa', 'Tante Rosa', 'Mama']);
  });

  test('after a check the family reacts to how risky the message was', async ({ page }) => {
    await analyze(page, 'pesan berisiko untuk dianalisis');
    await page.locator('.bottom-nav-btn[data-tab="simulator"]').click();
    await send(page, 'Ma, info ini ternyata hoaks, ini penjelasannya lengkap');

    await expect(received(page)).toHaveCount(2, { timeout: 5000 });
    expect(['Mama', 'Papa', 'Om Heri']).toContain(await received(page).last().locator('.sender-name').innerText());
    await expect(received(page).last().locator('.message-content')).toContainText(/klarifikasi|penjelasan|tidak benar|Terima kasih/i);
  });

  test('empty messages are ignored and Enter sends', async ({ page }) => {
    await page.goto('/?tab=simulator');
    await page.fill('#chat-simulator-input', '   ');
    await page.click('#chat-send-btn');
    await expect(page.locator('#chat-box .chat-bubble.sent')).toHaveCount(0);

    await page.fill('#chat-simulator-input', 'lewat enter');
    await page.press('#chat-simulator-input', 'Enter');
    await expect(page.locator('#chat-box .chat-bubble.sent')).toHaveCount(1);
  });

  test('quick chips fill the input, and reset restores the first message', async ({ page }) => {
    await page.goto('/?tab=simulator');
    const chip = page.locator('.chat-quick-chip').first();
    const text = await chip.getAttribute('data-chip');
    await chip.click();
    await expect(page.locator('#chat-simulator-input')).toHaveValue(text);

    await page.click('#chat-send-btn');
    await expect(page.locator('#chat-box .chat-bubble.sent')).toHaveCount(1);
    await page.click('#reset-chat-btn');
    await expect(toast(page)).toHaveText('Percakapan disetel ulang');
    await expect(page.locator('#chat-box .chat-bubble')).toHaveCount(1);
    await expect(page.locator('#chat-simulator-input')).toHaveValue('');
    await expect(page.locator('#sim-time-1')).toHaveText(/^\d{2}:\d{2}$/);
  });

  test('the polite reply from the check can be pasted into the chat', async ({ page }) => {
    await page.goto('/?tab=simulator');
    await page.click('#chat-paste-from-periksa');
    await expect(toast(page)).toHaveText('Belum ada balasan sopan. Periksa hoaks dulu.');

    await analyze(page, 'pesan untuk ditempel');
    await page.locator('.bottom-nav-btn[data-tab="simulator"]').click();
    await page.click('#chat-paste-from-periksa');
    await expect(page.locator('#chat-simulator-input')).toHaveValue('Balasan sopan');
    await expect(toast(page)).toHaveText('Balasan sopan tertempel. Tekan kirim.');
  });
});

test.describe('Bahasa Mama Mode', () => {
  const begin = async (page, persona = 'mama') => {
    await page.goto('/?tab=simulator');
    await page.click(`.coach-persona-btn[data-persona="${persona}"]`);
    await page.locator('.coach-scenario-chip').first().click();
    await page.click('#coach-start-btn');
  };
  const say = async (page, text) => {
    await page.fill('#coach-input', text);
    await page.click('#coach-send-btn');
    await expect(page.locator('#coach-send-btn')).toBeEnabled();
  };

  test('needs a scenario before it starts', async ({ page }) => {
    await page.goto('/?tab=simulator');
    await page.click('#coach-start-btn');
    await expect(toast(page)).toHaveText('Mohon isi atau pilih skenario hoaks terlebih dahulu.');
    await expect(page.locator('#coach-setup')).toBeVisible();
  });

  test('the chosen persona plays the parent who forwarded the hoax', async ({ page, problems }) => {
    await page.goto('/?tab=simulator');
    await page.click('.coach-persona-btn[data-persona="papa"]');
    await expect(page.locator('.coach-persona-btn[data-persona="papa"]')).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('.coach-persona-btn[data-persona="mama"]')).toHaveAttribute('aria-checked', 'false');

    const preset = await page.locator('.coach-scenario-chip').first().getAttribute('data-scenario');
    await page.locator('.coach-scenario-chip').first().click();
    await expect(page.locator('#coach-scenario-input')).toHaveValue(preset);
    await page.click('#coach-start-btn');

    await expect(page.locator('#coach-chat-wrap')).toBeVisible();
    await expect(page.locator('#coach-setup')).toBeHidden();
    await expect(page.locator('#coach-active-name')).toHaveText('Papa');
    await expect(page.locator('#coach-active-avatar')).toHaveText('P');
    await expect(page.locator('#coach-active-mood')).toHaveText('Tegas - Ngeyel');
    await expect(page.locator('#coach-messages .coach-forward-label')).toHaveText('Papa mem-forward:');
    await expect(page.locator('#coach-messages')).toContainText(preset);
    expect(problems).toEqual([]);
  });

  test('the parent softens as the conversation goes on', async ({ page }) => {
    await begin(page);
    const mood = page.locator('#coach-active-mood');
    const expected = [
      'Skeptis - Defensif',
      'Mulai Mendengar',
      'Mulai Mendengar',
      'Mempertimbangkan',
      'Mempertimbangkan',
      'Mendukung Klarifikasi',
    ];
    for (let turn = 1; turn <= 6; turn += 1) {
      await say(page, `balasan ${turn}`);
      await expect(page.locator('#coach-messages .coach-msg.parent')).toHaveCount(turn + 1);
      await expect(mood).toHaveText(expected[turn - 1]);
    }
    await expect(page.locator('#coach-messages .coach-msg.user')).toHaveCount(6);
  });

  test('Enter sends, Shift+Enter does not', async ({ page }) => {
    await begin(page);
    await page.fill('#coach-input', 'baris satu');
    await page.press('#coach-input', 'Shift+Enter');
    await expect(page.locator('#coach-messages .coach-msg.user')).toHaveCount(0);
    await page.press('#coach-input', 'Enter');
    await expect(page.locator('#coach-messages .coach-msg.user')).toHaveCount(1);
  });

  test('evaluation needs at least one reply, then scores the conversation', async ({ page }) => {
    await begin(page);
    await page.click('#coach-end-btn');
    await expect(toast(page)).toHaveText('Kirim minimal satu balasan dulu untuk dievaluasi.');

    await say(page, 'Ma, boleh dicek dulu sumbernya?');
    await page.click('#coach-end-btn');
    await expect(page.locator('#coach-eval-wrap')).toBeVisible();
    await expect(page.locator('#coach-chat-wrap')).toBeHidden();
    await expect(page.locator('#coach-eval-score-num')).toHaveText('85');
    await expect(page.locator('#coach-eval-strengths li')).toHaveText(['Nada sopan']);
    await expect(page.locator('#coach-eval-improvements li')).toHaveText(['Tambahkan sumber']);
    await expect(page.locator('#coach-eval-rec')).toHaveText('Lanjutkan.');
    await expect(page.locator('#coach-eval-score-arc')).toHaveCSS('stroke-dashoffset', /^47\./);

    await page.click('#coach-restart-btn');
    await expect(page.locator('#coach-setup')).toBeVisible();
    await expect(page.locator('#coach-scenario-input')).toHaveValue('');
    await expect(page.locator('#coach-messages')).toBeEmpty();
  });

  test('going back clears the conversation', async ({ page }) => {
    await begin(page);
    await say(page, 'halo Ma');
    await page.click('#coach-back-btn');
    await expect(page.locator('#coach-setup')).toBeVisible();
    await expect(page.locator('#coach-messages')).toBeEmpty();
  });

  test('failures are shown in the chat and the evaluation toast', async ({ page }) => {
    await begin(page);
    await page.route('**/api/coach', (route) =>
      route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Layanan AI belum dikonfigurasi di server.' }) }),
    );
    await say(page, 'Ma, ini hoaks');
    await expect(page.locator('#coach-messages .coach-msg.parent').last()).toHaveText('Gagal memuat balasan. Layanan AI belum dikonfigurasi di server.');
    await expect(page.locator('#coach-input')).toBeFocused();

    await page.route('**/api/coach/evaluate', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }));
    await page.click('#coach-end-btn');
    await expect(toast(page)).toHaveText('Gagal mengevaluasi: HTTP 500');
    await expect(page.locator('#coach-end-btn')).toBeEnabled();
  });

  test('the home screen promo opens the coach', async ({ page }) => {
    await page.goto('/');
    await page.click('#hero-promo-coach');
    await expect(page.locator('#panel-simulator')).toHaveClass(/active/);
    await expect(page.locator('#coach-section')).toBeInViewport({ timeout: 3000 });
  });
});

test.describe('ambient behaviour', () => {
  test('the demo activity indicator stays within its range', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#live-activity-count')).toHaveText(/^\d+$/);
    await page.waitForTimeout(1500);
    const count = Number(await page.locator('#live-activity-count').innerText());
    expect(count).toBeGreaterThanOrEqual(8);
    expect(count).toBeLessThanOrEqual(47);
  });

  test('home counters settle on the values in the markup', async ({ page, request }) => {
    const html = await (await request.get('/')).text();
    const markup = (cls) => Number(html.match(new RegExp(`${cls}[\\s\\S]*?hero-stat-val[^>]*>([\\d.]+)<`))[1].replace(/\./g, ''));

    await page.goto('/');
    await page.waitForTimeout(1800);
    const text = (selector) => page.locator(selector).innerText().then((value) => Number(value.replace(/\D/g, '')));
    expect(await text('.streak-stat .hero-stat-val')).toBe(markup('streak-stat'));
    expect(await text('.points-stat .hero-stat-val')).toBe(markup('points-stat'));
  });

  test('uncaught errors surface as a friendly toast instead of failing silently', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => setTimeout(() => {
      throw new Error('boom');
    }));
    await expect(toast(page)).toHaveText('Terjadi kesalahan kecil. Coba muat ulang halaman.');
    await expect(toast(page)).toHaveClass(/toast-danger/);

    await page.evaluate(() => {
      Promise.reject(new Error('ditolak'));
    });
    await expect(toast(page)).toHaveText('Permintaan gagal di latar belakang. Coba lagi.');
  });

  test('the installed app logs its signature once', async ({ page }) => {
    const logs = [];
    page.on('console', (message) => logs.push(message.text()));
    await page.goto('/');
    await expect.poll(() => logs.filter((line) => line.includes('SaringSini v2.3')).length).toBe(1);
  });
});

test.describe('install banner', () => {
  const offerInstall = (page, outcome = 'accepted') =>
    page.evaluate((result) => {
      const event = new Event('beforeinstallprompt', { cancelable: true });
      event.prompt = () => {
        window.__installPrompted = true;
      };
      event.userChoice = Promise.resolve({ outcome: result });
      window.dispatchEvent(event);
    }, outcome);

  test('appears a few seconds after the browser offers installation, and installs on request', async ({ page }) => {
    await page.goto('/');
    await offerInstall(page);
    await expect(page.locator('#pwa-install-banner')).toBeHidden();
    await expect(page.locator('#pwa-install-banner')).toBeVisible({ timeout: 7000 });

    await page.click('#pwa-install-accept');
    await expect(page.locator('#pwa-install-banner')).toBeHidden();
    expect(await page.evaluate(() => window.__installPrompted)).toBe(true);
    await expect(toast(page)).toHaveText('SaringSini berhasil dipasang');
  });

  test('stays away for a week after being dismissed', async ({ page }) => {
    await page.goto('/');
    await offerInstall(page);
    await expect(page.locator('#pwa-install-banner')).toBeVisible({ timeout: 7000 });
    await page.click('#pwa-install-dismiss');
    await expect(page.locator('#pwa-install-banner')).toBeHidden();
    expect(Number(await page.evaluate(() => localStorage.getItem('saringsini_pwa_dismissed_at')))).toBeGreaterThan(0);

    await page.reload();
    await offerInstall(page);
    await page.waitForTimeout(4600);
    await expect(page.locator('#pwa-install-banner')).toBeHidden();
  });

  test('hides when the app gets installed some other way', async ({ page }) => {
    await page.goto('/');
    await offerInstall(page);
    await expect(page.locator('#pwa-install-banner')).toBeVisible({ timeout: 7000 });
    await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
    await expect(page.locator('#pwa-install-banner')).toBeHidden();
  });
});

firstVisit.describe('first visit onboarding', () => {
  firstVisit('walks through four steps and remembers that it was completed', async ({ page, problems }) => {
    await page.goto('/');
    const overlay = page.locator('#onboarding-overlay');
    await expect(overlay).toBeHidden();
    await expect(overlay).toBeVisible({ timeout: 3000 });

    const titles = ['Selamat Datang di SaringSini', 'Periksa Pesan Mencurigakan', 'Balasan Sopan Otomatis', 'Jelajahi Fitur Demonstrasi'];
    for (const [index, title] of titles.entries()) {
      await expect(page.locator('#onboarding-title')).toHaveText(title);
      await expect(page.locator('#onboarding-illustration svg')).toBeVisible();
      await expect(page.locator('.onboarding-dot').nth(index)).toHaveClass(/active/);
      await expect(page.locator('.onboarding-dot.active')).toHaveCount(1);
      await expect(page.locator('#onboarding-next')).toHaveText(index === titles.length - 1 ? 'Mulai' : 'Lanjut');
      await page.click('#onboarding-next');
    }

    await expect(overlay).toBeHidden();
    await expect(page.locator('#toast')).toHaveText('Selamat memeriksa hoaks. Tetap waspada keluarga Indonesia.');
    expect(await page.evaluate(() => localStorage.getItem('saringsini_onboarded'))).toBe('1');

    await page.reload();
    await page.waitForTimeout(1500);
    await expect(overlay).toBeHidden();
    expect(problems).toEqual([]);
  });

  firstVisit('can be skipped or closed with Escape', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#onboarding-overlay')).toBeVisible({ timeout: 3000 });
    await page.click('#onboarding-skip');
    await expect(page.locator('#onboarding-overlay')).toBeHidden();
    expect(await page.evaluate(() => localStorage.getItem('saringsini_onboarded'))).toBe('1');

    await page.evaluate(() => localStorage.removeItem('saringsini_onboarded'));
    await page.reload();
    await expect(page.locator('#onboarding-overlay')).toBeVisible({ timeout: 3000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('#onboarding-overlay')).toBeHidden();
  });
});
