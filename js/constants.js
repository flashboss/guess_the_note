const NOTE_NAMES = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
const CHOICE_COUNT_MIN = 3;
const CHOICE_COUNT_MAX = 7;
const ACCIDENTALS = [-1, 0, 1];
const CLEFS = ["treble", "bass"];
const SHAPES = ["notes", "chords"];
const QUALITY_MARKS = {
  major: "",
  minor: "-",
  dim: "°",
  aug: "+",
  dom7: "7",
  min7: "-7",
  maj7: "Δ",
  dim7: "°7",
  halfdim: "ø",
  aug7: "+7",
  dom9: "9",
  min9: "-9",
  maj9: "Δ9",
  sus2: "sus2",
  sus4: "sus4",
  majFlat5: "♭5",
  majSharp5: "♯5",
  minFlat5: "-♭5",
  minSharp5: "-♯5",
  dom7Flat5: "7♭5",
  dom7Sharp5: "7♯5",
  min7Flat5: "-7♭5",
  min7Sharp5: "-7♯5",
  maj7Flat5: "Δ♭5",
  maj7Sharp5: "Δ♯5",
};
const CHORD_SPECS = {
  major: { steps: [0, 2, 4], semis: [0, 4, 7] },
  minor: { steps: [0, 2, 4], semis: [0, 3, 7] },
  dim: { steps: [0, 2, 4], semis: [0, 3, 6] },
  aug: { steps: [0, 2, 4], semis: [0, 4, 8] },
  dom7: { steps: [0, 2, 4, 6], semis: [0, 4, 7, 10] },
  min7: { steps: [0, 2, 4, 6], semis: [0, 3, 7, 10] },
  maj7: { steps: [0, 2, 4, 6], semis: [0, 4, 7, 11] },
  dim7: { steps: [0, 2, 4, 6], semis: [0, 3, 6, 9] },
  halfdim: { steps: [0, 2, 4, 6], semis: [0, 3, 6, 10] },
  aug7: { steps: [0, 2, 4, 6], semis: [0, 4, 8, 10] },
  dom9: { steps: [0, 2, 4, 6, 8], semis: [0, 4, 7, 10, 14] },
  min9: { steps: [0, 2, 4, 6, 8], semis: [0, 3, 7, 10, 14] },
  maj9: { steps: [0, 2, 4, 6, 8], semis: [0, 4, 7, 11, 14] },
  majFlat5: { steps: [0, 2, 4], semis: [0, 4, 6] },
  majSharp5: { steps: [0, 2, 4], semis: [0, 4, 8] },
  minFlat5: { steps: [0, 2, 4], semis: [0, 3, 6] },
  minSharp5: { steps: [0, 2, 4], semis: [0, 3, 8] },
  dom7Flat5: { steps: [0, 2, 4, 6], semis: [0, 4, 6, 10] },
  dom7Sharp5: { steps: [0, 2, 4, 6], semis: [0, 4, 8, 10] },
  min7Flat5: { steps: [0, 2, 4, 6], semis: [0, 3, 6, 10] },
  min7Sharp5: { steps: [0, 2, 4, 6], semis: [0, 3, 8, 10] },
  maj7Flat5: { steps: [0, 2, 4, 6], semis: [0, 4, 6, 11] },
  maj7Sharp5: { steps: [0, 2, 4, 6], semis: [0, 4, 8, 11] },
};
const KIND_QUALITIES = {
  dyad: ["major", "minor", "dim", "aug"],
  chord: [
    "major",
    "minor",
    "dim",
    "aug",
    "majFlat5",
    "majSharp5",
    "minFlat5",
    "minSharp5",
  ],
  sevenths: [
    "dom7",
    "min7",
    "maj7",
    "dim7",
    "halfdim",
    "aug7",
    "dom7Flat5",
    "dom7Sharp5",
    "min7Flat5",
    "min7Sharp5",
    "maj7Flat5",
    "maj7Sharp5",
  ],
  ninths: ["dom9", "min9", "maj9"],
};
const ANSWER_MODES = ["notes", "choices"];
const CHOICE_KINDS = ["single", "multiple"];
const DIFFICULTY_MIN = 1;
const DIFFICULTY_MAX = 10;
const SIMPLE_QUALITIES = {
  dyad: ["major", "minor"],
  chord: ["major", "minor"],
  sevenths: ["dom7", "min7", "maj7"],
  ninths: ["dom9", "min9", "maj9"],
};
const COMMON_QUALITIES = {
  dyad: ["major", "minor", "dim"],
  chord: ["major", "minor", "dim", "aug"],
  sevenths: ["dom7", "min7", "maj7", "halfdim"],
  ninths: ["dom9", "min9", "maj9"],
};
const DYAD_SPECS = {
  major: { steps: [0, 2], semis: [0, 4] },
  minor: { steps: [0, 2], semis: [0, 3] },
  dim: { steps: [0, 4], semis: [0, 6] },
  aug: { steps: [0, 4], semis: [0, 8] },
};
const SUS_SPECS = {
  sus2: { steps: [0, 1, 4], semis: [0, 2, 7] },
  sus4: { steps: [0, 3, 4], semis: [0, 5, 7] },
};
const SETTINGS_CLEF = "gtn-clef";
const SETTINGS_SHAPES = "gtn-shapes";
const SETTINGS_ANSWER_MODE = "gtn-answer-mode";
const SETTINGS_CHOICE_COUNT = "gtn-choice-count";
const SETTINGS_CHOICE_KIND = "gtn-choice-kind";
const SETTINGS_DIFFICULTY = "gtn-difficulty";
const SETTINGS_TEMPO = "gtn-tempo";
const SETTINGS_ROUNDS = "gtn-rounds";
const SETTINGS_SOUND = "gtn-sound";
const GRADE_ACCURACY = 0.85;
const GRADE_SPEED = 0.15;
const UNIVERSAL_BASE = 2500;
const UNIVERSAL_STREAK_STEP = 500;
const UNIVERSAL_SPEED_DIVISOR = 2;
const PAUSE_QUALITY_FACTOR = 0.06;

