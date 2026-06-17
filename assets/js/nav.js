/* Menu mobile : ouverture/fermeture accessible du header persistant. */

export function initNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-main-nav]");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    nav.setAttribute("data-open", String(open));
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => {
    const open = nav.getAttribute("data-open") === "true";
    setOpen(!open);
  });

  // Ferme au clic sur un lien (navigation mobile) et à la touche Échap.
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}
