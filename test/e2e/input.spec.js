'use strict';

const { PNG_1X1, expect, test } = require('./fixtures');

const MP4_BYTES = Buffer.concat([Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]), Buffer.alloc(32)]);
const FIVE_MB = 5 * 1024 * 1024;

const PANELS = ['beranda', 'periksa', 'simulator', 'komunitas', 'edukasi'];
const toast = (page) => page.locator('#toast');

test.describe('navigation', () => {
  test('the bottom navigation switches between the five panels', async ({ page, problems }) => {
    await page.goto('/');
    for (const tab of ['periksa', 'simulator', 'komunitas', 'edukasi', 'beranda']) {
      await page.locator(`.bottom-nav-btn[data-tab="${tab}"]`).click();
      await expect(page.locator(`#panel-${tab}`)).toHaveClass(/active/);
      await expect(page.locator(`.bottom-nav-btn[data-tab="${tab}"]`)).toHaveClass(/active/);
      await expect(page.locator('.tab-panel.active')).toHaveCount(1);
    }
    expect(problems).toEqual([]);
  });

  test('the quick actions on the home screen open their panels', async ({ page }) => {
    await page.goto('/');
    for (const tab of ['periksa', 'simulator', 'komunitas', 'edukasi']) {
      await page.click(`#action-go-${tab}`);
      await expect(page.locator(`#panel-${tab}`)).toHaveClass(/active/);
      await page.locator('.bottom-nav-btn[data-tab="beranda"]').click();
    }
  });

  test('the ?tab= shortcut opens a panel, and unknown values are ignored', async ({ page }) => {
    for (const tab of PANELS) {
      await page.goto(`/?tab=${tab}`);
      await expect(page.locator(`#panel-${tab}`)).toHaveClass(/active/);
    }
    await page.goto('/?tab=tidak-ada');
    await expect(page.locator('#panel-beranda')).toHaveClass(/active/);
  });
});

test.describe('input tabs', () => {
  test('the four input modes show exactly one input group', async ({ page }) => {
    await page.goto('/?tab=periksa');
    for (const name of ['image', 'deepfake', 'url', 'text']) {
      await page.click(`#tab-${name}`);
      await expect(page.locator(`#tab-${name}`)).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator(`#group-${name}`)).toBeVisible();
      await expect(page.locator('[id^="group-"]:not(.hidden)')).toHaveCount(1);
    }
  });

  test('every mode asks for its input before sending anything', async ({ page }) => {
    await page.goto('/?tab=periksa');
    const requests = [];
    page.on('request', (request) => request.url().includes('/api/analyze') && requests.push(request.url()));

    const cases = [
      ['text', 'Mohon masukkan teks pesan atau berita terlebih dahulu'],
      ['image', 'Mohon pilih atau unggah tangkapan layar chat'],
      ['deepfake', 'Mohon pilih atau unggah foto atau video rekayasa AI'],
      ['url', 'Mohon tempel URL yang ingin diperiksa'],
    ];
    for (const [name, message] of cases) {
      await page.click(`#tab-${name}`);
      await page.click('#analyze-btn');
      await expect(toast(page)).toHaveText(message);
    }
    await page.fill('#url-input', 'bukan url');
    await page.click('#analyze-btn');
    await expect(toast(page)).toHaveText('Format URL tidak valid. Pastikan diawali http:// atau https://');
    expect(requests).toEqual([]);
  });

  test('Escape dismisses the toast', async ({ page }) => {
    await page.goto('/?tab=periksa');
    await page.click('#analyze-btn');
    await expect(toast(page)).toHaveClass(/show/);
    await page.keyboard.press('Escape');
    await expect(toast(page)).not.toHaveClass(/show/);
  });
});

