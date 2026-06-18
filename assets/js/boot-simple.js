/* Bootstrap des pages statiques (infos, principe). Externalisé pour permettre
   une CSP sans 'unsafe-inline' sur script-src. */
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";

initNav();
initCookieBanner();
