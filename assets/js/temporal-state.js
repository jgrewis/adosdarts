/* État temporel du site (§4.3) : bascule avant / pendant / après selon la
   date du jour et les dates de l'édition. Pilote aussi le compte à rebours. */

/* Échappement HTML défensif : les données proviennent d'edition.json
   (futur CMS headless) et sont injectées via innerHTML. */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

/* N'autorise que des URL relatives/http(s)/mailto pour un CTA injecté,
   afin d'écarter les schémas dangereux type "javascript:". */
function safeUrl(url) {
  const value = String(url || "").trim();
  if (/^(https?:|mailto:|\/|\.\/|\.\.\/|#)/i.test(value)) return value;
  return "#";
}

/**
 * Calcule l'état de l'édition à une date donnée.
 * Un override manuel (champ `statut_override` du CMS) prime sur le calcul.
 * @returns {"avant"|"pendant"|"apres"}
 */
export function computeState(edition, now = new Date()) {
  if (edition.statut_override) return edition.statut_override;

  const start = new Date(edition.date_debut + "T00:00:00");
  const end = new Date(edition.date_fin + "T23:59:59");

  if (now < start) return "avant";
  if (now > end) return "apres";
  return "pendant";
}

const COPY = {
  avant: {
    pill: "J-{days} avant l'ouverture",
    title: "La {numero}ᵉ édition arrive",
    cta: { label: "S'inscrire à un atelier", href: "participer.html" },
  },
  pendant: {
    pill: "C'est maintenant !",
    title: "Le festival a commencé",
    cta: { label: "Voir le programme du jour", href: "programme.html" },
  },
  apres: {
    pill: "Édition terminée",
    title: "Merci, à l'année prochaine",
    cta: { label: "Revivre l'édition", href: "programme.html" },
  },
};

function daysUntil(dateStr, now) {
  const target = new Date(dateStr + "T00:00:00");
  const ms = target - now;
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/** Remplit le bandeau d'état et le CTA contextuel de l'accueil. */
export function renderTemporalBanner(edition, container, now = new Date()) {
  const state = computeState(edition, now);
  const copy = COPY[state];
  const days = daysUntil(edition.date_debut, now);

  const pill = copy.pill
    .replace("{days}", days)
    .replace("{numero}", edition.numero);
  const title = copy.title.replace("{numero}", edition.numero);

  container.innerHTML = `
    <span class="status-pill">${escapeHtml(pill)}</span>
    <h2 class="section__title">${escapeHtml(title)}</h2>
    <div data-countdown></div>
    <a class="btn btn--primary" href="${escapeHtml(safeUrl(copy.cta.href))}">${escapeHtml(copy.cta.label)}</a>
  `;

  if (state === "avant") {
    startCountdown(container.querySelector("[data-countdown]"), edition.date_debut);
  } else {
    container.querySelector("[data-countdown]").remove();
  }

  return state;
}

/** Compte à rebours accessible jusqu'à la date d'ouverture. */
function startCountdown(el, dateStr) {
  if (!el) return;
  const target = new Date(dateStr + "T00:00:00").getTime();

  const units = [
    { key: "jours", div: 86_400_000 },
    { key: "heures", div: 3_600_000, mod: 24 },
    { key: "min", div: 60_000, mod: 60 },
  ];

  const render = () => {
    const diff = Math.max(0, target - Date.now());
    el.className = "countdown";
    el.setAttribute("role", "timer");
    el.setAttribute("aria-label", "Compte à rebours avant l'ouverture du festival");
    el.innerHTML = units
      .map(({ key, div, mod }) => {
        let value = Math.floor(diff / div);
        if (mod) value %= mod;
        return `
          <div class="countdown__unit">
            <span class="countdown__value">${String(value).padStart(2, "0")}</span>
            <span class="countdown__label">${key}</span>
          </div>`;
      })
      .join("");
  };

  render();
  // Mise à jour à la minute (suffisant et sobre).
  setInterval(render, 60_000);
}
