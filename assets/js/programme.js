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

/* Extrait l'identifiant d'une vidéo YouTube (watch?v=, youtu.be/, /embed/,
   /shorts/) pour permettre une intégration directe (lecteur youtube-nocookie).
   Retourne null si le format n'est pas reconnu — un lien externe est alors
   utilisé en repli. */
function extractYouTubeId(url) {
  const safe = safeUrl(url);
  if (!safe) return null;
  try {
    const u = new URL(safe);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    if (host === "youtu.be") return u.pathname.slice(1).split("/")[0] || null;
    if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const match = u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/);
      if (match) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

function bandCard(group, { teaser = false } = {}) {
  const imgSrc = safeImgSrc(group.image);
  const img = imgSrc
    ? `<img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(group.nom)}" loading="lazy" />`
    : "";

  const youtube = safeUrl(group.youtube);
  const ecoute = safeUrl(group.ecoute);

  if (!teaser) {
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

  /* Variante « teaser » (accueil) : seule la partie colorée (nom) est
     visible par défaut ; les détails se déroulent au survol/focus/tap, avec
     un délai de fermeture géré par wireTeaserCards(). La vidéo YouTube n'est
     jamais chargée d'office (RGPD) : une façade « click-to-play » ne monte
     l'iframe qu'au clic explicite du visiteur. */
  const videoId = teaser ? extractYouTubeId(youtube) : null;
  const fallbackClip =
    youtube && !videoId
      ? `<a class="btn btn--sm band-card__visual-link" href="${escapeHtml(youtube)}" target="_blank" rel="noopener noreferrer">▶ Clip</a>`
      : "";
  const media = videoId
    ? `<div class="band-card__media" data-video-id="${encodeURIComponent(videoId)}" data-video-title="Clip vidéo — ${escapeHtml(group.nom)}">
        <button class="band-card__media-play" type="button">▶ Lire le clip
          <span class="band-card__media-note">Vidéo chargée depuis YouTube au clic</span>
        </button>
      </div>`
    : "";
  const ecouteLink = ecoute
    ? `<div class="band-card__links"><a class="btn btn--sm btn--ghost" href="${escapeHtml(ecoute)}" target="_blank" rel="noopener noreferrer">♪ Écouter</a></div>`
    : "";

  return `
    <article class="band-card band-card--teaser" style="${bandStyle(group.couleur)}">
      <div class="band-card__visual${img ? " band-card__visual--has-img" : ""}" role="button"
        tabindex="0" aria-expanded="false">
        <span class="band-card__order">${escapeHtml(group.ordre)}</span>
        ${img}
        <h3 class="band-card__name">${escapeHtml(group.nom)}</h3>
        ${fallbackClip}
        <span class="band-card__chevron" aria-hidden="true">▾</span>
      </div>
      <div class="band-card__details">
        <div class="band-card__body">
          <p class="band-card__meta">
            <span class="badge">${escapeHtml(group.scene)}</span>
            <span class="badge">${escapeHtml(group.style)}</span>
          </p>
          <p>${escapeHtml(group.description)}</p>
          ${media}
          ${ecouteLink}
        </div>
      </div>
    </article>`;
}

/* Monte l'iframe YouTube (nocookie) dans la façade, au clic uniquement. */
function mountVideo(media) {
  if (!media || media.querySelector("iframe")) return;
  const id = decodeURIComponent(media.dataset.videoId || "");
  if (!id) return;
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1`;
  iframe.title = media.dataset.videoTitle || "Clip vidéo";
  iframe.setAttribute(
    "allow",
    "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  );
  iframe.setAttribute("allowfullscreen", "");
  iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
  media.querySelector(".band-card__media-play").hidden = true;
  media.appendChild(iframe);
}

/* Démonte l'iframe (coupe la lecture) et réaffiche la façade. */
function unmountVideo(media) {
  if (!media) return;
  const iframe = media.querySelector("iframe");
  if (iframe) iframe.remove();
  const play = media.querySelector(".band-card__media-play");
  if (play) play.hidden = false;
}

/* Ouverture au survol/focus, fermeture différée de 0,5s à la souris (pour ne
   pas refermer sur un simple passage), bascule immédiate au tap/clavier.
   Une seule carte ouverte à la fois ; Échap referme et rend le focus. */
function wireTeaserCards(container) {
  const CLOSE_DELAY = 500;
  const cards = [...container.querySelectorAll(".band-card--teaser")];
  const controllers = [];

  cards.forEach((card) => {
    const visual = card.querySelector(".band-card__visual");
    const media = card.querySelector(".band-card__media");
    let closeTimer = null;

    const close = () => {
      card.classList.remove("is-expanded");
      visual.setAttribute("aria-expanded", "false");
      unmountVideo(media);
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = null;
    };
    const open = () => {
      controllers.forEach((c) => {
        if (c.card !== card) c.close();
      });
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      card.classList.add("is-expanded");
      visual.setAttribute("aria-expanded", "true");
    };
    const scheduleClose = () => {
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(close, CLOSE_DELAY);
    };
    controllers.push({ card, close });

    card.addEventListener("mouseenter", open);
    card.addEventListener("mouseleave", scheduleClose);
    card.addEventListener("focusin", open);
    card.addEventListener("focusout", scheduleClose);
    visual.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      if (card.classList.contains("is-expanded")) close();
      else open();
    });
    visual.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (card.classList.contains("is-expanded")) close();
        else open();
      }
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && card.classList.contains("is-expanded")) {
        close();
        visual.focus();
      }
    });
    if (media) {
      media.querySelector(".band-card__media-play").addEventListener("click", () => {
        mountVideo(media);
      });
    }
  });
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
        <p>Retrouve tous les artistes de cette édition dans une playlist à écouter en boucle avant le grand soir.</p>
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
      container.innerHTML = groups.map((g) => bandCard(g, { teaser })).join("");
      renderPlaylistLinks(data.playlist);
      if (teaser) wireTeaserCards(container);
    })
    .catch(() => {
      container.innerHTML =
        '<p>La programmation complète arrive très bientôt. Suivez-nous sur les réseaux !</p>';
    });
}
