document.querySelectorAll("[data-lang]").forEach((btn) => {
  btn.addEventListener("click", () => {
    window.I18n.setLocale(btn.dataset.lang);
    window.I18n.apply();
  });
});

if (window.I18n) window.I18n.apply();
