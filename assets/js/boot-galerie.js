/* Bootstrap de la page galerie. Externalisé pour permettre une CSP sans
   'unsafe-inline' sur script-src. */
import { renderLayout } from "./layout.js";
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";
import { initGalerie } from "./galerie.js";

renderLayout();
initNav();
initCookieBanner();

/* Pas de limite : cette page montre toutes les photos. */
initGalerie();
