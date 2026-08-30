const NOTE_NAMES = ["Do", "Re", "Mi", "Fa", "Sol", "La", "Si"];
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
  clefMode: "treble",
  seconds: 4,
  current: null,
  guessed: null,
  locked: false,
  score: 0,
  attempted: 0,
  streak: 0,
  roundTimer: null,
  nextTimer: null,
};

const staff = document.getElementById("staff");
const tempo = document.getElementById("tempo");
const tempoLabel = document.getElementById("tempoLabel");
const timerFill = document.getElementById("timerFill");
const solutionEl = document.querySelector(".solution");
const solutionBody = document.getElementById("solutionBody");
const scoreEl = document.getElementById("score");
const streakEl = document.getElementById("streak");
const accuracyEl = document.getElementById("accuracy");

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

function drawStaff(clef, note) {
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

  if (!note) return;

  const y = yForStep(note.step, clef);
  for (const step of ledgerSteps(note.step, clef)) {
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

  const stemUp = note.step < CLEF_RANGES[clef].middleStep;
  const stemX = stemUp ? NOTE_X + 11 : NOTE_X - 11;
  const stemY2 = stemUp ? y - 58 : y + 58;
  staff.appendChild(
    svgEl("line", {
      x1: stemX,
      x2: stemX,
      y1: y,
      y2: stemY2,
      stroke: "#1b1410",
      "stroke-width": 2.2,
    })
  );

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
}

function clefLabel(clef) {
  return clef === "treble" ? "chiave di violino" : "chiave di basso";
}

function pickClef() {
  if (state.clefMode === "both") return Math.random() < 0.5 ? "treble" : "bass";
  return state.clefMode;
}

function pickNote(clef) {
  const { min, max } = CLEF_RANGES[clef];
  const step = min + Math.floor(Math.random() * (max - min + 1));
  return { ...noteFromStep(step), clef };
}

function resetButtons() {
  document.querySelectorAll(".note-btn").forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("is-picked", "is-correct", "is-wrong");
  });
}

function updateStats() {
  scoreEl.textContent = String(state.score);
  streakEl.textContent = String(state.streak);
  accuracyEl.textContent = state.attempted
    ? `${Math.round((state.score / state.attempted) * 100)}%`
    : "—";
}

function setSolution(text, mode) {
  solutionBody.textContent = text;
  solutionEl.classList.toggle("is-revealed", mode !== "wait");
  solutionEl.classList.toggle("is-correct", mode === "correct");
  solutionEl.classList.toggle("is-missed", mode === "missed");
}

function reveal() {
  if (!state.running || !state.current || state.locked) return;
  state.locked = true;
  clearTimeout(state.roundTimer);

  const { name, octave, clef } = state.current;
  const guessed = state.guessed;
  const correct = guessed === name;
  if (guessed) {
    state.attempted += 1;
    if (correct) {
      state.score += 1;
      state.streak += 1;
    } else {
      state.streak = 0;
    }
  } else {
    state.attempted += 1;
    state.streak = 0;
  }

  document.querySelectorAll(".note-btn").forEach((btn) => {
    btn.disabled = true;
    if (btn.dataset.note === name) btn.classList.add("is-correct");
    if (guessed && btn.dataset.note === guessed && !correct) {
      btn.classList.add("is-wrong");
    }
  });

  const prefix = correct
    ? "Esatto"
    : guessed
      ? "La nota era"
      : "Tempo scaduto";
  const letter = "CDEFGAB"[NOTE_NAMES.indexOf(name)];
  setSolution(
    `${prefix}: ${name} (${letter}${octave})  ·  ${clefLabel(clef)}`,
    correct ? "correct" : "missed"
  );
  updateStats();

  if (state.running) state.nextTimer = setTimeout(nextRound, 1800);
}

function startTimer() {
  timerFill.style.transition = "none";
  timerFill.style.transform = "scaleX(1)";
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      timerFill.style.transition = `transform ${state.seconds}s linear`;
      timerFill.style.transform = "scaleX(0)";
    });
  });
  state.roundTimer = setTimeout(reveal, state.seconds * 1000);
}

function nextRound() {
  if (!state.running) return;
  clearTimeout(state.roundTimer);
  clearTimeout(state.nextTimer);
  state.guessed = null;
  state.locked = false;
  resetButtons();
  setSolution("Comparirà qui allo scadere del tempo", "wait");
  const clef = pickClef();
  state.current = pickNote(clef);
  drawStaff(clef, state.current);
  startTimer();
  notifyUi();
}

function syncPlayButton() {
  const playBtn = document.getElementById("playBtn");
  const playLabel = document.getElementById("playLabel");
  const playIcon = document.getElementById("playIcon");
  playBtn.classList.toggle("is-running", state.running);
  playBtn.setAttribute("aria-pressed", String(state.running));
  playLabel.textContent = state.running ? "Stop" : "Start";
  playIcon.textContent = state.running ? "■" : "▶";
}

function notifyUi() {
  window.dispatchEvent(new Event("gtn:ui"));
}

function startGame() {
  if (state.running) return;
  state.running = true;
  document.getElementById("startOverlay").classList.add("is-hidden");
  syncPlayButton();
  nextRound();
}

function stopGame() {
  state.running = false;
  clearTimeout(state.roundTimer);
  clearTimeout(state.nextTimer);
  state.current = null;
  state.guessed = null;
  state.locked = false;
  timerFill.style.transition = "none";
  timerFill.style.transform = "scaleX(1)";
  drawStaff(previewClef(), null);
  document.querySelectorAll(".note-btn").forEach((btn) => {
    btn.disabled = true;
    btn.classList.remove("is-picked", "is-correct", "is-wrong");
  });
  setSolution("Comparirà qui allo scadere del tempo", "wait");
  document.getElementById("startOverlay").classList.remove("is-hidden");
  syncPlayButton();
  notifyUi();
}

function toggleGame() {
  if (state.running) stopGame();
  else startGame();
}

function previewClef() {
  return state.clefMode === "bass" ? "bass" : "treble";
}

document.querySelectorAll("[data-clef]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.clefMode = btn.dataset.clef;
    document.querySelectorAll("[data-clef]").forEach((other) => {
      const active = other === btn;
      other.classList.toggle("is-active", active);
      other.setAttribute("aria-pressed", String(active));
    });
    if (!state.running) drawStaff(previewClef(), null);
  });
});

tempo.addEventListener("input", () => {
  state.seconds = Number(tempo.value);
  tempoLabel.textContent = `${state.seconds.toFixed(1)} s`;
});

document.querySelectorAll(".note-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!state.running || state.locked || state.guessed) return;
    state.guessed = btn.dataset.note;
    btn.classList.add("is-picked");
    document.querySelectorAll(".note-btn").forEach((other) => {
      other.disabled = true;
    });
  });
});

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("playBtn").addEventListener("click", toggleGame);

document.addEventListener("keydown", (event) => {
  const index = Number(event.key) - 1;
  if (index >= 0 && index < NOTE_NAMES.length) {
    const btn = document.querySelector(`[data-note="${NOTE_NAMES[index]}"]`);
    btn?.click();
  }
});

window.GuessTheNote = {
  startGame,
  stopGame,
  toggleGame,
  getState: () => state,
};

drawStaff(previewClef(), null);
document.querySelectorAll(".note-btn").forEach((btn) => {
  btn.disabled = true;
});
