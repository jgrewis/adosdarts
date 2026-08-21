/* Bootstrap de la page d'administration. Externalisé pour permettre une CSP
   sans 'unsafe-inline' sur script-src.

   Ni renderLayout() ni initCookieBanner() ici : l'administration n'est pas une
   page du site public. Elle n'a pas le menu de navigation (qui n'aurait aucun
   sens une fois connecté), et la bannière de consentement ne s'applique pas —
   les seuls cookies posés sont strictement nécessaires au service demandé
   (session et identification de l'auteur). */
import { initAdmin } from "./admin.js";

initAdmin();
