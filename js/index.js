import { CLEFS, SHAPES } from "./constants.js";
import { state, dom } from "./state.js";
import { notifyUi } from "./util.js";
import {
  toggleListed,
  setClefs,
  setShapes,
  setAnswerMode,
  setChoiceKind,
  setSound,
  loadSettings,
  setTempo,
  setRounds,
  setChoiceCount,
  setDifficulty,
  syncAnswerModeButtons,
  syncChoiceKindButtons,
  syncSoundButton,
  setPlayerName,
  syncPlayerNameInput,
  syncHallOfFameFieldLabels,
  settingsAreOpen,
  openSettings,
  closeSettings,
  toggleSettings,
} from "./settings.js";
import {
  startGame,
  stopGame,
  toggleGame,
  pauseGame,
  resumeGame,
  togglePause,
  finishSession,
  unlockAudio,
  handleChoiceClick,
  choiceButtons,
  drawStaff,
  previewClef,
  idleChoices,
  updateStats,
  showIdleOverlay,
  renderResults,
  syncPlayButton,
  relabelChoices,
  syncQualityHint,
} from "./game.js";
import { formatUniversalScore } from "./scoring.js";
import { hideCelebration } from "./hall-of-fame.js";

const {
  tempo,
  roundsInput,
  difficultyInput,
  choiceCountInput,
  resultOverlay,
  settingsBtn,
  settingsOverlay,
  playerNameInput,
} = dom;

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

tempo?.addEventListener("input", () => {
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

playerNameInput?.addEventListener("input", () => {
  setPlayerName(playerNameInput.value, {
    fallbackRandom: false,
    notify: false,
    syncInput: false,
  });
});

playerNameInput?.addEventListener("blur", () => {
  setPlayerName(playerNameInput.value);
});

document.getElementById("soundBtn")?.addEventListener("click", () => {
  if (!state.sound) unlockAudio();
  setSound(!state.sound);
});

document.getElementById("choices")?.addEventListener("click", (event) => {
  const btn = event.target.closest(".note-btn");
  if (!btn) return;
  handleChoiceClick(btn);
});

document.getElementById("playBtn")?.addEventListener("click", toggleGame);
document.getElementById("pauseBtn")?.addEventListener("click", togglePause);
document.getElementById("playAgainBtn")?.addEventListener("click", () => {
  hideCelebration();
  startGame();
});
document.getElementById("hofCelebrationClose")?.addEventListener("click", hideCelebration);
document.getElementById("hallOfFameCelebration")?.addEventListener("click", (event) => {
  if (event.target.id === "hallOfFameCelebration") hideCelebration();
});
resultOverlay?.addEventListener("click", (event) => {
  if (event.target !== resultOverlay) return;
  showIdleOverlay();
  notifyUi();
});

settingsBtn?.addEventListener("click", toggleSettings);
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

function refreshLabels() {
  syncPlayButton();
  syncSoundButton();
  setTempo(state.seconds);
  setRounds(state.rounds);
  setChoiceCount(state.choiceCount);
  setDifficulty(state.difficulty);
  syncAnswerModeButtons();
  syncChoiceKindButtons();
  syncPlayerNameInput();
  syncHallOfFameFieldLabels();
  updateStats();
  relabelChoices();
  syncQualityHint();
  if (resultOverlay && !resultOverlay.classList.contains("is-hidden")) renderResults();
}

document.querySelectorAll("[data-lang]").forEach((btn) => {
  btn.addEventListener("click", () => {
    window.I18n.setLocale(btn.dataset.lang);
    window.I18n.apply();
    refreshLabels();
    notifyUi();
  });
});

window.addEventListener("gtn:i18n", refreshLabels);

window.GuessTheNote = {
  startGame,
  stopGame,
  toggleGame,
  pauseGame,
  resumeGame,
  togglePause,
  finishSession,
  unlockAudio,
  openSettings,
  closeSettings,
  settingsAreOpen,
  getState: () => state,
  getLastResult: () => state.lastResult,
  getPlayerName: () => state.playerName,
  formatUniversalScore,
  showingResults: () => resultOverlay && !resultOverlay.classList.contains("is-hidden"),
  refreshLabels,
};

loadSettings();
if (window.I18n) window.I18n.apply();
drawStaff(previewClef(), null);
idleChoices();
refreshLabels();
updateStats();

function isPhoneLandscape() {
  return window.matchMedia("(orientation: landscape) and (max-height: 520px)").matches;
}

function scrollToStaffIfLandscape() {
  if (document.documentElement.classList.contains("is-tv")) return;
  if (!isPhoneLandscape()) return;
  if (settingsAreOpen()) return;
  if (resultOverlay && !resultOverlay.classList.contains("is-hidden")) return;
  const target = document.querySelector(".manuscript");
  if (!target) return;
  const top = Math.round(target.getBoundingClientRect().top + window.scrollY);
  window.scrollTo(0, Math.max(0, top));
}

function scheduleScrollToStaff() {
  requestAnimationFrame(() => {
    setTimeout(scrollToStaffIfLandscape, 200);
  });
}

const phoneLandscapeMq = window.matchMedia("(orientation: landscape) and (max-height: 520px)");
const onLandscapeChange = (event) => {
  if (event.matches) scheduleScrollToStaff();
};
if (phoneLandscapeMq.addEventListener) {
  phoneLandscapeMq.addEventListener("change", onLandscapeChange);
} else if (phoneLandscapeMq.addListener) {
  phoneLandscapeMq.addListener(onLandscapeChange);
}

window.addEventListener("gtn:ui", scheduleScrollToStaff);
window.addEventListener("resize", scheduleScrollToStaff);
window.addEventListener("orientationchange", scheduleScrollToStaff);
window.addEventListener("load", scheduleScrollToStaff);
if (isPhoneLandscape()) scheduleScrollToStaff();
