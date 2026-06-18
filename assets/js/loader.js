/* Animation de chargement « entrée dans la jungle ».
   - Injectée dans le DOM (progressive enhancement : sans JS, la page s'affiche
     normalement, aucun overlay).
   - Jouée une seule fois par session (sessionStorage).
   - Désactivée sous prefers-reduced-motion (retour anticipé).
   - Bouton « Entrer » et touche Échap pour passer. Sans son.
   Les visuels sont les SVG fournis par le client (toucan + feuilles). */

const SEEN_KEY = "adodart-loader-seen";
const AUTO_MS = 2600;

export function initLoader() {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;
  if (sessionStorage.getItem(SEEN_KEY)) return;

  const loader = document.createElement("div");
  loader.className = "loader";
  loader.setAttribute("role", "dialog");
  loader.setAttribute("aria-label", "Animation d'accueil du festival");
  loader.innerHTML = `
    <div class="loader__stage">
      <img class="loader__leaf loader__leaf--left" src="assets/img/elements/feuille-2-0.svg" alt="" />
      <img class="loader__leaf loader__leaf--right" src="assets/img/elements/feuille-1-0.svg" alt="" />
      <img class="loader__toucan" src="assets/img/elements/toucan.svg" alt="" />
      <span class="loader__title">À Dos d'Arts #8</span>
    </div>
    <button class="btn btn--sm btn--on-dark loader__skip" type="button" data-loader-skip>Entrer</button>
  `;

  document.body.appendChild(loader);
  document.body.style.overflow = "hidden";

  let done = false;
  const dismiss = () => {
    if (done) return;
    done = true;
    sessionStorage.setItem(SEEN_KEY, "1");
    loader.setAttribute("data-hide", "true");
    document.body.style.overflow = "";
    window.removeEventListener("keydown", onKey);
    setTimeout(() => loader.remove(), 520);
  };

  const onKey = (e) => {
    if (e.key === "Escape" || e.key === "Enter") dismiss();
  };

  loader.querySelector("[data-loader-skip]").addEventListener("click", dismiss);
  window.addEventListener("keydown", onKey);
  loader.querySelector("[data-loader-skip]").focus();

  setTimeout(dismiss, AUTO_MS);
}
