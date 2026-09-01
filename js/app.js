const NOTE_NAMES = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
const CHOICE_COUNT_MIN = 3;
const CHOICE_COUNT_MAX = 7;
const ACCIDENTALS = [-1, 0, 1];
const CLEFS = ["treble", "bass"];
const SHAPES = ["notes", "dyads", "chords", "sevenths", "ninths"];
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
};
const KIND_QUALITIES = {
  dyad: ["major", "minor", "dim", "aug"],
  chord: ["major", "minor", "dim", "aug"],
  sevenths: ["dom7", "min7", "maj7", "dim7", "halfdim", "aug7"],
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

// Difficulty ladder (single unified scale for grade and universal score).
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
};
const SEMITONES = [0, 2, 4, 5, 7, 9, 11];
const LINE_GAP = 20;
const TOP_LINE_Y = 78;
const BOTTOM_LINE_Y = TOP_LINE_Y + 4 * LINE_GAP;
const NOTE_X = 430;

const CLEF_RANGES = {
  treble: { min: 0, max: 12, bottomStep: 2, topStep: 10, middleStep: 6 },
  bass: { min: -12, max: 0, bottomStep: -10, topStep: -2, middleStep: -6 },
};

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

function noteFromStep(step) {
  const index = ((step % 7) + 7) % 7;
  const octave = 4 + Math.floor(step / 7);
  return { name: NOTE_NAMES[index], octave, step };
}

function yForStep(step, clef) {
  const fromBottom = step - CLEF_RANGES[clef].bottomStep;
  return BOTTOM_LINE_Y - fromBottom * (LINE_GAP / 2);
}

function ledgerSteps(step, clef) {
  const { bottomStep, topStep } = CLEF_RANGES[clef];
  const ledgers = [];
  if (step < bottomStep) {
    for (let s = bottomStep - 2; s >= step; s -= 2) ledgers.push(s);
  }
  if (step > topStep) {
    for (let s = topStep + 2; s <= step; s += 2) ledgers.push(s);
  }
  return ledgers;
}

function svgEl(name, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  return el;
}

// Bravura (SMuFL) outlines — origin on the G / F line, 250 units = 1 staff space.
const CLEF_PATHS = {
  treble:
    "M376 415C374 427 376 428 382 434C398 449 419 470 438 491C522 583 572 702 572 815C572 902 548 988 507 1048C492 1070 466 1098 455 1098C441 1098 410 1072 390 1050C316 968 292 843 292 739C292 681 299 616 306 575C308 563 309 561 297 551C233 498 164 437 112 373C43 287 0 194 0 87C0 -87 119 -252 364 -252C387 -252 413 -250 433 -246C444 -244 446 -243 448 -255C460 -322 475 -409 475 -456C475 -604 375 -622 316 -622C262 -622 236 -606 236 -593C236 -586 245 -583 268 -576C299 -567 335 -540 335 -482C335 -427 300 -380 239 -380C172 -380 132 -433 132 -495C132 -560 171 -658 322 -658C389 -658 519 -628 519 -458C519 -401 501 -306 490 -244C488 -232 489 -233 503 -227C604 -187 671 -102 671 11C671 139 577 252 430 252C404 252 404 252 401 270ZM470 943C503 943 530 916 530 861C530 792 497 728 419 650C403 634 379 611 356 591C349 585 345 586 343 599C339 625 337 659 337 691C337 847 409 943 470 943ZM361 262C364 243 364 244 346 238C258 208 201 129 201 44C201 -46 248 -110 316 -133C324 -136 336 -139 343 -139C351 -139 355 -134 355 -128C355 -121 347 -118 340 -115C298 -97 268 -54 268 -8C268 49 307 92 368 109C384 113 386 112 388 101L438 -197C440 -208 439 -208 424 -211C408 -214 388 -216 368 -216C193 -216 80 -119 80 20C80 79 90 158 173 252C233 319 279 356 326 394C336 402 338 401 340 390ZM430 103C428 115 429 118 441 117C522 110 589 42 589 -46C589 -109 551 -160 495 -188C483 -194 481 -194 479 -182Z",
  bass: "M252 262C78 262 0 135 0 39C0 -41 42 -110 123 -110C186 -110 229 -66 229 -4C229 60 182 100 133 100C106 100 96 93 83 93C70 93 67 101 67 111C67 151 127 224 229 224C335 224 381 120 381 -37C381 -140 359 -260 297 -356C237 -449 134 -534 10 -605C1 -610 -5 -615 -5 -623C-5 -629 -1 -635 8 -635C13 -635 19 -633 25 -630C158 -565 286 -489 392 -375C479 -281 531 -159 531 -28C531 146 425 262 252 262ZM629 180C598 180 574 156 574 125C574 94 598 70 629 70C660 70 684 94 684 125C684 156 660 180 629 180ZM630 -71C599 -71 576 -94 576 -125C576 -156 599 -179 630 -179C661 -179 684 -156 684 -125C684 -94 661 -71 630 -71Z",
};

