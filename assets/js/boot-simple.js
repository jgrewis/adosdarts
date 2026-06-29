/* Bootstrap des pages statiques (infos, principe). Externalisé pour permettre
   une CSP sans 'unsafe-inline' sur script-src. */
import { renderLayout } from "./layout.js";
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";

renderLayout();
initNav();
initCookieBanner();