// Difficulty ladder for the universal score (weighted by challenge, settings, and session length).
// Shape kind: note < dyad < chord < seventh < ninth.
// Per round: kind × quality × pitch density × accidentals × answer panel × slider.
// Session: rounds endurance (√ rounds/10) and shape-menu spread when several types are selected.
const SHAPE_KIND_WEIGHT = {
  note: 1,
  notes: 1,
  dyad: 1.3,
  dyads: 1.3,
  chord: 1.5,
  chords: 1.5,
  sevenths: 1.85,
  ninths: 2.15,
};
const QUALITY_WEIGHT = {
  major: 1,
  minor: 1.04,
  dim: 1.1,
  aug: 1.1,
  dom7: 1.06,
  min7: 1.08,
  maj7: 1.1,
  halfdim: 1.15,
  dim7: 1.18,
  aug7: 1.2,
  dom9: 1.12,
  min9: 1.14,
  maj9: 1.16,
  majFlat5: 1.12,
  majSharp5: 1.12,
  minFlat5: 1.12,
  minSharp5: 1.12,
  dom7Flat5: 1.14,
  dom7Sharp5: 1.14,
  min7Flat5: 1.15,
  min7Sharp5: 1.14,
  maj7Flat5: 1.14,
  maj7Sharp5: 1.14,
};
const SEMITONES = [0, 2, 4, 5, 7, 9, 11];
const LINE_GAP = 20;
const TOP_LINE_Y = 100;
const BOTTOM_LINE_Y = TOP_LINE_Y + 4 * LINE_GAP;
const NOTE_X = 430;

const CLEF_RANGES = {
  treble: { min: -6, max: 18, bottomStep: 2, topStep: 10, middleStep: 6 },
  bass: { min: -18, max: 6, bottomStep: -10, topStep: -2, middleStep: -6 },
};

export {
  NOTE_NAMES,
  CHOICE_COUNT_MIN,
  CHOICE_COUNT_MAX,
  ACCIDENTALS,
  CLEFS,
  SHAPES,
  QUALITY_MARKS,
  CHORD_SPECS,
  KIND_QUALITIES,
  ANSWER_MODES,
  CHOICE_KINDS,
  DIFFICULTY_MIN,
  DIFFICULTY_MAX,
  SIMPLE_QUALITIES,
  COMMON_QUALITIES,
  DYAD_SPECS,
  SUS_SPECS,
  SETTINGS_CLEF,
  SETTINGS_SHAPES,
  SETTINGS_ANSWER_MODE,
  SETTINGS_CHOICE_COUNT,
  SETTINGS_CHOICE_KIND,
  SETTINGS_DIFFICULTY,
  SETTINGS_TEMPO,
  SETTINGS_ROUNDS,
  SETTINGS_SOUND,
  GRADE_ACCURACY,
  GRADE_SPEED,
  UNIVERSAL_BASE,
  UNIVERSAL_STREAK_STEP,
  UNIVERSAL_SPEED_DIVISOR,
  PAUSE_QUALITY_FACTOR,
  SHAPE_KIND_WEIGHT,
  QUALITY_WEIGHT,
  SEMITONES,
  LINE_GAP,
  TOP_LINE_Y,
  BOTTOM_LINE_Y,
  NOTE_X,
  CLEF_RANGES,
};
