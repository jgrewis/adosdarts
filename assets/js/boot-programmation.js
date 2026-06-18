/* Bootstrap de la page programmation. Externalisé pour permettre une CSP
   sans 'unsafe-inline' sur script-src. */
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";
import { initProgramme } from "./programme.js";

initNav();
initCookieBanner();
initProgramme();
