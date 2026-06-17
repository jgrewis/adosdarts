/* Bannière de consentement (§15) : refus aussi simple que l'acceptation,
   choix mémorisé, aucun script tiers chargé avant accord. */

const CONSENT_KEY = "adodart-consent";

export function initCookieBanner() {
  const banner = document.querySelector("[data-cookie-banner]");
  if (!banner) return;

  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored === "accepted" || stored === "refused") {
    banner.hidden = true;
    if (stored === "accepted") loadAnalytics();
    return;
  }

  banner.hidden = false;

  const decide = (choice) => {
    localStorage.setItem(CONSENT_KEY, choice);
    banner.hidden = true;
    if (choice === "accepted") loadAnalytics();
  };

  banner.querySelector("[data-cookie-accept]")?.addEventListener("click", () => decide("accepted"));
  banner.querySelector("[data-cookie-refuse]")?.addEventListener("click", () => decide("refused"));
}

/* Emplacement du chargement différé d'une mesure d'audience respectueuse
   du RGPD (Plausible/Matomo, §11). Désactivé dans l'ébauche. */
function loadAnalytics() {
  // Production : injecter ici le script d'analytics, après consentement.
}
