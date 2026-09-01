import {
  HALL_OF_FAME_API_URL,
  HALL_OF_FAME_SUBMIT_TOKEN,
  HALL_OF_FAME_MAX_DISPLAY,
  SETTINGS_HALL_OF_FAME_CACHE,
  SETTINGS_HALL_OF_FAME_LOCAL,
  SETTINGS_SOUND,
  PLAYER_NAME_MAX,
} from "./constants.js";
import { startFireworks, stopFireworks } from "./fireworks.js";
import { storageGet, storageSet, t } from "./util.js";
import { formatUniversalScore } from "./scoring.js";

const LOCAL_MAX_RECORDS = 50;

function apiEnabled() {
  return Boolean(HALL_OF_FAME_API_URL);
}

function buildApiUrl(params) {
  const url = new URL(HALL_OF_FAME_API_URL);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

function readLocalRecords() {
  try {
    const raw = storageGet(SETTINGS_HALL_OF_FAME_LOCAL);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalRecords(records) {
  storageSet(SETTINGS_HALL_OF_FAME_LOCAL, JSON.stringify(records));
}

function sortedRecords(records) {
  return records
    .slice()
    .sort((a, b) => Number(b.score) - Number(a.score) || String(b.at).localeCompare(String(a.at)))
    .slice(0, LOCAL_MAX_RECORDS);
}

function highScore(records) {
  if (!records.length) return 0;
  return records.reduce((max, row) => Math.max(max, Number(row.score) || 0), 0);
}

function saveCache(payload) {
  storageSet(
    SETTINGS_HALL_OF_FAME_CACHE,
    JSON.stringify({
      highScore: payload.highScore || 0,
      records: payload.records || [],
      at: Date.now(),
    })
  );
}

function loadCache() {
  try {
    const raw = storageGet(SETTINGS_HALL_OF_FAME_CACHE);
    if (!raw) return { ok: true, highScore: 0, records: [], cached: true };
    const parsed = JSON.parse(raw);
    return {
      ok: true,
      highScore: Number(parsed.highScore) || 0,
      records: Array.isArray(parsed.records) ? parsed.records : [],
      cached: true,
    };
  } catch {
    return { ok: true, highScore: 0, records: [], cached: true };
  }
}

function normalizeName(name) {
  return String(name || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PLAYER_NAME_MAX);
}

const JSONP_TIMEOUT_MS = 15000;
let jsonpCounter = 0;

// Apps Script Web Apps do not send CORS headers; JSONP is the standard workaround.
function fetchApi(params) {
  return fetchJsonp(buildApiUrl(params));
}

function fetchJsonp(url) {
  return new Promise((resolve, reject) => {
    const callbackName = `gtnHofCb${Date.now()}${jsonpCounter++}`;
    const script = document.createElement("script");
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      delete window[callbackName];
      script.remove();
      fn(value);
    };

    const timer = window.setTimeout(() => {
      finish(reject, new Error("timeout"));
    }, JSONP_TIMEOUT_MS);

    window[callbackName] = (data) => finish(resolve, data);

    const separator = url.includes("?") ? "&" : "?";
    script.src = `${url}${separator}callback=${encodeURIComponent(callbackName)}`;
    script.async = true;
    script.onerror = () => finish(reject, new Error("jsonp_failed"));

    document.head.appendChild(script);
  });
}

async function loadRecords() {
  if (!apiEnabled()) {
    const records = sortedRecords(readLocalRecords());
    return { ok: true, highScore: highScore(records), records, local: true };
  }

  try {
    const data = await fetchApi({ action: "list" });
    if (data.ok) saveCache(data);
    return data;
  } catch {
    return loadCache();
  }
}

function submitLocalRecord(entry) {
  const records = readLocalRecords();
  const previousHigh = highScore(records);
  const row = {
    name: normalizeName(entry.name),
    score: Math.round(Number(entry.score)),
    grade: Math.round(Number(entry.grade)),
    at: new Date().toISOString(),
  };
  if (!row.name || !Number.isFinite(row.score)) {
    return { ok: false, error: "invalid_entry" };
  }
  records.push(row);
  const nextRecords = sortedRecords(records);
  writeLocalRecords(nextRecords);
  return {
    ok: true,
    added: true,
    isNewHigh: row.score > previousHigh,
    highScore: highScore(nextRecords),
    records: nextRecords,
    local: true,
  };
}

async function submitRecord(entry) {
  if (!apiEnabled()) {
    return submitLocalRecord(entry);
  }

  const params = {
    action: "submit",
    name: normalizeName(entry.name),
    score: Math.round(Number(entry.score)),
    grade: Math.round(Number(entry.grade)),
  };
  if (HALL_OF_FAME_SUBMIT_TOKEN) params.token = HALL_OF_FAME_SUBMIT_TOKEN;

  try {
    const data = await fetchApi(params);
    if (data.ok) saveCache(data);
    return data;
  } catch {
    return { ok: false, error: "network" };
  }
}

function qualifiesForBoard(score, records) {
  const value = Math.round(Number(score));
  if (!Number.isFinite(value) || value <= 0) return false;
  if (!records.length) return true;
  if (value >= highScore(records)) return true;
  if (records.length < LOCAL_MAX_RECORDS) return true;
  const cutoff = Number(records[records.length - 1]?.score) || 0;
  return value >= cutoff;
}

function celebrationSlot() {
  return document.getElementById("resultHofSlot");
}

function celebrationPending() {
  return document.getElementById("resultHofPending");
}

function celebrationPendingText() {
  return document.getElementById("resultHofPendingText");
}

function celebrationBadge() {
  return document.getElementById("resultHofBadge");
}

function celebrationBadgeText() {
  return document.getElementById("resultHofBadgeText");
}

function playCelebrationTone() {
  if (storageGet(SETTINGS_SOUND) === "0") return;
  try {
    const audio = new AudioContext();
    const melody = [
      { freq: 523.25, at: 0, dur: 0.22 },
      { freq: 659.25, at: 0.14, dur: 0.22 },
      { freq: 783.99, at: 0.28, dur: 0.24 },
      { freq: 1046.5, at: 0.44, dur: 0.34 },
      { freq: 1174.66, at: 0.62, dur: 0.28 },
      { freq: 1318.51, at: 0.8, dur: 0.5 },
    ];
    melody.forEach(({ freq, at, dur }) => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(audio.destination);
      const start = audio.currentTime + at;
      gain.gain.exponentialRampToValueAtTime(0.1, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    });
    window.setTimeout(() => audio.close(), 1800);
  } catch {
    /* ignore */
  }
}

function showHofPending() {
  const slot = celebrationSlot();
  const pending = celebrationPending();
  const badge = celebrationBadge();
  const label = celebrationPendingText();
  if (label) label.textContent = t("hallOfFameChecking");
  slot?.classList.remove("is-hidden");
  pending?.classList.remove("is-hidden");
  badge?.classList.add("is-hidden");
}

function hideHofStatus() {
  celebrationSlot()?.classList.add("is-hidden");
  celebrationPending()?.classList.add("is-hidden");
  const badge = celebrationBadge();
  badge?.classList.add("is-hidden");
  if (badge) delete badge.dataset.newHigh;
}

function showHallOfFameCelebration(isNewHigh) {
  const pending = celebrationPending();
  const badge = celebrationBadge();
  const label = celebrationBadgeText();
  pending?.classList.add("is-hidden");
  if (badge) {
    badge.dataset.newHigh = isNewHigh ? "1" : "0";
    badge.classList.remove("is-hidden");
  }
  if (label) {
    label.textContent = t(isNewHigh ? "hallOfFameNewRecord" : "hallOfFameQualified");
  }
  celebrationSlot()?.classList.remove("is-hidden");
  startFireworks();
  playCelebrationTone();
}

function hideCelebration() {
  hideHofStatus();
  stopFireworks();
}

function showCelebration() {
  showHallOfFameCelebration(true);
}

async function processSessionResult(result) {
  if (!result) return null;

  const entry = {
    name: normalizeName(result.playerName),
    score: Math.round(Number(result.universalScore)),
    grade: Math.round(Number(result.grade)),
  };
  if (!entry.name || entry.score <= 0) return null;

  showHofPending();

  let board;
  try {
    board = await loadRecords();
  } catch {
    hideHofStatus();
    return null;
  }

  const records = Array.isArray(board.records) ? board.records : [];
  if (!qualifiesForBoard(entry.score, records)) {
    hideHofStatus();
    return null;
  }

  const response = await submitRecord(entry);
  if (response?.ok && response.added) {
    showHallOfFameCelebration(Boolean(response.isNewHigh));
  } else {
    hideHofStatus();
  }
  return response;
}

function formatRecordDate(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function renderRecordsTable(container, records, options = {}) {
  if (!container) return;
  const limit = options.limit ?? HALL_OF_FAME_MAX_DISPLAY;
  const rows = sortedRecords(records).slice(0, limit);

  if (!rows.length) {
    container.innerHTML = `<p class="hof-empty">${t("hallOfFameEmpty")}</p>`;
    return;
  }

  const head = `
    <thead>
      <tr>
        <th scope="col">${t("hallOfFameRank")}</th>
        <th scope="col">${t("hallOfFamePlayer")}</th>
        <th scope="col">${t("hallOfFameScore")}</th>
        <th scope="col">${t("hallOfFameDate")}</th>
      </tr>
    </thead>
  `;

  const body = rows
    .map(
      (row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(row.name)}</td>
        <td>${escapeHtml(formatUniversalScore(row.score))}</td>
        <td>${escapeHtml(formatRecordDate(row.at))}</td>
      </tr>
    `
    )
    .join("");

  container.innerHTML = `<table class="hof-table">${head}<tbody>${body}</tbody></table>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export {
  apiEnabled,
  loadRecords,
  submitRecord,
  processSessionResult,
  renderRecordsTable,
  showCelebration,
  hideCelebration,
  showHallOfFameCelebration,
  formatRecordDate,
};
