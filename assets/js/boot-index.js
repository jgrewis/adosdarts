/* Bootstrap de la page d'accueil. Externalisé pour permettre une CSP
   sans 'unsafe-inline' sur script-src. */
import { renderLayout } from "./layout.js";
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";
import { initLoader } from "./loader.js";
import { initProgramme } from "./programme.js";
import { renderPartenaires } from "./partenaires.js";
import { initGalerie } from "./galerie.js";
import { initMemories } from "./memories.js";

renderLayout();
initNav();
initCookieBanner();
initLoader();

/* Plus de bloc "cartes groupes" sur l'accueil depuis le retrait du teaser
   programmation (contenu redondant avec la page dédiée) : seule la Playlist,
   mutualisée avec programmation.html, est encore rendue ici. */
initProgramme();

/* Galerie « En images » : les 8 dernières photos, et le lien vers la galerie
   complète seulement s'il y en a davantage. */
initGalerie({ limite: 8, lienComplet: "[data-lien-galerie]" });

/* Arrivée de l'affiche 2026 dans le mur + compteur d'éditions 7 → 8. */
initMemories();

fetch("assets/data/edition.json")
  .then((r) => r.json())
  .then((edition) => {
    renderPartenaires(document.querySelector("[data-partenaires]"), edition);
    const dateEl = document.querySelector("[data-date]");
    if (dateEl && edition.date_label) dateEl.textContent = edition.date_label;
  })
  .catch(() => {});
