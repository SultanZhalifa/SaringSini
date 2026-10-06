'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { HttpError } = require('../lib/http-error');
const { badgeClassForPercentage } = require('../lib/analysis');
const { formatRelativeTime } = require('../lib/relative-time');
const { isPlainObject, toPlainText } = require('../lib/sanitize');

const SAVE_DEBOUNCE_MS = 250;
const MINUTE = 60_000;
const BADGE_CLASSES = ['safe', 'warning', 'danger'];
const ID_PATTERN = /^[\w-]{1,64}$/;

/** Voters are stored as hashes so a leaked data file does not expose client identifiers. */
const hashClientId = (clientId) => crypto.createHash('sha256').update(clientId).digest('hex').slice(0, 32);

const toCount = (value) => (Number.isInteger(value) && value > 0 ? value : 0);

function readJson(filePath, log) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (error) {
    if (error.code !== 'ENOENT') log.warn(`[DB] Gagal membaca ${path.basename(filePath)}: ${error.message}`);
    return null;
  }
}

/**
 * In-memory community feed with best-effort JSON persistence for local development and
 * demos. State is per process: on ephemeral or multi-instance platforms use a managed
 * database instead.
 */
function createCommunityStore({
  filePath,
  seed,
  maxReports,
  maxVotersPerReport,
  now = Date.now,
  log = console,
}) {
  let saveTimer = null;
  let dirty = false;

  /** Rebuilds a trusted record from stored data, which may predate current validation. */
  function hydrate(entry) {
    if (!isPlainObject(entry) || !ID_PATTERN.test(entry.id) || typeof entry.text !== 'string') return null;

    const percentage = Math.min(100, toCount(entry.percentage));
    const legacyVoters = Array.isArray(entry.upvotedClients)
      ? entry.upvotedClients.filter((id) => typeof id === 'string').map(hashClientId)
      : [];
    const voters = Array.isArray(entry.voters) ? entry.voters.filter((id) => typeof id === 'string') : legacyVoters;

    return {
      id: entry.id,
      author: toPlainText(entry.author, 40) || 'Anonim',
      text: toPlainText(entry.text, 200),
      percentage,
      badge: toPlainText(entry.badge, 30),
      badgeClass: BADGE_CLASSES.includes(entry.badgeClass) ? entry.badgeClass : badgeClassForPercentage(percentage),
      category: toPlainText(entry.category, 60) || 'Umum',
      upvotes: toCount(entry.upvotes),
      createdAt: Number.isFinite(entry.createdAt) ? entry.createdAt : now(),
      voters: voters.slice(0, maxVotersPerReport),
    };
  }

  function load() {
    const stored = readJson(filePath, log);
    const restored = Array.isArray(stored) ? stored.map(hydrate).filter(Boolean) : [];
    if (restored.length > 0) return restored.slice(0, maxReports);

    return seed.map(({ ageMinutes, ...report }) => ({
      ...report,
      createdAt: now() - ageMinutes * MINUTE,
      voters: [],
    }));
  }

  let reports = load();

  /** Atomic write: a crash mid-write can never leave a truncated data file. */
  function persist() {
    dirty = false;
    const temporaryPath = `${filePath}.${process.pid}.tmp`;
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(temporaryPath, JSON.stringify(reports, null, 2));
      fs.renameSync(temporaryPath, filePath);
    } catch (error) {
      log.warn(`[DB] Gagal menyimpan ${path.basename(filePath)}: ${error.message}`);
      fs.rm(temporaryPath, { force: true }, () => {});
    }
  }

  function scheduleSave() {
    dirty = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, SAVE_DEBOUNCE_MS);
    saveTimer.unref();
  }

  /** Public projection: never exposes voter data. */
  const toPublic = (report, voter) => ({
    id: report.id,
    author: report.author,
    text: report.text,
    percentage: report.percentage,
    badge: report.badge,
    badgeClass: report.badgeClass,
    category: report.category,
    upvotes: report.upvotes,
    time: formatRelativeTime(report.createdAt, now()),
    upvoted: voter ? report.voters.includes(voter) : false,
  });

  return {
    get size() {
      return reports.length;
    },

    totals() {
      return {
        totalChecks: reports.length,
        totalUpvotes: reports.reduce((sum, report) => sum + report.upvotes, 0),
      };
    },

    /** @param {string} [viewerClientId] marks reports this client has already supported */
    list(viewerClientId) {
      const voter = viewerClientId ? hashClientId(viewerClientId) : null;
      return reports.map((report) => toPublic(report, voter));
    },

    /** Publishes an already-sanitised analysis snippet at the top of the feed. */
    add({ text, percentage, badge, category }) {
      const report = {
        id: `cp_${crypto.randomUUID()}`,
        author: `Buster #${crypto.randomInt(1000, 10000)}`,
        text,
        percentage,
        badge,
        badgeClass: badgeClassForPercentage(percentage),
        category,
        upvotes: 0,
        createdAt: now(),
        voters: [],
      };
      reports = [report, ...reports].slice(0, maxReports);
      scheduleSave();
      return toPublic(report, null);
    },

    upvote(id, clientId) {
      const report = reports.find((candidate) => candidate.id === id);
      if (!report) throw new HttpError(404, 'Laporan tidak ditemukan.');

      const voter = hashClientId(clientId);
      if (report.voters.includes(voter)) {
        throw new HttpError(409, 'Anda sudah memberikan dukungan untuk laporan ini.');
      }
      if (report.voters.length >= maxVotersPerReport) {
        throw new HttpError(429, 'Laporan ini sudah mencapai batas dukungan.');
      }

      report.voters.push(voter);
      report.upvotes += 1;
      scheduleSave();
      return toPublic(report, voter);
    },

    /** Writes pending changes immediately; call before the process exits. */
    flush() {
      clearTimeout(saveTimer);
      if (dirty) persist();
    },
  };
}

module.exports = { createCommunityStore };
