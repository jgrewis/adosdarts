/* Section « Memories » — l'arrivée de l'affiche de l'édition qui vient d'avoir
   lieu, et le compteur d'éditions qui passe de 7 à 8.

   Sens de l'amélioration progressive (PLAN-apres-festival-2026.md §3.3) :
   le HTML servi porte l'état FINAL et vrai — huit affiches, « 8 éditions de
   souvenirs ». Ce module recule l'affichage d'un cran (compteur à 7, dernière
   affiche masquée) juste avant de l'animer. Conséquence voulue : sans
   JavaScript, en cas d'erreur de script, en mouvement réduit ou pour un moteur
   de recherche, la page annonce d'emblée le bon chiffre et le mur complet.
   Jamais l'inverse. */

const AVANT = 7;

/* Le mouvement est refusé : on ne met rien en scène, l'état final du HTML est
   déjà le bon. Testé une seule fois, au démarrage — un visiteur qui change ce
   réglage en cours de route rechargera la page. */
function mouvementRefuse() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* Remplace le chiffre par un rouleau à deux crans. Le rouleau est décoratif
   (aria-hidden) et doublé d'un texte pour lecteur d'écran, sinon le titre se
   lirait « 78 éditions de souvenirs ». */
function monteCompteur(tally) {
  const valeur = tally.textContent.trim();
  tally.textContent = "";
  tally.classList.add("tally--anime");
  tally.insertAdjacentHTML(
    "beforeend",
    `<span class="tally__piste" aria-hidden="true">
       <span class="tally__chiffre">${AVANT}</span>
       <span class="tally__chiffre">${valeur}</span>
     </span>
     <span class="visually-hidden">${valeur}</span>`
  );
}

/* Une image encore en cours de chargement se révélerait vide : on attend son
   arrivée. Mais JAMAIS indéfiniment — l'affiche est masquée pendant l'attente,
   une promesse qui ne se résout pas la laisserait invisible pour de bon.
   D'où la course contre une échéance courte : au pire, on révèle une image
   encore en train de peindre, ce qui reste infiniment préférable à un trou
   dans le mur.

   (img.decode() a été écarté : sur un onglet en arrière-plan, il peut rester
   en attente sans jamais aboutir. Les événements load/error, eux, sont sûrs.) */
const ATTENTE_MAX = 600;

function imagePrete(figure) {
  const img = figure.querySelector("img");
  if (!img || img.complete) return Promise.resolve();
  return Promise.race([
    new Promise((resoudre) => {
      img.addEventListener("load", resoudre, { once: true });
      img.addEventListener("error", resoudre, { once: true });
    }),
    new Promise((resoudre) => window.setTimeout(resoudre, ATTENTE_MAX)),
  ]);
}

export function initMemories() {
  const section = document.querySelector("[data-memories]");
  if (!section) return;

  const tally = section.querySelector("[data-tally]");
  const affiche = section.querySelector("[data-affiche-nouvelle]");
  if (!tally && !affiche) return;

  if (mouvementRefuse() || !("IntersectionObserver" in window)) return;

  /* Mise en scène : on recule d'un cran. À partir d'ici, l'affichage ment le
     temps de l'animation — d'où le déclenchement garanti plus bas. */
  if (tally) monteCompteur(tally);
  if (affiche) {
    affiche.classList.add("memory--a-reveler");
    /* On sort cette affiche du chargement paresseux dès la mise en scène :
       elle a alors tout le temps du défilement pour arriver, et la révélation
       ne bute pas sur une image encore vide. */
    const img = affiche.querySelector("img");
    if (img) img.loading = "eager";
  }

  let fait = false;
  const reveler = () => {
    if (fait) return;
    fait = true;
    if (tally) tally.classList.add("tally--bascule");
    if (!affiche) return;
    imagePrete(affiche).then(() => affiche.classList.add("memory--revelee"));
  };

  /* Seuil bas et marge basse négative : la révélation se joue quand le mur est
     franchement entré dans l'écran, pas dès que son premier pixel affleure. */
  const observateur = new IntersectionObserver(
    (entrees) => {
      if (entrees.some((e) => e.isIntersecting)) {
        reveler();
        observateur.disconnect();
      }
    },
    { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
  );
  observateur.observe(affiche || section);

  /* Filet de sécurité : si l'observateur ne se déclenche jamais (section déjà
     entièrement visible sur un très grand écran, onglet ouvert en arrière-plan,
     seuil jamais atteint), on révèle quand même. L'affichage ne doit pas rester
     bloqué sur « 7 éditions ». */
  window.setTimeout(reveler, 2500);
}
