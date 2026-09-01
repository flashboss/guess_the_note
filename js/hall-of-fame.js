import {
  HALL_OF_FAME_API_URL,
  HALL_OF_FAME_SUBMIT_TOKEN,
  HALL_OF_FAME_MAX_DISPLAY,
  SETTINGS_HALL_OF_FAME_CACHE,
  SETTINGS_HALL_OF_FAME_LOCAL,
  SETTINGS_SOUND,
  PLAYER_NAME_MAX,
} from "./constants.js";
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

function celebrationEl() {
  return document.getElementById("hallOfFameCelebration");
}

function playCelebrationTone() {
  if (storageGet(SETTINGS_SOUND) === "0") return;
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      gain.gain.value = 0.0001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + index * 0.12;
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.start(start);
      osc.stop(start + 0.36);
    });
    window.setTimeout(() => ctx.close(), 1200);
  } catch {
    /* ignore */
  }
}

function showCelebration() {
  const overlay = celebrationEl();
  if (!overlay) return;
  overlay.classList.remove("is-hidden");
  playCelebrationTone();
}

function hideCelebration() {
  celebrationEl()?.classList.add("is-hidden");
}

async function processSessionResult(result) {
  if (!result) return null;

  const entry = {
    name: normalizeName(result.playerName),
    score: Math.round(Number(result.universalScore)),
    grade: Math.round(Number(result.grade)),
  };
  if (!entry.name || entry.score <= 0) return null;

  let board;
  try {
    board = await loadRecords();
  } catch {
    return null;
  }

  const records = Array.isArray(board.records) ? board.records : [];
  if (!qualifiesForBoard(entry.score, records)) return null;

  const response = await submitRecord(entry);
  if (response?.ok && response.isNewHigh) showCelebration();
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
        <th scope="col">${t("hallOfFameGrade")}</th>
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
        <td>${escapeHtml(String(row.grade ?? "—"))}</td>
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
  formatRecordDate,
};
