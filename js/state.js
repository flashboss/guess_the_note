const state = {
  running: false,
  clefs: ["treble", "bass"],
  shapes: ["notes"],
  answerMode: "choices",
  choiceCount: 5,
  choiceKind: "single",
  difficulty: 5,
  rounds: 10,
  seconds: 4,
  current: null,
  choices: [],
  selected: [],
  locked: false,
  score: 0,
  attempted: 0,
  streak: 0,
  bestStreak: 0,
  round: 0,
  weightedQualitySum: 0,
  roundWeightSum: 0,
  timeSum: 0,
  universalScore: 0,
  answerElapsed: null,
  lastResult: null,
  roundTimer: null,
  nextTimer: null,
  sound: true,
  paused: false,
  pauseCount: 0,
  pauseKind: null,
  pauseRemaining: 0,
  timerStartedAt: 0,
  timerDuration: 0,
  nextDueAt: 0,
};

const staff = document.getElementById("staff");
const tempo = document.getElementById("tempo");
const tempoLabel = document.getElementById("tempoLabel");
const roundsInput = document.getElementById("rounds");
const roundsLabel = document.getElementById("roundsLabel");
const choiceCountInput = document.getElementById("choiceCount");
const choiceCountLabel = document.getElementById("choiceCountLabel");
const difficultyInput = document.getElementById("difficulty");
const difficultyLabel = document.getElementById("difficultyLabel");
const overlayHint = document.getElementById("overlayHint");
const timerFill = document.getElementById("timerFill");
const scoreEl = document.getElementById("score");
const streakEl = document.getElementById("streak");
const avgTimeEl = document.getElementById("avgTime");
const progressEl = document.getElementById("progress");
const startOverlay = document.getElementById("startOverlay");
const resultOverlay = document.getElementById("resultOverlay");
const resultGrade = document.getElementById("resultGrade");
const resultLabel = document.getElementById("resultLabel");
const resultUniversal = document.getElementById("resultUniversal");
const resultSummary = document.getElementById("resultSummary");
const pauseOverlay = document.getElementById("pauseOverlay");
const settingsOverlay = document.getElementById("settingsOverlay");
const settingsBtn = document.getElementById("settingsBtn");
const qualityHint = document.getElementById("qualityHint");

export { state };
export const dom = {
  staff, tempo, tempoLabel, roundsInput, roundsLabel, choiceCountInput, choiceCountLabel,
  difficultyInput, difficultyLabel, overlayHint, timerFill, scoreEl, streakEl, avgTimeEl,
  progressEl, startOverlay, resultOverlay, resultGrade, resultLabel, resultUniversal,
  resultSummary, pauseOverlay, settingsOverlay, settingsBtn, qualityHint,
};
