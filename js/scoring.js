import {
  NOTE_NAMES, CHOICE_COUNT_MIN, CHOICE_COUNT_MAX, ACCIDENTALS, CLEFS, SHAPES,
  QUALITY_MARKS, CHORD_SPECS, KIND_QUALITIES, DYAD_SPECS, SUS_SPECS,
  SETTINGS_CLEF, SETTINGS_SHAPES, SETTINGS_ANSWER_MODE, SETTINGS_CHOICE_COUNT,
  SETTINGS_CHOICE_KIND, SETTINGS_DIFFICULTY, SETTINGS_TEMPO, SETTINGS_ROUNDS, SETTINGS_SOUND,
  GRADE_ACCURACY, GRADE_SPEED, UNIVERSAL_BASE, UNIVERSAL_STREAK_STEP, UNIVERSAL_SPEED_DIVISOR,
  PAUSE_QUALITY_FACTOR, SHAPE_KIND_WEIGHT, QUALITY_WEIGHT, SEMITONES, LINE_GAP,
  TOP_LINE_Y, BOTTOM_LINE_Y, NOTE_X, CLEF_RANGES, DIFFICULTY_MIN, DIFFICULTY_MAX,
  SIMPLE_QUALITIES, COMMON_QUALITIES,
} from "./constants.js";
import { state } from "./state.js";
import { difficultyLevel, isNotesMode, isMultiple } from "./util.js";

function universalRoundPoints(correct, elapsedMs, totalMs, streakAfter, roundWeight) {
  if (!correct) return 0;
  const speedBonus = Math.floor(Math.max(0, totalMs - elapsedMs) / UNIVERSAL_SPEED_DIVISOR);
  const streakBonus = Math.max(0, streakAfter - 1) * UNIVERSAL_STREAK_STEP;
  return Math.round(roundWeight * (UNIVERSAL_BASE + speedBonus + streakBonus));
}

function sliderWeight() {
  return 0.75 + difficultyLevel() * 0.025;
}

function answerSettingsWeight() {
  if (isNotesMode()) return 0.88;
  const choices = state.choiceCount || CHOICE_COUNT_MIN;
  const countFactor = 1 + (choices - CHOICE_COUNT_MIN) * 0.07;
  return countFactor * (isMultiple() ? 1.35 : 1);
}

function sessionRoundsFactor() {
  return Math.sqrt(state.rounds / 10);
}

function shapeMenuSpreadFactor() {
  const kinds = state.shapes.length ? state.shapes : ["notes"];
  if (kinds.length <= 1) return 1;
  return 1 + (kinds.length - 1) * 0.04;
}

function averageShapeMenuWeight() {
  const kinds = state.shapes.length ? state.shapes : ["notes"];
  const total = kinds.reduce((sum, kind) => sum + (SHAPE_KIND_WEIGHT[kind] || 1), 0);
  return total / kinds.length;
}

function challengeRoundWeight(challenge) {
  if (!challenge) return 1;
  const kindW = SHAPE_KIND_WEIGHT[challenge.kind] || 1;
  const qualW = challenge.quality ? QUALITY_WEIGHT[challenge.quality] || 1 : 1;
  const accidental = challenge.accidental || 0;
  const accW = 1 + Math.abs(accidental) * 0.06 + (Math.abs(accidental) >= 2 ? 0.06 : 0);
  const noteCount = challenge.notes?.length || 1;
  const densityW = 1 + Math.max(0, noteCount - 1) * 0.05;
  return kindW * qualW * accW * densityW;
}

function fullRoundWeight(challenge) {
  return (
    challengeRoundWeight(challenge) *
    answerSettingsWeight() *
    sliderWeight() *
    sessionRoundsFactor() *
    shapeMenuSpreadFactor()
  );
}

function sessionDifficultyIndex() {
  if (!state.attempted) {
    return (
      averageShapeMenuWeight() *
      answerSettingsWeight() *
      sliderWeight() *
      sessionRoundsFactor() *
      shapeMenuSpreadFactor()
    );
  }
  return state.roundWeightSum / state.attempted;
}

function formatUniversalScore(value) {
  const locale = window.I18n?.locale || "en";
  return new Intl.NumberFormat(locale).format(Math.max(0, Math.round(value)));
}

function sessionSettingsSnapshot() {
  return {
    difficulty: state.difficulty,
    rounds: state.rounds,
    seconds: state.seconds,
    answerMode: state.answerMode,
    choiceCount: state.choiceCount,
    choiceKind: state.choiceKind,
    clefs: state.clefs.slice().sort().join(","),
    shapes: state.shapes.slice().sort().join(","),
  };
}

function sessionGradeQuality() {
  return state.attempted ? state.gradeQualitySum / state.attempted : 0;
}

function pauseScoreFactor() {
  const pauses = state.pauseCount || 0;
  return Math.max(0, 1 - pauses * PAUSE_QUALITY_FACTOR);
}

function applyPausePenalty(gradeQuality, universalScore) {
  const factor = pauseScoreFactor();
  const quality = gradeQuality * factor;
  return {
    quality,
    universalScore: Math.round(universalScore * factor),
    pauseCount: state.pauseCount || 0,
    pausePenaltyPercent: Math.round((1 - factor) * 100),
  };
}

export {
  universalRoundPoints,
  sliderWeight,
  answerSettingsWeight,
  sessionRoundsFactor,
  shapeMenuSpreadFactor,
  averageShapeMenuWeight,
  challengeRoundWeight,
  fullRoundWeight,
  sessionDifficultyIndex,
  formatUniversalScore,
  sessionSettingsSnapshot,
  sessionGradeQuality,
  pauseScoreFactor,
  applyPausePenalty,
};