function drawSharp(x, y) {
  const g = svgEl("g", {
    class: "accidental",
    fill: "#1b1410",
    stroke: "#1b1410",
    "stroke-linecap": "square",
  });
  g.appendChild(
    svgEl("line", {
      x1: x - 3.5,
      y1: y - 15,
      x2: x - 3.5,
      y2: y + 15,
      "stroke-width": 1.8,
    })
  );
  g.appendChild(
    svgEl("line", {
      x1: x + 3.5,
      y1: y - 15,
      x2: x + 3.5,
      y2: y + 15,
      "stroke-width": 1.8,
    })
  );
  g.appendChild(
    svgEl("polygon", {
      points: `${x - 9},${y - 3} ${x + 9},${y - 8} ${x + 9},${y - 3.2} ${x - 9},${y + 1.8}`,
      stroke: "none",
    })
  );
  g.appendChild(
    svgEl("polygon", {
      points: `${x - 9},${y + 8} ${x + 9},${y + 3} ${x + 9},${y + 7.8} ${x - 9},${y + 12.8}`,
      stroke: "none",
    })
  );
  return g;
}

function drawFlat(x, y) {
  const g = svgEl("g", {
    class: "accidental",
    fill: "none",
    stroke: "#1b1410",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  g.appendChild(
    svgEl("line", {
      x1: x - 5,
      y1: y - 18,
      x2: x - 5,
      y2: y + 9,
      "stroke-width": 1.8,
    })
  );
  g.appendChild(
    svgEl("path", {
      d: `M ${x - 5} ${y + 9} C ${x + 11} ${y + 5} ${x + 12} ${y - 6} ${x - 5} ${y - 1}`,
      "stroke-width": 1.8,
    })
  );
  return g;
}

function drawDoubleSharp(x, y) {
  const g = svgEl("g", {
    class: "accidental",
    fill: "#1b1410",
    stroke: "#1b1410",
    "stroke-linecap": "square",
  });
  g.appendChild(
    svgEl("line", {
      x1: x - 7,
      y1: y - 8,
      x2: x + 7,
      y2: y + 8,
      "stroke-width": 2.6,
    })
  );
  g.appendChild(
    svgEl("line", {
      x1: x + 7,
      y1: y - 8,
      x2: x - 7,
      y2: y + 8,
      "stroke-width": 2.6,
    })
  );
  g.appendChild(
    svgEl("line", {
      x1: x,
      y1: y - 11,
      x2: x,
      y2: y + 11,
      "stroke-width": 1.6,
    })
  );
  return g;
}

function drawDoubleFlat(x, y) {
  const g = svgEl("g", { class: "accidental" });
  g.appendChild(drawFlat(x - 9, y));
  g.appendChild(drawFlat(x + 5, y));
  return g;
}

function drawAccidental(note, y) {
  const acc = note.accidental || 0;
  if (!acc) return null;
  const x = NOTE_X - (Math.abs(acc) >= 2 ? 40 : 32);
  if (acc >= 2) return drawDoubleSharp(x, y);
  if (acc <= -2) return drawDoubleFlat(x, y);
  return acc > 0 ? drawSharp(x, y) : drawFlat(x, y);
}

function drawClef(clef) {
  const anchorY =
    clef === "treble" ? TOP_LINE_Y + 3 * LINE_GAP : TOP_LINE_Y + LINE_GAP;
  const scale = LINE_GAP / 250;
  const group = svgEl("g", {
    class: "clef",
    transform: `translate(48 ${anchorY}) scale(${scale} ${-scale})`,
    fill: "#1b1410",
  });
  group.appendChild(svgEl("path", { d: CLEF_PATHS[clef] }));
  return group;
}

function drawStaff(clef, challenge) {
  staff.replaceChildren();

  staff.appendChild(
    svgEl("rect", { x: 0, y: 0, width: 820, height: 280, fill: "none" })
  );

  staff.appendChild(
    svgEl("line", {
      x1: 36,
      x2: 36,
      y1: TOP_LINE_Y,
      y2: BOTTOM_LINE_Y,
      stroke: "#1b1410",
      "stroke-width": 2,
    })
  );

  for (let i = 0; i < 5; i += 1) {
    const y = TOP_LINE_Y + i * LINE_GAP;
    staff.appendChild(
      svgEl("line", {
        x1: 36,
        x2: 784,
        y1: y,
        y2: y,
        stroke: "#1b1410",
        "stroke-width": 1.6,
      })
    );
  }

  staff.appendChild(
    svgEl("line", {
      x1: 778,
      x2: 778,
      y1: TOP_LINE_Y,
      y2: BOTTOM_LINE_Y,
      stroke: "#1b1410",
      "stroke-width": 1.6,
    })
  );
  staff.appendChild(
    svgEl("line", {
      x1: 786,
      x2: 786,
      y1: TOP_LINE_Y,
      y2: BOTTOM_LINE_Y,
      stroke: "#1b1410",
      "stroke-width": 5,
    })
  );

  staff.appendChild(drawClef(clef));

  if (!challenge) return;
  const notes = challenge.notes || [challenge];
  if (!notes.length) return;

  const ledgers = new Set();
  notes.forEach((note) => {
    ledgerSteps(note.step, clef).forEach((step) => ledgers.add(step));
  });
  for (const step of ledgers) {
    const ly = yForStep(step, clef);
    staff.appendChild(
      svgEl("line", {
        x1: NOTE_X - 22,
        x2: NOTE_X + 22,
        y1: ly,
        y2: ly,
        stroke: "#1b1410",
        "stroke-width": 1.8,
      })
    );
  }

  const steps = notes.map((note) => note.step);
  const low = Math.min(...steps);
  const high = Math.max(...steps);
  const yLow = yForStep(low, clef);
  const yHigh = yForStep(high, clef);
  const stemUp = (low + high) / 2 < CLEF_RANGES[clef].middleStep;
  const stemX = stemUp ? NOTE_X + 11 : NOTE_X - 11;
  const stemY1 = stemUp ? yLow : yHigh;
  const stemY2 = stemUp ? yHigh - 58 : yLow + 58;
  staff.appendChild(
    svgEl("line", {
      x1: stemX,
      x2: stemX,
      y1: stemY1,
      y2: stemY2,
      stroke: "#1b1410",
      "stroke-width": 2.2,
    })
  );

  notes.forEach((note) => {
    const y = yForStep(note.step, clef);
    const accidental = drawAccidental(note, y);
    if (accidental) staff.appendChild(accidental);
    const head = svgEl("ellipse", {
      class: "note-head",
      cx: NOTE_X,
      cy: y,
      rx: 13,
      ry: 9,
      fill: "#1b1410",
      transform: `rotate(-18 ${NOTE_X} ${y})`,
    });
    staff.appendChild(head);
  });
}

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

let audioCtx = null;
let activeOscs = [];

function unlockAudio() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function stopTone() {
  activeOscs.forEach((osc) => {
    try {
      osc.stop();
    } catch (error) {
      /* already stopped */
    }
  });
  activeOscs = [];
}

function midiForNote(note) {
  const index = NOTE_NAMES.indexOf(note.name);
  if (index < 0) return null;
  return 12 * (note.octave + 1) + SEMITONES[index] + (note.accidental || 0);
}

function freqForNote(note) {
  const midi = midiForNote(note);
  if (midi == null) return null;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function playNoteSound(challenge) {
  if (!state.sound || !challenge) return;
  const notes = challenge.notes || [challenge];
  if (!notes.length) return;
  const ctx = unlockAudio();
  if (!ctx) return;
  const start = () => startTones(notes, ctx);
  if (ctx.state === "suspended") {
    ctx.resume().then(start).catch(() => {});
    return;
  }
  start();
}

function startTones(notes, ctx) {
  stopTone();
  const now = ctx.currentTime;
  const vol = 0.2 / Math.max(1, notes.length);
  notes.forEach((note) => {
    const freq = freqForNote(note);
    if (!freq) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(vol, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.15);
    osc.onended = () => {
      activeOscs = activeOscs.filter((item) => item !== osc);
    };
    activeOscs.push(osc);
  });
}

function playFeedback(correct) {
  if (!state.sound) return;
  const ctx = unlockAudio();
  if (!ctx) return;
  const start = () => startFeedback(correct, ctx);
  if (ctx.state === "suspended") {
    ctx.resume().then(start).catch(() => {});
    return;
  }
  start();
}

function beep(ctx, freq, when, duration, type, volume) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(volume, when + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

function startFeedback(correct, ctx) {
  stopTone();
  const now = ctx.currentTime;
  if (correct) {
    beep(ctx, 659.25, now, 0.11, "sine", 0.16);
    beep(ctx, 880, now + 0.11, 0.2, "sine", 0.14);
    return;
  }
  beep(ctx, 220, now, 0.14, "triangle", 0.16);
  beep(ctx, 164.81, now + 0.12, 0.22, "triangle", 0.16);
}

function t(key) {
  return window.I18n ? window.I18n.t(key) : key;
}

function pickClef() {
  const clefs = state.clefs.length ? state.clefs : ["treble"];
  return clefs[Math.floor(Math.random() * clefs.length)];
}

function challengeFrom(root, notes, quality, kind) {
  return {
    ...root,
    notes,
    quality,
    kind,
  };
}

function noteAtInterval(root, stepOffset, semitones) {
  const target = { ...noteFromStep(root.step + stepOffset), clef: root.clef };
  let accidental = midiForNote(root) + semitones - midiForNote(target);
  if (accidental > 6) accidental -= 12;
  if (accidental < -6) accidental += 12;
  return { ...target, accidental };
}

function raiseOctave(note) {
  return {
    ...noteFromStep(note.step + 7),
    clef: note.clef,
    accidental: note.accidental || 0,
  };
}

function invertNotes(tones, inversion) {
  const notes = tones.map((note) => ({ ...note }));
  for (let i = 0; i < inversion; i += 1) {
    notes.push(raiseOctave(notes.shift()));
  }
  return notes;
}

function difficultyLevel() {
  const level = Number(state.difficulty);
  if (!Number.isFinite(level)) return 5;
  return Math.min(DIFFICULTY_MAX, Math.max(DIFFICULTY_MIN, Math.round(level)));
}

function difficultyT() {
  return (difficultyLevel() - DIFFICULTY_MIN) / (DIFFICULTY_MAX - DIFFICULTY_MIN);
}

function playRange(clef) {
  const full = CLEF_RANGES[clef];
  const t = difficultyT();
  const easyMin = full.bottomStep;
  const easyMax = full.topStep - 2;
  return {
    min: Math.round(easyMin + (full.min - easyMin) * t),
    max: Math.round(easyMax + (full.max - easyMax) * t),
  };
}

function notesInRange(notes, clef) {
  const { min, max } = playRange(clef);
  return notes.every((note) => note.step >= min && note.step <= max);
}

function difficultyQualities() {
  const level = difficultyLevel();
  if (level <= 3) return "simple";
  if (level <= 7) return "common";
  return "all";
}

function qualitiesForKind(kind) {
  const all = KIND_QUALITIES[kind];
  if (!all) return [];
  const filter = difficultyQualities();
  if (filter === "simple") return SIMPLE_QUALITIES[kind] || all;
  if (filter === "common") return COMMON_QUALITIES[kind] || all;
  return all;
}

function poolAccidentals() {
  return difficultyLevel() <= 3 ? [0] : ACCIDENTALS;
}

function pickAccidental() {
  if (state.answerMode !== "choices") return 0;
  const chance = difficultyT() * 0.7;
  if (chance <= 0 || Math.random() >= chance) return 0;
  return Math.random() < 0.5 ? 1 : -1;
}

function specFor(kind, quality) {
  if (kind === "dyad") return DYAD_SPECS[quality];
  return CHORD_SPECS[quality];
}

function tonesForQuality(root, quality, kind) {
  const spec = specFor(kind, quality);
  if (!spec) return [root];
  return spec.steps.map((step, index) =>
    step === 0 ? { ...root } : noteAtInterval(root, step, spec.semis[index])
  );
}

function pickVoicing(clef, kind) {
  const qualities = qualitiesForKind(kind);
  if (!qualities.length) return null;
  const { min, max } = playRange(clef);
  const options = [];
  qualities.forEach((quality) => {
    const spec = specFor(kind, quality);
    if (!spec) return;
    const maxInversion = Math.min(
      spec.steps.length - 1,
      Math.floor((difficultyLevel() - 1) / 2)
    );
    for (let step = min; step <= max; step += 1) {
      const root = { ...noteFromStep(step), clef, accidental: pickAccidental() };
      const tones = tonesForQuality(root, quality, kind);
      for (let inversion = 0; inversion <= maxInversion; inversion += 1) {
        const notes = invertNotes(tones, inversion);
        if (notesInRange(notes, clef)) options.push({ root, notes, quality });
      }
    }
  });
  if (!options.length) return null;
  return options[Math.floor(Math.random() * options.length)];
}

function pickHarmony(clef, kind) {
  const voicing = pickVoicing(clef, kind);
  if (!voicing) return null;
  return challengeFrom(voicing.root, voicing.notes, voicing.quality, kind);
}

function pickNote(clef) {
  const { min, max } = playRange(clef);
  const step = min + Math.floor(Math.random() * (max - min + 1));
  const root = { ...noteFromStep(step), clef, accidental: pickAccidental() };
  return challengeFrom(root, [root], null, "note");
}

function pickDyad(clef) {
  return pickHarmony(clef, "dyad");
}

function pickChord(clef) {
  return pickHarmony(clef, "chord");
}

function pickSeventh(clef) {
  return pickHarmony(clef, "sevenths");
}

function pickNinth(clef) {
  return pickHarmony(clef, "ninths");
}

function pickChallenge(clef) {
  const kinds = state.shapes.length ? state.shapes : ["notes"];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  if (kind === "dyads") return pickDyad(clef) || pickNote(clef);
  if (kind === "chords") return pickChord(clef) || pickNote(clef);
  if (kind === "sevenths") return pickSeventh(clef) || pickNote(clef);
  if (kind === "ninths") return pickNinth(clef) || pickNote(clef);
  return pickNote(clef);
}

function accidentalMark(accidental) {
  if (accidental >= 2) return " ♯♯";
  if (accidental <= -2) return " ♭♭";
  if (accidental > 0) return " ♯";
  if (accidental < 0) return " ♭";
  return "";
}

function noteLabel(name, accidental) {
  return `${t(`note${name}`)}${accidentalMark(accidental)}`;
}

function answerLabel(name, accidental, quality) {
  const base = noteLabel(name, accidental || 0);
  return `${base}${QUALITY_MARKS[quality] || ""}`;
}

function answerKey(name, accidental, quality) {
  return `${name}:${accidental || 0}:${quality || ""}`;
}

function shuffle(list) {
  const items = list.slice();
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function candidateAnswers(qualities) {
  const quals = qualities && qualities.length ? qualities : [null];
  const items = [];
  NOTE_NAMES.forEach((name) => {
    poolAccidentals().forEach((accidental) => {
      quals.forEach((quality) => {
        items.push({ name, accidental, quality });
      });
    });
  });
  return items;
}

function qualitiesForChallenge(challenge) {
  if (!challenge || !challenge.quality) return [null];
  const list = qualitiesForKind(challenge.kind);
  return list.length ? list : [challenge.quality];
}

function uniquePitchItems(challenge) {
  const map = new Map();
  (challenge.notes || [challenge]).forEach((note) => {
    const item = {
      name: note.name,
      accidental: note.accidental || 0,
      quality: null,
    };
    map.set(answerKey(item.name, item.accidental, null), item);
  });
  return [...map.values()];
}

function choiceFrom(item, correctKeys) {
  const key = answerKey(item.name, item.accidental, item.quality);
  return {
    key,
    name: item.name,
    accidental: item.accidental,
    quality: item.quality,
    label: answerLabel(item.name, item.accidental, item.quality),
    correct: correctKeys.has(key),
  };
}

function isNotesMode() {
  return state.answerMode === "notes";
}

const MINOR_QUALITIES = new Set(["minor", "min7", "min9", "dim", "dim7", "halfdim"]);

function syncQualityHint() {
  if (!qualityHint) return;
  const quality = isNotesMode() && state.running && state.current && state.current.quality;
  if (!quality) {
    qualityHint.classList.add("is-hidden");
    qualityHint.textContent = "";
    return;
  }
  qualityHint.textContent = MINOR_QUALITIES.has(quality)
    ? t("qualityMinor")
    : t("qualityMajor");
  qualityHint.classList.remove("is-hidden");
}

function isMultiple() {
  return state.answerMode === "choices" && state.choiceKind === "multiple";
}

function pickAriaKey() {
  if (isNotesMode()) return "pickNote";
  return isMultiple() ? "pickAll" : "pickChoice";
}

function syncChoicesAria() {
  const box = document.getElementById("choices");
  if (!box) return;
  const key = pickAriaKey();
  box.dataset.i18nAria = key;
  box.setAttribute("aria-label", t(key));
}

function buildChoices(challenge) {
  if (isNotesMode()) {
    return NOTE_NAMES.map((name) => ({
      key: name,
      name,
      accidental: 0,
      quality: null,
      label: t(`note${name}`),
      correct: name === challenge.name,
    }));
  }

  const count = state.choiceCount;
  if (isMultiple()) {
    const corrects = uniquePitchItems(challenge);
    const correctKeys = new Set(
      corrects.map((item) => answerKey(item.name, item.accidental, null))
    );
    const optionCount = Math.min(
      CHOICE_COUNT_MAX,
      Math.max(count, corrects.length)
    );
    const pool = candidateAnswers([null]).filter(
      (item) => !correctKeys.has(answerKey(item.name, item.accidental, null))
    );
    const wrong = shuffle(pool).slice(0, Math.max(0, optionCount - corrects.length));
    const items = shuffle([...corrects, ...wrong]);
    return items.map((item) => choiceFrom(item, correctKeys));
  }

  const correct = {
    name: challenge.name,
    accidental: challenge.accidental || 0,
    quality: challenge.quality || null,
  };
  const correctKey = answerKey(correct.name, correct.accidental, correct.quality);
  const correctKeys = new Set([correctKey]);
  const pool = candidateAnswers(qualitiesForChallenge(challenge)).filter(
    (item) => !correctKeys.has(answerKey(item.name, item.accidental, item.quality))
  );
  const wrong = shuffle(pool).slice(0, Math.max(0, count - 1));
  return shuffle([correct, ...wrong]).map((item) => choiceFrom(item, correctKeys));
}

function choiceButtons() {
  return [...document.querySelectorAll("#choices .note-btn")];
}

function desiredButtonCount() {
  if (isNotesMode()) return NOTE_NAMES.length;
  if (state.choices.length) return state.choices.length;
  return state.choiceCount;
}

function ensureChoiceButtons() {
  const box = document.getElementById("choices");
  if (!box) return;
  const count = desiredButtonCount();
  box.dataset.mode = isNotesMode() ? "notes" : "choices";
  box.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
  while (box.children.length > count) box.removeChild(box.lastChild);
  while (box.children.length < count) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "note-btn";
    btn.disabled = true;
    btn.textContent = "—";
    box.appendChild(btn);
  }
}

function paintChoices(disabled) {
  ensureChoiceButtons();
  const buttons = choiceButtons();
  buttons.forEach((btn) => {
    btn.classList.remove("is-picked", "is-correct", "is-wrong");
  });
  const active = document.activeElement;
  if (
    active &&
    active.classList.contains("note-btn") &&
    !state.selected.includes(active.dataset.choice)
  ) {
    active.blur();
  }
  if (!state.choices.length) {
    buttons.forEach((btn) => {
      btn.dataset.choice = "";
      btn.textContent = "—";
      btn.disabled = true;
    });
    return;
  }
  state.choices.forEach((choice, index) => {
    const btn = buttons[index];
    if (!btn) return;
    btn.dataset.choice = choice.key;
    btn.textContent = choice.label;
    btn.disabled = disabled;
    if (state.selected.includes(choice.key)) btn.classList.add("is-picked");
  });
}

function renderChoices() {
  const lockSingle = !isMultiple() && state.selected.length > 0;
  paintChoices(!state.running || state.paused || state.locked || lockSingle);
}

function choiceLabel(choice) {
  if (isNotesMode()) return t(`note${choice.name}`);
  return answerLabel(choice.name, choice.accidental, choice.quality);
}

function relabelChoices() {
  if (!state.choices.length) {
    idleChoices();
    return;
  }
  state.choices = state.choices.map((choice) => ({
    ...choice,
    label: choiceLabel(choice),
  }));
  const buttons = choiceButtons();
  state.choices.forEach((choice, index) => {
    const btn = buttons[index];
    if (!btn) return;
    btn.textContent = choice.label;
  });
  syncChoicesAria();
}

function idleChoices() {
  state.selected = [];
  if (isNotesMode()) {
    state.choices = NOTE_NAMES.map((name) => ({
      key: name,
      name,
      accidental: 0,
      quality: null,
      label: t(`note${name}`),
      correct: false,
    }));
  } else {
    state.choices = [];
  }
  paintChoices(true);
  syncChoicesAria();
}

function applyChoiceLayout() {
  if (!state.running) {
    idleChoices();
    return;
  }
  if (state.locked || !state.current) return;
  state.selected = [];
  state.answerElapsed = null;
  state.choices = buildChoices(state.current);
  renderChoices();
}

function resetButtons() {
  const lockSingle = !isMultiple() && state.selected.length > 0;
  document.querySelectorAll(".note-btn").forEach((btn) => {
    btn.disabled = lockSingle;
    if (!state.selected.includes(btn.dataset.choice)) {
      btn.classList.remove("is-picked");
    }
    btn.classList.remove("is-correct", "is-wrong");
  });
}

function correctChoiceKeys() {
  return (state.choices || []).filter((choice) => choice.correct).map((choice) => choice.key);
}

function selectionIsCorrect() {
  const need = correctChoiceKeys().slice().sort();
  const got = state.selected.slice().sort();
  return need.length > 0 && need.length === got.length && need.every((key, i) => key === got[i]);
}

function handleChoiceClick(btn) {
  if (!state.running || state.paused || state.locked) return;
  const key = btn.dataset.choice;
  if (!key) return;
  if (isMultiple()) {
    if (state.selected.includes(key)) {
      state.selected = state.selected.filter((item) => item !== key);
      btn.classList.remove("is-picked");
      if (!state.selected.length) state.answerElapsed = null;
    } else {
      state.selected.push(key);
      btn.classList.add("is-picked");
      if (state.selected.length === 1) state.answerElapsed = elapsedMs();
    }
    return;
  }
  if (state.selected.length) return;
  state.selected = [key];
  state.answerElapsed = elapsedMs();
  btn.classList.add("is-picked");
  document.querySelectorAll(".note-btn").forEach((other) => {
    other.disabled = true;
  });
}

function formatMessage(key, vars) {
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
    t(key)
  );
}

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

function remainingMs() {
  return Math.max(0, state.timerStartedAt + state.timerDuration - Date.now());
}

function elapsedMs() {
  const total = state.seconds * 1000;
  return Math.max(0, Math.min(total, total - remainingMs()));
}

function sessionQuality() {
  return state.roundWeightSum ? state.weightedQualitySum / state.roundWeightSum : 0;
}

function updateStats() {
  scoreEl.textContent = String(state.score);
  streakEl.textContent = String(state.streak);
  progressEl.textContent = `${state.round} / ${state.rounds}`;
  if (!avgTimeEl) return;
  avgTimeEl.textContent = state.attempted
    ? `${(state.timeSum / state.attempted / 1000).toFixed(1)} ${t("tempoUnit")}`
    : "—";
}

function reveal() {
  if (!state.running || !state.current || state.locked) return;
  state.locked = true;
  clearTimeout(state.roundTimer);

  const guessed = state.selected.length > 0;
  const correct = selectionIsCorrect();
  const need = new Set(correctChoiceKeys());
  const got = new Set(state.selected);
  const total = state.seconds * 1000;
  const elapsed =
    guessed && state.answerElapsed != null ? state.answerElapsed : total;
  const speed = total ? Math.max(0, Math.min(1, (total - elapsed) / total)) : 0;
  const quality = correct
    ? GRADE_ACCURACY + GRADE_SPEED * Math.sqrt(speed)
    : 0;

  state.attempted += 1;
  const roundWeight = fullRoundWeight(state.current);
  state.roundWeightSum += roundWeight;
  state.weightedQualitySum += quality * roundWeight;
  state.timeSum += elapsed;
  if (guessed) {
    if (correct) {
      state.score += 1;
      state.streak += 1;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      state.universalScore += universalRoundPoints(
        true,
        elapsed,
        total,
        state.streak,
        roundWeight
      );
    } else {
      state.streak = 0;
    }
  } else {
    state.streak = 0;
  }

  document.querySelectorAll(".note-btn").forEach((btn) => {
    btn.disabled = true;
    const key = btn.dataset.choice;
    btn.classList.remove("is-picked");
    if (need.has(key)) btn.classList.add("is-correct");
    if (got.has(key) && !need.has(key)) btn.classList.add("is-wrong");
  });

  playFeedback(correct);
  updateStats();

  if (!state.running || state.paused) return;
  if (state.round >= state.rounds) {
    state.nextDueAt = Date.now() + 1800;
    state.nextTimer = setTimeout(finishSession, 1800);
    return;
  }
  state.nextDueAt = Date.now() + 1800;
  state.nextTimer = setTimeout(nextRound, 1800);
}

function freezeTimerBar(remainingMs) {
  const total = state.seconds * 1000;
  const scale = total ? Math.max(0, Math.min(1, remainingMs / total)) : 0;
  timerFill.style.transition = "none";
  timerFill.style.transform = `scaleX(${scale})`;
}

function startTimer(durationMs) {
  const total = state.seconds * 1000;
  const remaining = durationMs == null ? total : durationMs;
  freezeTimerBar(remaining);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      timerFill.style.transition = `transform ${remaining / 1000}s linear`;
      timerFill.style.transform = "scaleX(0)";
    });
  });
  state.timerStartedAt = Date.now();
  state.timerDuration = remaining;
  state.roundTimer = setTimeout(reveal, remaining);
}

