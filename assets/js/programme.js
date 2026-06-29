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
  const color = ALLOWED_COLORS.has(group.couleur) ? group.couleur : "var(--brand-teal)";
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

  /* Variante « teaser » (accueil) : seule la partie colorée (nom) est
     visible par défaut ; les détails se déroulent au survol/focus, avec un
     délai de fermeture géré par wireTeaserCards(). La vidéo YouTube n'est
     montée (data-src -> src) qu'à la première ouverture. */
  const videoId = teaser ? extractYouTubeId(youtube) : null;
  const fallbackClip =
    youtube && !videoId
      ? `<a class="btn btn--sm band-card__visual-link" href="${escapeHtml(youtube)}" target="_blank" rel="noopener noreferrer">▶ Clip</a>`
      : "";
  const media = videoId
    ? `<div class="band-card__media"><iframe data-src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}" title="Clip vidéo — ${escapeHtml(group.nom)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>`
    : "";
  const ecouteLink = ecoute
    ? `<div class="band-card__links"><a class="btn btn--sm btn--ghost" href="${escapeHtml(ecoute)}" target="_blank" rel="noopener noreferrer">♪ Écouter</a></div>`
    : "";

  return `
    <article class="band-card band-card--teaser" style="--band-color: ${color}">
      <div class="band-card__visual${img ? " band-card__visual--has-img" : ""}" tabindex="0">
        <span class="band-card__order">${escapeHtml(group.ordre)}</span>
        ${img}
        <h3 class="band-card__name">${escapeHtml(group.nom)}</h3>
        ${fallbackClip}
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

/* Ouverture au survol/focus, fermeture différée de 2s (pour ne pas refermer
   sur un simple passage de souris), bascule au tap sur mobile (pas de hover).
   L'iframe vidéo est démontée à la fermeture pour couper la lecture. */
function wireTeaserCards(container) {
  const CLOSE_DELAY = 2000;
  container.querySelectorAll(".band-card--teaser").forEach((card) => {
    const visual = card.querySelector(".band-card__visual");
    const media = card.querySelector(".band-card__media iframe");
    let closeTimer = null;

    const open = () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
      card.classList.add("is-expanded");
      if (media && !media.src && media.dataset.src) media.src = media.dataset.src;
    };
    const close = () => {
      card.classList.remove("is-expanded");
      if (media) media.removeAttribute("src");
      closeTimer = null;
    };
    const scheduleClose = () => {
      if (closeTimer) clearTimeout(closeTimer);
      closeTimer = setTimeout(close, CLOSE_DELAY);
    };

    card.addEventListener("mouseenter", open);
    card.addEventListener("mouseleave", scheduleClose);
    card.addEventListener("focusin", open);
    card.addEventListener("focusout", scheduleClose);
    visual.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      if (card.classList.contains("is-expanded")) scheduleClose();
      else open();
    });
  });
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
