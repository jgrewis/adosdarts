/* Intro « entrée dans la jungle » : overlay SVG animé, joué une seule fois par
   session. Décoratif et progressif — si le JS ne tourne pas, la page s'affiche
   normalement. Respecte prefers-reduced-motion (aucun overlay dans ce cas). */

const SEEN_KEY = "adodart-intro-seen";
const AUTO_MS = 3000; // durée avant disparition automatique (~3 s)
const FADE_MS = 650; // doit couvrir la transition d'opacité (.intro 600ms)

/* Un cluster de feuilles tropicales (décoratif). */
function foliageSvg() {
  const leaf = (x, y, r, scale, fill) =>
    `<g transform="translate(${x} ${y}) rotate(${r}) scale(${scale})">
       <path d="M0 0 C44 -34 120 -22 164 44 C120 78 44 66 0 44 Z" fill="${fill}"/>
       <path d="M6 22 C56 8 120 20 164 44" stroke="rgba(0,0,0,.18)" stroke-width="3" fill="none"/>
     </g>`;
  return `
    <svg viewBox="0 0 300 900" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      ${leaf(-30, 70, 12, 1.1, "#0e7a3f")}
      ${leaf(-50, 230, -18, 1.35, "#0a5f31")}
      ${leaf(-20, 430, 6, 1.2, "#138a45")}
      ${leaf(-60, 620, -28, 1.45, "#0a5f31")}
      ${leaf(-30, 800, -6, 1.15, "#157c3e")}
    </svg>`;
}

/* Toucan géométrique et plat (style aplats de couleur), bec orienté à droite :
   corps noir, aile bleue, plastron blanc, contour d'œil jaune/orange, bec jaune
   à liseré rouge. Inspiré de la référence fournie. */
function toucanSvg() {
  return `
    <svg class="intro__toucan" viewBox="0 0 240 220" xmlns="http://www.w3.org/2000/svg"
         role="img" aria-label="Un toucan, mascotte de l'édition jungle">
      <!-- branche -->
      <rect x="62" y="200" width="156" height="11" rx="5" fill="#6b4423"/>
      <!-- queue -->
      <path d="M80 126 L18 108 L76 170 Z" fill="#141414"/>
      <!-- corps -->
      <ellipse cx="124" cy="142" rx="64" ry="55" fill="#141414"/>
      <!-- tête -->
      <circle cx="158" cy="92" r="44" fill="#141414"/>
      <!-- aile bleue -->
      <ellipse cx="100" cy="152" rx="37" ry="27" fill="#1e3fd6"
        transform="rotate(-18 100 152)"/>
      <!-- plastron blanc -->
      <ellipse cx="154" cy="148" rx="23" ry="38" fill="#f6f3e7"/>
      <!-- pattes bleues -->
      <path d="M124 192 v16 M142 192 v16" stroke="#1e3fd6" stroke-width="6"
        stroke-linecap="round"/>
      <!-- contour de l'œil : aplat jaune (haut) + orange (bas) -->
      <rect x="148" y="60" width="46" height="50" rx="11" fill="#ff7a18"/>
      <rect x="148" y="60" width="46" height="28" rx="11" fill="#ffd23a"/>
      <!-- bec supérieur -->
      <path d="M182 66 L232 80 L238 92 L188 100 Q178 84 182 66 Z"
        fill="#f5c518" stroke="#141414" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- liseré rouge sous le bec -->
      <path d="M189 99 L237 92" stroke="#e0331f" stroke-width="3" stroke-linecap="round"/>
      <!-- bec inférieur (resserré sous le bec supérieur) -->
      <path d="M190 101 L223 104 L220 113 Q204 112 192 109 Q187 105 190 101 Z"
        fill="#f5c518" stroke="#141414" stroke-width="1.5" stroke-linejoin="round"/>
      <!-- œil -->
      <circle cx="170" cy="85" r="13" fill="#27b9c9"/>
      <circle cx="170" cy="85" r="6.5" fill="#141414"/>
      <circle cx="172" cy="82" r="2.2" fill="#fff"/>
    </svg>`;
}

function sparks(count) {
  let html = "";
  for (let i = 0; i < count; i++) {
    const left = 12 + Math.random() * 76;
    const top = 24 + Math.random() * 56;
    const delay = Math.random() * 1600;
    html += `<span class="intro__spark" style="left:${left}%;top:${top}%;animation-delay:${delay}ms"></span>`;
  }
  return html;
}

export function initIntro({ edition } = {}) {
  if (sessionStorage.getItem(SEEN_KEY)) return;

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) {
    // Aucune animation d'entrée : on note la session et on laisse la page.
    sessionStorage.setItem(SEEN_KEY, "1");
    return;
  }

  const numero = edition?.numero ?? 8;
  const annee = edition?.annee ?? 2026;

  const overlay = document.createElement("div");
  overlay.className = "intro";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", "Animation d'introduction");
  overlay.innerHTML = `
    <button type="button" class="intro__skip" data-intro-skip>Entrer</button>
    <div class="intro__scene" aria-hidden="true">
      <div class="intro__leaves intro__leaves--left">${foliageSvg()}</div>
      <div class="intro__leaves intro__leaves--right">${foliageSvg()}</div>
      ${sparks(7)}
    </div>
    ${toucanSvg()}
    <p class="intro__title">
      <strong>À Dos d'Arts</strong>
      <span>Édition Jungle · ${numero}ᵉ · ${annee}</span>
    </p>
  `;

  document.body.appendChild(overlay);
  document.documentElement.classList.add("intro-lock");

  const previouslyFocused = document.activeElement;
  const skipBtn = overlay.querySelector("[data-intro-skip]");
  skipBtn.focus();

  let done = false;
  let autoTimer;

  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(autoTimer);
    overlay.classList.add("is-leaving");
    document.removeEventListener("keydown", onKey);

    setTimeout(() => {
      overlay.remove();
      document.documentElement.classList.remove("intro-lock");
      sessionStorage.setItem(SEEN_KEY, "1");
      // Rend le focus au document sans piéger l'utilisateur.
      const target = document.querySelector("#main") || document.body;
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
      } else if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus();
      }
    }, FADE_MS);
  };

  function onKey(event) {
    if (event.key === "Escape" || event.key === "Enter") finish();
  }

  skipBtn.addEventListener("click", finish);
  document.addEventListener("keydown", onKey);
  autoTimer = setTimeout(finish, AUTO_MS);
}