function nextRound() {
  if (!state.running || state.paused) return;
  clearTimeout(state.roundTimer);
  clearTimeout(state.nextTimer);
  state.round += 1;
  state.selected = [];
  state.answerElapsed = null;
  state.locked = false;
  const clef = pickClef();
  state.current = pickChallenge(clef);
  state.choices = buildChoices(state.current);
  renderChoices();
  drawStaff(clef, state.current);
  updateStats();
  syncQualityHint();
  playNoteSound(state.current);
  startTimer();
  notifyUi();
}

function showIdleOverlay() {
  if (resultOverlay) resultOverlay.classList.add("is-hidden");
  startOverlay.classList.remove("is-hidden");
  syncQualityHint();
}

function renderResults() {
  const result = state.lastResult;
  if (!result) return;
  resultGrade.textContent = String(result.grade);
  resultLabel.textContent = t(`grade${result.grade}`);
  if (resultUniversal) {
    resultUniversal.textContent = formatUniversalScore(result.universalScore);
  }
  resultSummary.textContent = formatMessage("resultSummary", {
    score: result.score,
    total: result.attempted,
    accuracy: result.percent,
    streak: result.bestStreak,
  });
}

function showResultOverlay() {
  renderResults();
  startOverlay.classList.add("is-hidden");
  if (resultOverlay) resultOverlay.classList.remove("is-hidden");
  requestAnimationFrame(() => {
    document.getElementById("playAgainBtn")?.focus();
  });
}

