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

  function visibleFocusables() {
    const game = api();
    const running = game && game.getState().running;
    const paused = game && game.getState().paused;
    if (running && paused) {
      return [
        document.getElementById("settingsBtn"),
        document.getElementById("pauseBtn"),
        document.getElementById("playBtn"),
      ].filter(Boolean);
    }
    if (running) {
      const enabled = noteButtons().filter((btn) => !btn.disabled);
      return enabled.length ? enabled : noteButtons();
    }

    if (game && game.settingsAreOpen()) {
      return [
        ...document.querySelectorAll("[data-lang]"),
        ...document.querySelectorAll("[data-clef]"),
        ...document.querySelectorAll("[data-shape]"),
        document.getElementById("difficulty"),
        ...document.querySelectorAll("[data-answer-mode]"),
        ...document.querySelectorAll("[data-choice-kind]"),
        document.getElementById("choiceCount"),
        document.getElementById("rounds"),
        document.getElementById("tempo"),
        document.getElementById("soundBtn"),
        document.getElementById("settingsClose"),
      ].filter((el) => el && !el.closest(".is-hidden"));
    }

    if (game && game.showingResults()) {
      return [document.getElementById("playAgainBtn")].filter(Boolean);
    }

    const items = [
      document.getElementById("settingsBtn"),
      document.getElementById("playBtn"),
    ];
    return items.filter(Boolean);
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

  function currentIndex(items) {
    const active = document.activeElement;
    const index = items.indexOf(active);
    return index >= 0 ? index : 0;
  }

  function moveFocus(dx, dy) {
    const items = visibleFocusables();
    if (!items.length) return;

    const active = document.activeElement;
    if (dy !== 0) {
      const rows = [];
      items.forEach((el) => {
        const top = Math.round(el.getBoundingClientRect().top / 24);
        let row = rows.find((entry) => entry.top === top);
        if (!row) {
          row = { top, els: [] };
          rows.push(row);
        }
        row.els.push(el);
      });
      rows.sort((a, b) => a.top - b.top);
      const rowIndex = rows.findIndex((row) => row.els.includes(active));
      const from = rowIndex >= 0 ? rowIndex : 0;
      const target = rows[Math.max(0, Math.min(rows.length - 1, from + dy))];
      const col = rowIndex >= 0 ? rows[from].els.indexOf(active) : 0;
      focusEl(target.els[Math.min(col, target.els.length - 1)]);
      return;
    }

    const index = currentIndex(items);
    const next = (index + dx + items.length) % items.length;
    focusEl(items[next]);
  }

  function activate() {
    const el = document.activeElement;
    if (el && (el.tagName === "BUTTON" || el.tagName === "INPUT")) {
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
      moveFocus(0, -1);
      return;
    }
    if (key === "ArrowDown" || code === 40) {
      event.preventDefault();
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
    const items = visibleFocusables();
    if (game && game.showingResults()) {
      focusEl(document.getElementById("playAgainBtn"));
      return;
    }
    if (items.includes(document.activeElement)) return;
    const preferred =
      items.find((el) => el.classList.contains("note-btn")) ||
      items.find((el) => el.id === "pauseBtn") ||
      items.find((el) => el.id === "playBtn") ||
      items.find((el) => el.dataset.lang) ||
      items.find((el) => el.id === "settingsBtn") ||
      items[0];
    focusEl(preferred);
  });

  registerTvKeys();
  window.addEventListener("load", () => {
    const game = api();
    if (document.documentElement.classList.contains("is-tv") && game) {
      game.startGame();
      return;
    }
    window.dispatchEvent(new Event("gtn:ui"));
  });
})();
