'use strict';

const { expect, test: base } = require('@playwright/test');

const HOSTILE_TEXT = '<img src=x onerror="window.__pwned=1">';

/**
 * `problems` collects uncaught page errors and console errors (which include
 * Content-Security-Policy violations). Failed loads of Google Fonts are ignored: they
 * depend on the network, not on us.
 */
const collectProblems = async ({ page }, use) => {
  const problems = [];
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    const fromFonts = /fonts\.(googleapis|gstatic)\.com/.test(message.location().url);
    if (message.type() === 'error' && !fromFonts) problems.push(`console: ${message.text()}`);
  });
  await use(problems);
};

/** A returning visitor: the first-visit onboarding tour has already been dismissed. */
const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => localStorage.setItem('saringsini_onboarded', '1'));
    await use(page);
  },
  problems: collectProblems,
});

/** A brand-new visitor who still sees the onboarding tour. */
const firstVisit = base.extend({ problems: collectProblems });

/** Runs an analysis through the UI and waits for the result cards. */
const analyze = async (page, message) => {
  await page.goto('/?tab=periksa');
  await page.fill('#message-input', message);
  await page.click('#analyze-btn');
  await expect(page.locator('#res-claims-list .claim-card').first()).toBeVisible();
};

/** A valid 1x1 PNG, so previews render without console noise. */
const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

module.exports = { expect, test, firstVisit, analyze, HOSTILE_TEXT, PNG_1X1 };