function finishSession() {
  clearTimeout(state.roundTimer);
  clearTimeout(state.nextTimer);
  stopTone();
  state.running = false;
  state.paused = false;
  hidePauseOverlay();
  state.current = null;
  state.selected = [];
  state.locked = false;
  timerFill.style.transition = "none";
  timerFill.style.transform = "scaleX(1)";
  document.querySelectorAll(".note-btn").forEach((btn) => {
    btn.disabled = true;
    btn.classList.remove("is-picked");
  });
  const quality = sessionQuality();
  const percent = Math.round(quality * 100);
  const grade = Math.max(0, Math.min(10, Math.round(quality * 10)));
  state.lastResult = {
    grade,
    percent,
    score: state.score,
    attempted: state.attempted,
    bestStreak: state.bestStreak,
    universalScore: state.universalScore,
    sessionDifficulty: Math.round(sessionDifficultyIndex() * 100) / 100,
    settings: sessionSettingsSnapshot(),
  };
  drawStaff(previewClef(), null);
  syncQualityHint();
  showResultOverlay();
  syncPlayButton();
  notifyUi();
}

function hidePauseOverlay() {
  if (pauseOverlay) pauseOverlay.classList.add("is-hidden");
}

function showPauseOverlay() {
  if (pauseOverlay) pauseOverlay.classList.remove("is-hidden");
}

