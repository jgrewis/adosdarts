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

/* Déclenche `action` la première fois que `cible` est réellement à l'écran.
   Un seul tir, puis l'observateur se débranche.

   Pas de minuteur de secours ici, volontairement : un déclenchement à retardement
   jouerait l'animation alors que la zone n'a jamais été vue, et le visiteur
   n'en découvrirait que le résultat. Si l'observation n'aboutit jamais, rien ne
   bouge — mais rien n'est visible non plus, donc personne ne le constate. */
function auPremierPassage(cible, seuil, action) {
  let fait = false;
  const declencher = () => {
    if (fait) return;
    fait = true;
    action();
  };

  const observateur = new IntersectionObserver(
    (entrees) => {
      if (entrees.some((e) => e.isIntersecting)) {
        declencher();
        observateur.disconnect();
      }
    },
    /* Marge basse négative : la zone doit être franchement entrée dans l'écran,
       pas seulement affleurer le bord inférieur. */
    { threshold: seuil, rootMargin: "0px 0px -12% 0px" }
  );
  observateur.observe(cible);
}

export function initMemories() {
  const section = document.querySelector("[data-memories]");
  if (!section) return;

  const tally = section.querySelector("[data-tally]");
  const affiche = section.querySelector("[data-affiche-nouvelle]");
  if (!tally && !affiche) return;

  if (mouvementRefuse() || !("IntersectionObserver" in window)) return;

  /* Mise en scène : on recule d'un cran. */
  if (tally) monteCompteur(tally);
  if (affiche) {
    affiche.classList.add("memory--a-reveler");
    /* Hors du chargement paresseux dès maintenant : l'image a tout le temps du
       défilement pour arriver, la révélation ne bute pas sur un cadre vide. */
    const img = affiche.querySelector("img");
    if (img) img.loading = "eager";
  }

  /* Deux déclencheurs distincts, et c'est le point important : le compteur est
     dans le titre, tout en haut de la section, tandis que l'affiche est la
     dernière du mur. Sur téléphone, le mur fait plusieurs hauteurs d'écran —
     lier les deux animations à la position de l'affiche ferait basculer le
     compteur alors qu'il est déjà sorti par le haut. Chacun s'anime donc
     lorsque c'est LUI qui est à l'écran. */
  if (tally) {
    /* Le compteur est un petit élément : on exige qu'il soit entièrement visible. */
    auPremierPassage(tally, 1, () => tally.classList.add("tally--bascule"));
  }

  if (affiche) {
    /* L'affiche est haute : un tiers visible suffit à ce que la révélation se
       joue sous les yeux du visiteur plutôt qu'au ras du bord. */
    auPremierPassage(affiche, 0.35, () => {
      imagePrete(affiche).then(() => affiche.classList.add("memory--revelee"));
    });
  }
}
