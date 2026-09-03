/* Rendu de la programmation (4 groupes) depuis programmation.json.
   Échappement défensif des données injectées via innerHTML (cf. sanitize.js). */

import { escapeHtml, safeUrl, safeImgSrc } from "./sanitize.js";

/* Les couleurs proviennent du JSON et sont injectées en style ; on les
   restreint à une liste blanche de variables de marque pour écarter toute
   injection d'attribut. Chaque fond est associé à une couleur de texte
   garantissant un contraste WCAG ≥ 4.5:1 (l'encre partout, sauf sur le bleu
   toucan où le blanc passe largement). Le text-shadow n'est conservé que
   pour le texte blanc. */
const COLOR_STYLES = new Map([
  ["var(--brand-teal)", { ink: "var(--brand-ink)", shadow: "none" }],
  ["var(--brand-coral)", { ink: "var(--brand-ink)", shadow: "none" }],
  ["var(--brand-yellow)", { ink: "var(--brand-ink)", shadow: "none" }],
  ["var(--brand-green)", { ink: "var(--brand-ink)", shadow: "none" }],
  ["var(--brand-orange)", { ink: "var(--brand-ink)", shadow: "none" }],
  ["var(--brand-toucan)", { ink: "var(--white)", shadow: null }],
]);
const DEFAULT_COLOR = "var(--brand-teal)";

function bandStyle(couleur) {
  const color = COLOR_STYLES.has(couleur) ? couleur : DEFAULT_COLOR;
  const { ink, shadow } = COLOR_STYLES.get(color);
  return `--band-color: ${color}; --band-ink: ${ink}${shadow ? `; --band-shadow: ${shadow}` : ""}`;
}

/* Page de destination des cartes « teaser » de l'accueil. */
const PROGRAMME_URL = "programmation";

/* Bloc coloré commun aux deux variantes de carte (accueil et programmation) :
   numéro d'ordre, photo éventuelle, nom du groupe. Factorisé ici pour n'avoir
   qu'un seul endroit à faire évoluer.
   Le numéro n'est affiché que pour un ordre ≥ 1 : l'ordre 0 signifie « hors
   numérotation » (Scène ouverte), cf. _note_ordre dans programmation.json. */
function bandVisual(group) {
  const imgSrc = safeImgSrc(group.image);
  const img = imgSrc
    ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(group.nom)}" loading="lazy" />`
    : "";
  const order = Number(group.ordre) > 0
    ? `<span class="band-card__order">${escapeHtml(group.ordre)}</span>`
    : "";

  return `
      <div class="band-card__visual${img ? " band-card__visual--has-img" : ""}">
        ${order}
        ${img}
        <h3 class="band-card__name">${escapeHtml(group.nom)}</h3>
      </div>`;
}

/* Carte complète (page programmation) : bloc coloré + description et liens. */
function bandCard(group) {
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
      <article class="band-card" style="${bandStyle(group.couleur)}">
        ${bandVisual(group)}
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

/* Carte « teaser » (accueil) : uniquement le bloc coloré, rendu entièrement
   cliquable vers la page Au programme. Pas de dépliage, pas de clip embarqué —
   les détails vivent sur la page dédiée. La carte est un <a> : toute sa surface
   est une cible tactile, et le clavier la traverse naturellement. */
function bandTeaser(group) {
  return `
      <a class="band-card band-card--teaser" href="${PROGRAMME_URL}"
        style="${bandStyle(group.couleur)}"
        aria-label="${escapeHtml(group.nom)} — voir le programme">
        ${bandVisual(group)}
      </a>`;
}

/* Bloc « Playlist du festival » — markup statique mutualisé (accueil +
   programmation) pour éviter la duplication. Injecté dans [data-playlist] ;
   les liens (masqués par défaut) sont ensuite renseignés par
   renderPlaylistLinks() depuis les URL du JSON. */
function renderPlaylistBlock() {
  const container = document.querySelector("[data-playlist]");
  if (!container) return;
  container.innerHTML = `
    <div class="cta-band cta-band--alt cta-band--center">
      <div>
        <h2>La playlist du festival</h2>
        <p>Retrouve les artistes de cette édition et ceux de toutes les anciennes dans une playlist à écouter en boucle avant le grand soir.</p>
      </div>
      <div class="cta-band__links">
        <a class="btn btn--sm" id="playlist-spotify" href="#" hidden target="_blank" rel="noopener noreferrer">
          <img src="assets/img/elements/spotify.png" alt="" width="20" height="20" /> Écouter sur Spotify
        </a>
        <a class="btn btn--sm btn--ghost" id="playlist-deezer" href="#" hidden target="_blank" rel="noopener noreferrer">
          <img src="assets/img/elements/deezer.png" alt="" width="20" height="20" /> Écouter sur Deezer
        </a>
      </div>
    </div>`;
}

function renderPlaylistLinks(playlist) {
  const spotify = document.getElementById("playlist-spotify");
  const deezer = document.getElementById("playlist-deezer");
  const spotifyUrl = safeUrl(playlist && playlist.spotify);
  const deezerUrl = safeUrl(playlist && playlist.deezer);
  if (spotify && spotifyUrl) {
    spotify.href = spotifyUrl;
    spotify.hidden = false;
  }
  if (deezer && deezerUrl) {
    deezer.href = deezerUrl;
    deezer.hidden = false;
  }
}

export function initProgramme({ teaser = false } = {}) {
  const container = document.querySelector("[data-programme]");
  if (!container) return;

  renderPlaylistBlock();

  fetch("assets/data/programmation.json")
    .then((r) => r.json())
    .then((data) => {
      const groups = [...(data.groupes || [])].sort((a, b) => a.ordre - b.ordre);
      const render = teaser ? bandTeaser : bandCard;
      container.innerHTML = groups.map(render).join("");
      renderPlaylistLinks(data.playlist);
    })
    .catch(() => {
      container.innerHTML =
        '<p>La programmation n\'a pas pu être chargée. Rechargez la page ou retrouvez-la sur nos réseaux.</p>';
    });
}