function syncPauseButton() {
  const pauseBtn = document.getElementById("pauseBtn");
  const pauseIcon = document.getElementById("pauseIcon");
  if (!pauseBtn || !pauseIcon) return;
  const label = state.paused ? t("resume") : t("pause");
  pauseBtn.classList.toggle("is-hidden", !state.running);
  pauseBtn.classList.toggle("is-paused", state.paused);
  pauseBtn.setAttribute("aria-pressed", String(state.paused));
  pauseBtn.setAttribute("aria-label", label);
  pauseBtn.title = label;
  pauseIcon.textContent = state.paused ? "▶" : "⏸";
}

function syncPlayButton() {
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const label = state.running ? t("stop") : t("start");
  playBtn.classList.toggle("is-running", state.running);
  playBtn.setAttribute("aria-pressed", String(state.running));
  playBtn.setAttribute("aria-label", label);
  playBtn.title = label;
  playIcon.textContent = state.running ? "■" : "▶";
  if (settingsBtn) settingsBtn.disabled = state.running && !state.paused;
  syncPauseButton();
}

function pauseGame() {
  if (!state.running || state.paused) return;
  state.paused = true;
  stopTone();
  closeSettings();
  if (state.locked) {
    state.pauseKind = "next";
    state.pauseRemaining = Math.max(0, state.nextDueAt - Date.now());
    clearTimeout(state.nextTimer);
  } else {
    state.pauseKind = "round";
    state.pauseRemaining = Math.max(
      0,
      state.timerStartedAt + state.timerDuration - Date.now()
    );
    clearTimeout(state.roundTimer);
    freezeTimerBar(state.pauseRemaining);
    document.querySelectorAll(".note-btn").forEach((btn) => {
      btn.disabled = true;
    });
  }
  showPauseOverlay();
  syncPlayButton();
  notifyUi();
}

