import { loadRecords, renderRecordsTable } from "./hall-of-fame.js";
import { t } from "./util.js";

const tableHost = document.getElementById("hofTable");
const statusEl = document.getElementById("hofStatus");

function setStatus(message) {
  if (statusEl) statusEl.textContent = message || "";
}

async function refreshBoard() {
  setStatus(t("hallOfFameLoading"));
  const data = await loadRecords();
  if (!data.ok) {
    setStatus(t("hallOfFameLoadError"));
    renderRecordsTable(tableHost, []);
    return;
  }

  renderRecordsTable(tableHost, data.records || []);
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
}

document.querySelectorAll("[data-lang]").forEach((btn) => {
  btn.addEventListener("click", () => {
    window.I18n.setLocale(btn.dataset.lang);
    window.I18n.apply();
    applyPageCopy();
    refreshBoard();
  });
});

document.getElementById("hofCelebrationClose")?.addEventListener("click", () => {
  document.getElementById("hallOfFameCelebration")?.classList.add("is-hidden");
});

if (window.I18n) window.I18n.apply();
applyPageCopy();
refreshBoard();
