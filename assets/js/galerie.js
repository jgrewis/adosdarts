/* Affichage de la galerie photos alimentée depuis la page d'administration.
 *
 * Deux usages, un seul module :
 *   - accueil (index.html)   : les 8 photos les plus récentes + un lien vers la
 *                              galerie complète ;
 *   - galerie.html           : toutes les photos.
 *
 * L'index est lu dans `assets/uploads/galerie.json`, écrit par le serveur à
 * chaque publication. Ce fichier ne contient QUE des noms de fichiers et des
 * dimensions : jamais le nom de la personne qui a publié.
 *
 * Sans JavaScript, ou avant la première publication, le HTML d'origine reste
 * en place : les cases en pointillés « Photo à venir ». C'est l'état vide, il
 * est déjà écrit dans la page, on ne le fabrique pas ici.
 */

const CHEMIN_INDEX = "assets/uploads/galerie.json";
const DOSSIER_PHOTOS = "assets/uploads/";

/* Texte alternatif générique : on ne connaît pas le contenu des photos, et
   inventer une description serait pire que rien. On décrit donc la fonction de
   l'image, ce que demande le référentiel. */
const ALT_GENERIQUE = "Photo d'une édition passée du festival À Dos d'Arts";

async function chargerPhotos() {
  let reponse;
  try {
    /* no-cache : le navigateur revalide auprès du serveur. Sans ça, une photo
       publiée à l'instant peut rester invisible pendant des heures pour qui a
       déjà visité la page. */
    reponse = await fetch(CHEMIN_INDEX, { cache: "no-cache" });
  } catch {
    return [];   // hors ligne : on garde l'état vide, sans rien casser
  }

  /* 404 avant la première publication : ce n'est pas une erreur, c'est une
     galerie vide. On ne journalise rien en console pour ne pas faire croire
     à un bug. */
  if (!reponse.ok) return [];

  let donnees;
  try {
    donnees = await reponse.json();
  } catch {
    return [];   // fichier corrompu : on retombe proprement sur l'état vide
  }

  if (!donnees || !Array.isArray(donnees.photos)) return [];

  /* On ne fait confiance qu'à ce qui a la bonne forme : ce fichier est écrit
     par le serveur, mais il est servi publiquement et lu ici sans autre
     contrôle. Un nom de fichier hors format est ignoré. */
  return donnees.photos.filter(
    (photo) =>
      photo &&
      typeof photo.fichier === "string" &&
      /^[a-f0-9]{16}\.(jpg|png|webp)$/.test(photo.fichier)
  );
}

function creerVignette(photo, rang) {
  const figure = document.createElement("figure");
  figure.className = "gallery__item";

  /* Un bouton, pas une figure cliquable : lui seul est focusable au clavier et
     annoncé comme actionnable par un lecteur d'écran. */
  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.className = "gallery__bouton";
  bouton.setAttribute("aria-label", `Agrandir la photo ${rang + 1}`);
  bouton.addEventListener("click", () => ouvrirVisionneuse(rang));

  const image = document.createElement("img");
  image.src = DOSSIER_PHOTOS + photo.fichier;
  image.alt = ALT_GENERIQUE;
  image.loading = "lazy";
  image.decoding = "async";

  /* Dimensions intrinsèques : le navigateur réserve la place avant que l'image
     arrive, la page ne sursaute pas pendant le chargement. */
  image.width = Number(photo.largeur) || 1600;
  image.height = Number(photo.hauteur) || 1200;

  bouton.append(image);
  figure.append(bouton);
  return figure;
}

/* ==========================================================================
   Visionneuse — la photo en grand par-dessus la page
   ==========================================================================
   Bâtie sur l'élément natif <dialog> : la fermeture par Échap, le piégeage du
   focus, l'inertie de la page derrière et le retour du focus sur la vignette
   d'origine sont assurés par le navigateur. Les refaire à la main, c'est plus
   de code et moins d'accessibilité.

   Construite à la première ouverture seulement : une page sans photo n'a aucun
   nœud inutile. */

let photosVisionnees = [];   // les photos réellement affichées dans la grille
let visionneuse = null;      // { dialogue, image, compte } — construit une fois
let indexCourant = 0;

