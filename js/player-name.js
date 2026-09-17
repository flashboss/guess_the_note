import {
  SETTINGS_PLAYER_NAME,
  SETTINGS_PLAYER_NAME_KEEP,
  PLAYER_NAME_MAX,
  RANDOM_NAME_ADJECTIVES,
  RANDOM_NAME_NOUNS,
} from "./constants.js";
import { state } from "./state.js";
import { storageGet, storageSet, notifyUi } from "./util.js";

/** True after the user types in the name field; clears on rotate/start commit. */
let playerNameUserEdited = false;

function getPlayerNameInput() {
  return document.getElementById("playerName");
}

function normalizePlayerName(raw) {
  return String(raw || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, PLAYER_NAME_MAX);
}

function generateRandomPlayerName() {
  const adj =
    RANDOM_NAME_ADJECTIVES[Math.floor(Math.random() * RANDOM_NAME_ADJECTIVES.length)];
  const noun = RANDOM_NAME_NOUNS[Math.floor(Math.random() * RANDOM_NAME_NOUNS.length)];
  const suffix = Math.random() < 0.35 ? ` ${Math.floor(Math.random() * 90) + 10}` : "";
  return normalizePlayerName(`${adj} ${noun}${suffix}`);
}

function syncPlayerNameInput() {
  const playerNameInput = getPlayerNameInput();
  if (!playerNameInput) return;
  if (playerNameInput.value !== state.playerName) {
    playerNameInput.value = state.playerName;
  }
}

function keepPlayerNameInput() {
  return document.getElementById("keepPlayerName");
}

function syncKeepPlayerNameInput() {
  const input = keepPlayerNameInput();
  if (input) input.checked = Boolean(state.keepPlayerName);
}

function setKeepPlayerName(keep, { notify = true } = {}) {
  state.keepPlayerName = Boolean(keep);
  storageSet(SETTINGS_PLAYER_NAME_KEEP, state.keepPlayerName ? "1" : "0");
  syncKeepPlayerNameInput();
  if (state.keepPlayerName && state.playerName) {
    storageSet(SETTINGS_PLAYER_NAME, state.playerName);
  }
  if (notify) notifyUi();
}

function loadKeepPlayerName() {
  const raw = storageGet(SETTINGS_PLAYER_NAME_KEEP);
  state.keepPlayerName = raw === "1";
  syncKeepPlayerNameInput();
}

function setPlayerName(name, { persist = true, fallbackRandom = true, notify = true, syncInput = true } = {}) {
  const next = normalizePlayerName(name);
  state.playerName = next || (fallbackRandom ? generateRandomPlayerName() : "");
  if (syncInput) syncPlayerNameInput();
  if (persist && state.keepPlayerName && state.playerName) {
    storageSet(SETTINGS_PLAYER_NAME, state.playerName);
  }
  if (notify) notifyUi();
}

function loadPlayerName() {
  loadKeepPlayerName();
  playerNameUserEdited = false;
  if (state.keepPlayerName) {
    const saved = normalizePlayerName(storageGet(SETTINGS_PLAYER_NAME));
    setPlayerName(saved || generateRandomPlayerName(), { persist: !saved });
    return;
  }
  setPlayerName(generateRandomPlayerName(), { persist: false });
}

function markPlayerNameUserEdited() {
  playerNameUserEdited = true;
}

function clearPlayerNameUserEdited() {
  playerNameUserEdited = false;
}

/** Read the name field into state without inventing a random name on empty. */
function commitPlayerNameFromInput() {
  const playerNameInput = getPlayerNameInput();
  if (!playerNameInput) return state.playerName;
  const typed = normalizePlayerName(playerNameInput.value);
  if (typed) {
    setPlayerName(typed, { notify: false, fallbackRandom: false });
  } else if (!normalizePlayerName(state.playerName)) {
    setPlayerName(generateRandomPlayerName(), { persist: false, notify: false });
  } else {
    syncPlayerNameInput();
  }
  return state.playerName;
}

/**
 * After a session, rotate the name unless keep is on or the user already
 * typed a next-game name.
 */
function rotatePlayerNameAfterSession() {
  if (state.keepPlayerName || playerNameUserEdited) return;
  setPlayerName(generateRandomPlayerName(), { persist: false });
  playerNameUserEdited = false;
}

export {
  normalizePlayerName,
  generateRandomPlayerName,
  syncPlayerNameInput,
  syncKeepPlayerNameInput,
  setKeepPlayerName,
  setPlayerName,
  loadPlayerName,
  commitPlayerNameFromInput,
  rotatePlayerNameAfterSession,
  markPlayerNameUserEdited,
  clearPlayerNameUserEdited,
  keepPlayerNameInput,
};
