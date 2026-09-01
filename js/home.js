const SITE_URL = "https://guessthenote.vige.it/";
const SITE_IMAGE = `${SITE_URL}img/social.webp`;
const APP_LANGUAGES = ["en", "it", "es", "pt", "de", "fr", "zh", "ja"];
const APP_NAMES = {
  en: "Guess the Note",
  it: "Indovina la nota",
  es: "Adivina la nota",
  pt: "Adivinha a nota",
  de: "Rate die Note",
  fr: "Devine la note",
  zh: "猜音符",
  ja: "音符当て",
};

function syncHomeJsonLd() {
  const el = document.getElementById("homeJsonLd");
  if (!el || !window.I18n) return;
  const locale = window.I18n.locale;
  const name = APP_NAMES[locale] || APP_NAMES.en;
  const description = window.I18n.t("description");
  const alternates = APP_LANGUAGES.filter((code) => code !== locale).map(
    (code) => APP_NAMES[code]
  );
  el.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}#website`,
        url: SITE_URL,
        name,
        alternateName: alternates,
        description,
        inLanguage: APP_LANGUAGES,
        publisher: { "@id": `${SITE_URL}#app` },
      },
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}#app`,
        name,
        alternateName: APP_NAMES.en,
        url: SITE_URL,
        description,
        applicationCategory: "EducationalApplication",
        applicationSubCategory: "Music",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        inLanguage: APP_LANGUAGES,
        image: SITE_IMAGE,
        screenshot: SITE_IMAGE,
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
        featureList: [
          window.I18n.t("homeFeatureClefTitle"),
          window.I18n.t("homeFeatureGradeTitle"),
          window.I18n.t("homeFeatureTvTitle"),
        ],
        license: "https://www.apache.org/licenses/LICENSE-2.0.html",
        sameAs: ["https://github.com/flashboss/guess_the_note"],
      },
    ],
  });
}

window.addEventListener("gtn:i18n", syncHomeJsonLd);

if (window.I18n) window.I18n.apply();
syncHomeJsonLd();
