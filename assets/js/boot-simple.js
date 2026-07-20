/* Bootstrap des pages statiques (infos, principe). Externalisé pour permettre
   une CSP sans 'unsafe-inline' sur script-src. */
import { renderLayout } from "./layout.js";
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";
import { initGamePoubelle } from "./game-poubelle.js";

renderLayout();
initNav();
initCookieBanner();
/* Mini-jeu de tri, présent uniquement sur Infos pratiques : initGamePoubelle
   ne fait rien si le conteneur est absent (cas de principe.html). */
initGamePoubelle(document.querySelector("[data-jeu-poubelle]"));
