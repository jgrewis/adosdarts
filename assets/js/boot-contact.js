/* Bootstrap de la page contact. Externalisé pour permettre une CSP
   sans 'unsafe-inline' sur script-src. */
import { renderLayout } from "./layout.js";
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";
import { initForms } from "./forms.js";

renderLayout();
initNav();
initCookieBanner();
initForms();