function resumeGame() {
  if (!state.running || !state.paused) return;
  state.paused = false;
  hidePauseOverlay();
  closeSettings();
  unlockAudio();
  const remaining = state.pauseRemaining;
  state.pauseKind = null;
  if (state.locked) {
    const delay = remaining || 0;
    state.nextDueAt = Date.now() + delay;
    const followUp = state.round >= state.rounds ? finishSession : nextRound;
    state.nextTimer = setTimeout(followUp, delay);
  } else {
    if (isMultiple() || !state.selected.length) resetButtons();
    else {
      document.querySelectorAll(".note-btn").forEach((btn) => {
        btn.disabled = true;
      });
    }
    startTimer(remaining);
  }
  syncPlayButton();
  notifyUi();
}

function togglePause() {
  if (!state.running) return;
  if (state.paused) resumeGame();
  else pauseGame();
}

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

function notifyUi() {
  window.dispatchEvent(new Event("gtn:ui"));
}

function startGame() {
  if (state.running) return;
  closeSettings();
  unlockAudio();
  state.running = true;
  state.paused = false;
  hidePauseOverlay();
  state.score = 0;
  state.attempted = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.round = 0;
  state.weightedQualitySum = 0;
  state.roundWeightSum = 0;
  state.timeSum = 0;
  state.universalScore = 0;
  state.answerElapsed = null;
  state.lastResult = null;
  startOverlay.classList.add("is-hidden");
  if (resultOverlay) resultOverlay.classList.add("is-hidden");
  updateStats();
  syncPlayButton();
  nextRound();
}

