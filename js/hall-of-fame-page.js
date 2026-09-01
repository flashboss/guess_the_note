import {
  loadRecords,
  renderRecordsTable,
  getHallOfFameDisplayLimit,
  setHallOfFameDisplayLimit,
} from "./hall-of-fame.js";
import { t } from "./util.js";

const tableHost = document.getElementById("hofTable");
const statusEl = document.getElementById("hofStatus");
const displayInput = document.getElementById("hofDisplayCount");
const displayLabel = document.getElementById("hofDisplayLabel");

let lastRecords = [];

function setStatus(message) {
  if (statusEl) statusEl.textContent = message || "";
}

function syncDisplayControl() {
  const limit = getHallOfFameDisplayLimit();
  if (displayInput) displayInput.value = String(limit);
  if (displayLabel) displayLabel.textContent = String(limit);
}

function rerenderBoard() {
  renderRecordsTable(tableHost, lastRecords);
}

async function refreshBoard() {
  setStatus(t("hallOfFameLoading"));
  const data = await loadRecords();
  if (!data.ok) {
    setStatus(t("hallOfFameLoadError"));
    lastRecords = [];
    renderRecordsTable(tableHost, []);
    return;
  }

  lastRecords = data.records || [];
  rerenderBoard();
  if (data.local) {
    setStatus(t("hallOfFameLocalNote"));
  } else if (data.cached) {
    setStatus(t("hallOfFameCachedNote"));
  } else {
    setStatus("");
  }
}

function applyPageCopy() {
  document.title = t("hallOfFameTitle");
  syncDisplayControl();
}

displayInput?.addEventListener("input", () => {
  const next = setHallOfFameDisplayLimit(displayInput.value);
  if (displayInput) displayInput.value = String(next);
  if (displayLabel) displayLabel.textContent = String(next);
  rerenderBoard();
});

window.addEventListener("gtn:i18n", () => {
  applyPageCopy();
  refreshBoard();
});

if (window.I18n) window.I18n.apply();
applyPageCopy();
refreshBoard();
