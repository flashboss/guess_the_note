(function () {
  const isTizen = typeof window.tizen !== "undefined";
  const forceTv = new URLSearchParams(location.search).has("tv");
  if (isTizen || forceTv || /Tizen|SMART-TV|SmartTV/i.test(navigator.userAgent)) {
    document.documentElement.classList.add("is-tv");
  }

  function api() {
    return window.GuessTheNote;
  }

  function noteButtons() {
    return [...document.querySelectorAll(".note-btn")];
  }

  function isTv() {
    return document.documentElement.classList.contains("is-tv");
  }

  function isTextField(el) {
    return (
      el?.tagName === "INPUT" &&
      (el.type === "text" || el.type === "search") &&
      !el.readOnly
    );
  }

  function isNameField(el) {
    return el?.tagName === "INPUT" && (el.type === "text" || el.type === "search");
  }

  function lockTvTextFields() {
    if (!isTv()) return;
    document.querySelectorAll('#settingsOverlay input[type="text"]').forEach((el) => {
      el.readOnly = true;
    });
  }

  function unlockTvTextField(el) {
    if (!isTv() || !isNameField(el)) return;
    el.readOnly = false;
    try {
      el.setSelectionRange(el.value.length, el.value.length);
    } catch {
      /* ignore */
    }
  }

  function hofScrollHost() {
    return document.getElementById("hofTable");
  }

  function isHofScrollTarget(el) {
    const host = hofScrollHost();
    return Boolean(host && el && (el === host || host.contains(el)));
  }

  function hofScrollStep(host) {
    const row = host.querySelector(".hof-table tbody tr");
    const rowHeight = row ? Math.ceil(row.getBoundingClientRect().height) : 0;
    return Math.max(rowHeight || 64, Math.round(host.clientHeight * 0.35));
  }

  function tryScrollHof(dir) {
    if (!document.documentElement.classList.contains("is-tv")) return false;
    const host = hofScrollHost();
    if (!host || !isHofScrollTarget(document.activeElement)) return false;
    const max = Math.max(0, host.scrollHeight - host.clientHeight);
    if (max <= 1) return false;
    const before = host.scrollTop;
    if (dir < 0 && before <= 0) return false;
    if (dir > 0 && before >= max - 1) return false;
    host.scrollTop = Math.max(0, Math.min(max, before + dir * hofScrollStep(host)));
    return true;
  }

  function isFocusable(el) {
    return Boolean(
      el &&
        !el.disabled &&
        !el.closest(".is-hidden") &&
        !el.closest("[hidden]")
    );
  }

  function focusable(items) {
    return items.filter(isFocusable);
  }

  function settingsFocusables() {
    return focusable([
      ...document.querySelectorAll("#settingsOverlay [data-lang]"),
      ...document.querySelectorAll("#settingsOverlay [data-clef]"),
      ...document.querySelectorAll("#settingsOverlay [data-shape]"),
      document.getElementById("difficulty"),
      ...document.querySelectorAll("#settingsOverlay [data-answer-mode]"),
      ...document.querySelectorAll("#settingsOverlay [data-choice-kind]"),
      document.getElementById("choiceCount"),
      document.getElementById("rounds"),
      document.getElementById("tempo"),
      document.getElementById("soundBtn"),
      document.getElementById("playerName"),
      document.getElementById("keepPlayerName"),
      document.getElementById("settingsClose"),
    ]);
  }

  function visibleFocusables() {
    const game = api();
    if (game && game.settingsAreOpen()) {
      return settingsFocusables();
    }

    if (!game) {
      const settingsOverlay = document.getElementById("settingsOverlay");
      const settingsOpen =
        settingsOverlay && !settingsOverlay.classList.contains("is-hidden");
      if (settingsOpen) {
        return focusable([
          ...document.querySelectorAll("#settingsOverlay [data-lang]"),
          document.getElementById("hofDisplayCount"),
          document.getElementById("settingsClose"),
        ]);
      }
      return focusable([
        document.querySelector(".hof-play-link"),
        document.getElementById("settingsBtn"),
        document.getElementById("hofTable"),
      ]);
    }

    const running = game && game.getState().running;
    const paused = game && game.getState().paused;
    if (running && paused) {
      return focusable([
        document.getElementById("settingsBtn"),
        document.getElementById("pauseBtn"),
        document.getElementById("playBtn"),
      ]);
    }
    if (running) {
      const enabled = noteButtons().filter((btn) => !btn.disabled);
      const notes = enabled.length ? enabled : noteButtons();
      return focusable([
        document.getElementById("pauseBtn"),
        ...notes,
      ]);
    }

    if (game && game.showingResults()) {
      return focusable([
        document.getElementById("playAgainBtn"),
        document.getElementById("resultHofLink"),
      ]);
    }

    return focusable([
      document.getElementById("settingsBtn"),
      document.getElementById("playBtn"),
    ]);
  }

  function focusEl(el) {
    if (!el) return;
    el.focus();
  }

  function nudgeRange(el, dir) {
    if (!el || el.type !== "range") return false;
    const step = Number(el.step) || 1;
    const min = Number(el.min);
    const max = Number(el.max);
    const next = Math.min(max, Math.max(min, Number(el.value) + dir * step));
    if (next === Number(el.value)) return true;
    el.value = String(next);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }

  function focusRows(items) {
    const rows = [];
    items.forEach((el) => {
      const box = el.getBoundingClientRect();
      // Use vertical center so flex-aligned items on one visual row share a bucket.
      const top = Math.round((box.top + box.height / 2) / 40);
      let row = rows.find((entry) => entry.top === top);
      if (!row) {
        row = { top, els: [] };
        rows.push(row);
      }
      row.els.push(el);
    });
    rows.sort((a, b) => a.top - b.top);
    rows.forEach((row) => {
      row.els.sort(
        (a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left
      );
    });
    return rows;
  }

  function moveFocus(dx, dy) {
    const items = visibleFocusables();
    if (!items.length) return;

    const active = document.activeElement;
    const rows = focusRows(items);
    const rowIndex = rows.findIndex((row) => row.els.includes(active));
    const from = rowIndex >= 0 ? rowIndex : 0;
    const currentRow = rows[from];
    const col = Math.max(0, currentRow.els.indexOf(active));

    if (dy !== 0) {
      const target = rows[Math.max(0, Math.min(rows.length - 1, from + dy))];
      focusEl(target.els[Math.min(col, target.els.length - 1)]);
      return;
    }

    // Horizontal moves stay on the current row so toolbar controls
    // (e.g. Pause) are only reached with Up, not by wrapping Left.
    const next = (col + dx + currentRow.els.length) % currentRow.els.length;
    focusEl(currentRow.els[next]);
  }

  function activate() {
    const el = document.activeElement;
    if (!el) return;
    if (isNameField(el) && el.readOnly) {
      unlockTvTextField(el);
      return;
    }
    if (el.tagName === "BUTTON" || el.tagName === "INPUT" || el.tagName === "A") {
      el.click();
    }
  }

  function registerTvKeys() {
    if (!isTizen || !tizen.tvinputdevice) return;
    [
      "MediaPlay",
      "MediaPause",
      "MediaPlayPause",
      "MediaStop",
    ].forEach((key) => {
      try {
        tizen.tvinputdevice.registerKey(key);
      } catch (error) {
        /* older firmware may not expose every media key */
      }
    });
  }

  function exitApp() {
    if (isTizen && tizen.application) {
      tizen.application.getCurrentApplication().exit();
    }
  }

  document.addEventListener("keydown", (event) => {
    api()?.unlockAudio?.();
    const key = event.key;
    const code = event.keyCode;
    const active = document.activeElement;

    if (isTextField(active)) {
      if (code === 10009 || key === "XF86Back" || key === "Escape") {
        event.preventDefault();
        active.blur();
        lockTvTextFields();
        return;
      }
      // While the on-screen keyboard is open, leave other keys to the IME.
      // Arrow keys still escape so the keep-name checkbox stays reachable.
      if (key === "ArrowLeft" || code === 37) {
        event.preventDefault();
        active.blur();
        lockTvTextFields();
        moveFocus(-1, 0);
        return;
      }
      if (key === "ArrowRight" || code === 39) {
        event.preventDefault();
        active.blur();
        lockTvTextFields();
        moveFocus(1, 0);
        return;
      }
      if (key === "ArrowUp" || code === 38) {
        event.preventDefault();
        active.blur();
        lockTvTextFields();
        moveFocus(0, -1);
        return;
      }
      if (key === "ArrowDown" || code === 40) {
        event.preventDefault();
        active.blur();
        lockTvTextFields();
        moveFocus(0, 1);
        return;
      }
      return;
    }

    if (key === "ArrowLeft" || code === 37) {
      event.preventDefault();
      if (nudgeRange(document.activeElement, -1)) return;
      moveFocus(-1, 0);
      return;
    }
    if (key === "ArrowRight" || code === 39) {
      event.preventDefault();
      if (nudgeRange(document.activeElement, 1)) return;
      moveFocus(1, 0);
      return;
    }
    if (key === "ArrowUp" || code === 38) {
      event.preventDefault();
      if (tryScrollHof(-1)) return;
      moveFocus(0, -1);
      return;
    }
    if (key === "ArrowDown" || code === 40) {
      event.preventDefault();
      if (tryScrollHof(1)) return;
      moveFocus(0, 1);
      return;
    }
    if (key === "Enter" || code === 13) {
      event.preventDefault();
      activate();
      return;
    }
    if (code === 10009 || key === "XF86Back" || key === "Escape") {
      event.preventDefault();
      const game = api();
      if (!game) {
        exitApp();
        return;
      }
      if (game.settingsAreOpen()) {
        game.closeSettings();
        return;
      }
      const { running, paused } = game.getState();
      if (running && !paused) {
        game.pauseGame();
        return;
      }
      if (running && paused) {
        game.stopGame();
        return;
      }
      if (game.showingResults()) {
        game.stopGame();
        return;
      }
      exitApp();
      return;
    }
    if (code === 10252 || key === "MediaPlayPause") {
      event.preventDefault();
      const game = api();
      if (!game) return;
      if (game.getState().running) game.togglePause();
      else game.toggleGame();
      return;
    }
    if (code === 415 || key === "MediaPlay") {
      event.preventDefault();
      const game = api();
      if (!game) return;
      if (game.getState().paused) game.resumeGame();
      else if (!game.getState().running) game.startGame();
      return;
    }
    if (code === 19 || key === "MediaPause") {
      event.preventDefault();
      api()?.pauseGame();
      return;
    }
    if (code === 413 || key === "MediaStop") {
      event.preventDefault();
      api()?.stopGame();
    }
  });

  window.addEventListener("gtn:ui", () => {
    const game = api();
    const active = document.activeElement;
    if (isTextField(active)) return;
    const items = visibleFocusables();
    if (game && game.showingResults()) {
      focusEl(document.getElementById("playAgainBtn"));
      return;
    }
    if (game && game.settingsAreOpen()) {
      if (items.includes(active)) return;
      focusEl(items.find((el) => el.dataset.lang) || document.getElementById("settingsClose") || items[0]);
      return;
    }

    const running = game && game.getState().running;
    const paused = game && game.getState().paused;
    if (running && !paused) {
      const notes = items.filter((el) => el.classList.contains("note-btn"));
      // After Play, land on the answer pad — not Pause / Stop.
      if (notes.length && (!active || !notes.includes(active))) {
        focusEl(notes[0]);
        return;
      }
      if (notes.includes(active)) return;
    }

    if (items.includes(active)) return;
    const preferred =
      items.find((el) => el.classList.contains("note-btn")) ||
      items.find((el) => el.id === "pauseBtn") ||
      items.find((el) => el.id === "playBtn") ||
      items.find((el) => el.id === "playAgainBtn") ||
      items.find((el) => el.classList.contains("hof-play-link")) ||
      items.find((el) => el.id === "settingsBtn") ||
      items.find((el) => el.dataset.lang) ||
      items[0];
    focusEl(preferred);
  });

  registerTvKeys();
  lockTvTextFields();
  document.addEventListener(
    "blur",
    (event) => {
      if (isNameField(event.target)) lockTvTextFields();
    },
    true
  );
  window.addEventListener("load", () => {
    lockTvTextFields();
    const game = api();
    if (document.documentElement.classList.contains("is-tv") && game) {
      game.startGame();
      return;
    }
    window.dispatchEvent(new Event("gtn:ui"));
  });
})();
