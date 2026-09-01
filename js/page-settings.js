(function () {
  const overlay = document.getElementById("settingsOverlay");
  const btn = document.getElementById("settingsBtn");
  const closeBtn = document.getElementById("settingsClose");
  if (!overlay || !btn) return;

  function isOpen() {
    return !overlay.classList.contains("is-hidden");
  }

  function openSettings() {
    overlay.classList.remove("is-hidden");
    btn.setAttribute("aria-expanded", "true");
    requestAnimationFrame(() => {
      const first =
        overlay.querySelector("[data-lang]") || closeBtn;
      first?.focus();
    });
  }

  function closeSettings() {
    overlay.classList.add("is-hidden");
    btn.setAttribute("aria-expanded", "false");
    btn.focus();
  }

  btn.addEventListener("click", () => {
    if (isOpen()) closeSettings();
    else openSettings();
  });

  closeBtn?.addEventListener("click", closeSettings);

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) closeSettings();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen()) {
      event.preventDefault();
      closeSettings();
    }
  });

  window.I18n?.bindLangButtons();
})();
