/* Bootstrap de la page du jeu « Compose ta mélodie ». Externalisé pour
   permettre une CSP sans 'unsafe-inline' sur script-src. */
import { renderLayout } from "./layout.js";
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";

renderLayout();
initNav();
initCookieBanner();

// L'init du jeu (écran d'accueil, déblocage audio, instrument…) arrive à
// l'étape 1 du plan de développement.