function stopGame() {
  state.running = false;
  state.paused = false;
  hidePauseOverlay();
  stopTone();
  clearTimeout(state.roundTimer);
  clearTimeout(state.nextTimer);
  state.current = null;
  state.selected = [];
  state.locked = false;
  timerFill.style.transition = "none";
  timerFill.style.transform = "scaleX(1)";
  drawStaff(previewClef(), null);
  idleChoices();
  showIdleOverlay();
  syncPlayButton();
  notifyUi();
}

function toggleGame() {
  if (state.running) stopGame();
  else startGame();
}

function previewClef() {
  return state.clefs.length === 1 && state.clefs[0] === "bass" ? "bass" : "treble";
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
  state.shapes = parseStoredList(storageGet(SETTINGS_SHAPES), SHAPES, ["notes"]);
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

function refreshLabels() {
  syncPlayButton();
  syncSoundButton();
  setTempo(state.seconds);
  setRounds(state.rounds);
  setChoiceCount(state.choiceCount);
  setDifficulty(state.difficulty);
  syncAnswerModeButtons();
  syncChoiceKindButtons();
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
window.addEventListener("orientationchange", scheduleScrollToStaff);
window.addEventListener("load", scheduleScrollToStaff);
if (isPhoneLandscape()) scheduleScrollToStaff();
