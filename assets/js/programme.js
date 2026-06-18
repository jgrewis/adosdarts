/* Rendu de la programmation (4 groupes) depuis programmation.json.
   Échappement défensif des données injectées via innerHTML. */

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

/* N'autorise que des URL http(s) pour les liens externes (clip / écoute). */
function safeUrl(url) {
  const value = String(url || "").trim();
  return /^https?:\/\//i.test(value) ? value : null;
}

/* Source d'image : on n'accepte qu'un chemin relatif same-origin (assets
   locaux). Tout schéma (javascript:, data:, http:, //…) est écarté. */
function safeImgSrc(src) {
  const value = String(src || "").trim();
  if (!value) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null; // schéma explicite refusé
  if (value.startsWith("//") || value.startsWith("/")) return null; // protocole-relatif / absolu
  return value;
}

/* Les couleurs proviennent du JSON et sont injectées en style ; on les
   restreint à une liste blanche de variables de marque pour écarter toute
   injection d'attribut. */
const ALLOWED_COLORS = new Set([
  "var(--brand-teal)",
  "var(--brand-coral)",
  "var(--brand-yellow)",
  "var(--brand-green)",
  "var(--brand-toucan)",
  "var(--brand-orange)",
]);

function bandCard(group) {
  const color = ALLOWED_COLORS.has(group.couleur) ? group.couleur : "var(--brand-teal)";
  const imgSrc = safeImgSrc(group.image);
  const img = imgSrc
    ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(group.nom)}" loading="lazy" />`
    : "";

  const youtube = safeUrl(group.youtube);
  const ecoute = safeUrl(group.ecoute);
  const links = [];
  if (youtube)
    links.push(
      `<a class="btn btn--sm" href="${escapeHtml(youtube)}" target="_blank" rel="noopener noreferrer">▶ Clip</a>`
    );
  if (ecoute)
    links.push(
      `<a class="btn btn--sm btn--ghost" href="${escapeHtml(ecoute)}" target="_blank" rel="noopener noreferrer">♪ Écouter</a>`
    );

  return `
    <article class="band-card" style="--band-color: ${color}">
      <div class="band-card__visual${img ? " band-card__visual--has-img" : ""}">
        <span class="band-card__order">${escapeHtml(group.ordre)}</span>
        ${img}
        <h3 class="band-card__name">${escapeHtml(group.nom)}</h3>
      </div>
      <div class="band-card__body">
        <p class="band-card__meta">
          <span class="badge">${escapeHtml(group.scene)}</span>
          <span class="badge">${escapeHtml(group.style)}</span>
        </p>
        <p>${escapeHtml(group.description)}</p>
        ${links.length ? `<div class="band-card__links">${links.join("")}</div>` : ""}
      </div>
    </article>`;
}

export function initProgramme() {
  const container = document.querySelector("[data-programme]");
  if (!container) return;

  fetch("assets/data/programmation.json")
    .then((r) => r.json())
    .then((data) => {
      const groups = [...(data.groupes || [])].sort((a, b) => a.ordre - b.ordre);
      container.innerHTML = groups.map(bandCard).join("");
    })
    .catch(() => {
      container.innerHTML =
        '<p>La programmation complète arrive très bientôt. Suivez-nous sur les réseaux !</p>';
    });
}