test.describe('uploads', () => {
  test('a screenshot is previewed, analysed and can be removed', async ({ page, problems }) => {
    await page.goto('/?tab=periksa');
    await page.click('#tab-image');
    await page.setInputFiles('#file-input', { name: 'chat.png', mimeType: 'image/png', buffer: PNG_1X1 });

    await expect(page.locator('#image-preview-container')).toBeVisible();
    await expect(page.locator('#image-preview')).toHaveAttribute('src', /^blob:/);

    await page.click('#analyze-btn');
    await expect(page.locator('#res-claims-list .claim-card').first()).toBeVisible();

    await page.click('#remove-image');
    await expect(page.locator('#image-preview-container')).toBeHidden();
    expect(problems).toEqual([]);
  });

  test('files that are not images, or are too large, are refused in the browser', async ({ page }) => {
    await page.goto('/?tab=periksa');
    await page.click('#tab-image');

    await page.setInputFiles('#file-input', { name: 'catatan.txt', mimeType: 'text/plain', buffer: Buffer.from('halo') });
    await expect(toast(page)).toHaveText('Format berkas tidak didukung. Hanya gambar.');

    await page.setInputFiles('#file-input', { name: 'besar.png', mimeType: 'image/png', buffer: Buffer.alloc(FIVE_MB + 1) });
    await expect(toast(page)).toHaveText('Ukuran gambar terlalu besar. Maksimal 5MB.');
    await expect(page.locator('#image-preview-container')).toBeHidden();
  });

  test('the deepfake check accepts an image or a video and shows the right preview', async ({ page }) => {
    await page.goto('/?tab=periksa');
    await page.click('#tab-deepfake');

    await page.setInputFiles('#file-input-deepfake', { name: 'foto.png', mimeType: 'image/png', buffer: PNG_1X1 });
    await expect(page.locator('#image-preview-deepfake')).toBeVisible();
    await expect(page.locator('#video-preview-deepfake')).toBeHidden();

    await page.setInputFiles('#file-input-deepfake', { name: 'klip.mp4', mimeType: 'video/mp4', buffer: MP4_BYTES });
    await expect(page.locator('#video-preview-deepfake')).toBeVisible();
    await expect(page.locator('#video-preview-deepfake')).toHaveAttribute('src', /^blob:/);
    await expect(page.locator('#image-preview-deepfake')).toBeHidden();

    await page.click('#analyze-btn');
    await expect(page.locator('#res-claims-list .claim-card').first()).toBeVisible();

    await page.click('#remove-image-deepfake');
    await expect(page.locator('#image-preview-container-deepfake')).toBeHidden();
  });

  test('the deepfake check refuses other file types and oversized files', async ({ page }) => {
    await page.goto('/?tab=periksa');
    await page.click('#tab-deepfake');

    await page.setInputFiles('#file-input-deepfake', { name: 'a.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
    await expect(toast(page)).toHaveText('Format berkas tidak didukung. Hanya gambar atau video.');

    await page.setInputFiles('#file-input-deepfake', { name: 'b.mp4', mimeType: 'video/mp4', buffer: Buffer.alloc(FIVE_MB + 1) });
    await expect(toast(page)).toHaveText('Ukuran berkas terlalu besar. Maksimal 5MB.');
  });

  test('dropping a file on the drop zone selects it', async ({ page }) => {
    await page.goto('/?tab=periksa');
    await page.click('#tab-image');

    const dataTransfer = await page.evaluateHandle((base64) => {
      const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const transfer = new DataTransfer();
      transfer.items.add(new File([bytes], 'drop.png', { type: 'image/png' }));
      return transfer;
    }, PNG_1X1.toString('base64'));

    await page.dispatchEvent('#drop-zone', 'dragenter', { dataTransfer });
    await expect(page.locator('#drop-zone')).toHaveClass(/dragover/);
    await page.dispatchEvent('#drop-zone', 'drop', { dataTransfer });
    await expect(page.locator('#drop-zone')).not.toHaveClass(/dragover/);
    await expect(page.locator('#image-preview-container')).toBeVisible();
  });

  test('a link check publishes only the host to the community feed', async ({ page }) => {
    await page.goto('/?tab=periksa');
    await page.click('#tab-url');
    await page.fill('#url-input', 'https://promo-bpjs.example/klaim?token=rahasia');
    await page.click('#analyze-btn');
    await expect(page.locator('#res-claims-list .claim-card').first()).toBeVisible();

    await page.goto('/?tab=komunitas');
    await expect(page.locator('.community-text', { hasText: 'Tautan mencurigakan: promo-bpjs.example' }).first()).toBeVisible();
    await expect(page.locator('#community-feed-container')).not.toContainText('token=rahasia');
  });
});

test.describe('failures', () => {
  test('a rejected analysis shows the server message and restores the form', async ({ page }) => {
    const message = 'Batas pemeriksaan tercapai. Tunggu sebentar untuk menjaga kuota sistem.';
    await page.route('**/api/analyze', (route) =>
      route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: message }) }),
    );
    await page.goto('/?tab=periksa');
    await page.fill('#message-input', 'pesan yang ditolak server');
    await page.click('#analyze-btn');

    await expect(toast(page)).toHaveText(message);
    await expect(toast(page)).toHaveClass(/toast-danger/);
    await expect(page.locator('#result-empty')).toBeVisible();
    await expect(page.locator('#analyze-btn')).toBeEnabled();
  });

  test('a network failure is reported and does not leave the button stuck', async ({ page }) => {
    await page.route('**/api/analyze', (route) => route.abort());
    await page.goto('/?tab=periksa');
    await page.fill('#message-input', 'pesan saat jaringan putus');
    await page.click('#analyze-btn');

    await expect(toast(page)).toHaveClass(/toast-danger/);
    await expect(page.locator('#result-empty')).toBeVisible();
    await expect(page.locator('#analyze-btn')).toBeEnabled();
  });
});

test.describe('voice input', () => {
  test.beforeEach(async ({ page }) => {
    // Chromium's recogniser needs a microphone and Google's service; script a deterministic one.
    await page.addInitScript(() => {
      window.SpeechRecognition = window.webkitSpeechRecognition = class {
        start() {
          this.onstart?.();
          setTimeout(() => {
            const result = Object.assign([{ transcript: ' halo dunia ' }], { isFinal: true });
            this.onresult?.({ resultIndex: 0, results: [result] });
            this.onend?.();
          }, 50);
        }

        stop() {
          this.onend?.();
        }
      };
    });
  });

  test('dictated text is appended to the message', async ({ page }) => {
    await page.goto('/?tab=periksa');
    await page.click('#voice-input-btn');

    await expect(page.locator('#message-input')).toHaveValue('halo dunia');
    await expect(toast(page)).toHaveText('Mulai bicara dalam Bahasa Indonesia');

    await page.click('#voice-input-btn');
    await expect(page.locator('#message-input')).toHaveValue('halo dunia halo dunia');
    await expect(page.locator('#voice-input-btn')).not.toHaveClass(/recording/);
  });
});

test('the voice button is disabled when the browser has no speech recognition', async ({ page }) => {
  await page.addInitScript(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  });
  await page.goto('/?tab=periksa');
  await expect(page.locator('#voice-input-btn')).toBeDisabled();
  await expect(page.locator('#voice-input-btn')).toHaveAttribute('aria-disabled', 'true');
});
