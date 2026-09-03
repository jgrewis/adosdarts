/* Contour lumineux qui suit le pointeur sur la carte « Merci à tous » de
   l'accueil (assets/css/pages.css, règles .merci::after / .merci--glow).
   Pur CSS + ce fichier : pas de dépendance, cohérent avec le reste du site.

   Ce module ne gère que le cas souris : pas de pointeur à suivre au tactile,
   donc rien à faire ici — la version tactile (contour qui tourne tout seul)
   est un pur relais CSS, `@media (hover: none)` dans pages.css, indépendant
   de ce fichier.

   Décoratif uniquement : n'affecte ni le contenu, ni la navigation clavier.
   En mouvement réduit, la carte reste dans son état normal (bordure + ombre
   déjà posées en CSS) — rien ne manque. */

export function initMerciGlow() {
  const carte = document.querySelector(".merci");
  if (!carte) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  carte.addEventListener("pointermove", (e) => {
    const rect = carte.getBoundingClientRect();
    carte.style.setProperty("--glow-x", `${e.clientX - rect.left}px`);
    carte.style.setProperty("--glow-y", `${e.clientY - rect.top}px`);
  });

  carte.addEventListener("pointerenter", () => carte.classList.add("merci--glow"));
  carte.addEventListener("pointerleave", () => carte.classList.remove("merci--glow"));
}