function construireVisionneuse() {
  const dialogue = document.createElement("dialog");
  dialogue.className = "visionneuse";
  dialogue.setAttribute("aria-label", "Photo agrandie");

  const image = document.createElement("img");
  image.className = "visionneuse__image";
  image.alt = ALT_GENERIQUE;
  image.decoding = "async";

  const precedent = creerCommande("visionneuse__nav visionneuse__nav--precedent", "‹", "Photo précédente");
  const suivant = creerCommande("visionneuse__nav visionneuse__nav--suivant", "›", "Photo suivante");
  const fermer = creerCommande("visionneuse__fermer", "✕", "Fermer la photo");

  /* Le compteur dit où l'on est. En aria-live, il l'annonce aussi à qui ne voit
     pas l'image changer. */
  const compte = document.createElement("p");
  compte.className = "visionneuse__compte";
  compte.setAttribute("aria-live", "polite");

  precedent.addEventListener("click", () => afficherPhoto(indexCourant - 1));
  suivant.addEventListener("click", () => afficherPhoto(indexCourant + 1));
  fermer.addEventListener("click", () => dialogue.close());

  /* Clic sur le fond : le fond est la seule zone où l'événement a le dialogue
     lui-même pour cible, l'image et les boutons captant le reste. */
  dialogue.addEventListener("click", (evenement) => {
    if (evenement.target === dialogue) dialogue.close();
  });

  dialogue.addEventListener("keydown", (evenement) => {
    if (evenement.key === "ArrowLeft") afficherPhoto(indexCourant - 1);
    if (evenement.key === "ArrowRight") afficherPhoto(indexCourant + 1);
  });

  /* Le blocage du défilement de la page derrière est fait EN CSS
     (`body:has(dialog.visionneuse[open])`), pas ici. Raison : une classe posée
     par JavaScript doit être retirée par JavaScript, donc il faut un chemin de
     nettoyage — et il y a quatre façons de fermer (bouton, Échap, clic sur le
     fond, retour arrière du navigateur). Le jour où l'une d'elles ne déclenche
     pas l'événement attendu, la page reste figée, et c'est un bug qu'on ne
     découvre qu'en production. La règle CSS, elle, suit l'état réel de
     l'élément : il n'y a rien à nettoyer, donc rien qui puisse rester coincé.
     Constaté pendant la recette du 03/08 : l'événement `close` n'est pas
     dispatché dans tous les moteurs. */

  /* Le bouton de fermeture est DANS le cadre, pas en débord du dialogue : en
     débord, il sortait de l'écran dès que la photo occupait toute la hauteur —
     constaté en recette, bouton mesuré à y = -13 px, donc inatteignable. */
  const cadre = document.createElement("div");
  cadre.className = "visionneuse__cadre";
  cadre.append(image, precedent, suivant, fermer);

  dialogue.append(cadre, compte);
  document.body.append(dialogue);

  return { dialogue, image, compte, precedent, suivant };
}

function creerCommande(classe, glyphe, libelle) {
  const bouton = document.createElement("button");
  bouton.type = "button";
  bouton.className = classe;
  bouton.textContent = glyphe;          // décoratif : le sens est dans le libellé
  bouton.setAttribute("aria-label", libelle);
  return bouton;
}

function cheminPhoto(index) {
  return DOSSIER_PHOTOS + photosVisionnees[index].fichier;
}

/* Précharge les voisines : sans ça, chaque changement laisse un cadre vide le
   temps du téléchargement. */
function precharger(index) {
  if (index < 0 || index >= photosVisionnees.length) return;
  new Image().src = cheminPhoto(index);
}

function afficherPhoto(index) {
  const total = photosVisionnees.length;
  if (!total) return;

  /* Bouclage : après la dernière on revient à la première, et inversement.
     Un cul-de-sac silencieux serait pris pour une panne. */
  indexCourant = (index + total) % total;

  const photo = photosVisionnees[indexCourant];
  visionneuse.image.src = cheminPhoto(indexCourant);
  visionneuse.image.width = Number(photo.largeur) || 1600;
  visionneuse.image.height = Number(photo.hauteur) || 1200;
  visionneuse.compte.textContent = `${indexCourant + 1} / ${total}`;

  /* Une seule photo : les flèches n'auraient aucun sens. */
  const navigable = total > 1;
  visionneuse.precedent.hidden = !navigable;
  visionneuse.suivant.hidden = !navigable;

  precharger(indexCourant + 1);
  precharger(indexCourant - 1);
}

function ouvrirVisionneuse(index) {
  if (!visionneuse) visionneuse = construireVisionneuse();
  afficherPhoto(index);
  visionneuse.dialogue.showModal();
}

/* `limite` : nombre maximal de photos affichées (0 = toutes).
   `lienComplet` : sélecteur du bloc « voir toutes les photos », révélé
   seulement s'il y a plus de photos que la limite. */
export async function initGalerie({ limite = 0, lienComplet = null } = {}) {
  const conteneur = document.querySelector("[data-galerie]");
  if (!conteneur) return;

  const photos = await chargerPhotos();

  /* Aucune photo : on ne touche à rien. Le balisage d'origine — les cases en
     pointillés — reste affiché. */
  if (!photos.length) return;

  const aAfficher = limite > 0 ? photos.slice(0, limite) : photos;

  /* La visionneuse ne montre que ce que la grille affiche : sur l'accueil, les
     flèches parcourent les 8 vignettes visibles, pas toute la collection. */
  photosVisionnees = aAfficher;

  conteneur.textContent = "";
  aAfficher.forEach((photo, rang) => {
    conteneur.append(creerVignette(photo, rang));
  });

  if (lienComplet && photos.length > aAfficher.length) {
    const bloc = document.querySelector(lienComplet);
    if (bloc) bloc.hidden = false;
  }

  /* Compteur éventuel sur la page galerie. */
  const compteur = document.querySelector("[data-galerie-compte]");
  if (compteur) {
    compteur.textContent =
      photos.length === 1 ? "1 photo" : `${photos.length} photos`;
  }
}
