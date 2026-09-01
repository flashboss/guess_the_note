import {
  ANSWER_MODES, CHOICE_KINDS, CHOICE_COUNT_MIN, CHOICE_COUNT_MAX,
  CLEFS, SHAPES,
  SETTINGS_CLEF, SETTINGS_SHAPES, SETTINGS_ANSWER_MODE, SETTINGS_CHOICE_COUNT,
  SETTINGS_CHOICE_KIND, SETTINGS_DIFFICULTY, SETTINGS_TEMPO, SETTINGS_ROUNDS, SETTINGS_SOUND,
  DIFFICULTY_MIN, DIFFICULTY_MAX,
} from "./constants.js";
import { state, dom } from "./state.js";
const {
  tempo, tempoLabel, roundsInput, roundsLabel, choiceCountInput, choiceCountLabel,
  difficultyInput, difficultyLabel, overlayHint, settingsOverlay, settingsBtn,
} = dom;
import { t, storageGet, storageSet, notifyUi, isNotesMode } from "./util.js";
import { applyChoiceLayout, syncChoicesAria, syncQualityHint, drawStaff, previewClef, updateStats, stopTone } from "./game.js";

function settingsAreOpen() {
  return settingsOverlay && !settingsOverlay.classList.contains("is-hidden");
}

function openSettings() {
  if ((state.running && !state.paused) || !settingsOverlay) return;
  settingsOverlay.classList.remove("is-hidden");
  if (settingsBtn) settingsBtn.setAttribute("aria-expanded", "true");
  notifyUi();
}

function closeSettings() {
  if (!settingsOverlay) return;
  settingsOverlay.classList.add("is-hidden");
  if (settingsBtn) settingsBtn.setAttribute("aria-expanded", "false");
  notifyUi();
}

function toggleSettings() {
  if (settingsAreOpen()) closeSettings();
  else openSettings();
}

function parseStoredList(raw, allowed, fallback) {
  if (raw === "both" && allowed.includes("treble") && allowed.includes("bass")) {
    return ["treble", "bass"];
  }
  const parts = String(raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => allowed.includes(item));
  return parts.length ? parts : fallback.slice();
}

function parseStoredShapes(raw) {
  const legacyHarmony = new Set(["dyads", "sevenths", "ninths"]);
  const selected = new Set();
  String(raw || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      if (item === "notes") selected.add("notes");
      else if (item === "chords" || legacyHarmony.has(item)) selected.add("chords");
    });
  return selected.size ? [...selected] : ["notes"];
}

function toggleListed(list, value, allowed) {
  if (!allowed.includes(value)) return list;
  if (list.includes(value)) {
    if (list.length === 1) return list;
    return list.filter((item) => item !== value);
  }
  return allowed.filter((item) => item === value || list.includes(item));
}

