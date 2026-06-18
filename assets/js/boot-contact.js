/* Bootstrap de la page contact. Externalisé pour permettre une CSP
   sans 'unsafe-inline' sur script-src. */
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";
import { initForms } from "./forms.js";

initNav();
initCookieBanner();
initForms();
