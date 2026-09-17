import {
  loadRecords,
  renderRecordsTable,
  scrollHighlightedHofRow,
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

function highlightFromQuery() {
  const params = new URLSearchParams(location.search);
  return {
    highlightName: params.get("player") || "",
    highlightScore: params.get("score"),
  };
}

function rerenderBoard() {
  renderRecordsTable(tableHost, lastRecords, highlightFromQuery());
}

function revealHighlightedPlayer() {
  if (!highlightFromQuery().highlightName) return;
  scrollHighlightedHofRow(tableHost);
  window.setTimeout(() => scrollHighlightedHofRow(tableHost), 120);
  window.setTimeout(() => scrollHighlightedHofRow(tableHost), 350);
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
  revealHighlightedPlayer();
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
  revealHighlightedPlayer();
});

window.addEventListener("gtn:i18n", () => {
  applyPageCopy();
  refreshBoard();
});

window.addEventListener("load", revealHighlightedPlayer);

if (window.I18n) window.I18n.apply();
applyPageCopy();
refreshBoard();