function syncToggleButtons(selector, active) {
  document.querySelectorAll(selector).forEach((btn) => {
    const key = selector.includes("clef") ? btn.dataset.clef : btn.dataset.shape;
    const on = active.includes(key);
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
}

function syncClefButtons() {
  syncToggleButtons("[data-clef]", state.clefs);
}

function syncShapeButtons() {
  syncToggleButtons("[data-shape]", state.shapes);
}

function setClefs(clefs) {
  state.clefs = clefs.length ? clefs : ["treble"];
  storageSet(SETTINGS_CLEF, state.clefs.join(","));
  syncClefButtons();
  if (!state.running) drawStaff(previewClef(), null);
}

function setShapes(shapes) {
  state.shapes = shapes.length ? shapes : ["notes"];
  storageSet(SETTINGS_SHAPES, state.shapes.join(","));
  syncShapeButtons();
}

function parseStoredValue(raw, allowed, fallback) {
  return allowed.includes(raw) ? raw : fallback;
}

function syncExclusiveButtons(selector, attr, value) {
  document.querySelectorAll(selector).forEach((btn) => {
    const on = btn.getAttribute(attr) === value;
    btn.classList.toggle("is-active", on);
    btn.setAttribute("aria-pressed", String(on));
  });
}

function syncAnswerModeButtons() {
  syncExclusiveButtons("[data-answer-mode]", "data-answer-mode", state.answerMode);
  document.body.dataset.answerMode = state.answerMode;
  const box = document.getElementById("choiceOptions");
  if (!box) return;
  const hide = state.answerMode !== "choices";
  box.classList.toggle("is-hidden", hide);
  box.hidden = hide;
  box.setAttribute("aria-hidden", String(hide));
}

function syncChoiceKindButtons() {
  syncExclusiveButtons("[data-choice-kind]", "data-choice-kind", state.choiceKind);
}

function parseDifficulty(raw) {
  if (raw === "easy") return 2;
  if (raw === "medium") return 5;
  if (raw === "hard") return 9;
  const level = Number(raw);
  if (Number.isFinite(level)) return level;
  return 5;
}

function setDifficulty(level) {
  if (!difficultyInput) return;
  const next = Math.min(
    DIFFICULTY_MAX,
    Math.max(DIFFICULTY_MIN, Math.round(Number(level)))
  );
  difficultyInput.value = String(next);
  state.difficulty = next;
  if (difficultyLabel) difficultyLabel.textContent = String(next);
  storageSet(SETTINGS_DIFFICULTY, String(next));
  notifyUi();
}

function setAnswerMode(mode) {
  state.answerMode = parseStoredValue(mode, ANSWER_MODES, "choices");
  storageSet(SETTINGS_ANSWER_MODE, state.answerMode);
  syncAnswerModeButtons();
  syncChoicesAria();
  syncQualityHint();
  applyChoiceLayout();
  notifyUi();
}

function setChoiceKind(kind) {
  state.choiceKind = parseStoredValue(kind, CHOICE_KINDS, "single");
  storageSet(SETTINGS_CHOICE_KIND, state.choiceKind);
  syncChoiceKindButtons();
  syncChoicesAria();
  applyChoiceLayout();
  notifyUi();
}

function setChoiceCount(count) {
  if (!choiceCountInput) return;
  const min = Number(choiceCountInput.min) || CHOICE_COUNT_MIN;
  const max = Number(choiceCountInput.max) || CHOICE_COUNT_MAX;
  const next = Math.min(max, Math.max(min, Math.round(Number(count))));
  choiceCountInput.value = String(next);
  state.choiceCount = next;
  if (choiceCountLabel) choiceCountLabel.textContent = String(next);
  storageSet(SETTINGS_CHOICE_COUNT, String(next));
  if (!isNotesMode()) applyChoiceLayout();
  notifyUi();
}

document.querySelectorAll("[data-clef]").forEach((btn) => {
  btn.addEventListener("click", () => {
    setClefs(toggleListed(state.clefs, btn.dataset.clef, CLEFS));
  });
});

document.querySelectorAll("[data-shape]").forEach((btn) => {
  btn.addEventListener("click", () => {
    setShapes(toggleListed(state.shapes, btn.dataset.shape, SHAPES));
  });
});

document.querySelectorAll("[data-answer-mode]").forEach((btn) => {
  btn.addEventListener("click", () => {
    setAnswerMode(btn.dataset.answerMode);
  });
});

document.querySelectorAll("[data-choice-kind]").forEach((btn) => {
  btn.addEventListener("click", () => {
    setChoiceKind(btn.dataset.choiceKind);
  });
});

function setTempo(seconds) {
  const min = Number(tempo.min);
  const max = Number(tempo.max);
  const next = Math.min(max, Math.max(min, seconds));
  tempo.value = String(next);
  state.seconds = next;
  tempoLabel.textContent = `${next.toFixed(1)} ${t("tempoUnit")}`;
  storageSet(SETTINGS_TEMPO, String(next));
}

function updateOverlayHint() {
  if (!overlayHint) return;
  overlayHint.textContent = formatMessage("overlayHint", { count: state.rounds });
}

function setRounds(count) {
  if (!roundsInput) return;
  const min = Number(roundsInput.min);
  const max = Number(roundsInput.max);
  const step = Number(roundsInput.step) || 5;
  const snapped = Math.round(count / step) * step;
  const next = Math.min(max, Math.max(min, snapped));
  roundsInput.value = String(next);
  state.rounds = next;
  if (roundsLabel) roundsLabel.textContent = String(next);
  storageSet(SETTINGS_ROUNDS, String(next));
  updateStats();
  updateOverlayHint();
}

function loadSettings() {
  state.clefs = parseStoredList(storageGet(SETTINGS_CLEF), CLEFS, ["treble", "bass"]);
  syncClefButtons();
  state.shapes = parseStoredShapes(storageGet(SETTINGS_SHAPES));
  syncShapeButtons();
  setAnswerMode(parseStoredValue(storageGet(SETTINGS_ANSWER_MODE), ANSWER_MODES, "choices"));
  setChoiceKind(parseStoredValue(storageGet(SETTINGS_CHOICE_KIND), CHOICE_KINDS, "single"));
  setDifficulty(parseDifficulty(storageGet(SETTINGS_DIFFICULTY)));
  const savedChoices = Number(storageGet(SETTINGS_CHOICE_COUNT));
  if (Number.isFinite(savedChoices) && savedChoices > 0) setChoiceCount(savedChoices);
  else setChoiceCount(state.choiceCount);
  const savedTempo = Number(storageGet(SETTINGS_TEMPO));
  if (Number.isFinite(savedTempo) && savedTempo > 0) setTempo(savedTempo);
  const savedRounds = Number(storageGet(SETTINGS_ROUNDS));
  if (Number.isFinite(savedRounds) && savedRounds > 0) setRounds(savedRounds);
  else setRounds(state.rounds);
  const savedSound = storageGet(SETTINGS_SOUND);
  if (savedSound === "0" || savedSound === "1") setSound(savedSound === "1");
  else syncSoundButton();
}

function syncSoundButton() {
  const soundBtn = document.getElementById("soundBtn");
  const soundLabel = document.getElementById("soundLabel");
  if (!soundBtn || !soundLabel) return;
  soundBtn.classList.toggle("is-active", state.sound);
  soundBtn.setAttribute("aria-pressed", String(state.sound));
  soundLabel.textContent = state.sound ? t("soundOn") : t("soundOff");
}

function setSound(on) {
  state.sound = Boolean(on);
  storageSet(SETTINGS_SOUND, state.sound ? "1" : "0");
  syncSoundButton();
  if (!state.sound) stopTone();
}

tempo.addEventListener("input", () => {
  setTempo(Number(tempo.value));
});

roundsInput?.addEventListener("input", () => {
  setRounds(Number(roundsInput.value));
});

difficultyInput?.addEventListener("input", () => {
  setDifficulty(Number(difficultyInput.value));
});

choiceCountInput?.addEventListener("input", () => {
  setChoiceCount(Number(choiceCountInput.value));
});

document.getElementById("soundBtn").addEventListener("click", () => {
  if (!state.sound) unlockAudio();
  setSound(!state.sound);
});

document.getElementById("choices")?.addEventListener("click", (event) => {
  const btn = event.target.closest(".note-btn");
  if (!btn) return;
  handleChoiceClick(btn);
});

document.getElementById("playBtn").addEventListener("click", toggleGame);
document.getElementById("pauseBtn").addEventListener("click", togglePause);
document.getElementById("playAgainBtn")?.addEventListener("click", startGame);
resultOverlay?.addEventListener("click", (event) => {
  if (event.target !== resultOverlay) return;
  showIdleOverlay();
  notifyUi();
});

if (settingsBtn) {
  settingsBtn.addEventListener("click", toggleSettings);
}
document.getElementById("settingsClose")?.addEventListener("click", closeSettings);
settingsOverlay?.addEventListener("click", (event) => {
  if (event.target === settingsOverlay) closeSettings();
});

document.addEventListener("keydown", (event) => {
  if (settingsAreOpen()) return;
  if (resultOverlay && !resultOverlay.classList.contains("is-hidden")) return;
  const index = Number(event.key) - 1;
  const buttons = choiceButtons();
  if (index >= 0 && index < buttons.length) {
    buttons[index].click();
  }
});

export {
  settingsAreOpen,
  openSettings,
  closeSettings,
  toggleSettings,
  parseStoredList,
  parseStoredShapes,
  toggleListed,
  syncToggleButtons,
  syncClefButtons,
  syncShapeButtons,
  setClefs,
  setShapes,
  parseStoredValue,
  syncExclusiveButtons,
  syncAnswerModeButtons,
  syncChoiceKindButtons,
  parseDifficulty,
  setDifficulty,
  setAnswerMode,
  setChoiceKind,
  setChoiceCount,
  setTempo,
  updateOverlayHint,
  setRounds,
  loadSettings,
  syncSoundButton,
  setSound,
};
