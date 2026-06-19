/* Bootstrap de la page d'accueil. Externalisé pour permettre une CSP
   sans 'unsafe-inline' sur script-src. */
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";
import { initLoader } from "./loader.js";
import { startCountdown } from "./countdown.js";
import { initProgramme } from "./programme.js";
import { renderPartenaires } from "./partenaires.js";
import { initGamePoubelle } from "./game-poubelle.js";

initNav();
initCookieBanner();
initLoader();
initProgramme();
initGamePoubelle(document.querySelector("[data-jeu-poubelle]"));

fetch("assets/data/edition.json")
  .then((r) => r.json())
  .then((edition) => {
    startCountdown(document.querySelector("[data-countdown]"), edition.ouverture_iso);
    renderPartenaires(document.querySelector("[data-partenaires]"), edition);
    const dateEl = document.querySelector("[data-date]");
    if (dateEl && edition.date_label) dateEl.textContent = edition.date_label.replace("Samedi ", "");
  })
  .catch(() => {});
