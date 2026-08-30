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
    if (running) {
      const enabled = noteButtons().filter((btn) => !btn.disabled);
      return enabled.length ? enabled : noteButtons();
    }

    const overlay = document.getElementById("startOverlay");
    const overlayOpen = overlay && !overlay.classList.contains("is-hidden");
    const items = [
      ...document.querySelectorAll("[data-lang]"),
      ...document.querySelectorAll("[data-clef]"),
      document.getElementById("tempoDown"),
      document.getElementById("tempoUp"),
      document.getElementById("playBtn"),
    ];
    if (overlayOpen) {
      const replay = document.getElementById("replayBtn");
      const start = document.getElementById("startBtn");
      if (replay && !replay.closest(".overlay-panel.is-hidden")) items.push(replay);
      else items.push(start);
    }
    return items.filter(Boolean);
  }

  function focusEl(el) {
    if (!el) return;
    el.focus();
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
    const key = event.key;
    const code = event.keyCode;

    if (key === "ArrowLeft" || code === 37) {
      event.preventDefault();
      moveFocus(-1, 0);
      return;
    }
    if (key === "ArrowRight" || code === 39) {
      event.preventDefault();
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
      if (game && game.getState().running) game.stopGame();
      else if (game && game.showingResults()) game.stopGame();
      else exitApp();
      return;
    }
    if (code === 10252 || code === 415 || key === "MediaPlayPause" || key === "MediaPlay") {
      event.preventDefault();
      api()?.toggleGame();
      return;
    }
    if (code === 19 || code === 413 || key === "MediaPause" || key === "MediaStop") {
      event.preventDefault();
      api()?.stopGame();
    }
  });

  window.addEventListener("gtn:ui", () => {
    const items = visibleFocusables();
    if (items.includes(document.activeElement)) return;
    const preferred =
      items.find((el) => el.classList.contains("note-btn")) ||
      items.find((el) => el.id === "replayBtn") ||
      items.find((el) => el.id === "startBtn") ||
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
