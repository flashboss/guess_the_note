(function () {
  const isTizen = typeof window.tizen !== "undefined";
  const forceTv = new URLSearchParams(location.search).has("tv");
  if (isTizen || forceTv || /Tizen|SMART-TV|SmartTV/i.test(navigator.userAgent)) {
    document.documentElement.classList.add("is-tv");
  }

  function api() {
    return window.GuessTheNote;
  }

  function visibleFocusables() {
    const overlay = document.getElementById("startOverlay");
    const overlayOpen = overlay && !overlay.classList.contains("is-hidden");
    if (overlayOpen) {
      return [document.getElementById("startBtn")].filter(Boolean);
    }

    const items = [
      ...document.querySelectorAll("[data-clef]"),
      document.getElementById("tempo"),
      document.getElementById("playBtn"),
    ];

    const game = api();
    const running = game && game.getState().running;
    if (running) {
      document.querySelectorAll(".note-btn:not(:disabled)").forEach((btn) => {
        items.push(btn);
      });
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
    if (active && active.id === "tempo" && dx !== 0) {
      const step = Number(active.step) || 0.5;
      const next = Number(active.value) + dx * step;
      active.value = String(
        Math.min(Number(active.max), Math.max(Number(active.min), next))
      );
      active.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }

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
    const preferred =
      items.find((el) => el.classList.contains("note-btn")) ||
      items.find((el) => el.id === "startBtn") ||
      items[0];
    focusEl(preferred);
  });

  registerTvKeys();
  window.addEventListener("load", () => {
    window.dispatchEvent(new Event("gtn:ui"));
  });
})();
