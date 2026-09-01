import { DIFFICULTY_MIN, DIFFICULTY_MAX } from "./constants.js";
import { state } from "./state.js";

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    /* private mode or TV storage may be unavailable */
  }
}

function t(key) {
  return window.I18n ? window.I18n.t(key) : key;
}

function formatMessage(key, vars) {
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
    t(key)
  );
}

function notifyUi() {
  window.dispatchEvent(new Event("gtn:ui"));
}

function shuffle(list) {
  const items = list.slice();
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function difficultyLevel() {
  const level = Number(state.difficulty);
  if (!Number.isFinite(level)) return 5;
  return Math.min(DIFFICULTY_MAX, Math.max(DIFFICULTY_MIN, Math.round(level)));
}

function difficultyT() {
  return (difficultyLevel() - DIFFICULTY_MIN) / (DIFFICULTY_MAX - DIFFICULTY_MIN);
}

function isNotesMode() {
  return state.answerMode === "notes";
}

function isMultiple() {
  return state.answerMode === "choices" && state.choiceKind === "multiple";
}

export {
  storageGet,
  storageSet,
  t,
  formatMessage,
  notifyUi,
  shuffle,
  difficultyLevel,
  difficultyT,
  isNotesMode,
  isMultiple,
};
