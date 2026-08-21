/* Administration de la galerie photos.
 *
 * Une seule page, deux vues : connexion et tableau de bord. La bascule se fait
 * ici, à partir de ce que répond le serveur — jamais à partir d'une supposition
 * du navigateur. Masquer le tableau de bord n'est pas une protection : chaque
 * action est revérifiée côté serveur (assets/php/admin-api.php).
 */

const API = "assets/php/admin-api.php";

/* Jeton anti-CSRF de la session, fourni par le serveur à la connexion.
   Gardé en mémoire du module et non en localStorage : il disparaît avec
   l'onglet, et reste hors de portée d'un éventuel script tiers. */
let jetonSession = "";

/* ==========================================================================
   Appels au serveur
   ========================================================================== */

/* Renvoie toujours { ok, http, donnees } — y compris quand le serveur répond
   du HTML (page d'erreur de l'hébergeur) ou ne répond pas du tout. Sans ça, une
   panne serveur se traduirait par une exception silencieuse et une interface
   figée. */
async function appeler(action, champs = {}) {
  const corps = new FormData();
  corps.append("action", action);
  for (const [cle, valeur] of Object.entries(champs)) {
    if (valeur !== null && valeur !== undefined) corps.append(cle, valeur);
  }

  let reponse;
  try {
    reponse = await fetch(API, {
      method: "POST",
      body: corps,
      headers: { "X-Requested-With": "fetch" },
      credentials: "same-origin",
    });
  } catch {
    return {
      ok: false,
      http: 0,
      donnees: { message: "Le serveur est injoignable. Vérifiez votre connexion." },
    };
  }

  let donnees = {};
  try {
    donnees = await reponse.json();
  } catch {
    donnees = {
      message: `Réponse inattendue du serveur (code ${reponse.status}).`,
    };
  }

  return { ok: reponse.ok && donnees.ok === true, http: reponse.status, donnees };
}

/* ==========================================================================
   Retours à l'utilisateur
   ========================================================================== */

function afficherStatut(element, type, message) {
  if (!element) return;
  element.hidden = false;
  element.className = `form-status form-status--${type}`;
  element.textContent = message;
  element.setAttribute("role", type === "error" ? "alert" : "status");
}

function masquerStatut(element) {
  if (!element) return;
  element.hidden = true;
  element.textContent = "";
}

function definirErreurChamp(champ, message) {
  const bloc = champ.closest(".field");
  if (!bloc) return;
  const erreur = bloc.querySelector("[data-field-error]");
  bloc.setAttribute("data-error", String(Boolean(message)));
  champ.setAttribute("aria-invalid", String(Boolean(message)));
  if (erreur) erreur.textContent = message || "";
}

/* ==========================================================================
   Diagnostic serveur
   ========================================================================== */

/* Construit avec des nœuds DOM et textContent, jamais avec innerHTML : ces
   valeurs viennent de la configuration du serveur, on ne les injecte pas
   comme du HTML (§17.2). */
function rendreDiagnostic(conteneur, diag) {
  conteneur.textContent = "";

  if (!diag) {
    const p = document.createElement("p");
    p.className = "admin-aide";
    p.textContent = "Diagnostic indisponible.";
    conteneur.append(p);
    return;
  }

  /* Le point qui décide si l'administration peut fonctionner du tout. */
  const verdict = document.createElement("p");
  verdict.className = diag.ecritureOk ? "admin-verdict admin-verdict--ok" : "admin-verdict admin-verdict--ko";
  verdict.textContent = diag.ecritureOk
    ? "✓ Le serveur accepte l'enregistrement des photos."
    : "✗ Le serveur refuse d'enregistrer des fichiers — la publication ne fonctionnera pas.";
  conteneur.append(verdict);

  const detail = document.createElement("p");
  detail.className = "admin-aide";
  detail.textContent = diag.detailEcriture || "";
  conteneur.append(detail);

  if (!diag.ecritureOk) {
    const aide = document.createElement("p");
    aide.className = "admin-aide";
    aide.textContent =
      "À corriger côté hébergement : le dossier assets/uploads/ doit exister et " +
      "être accessible en écriture (droits 755).";
    conteneur.append(aide);
  }

  if (!diag.https) {
    const alerte = document.createElement("p");
    alerte.className = "admin-verdict admin-verdict--ko";
    alerte.textContent =
      "✗ Cette page n'est pas servie en HTTPS : le mot de passe circule en clair.";
    conteneur.append(alerte);
  }

  if (diag.limiteImposeeParServeur) {
    const note = document.createElement("p");
    note.className = "admin-aide";
    note.textContent =
      `Note : c'est l'hébergeur qui fixe la limite de taille (${diag.tailleMaxFichier}), ` +
      "plus basse que celle prévue par le site. C'est cette limite-là qui s'applique. " +
      "Sans conséquence en pratique : une photo redimensionnée par le navigateur pèse " +
      "environ 300 Ko.";
    conteneur.append(note);
  }

  const enMo = (octets) => `${(Number(octets || 0) / 1048576).toFixed(1).replace(".", ",")} Mo`;

  const lignes = [
    ["Version de PHP", diag.php],
    ["Connexion sécurisée (HTTPS)", diag.https ? "oui" : "non"],
    ["Téléversement autorisé", diag.uploadsActives ? "oui" : "non"],
    ["Taille maximale par fichier (serveur)", diag.tailleMaxFichier],
    ["Taille maximale par envoi (serveur)", diag.tailleMaxRequete],
    ["Taille réellement acceptée", enMo(diag.tailleMaxEffective)],
  ];

  const liste = document.createElement("dl");
  liste.className = "admin-diag";
  for (const [libelle, valeur] of lignes) {
    const dt = document.createElement("dt");
    dt.textContent = libelle;
    const dd = document.createElement("dd");
    dd.textContent = String(valeur ?? "—");
    liste.append(dt, dd);
  }
  conteneur.append(liste);
}

/* ==========================================================================
   Redimensionnement dans le navigateur
   ========================================================================== */

/* Une photo de téléphone pèse 4 à 8 Mo et mesure 4000 px de large. L'envoyer
   telle quelle ferait une page d'accueil de plusieurs dizaines de Mo, et
   dépasserait les limites du serveur. On la réduit donc AVANT l'envoi.
   Effet de bord précieux : repasser par un <canvas> régénère l'image sans ses
   métadonnées EXIF — dont la position GPS, souvent le domicile de la personne. */
const COTE_MAX = 1600;
const QUALITE_JPEG = 0.82;

async function chargerImage(fichier) {
  /* createImageBitmap avec `imageOrientation: from-image` applique la rotation
     EXIF. Sans ça, les photos prises à la verticale arrivent couchées : le
     capteur enregistre en paysage et note la rotation à part. */
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(fichier, { imageOrientation: "from-image" });
    } catch {
      /* Option non supportée (Safari ancien) : on retombe sur <img>, qui
         applique l'orientation nativement depuis 2020. */
    }
  }

  return await new Promise((resoudre, rejeter) => {
    const url = URL.createObjectURL(fichier);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resoudre(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      rejeter(new Error("format non reconnu"));
    };
    image.src = url;
  });
}

async function redimensionner(fichier) {
  const source = await chargerImage(fichier);

  const largeurSource = source.width;
  const hauteurSource = source.height;
  if (!largeurSource || !hauteurSource) throw new Error("image illisible");

  /* Math.min(1, …) : on réduit, on n'agrandit jamais. Agrandir une petite
     photo ne fait qu'alourdir le fichier sans ajouter de détail. */
  const facteur = Math.min(1, COTE_MAX / Math.max(largeurSource, hauteurSource));
  const largeur = Math.round(largeurSource * facteur);
  const hauteur = Math.round(hauteurSource * facteur);

  const toile = document.createElement("canvas");
  toile.width = largeur;
  toile.height = hauteur;

  const contexte = toile.getContext("2d");
  contexte.imageSmoothingQuality = "high";
  contexte.drawImage(source, 0, 0, largeur, hauteur);

  if (typeof source.close === "function") source.close();   // libère la mémoire

  const blob = await new Promise((resoudre) =>
    toile.toBlob(resoudre, "image/jpeg", QUALITE_JPEG)
  );
  if (!blob) throw new Error("conversion impossible");

  return blob;
}

/* ==========================================================================
   Photos en ligne
   ========================================================================== */

function formaterDate(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function rendreListePhotos(photos) {
  const conteneur = document.querySelector("[data-liste-photos]");
  const compteur = document.querySelector("[data-compteur]");
  if (!conteneur) return;

  conteneur.textContent = "";
  if (compteur) {
    compteur.textContent = photos.length ? `(${photos.length})` : "";
  }

  /* État vide : il se dit, il ne se devine pas. */
  if (!photos.length) {
    const vide = document.createElement("p");
    vide.className = "admin-aide";
    vide.textContent =
      "Aucune photo publiée pour l'instant. La galerie du site affiche ses cases " +
      "en pointillés tant qu'elle est vide.";
    conteneur.append(vide);
    return;
  }

  const grille = document.createElement("ul");
  grille.className = "admin-grille";

  for (const photo of photos) {
    const item = document.createElement("li");
    item.className = "admin-vignette";

    const image = document.createElement("img");
    image.src = `assets/uploads/${photo.fichier}`;
    image.alt = `Photo publiée le ${formaterDate(photo.ajoutee)}`;
    image.loading = "lazy";
    image.decoding = "async";
    /* width/height intrinsèques : le navigateur réserve la place, la grille ne
       sursaute pas pendant le chargement. */
    image.width = photo.largeur || 1600;
    image.height = photo.hauteur || 1200;

    const legende = document.createElement("p");
    legende.className = "admin-vignette__date";
    legende.textContent = formaterDate(photo.ajoutee);

    const actions = document.createElement("div");
    actions.className = "admin-vignette__actions";

    const supprimer = document.createElement("button");
    supprimer.type = "button";
    supprimer.className = "btn btn--ghost btn--sm";
    supprimer.textContent = "Supprimer";
    supprimer.addEventListener("click", () => demanderConfirmation(item, actions, photo));

    actions.append(supprimer);
    item.append(image, legende, actions);
    grille.append(item);
  }

  conteneur.append(grille);
}

/* Confirmation en deux temps, dans la page. Un window.confirm() bloquerait le
   navigateur et n'est pas stylable ; une modale maison demanderait un piège à
   focus complet pour rester accessible. Ici, le bouton laisse place à une
   question et deux réponses, au même endroit — le focus part sur « Oui ». */
function demanderConfirmation(item, actions, photo) {
  actions.textContent = "";
  item.classList.add("admin-vignette--confirmation");

  const question = document.createElement("p");
  question.className = "admin-vignette__question";
  question.textContent = "Supprimer définitivement ?";

  const oui = document.createElement("button");
  oui.type = "button";
  oui.className = "btn btn--primary btn--sm";
  oui.textContent = "Oui, supprimer";

  const non = document.createElement("button");
  non.type = "button";
  non.className = "btn btn--ghost btn--sm";
  non.textContent = "Annuler";

  oui.addEventListener("click", async () => {
    oui.disabled = true;
    non.disabled = true;
    oui.textContent = "Suppression…";

    const { ok, donnees } = await appeler("supprimer", {
      fichier: photo.fichier,
      jeton: jetonSession,
    });

    if (!ok) {
      afficherStatut(
        document.querySelector("[data-statut-general]"),
        "error",
        donnees.message || "La suppression a échoué."
      );
      oui.disabled = false;
      non.disabled = false;
      oui.textContent = "Oui, supprimer";
      return;
    }

    rendreListePhotos(donnees.photos || []);
    afficherStatut(document.querySelector("[data-statut-general]"), "success", "Photo supprimée.");
    chargerJournal(true);
  });

  non.addEventListener("click", () => {
    item.classList.remove("admin-vignette--confirmation");
    actions.textContent = "";
    const rendre = document.createElement("button");
    rendre.type = "button";
    rendre.className = "btn btn--ghost btn--sm";
    rendre.textContent = "Supprimer";
    rendre.addEventListener("click", () => demanderConfirmation(item, actions, photo));
    actions.append(rendre);
    rendre.focus();
  });

  actions.append(question, oui, non);
  oui.focus();
}

/* ==========================================================================
   Auteur de la publication
   ========================================================================== */

function afficherAuteur(auteur, auteursConnus = []) {
  const champ = document.querySelector("[data-champ-auteur]");
  const aide = document.querySelector("[data-aide-auteur]");
  const ligne = document.querySelector("[data-auteur-actuel]");
  const nom = document.querySelector("[data-auteur-nom]");
  const datalist = document.querySelector("[data-auteurs-connus]");

  if (datalist) {
    datalist.textContent = "";
    for (const connu of auteursConnus) {
      const option = document.createElement("option");
      option.value = connu;
      datalist.append(option);
    }
  }

  const connuSurCetAppareil = Boolean(auteur);

  if (champ) champ.hidden = connuSurCetAppareil;
  if (aide) aide.hidden = connuSurCetAppareil;
  if (ligne) ligne.hidden = !connuSurCetAppareil;
  if (nom && auteur) nom.textContent = auteur;
}

function brancherChangementAuteur() {
  const bouton = document.querySelector("[data-changer-auteur]");
  if (!bouton) return;

  bouton.addEventListener("click", () => {
    afficherAuteur(null, dernierAuteursConnus);
    const champ = document.querySelector("#auteur");
    if (champ) {
      champ.value = "";
      champ.focus();
    }
  });
}

/* ==========================================================================
   Publication
   ========================================================================== */

function ligneProgression(nomFichier) {
  const item = document.createElement("li");
  item.className = "admin-progression__item";

  const libelle = document.createElement("span");
  libelle.className = "admin-progression__nom";
  libelle.textContent = nomFichier;

  const etat = document.createElement("span");
  etat.className = "admin-progression__etat";
  etat.textContent = "en attente…";

  item.append(libelle, etat);
  return { item, etat };
}

function brancherAjout() {
  const form = document.querySelector("[data-form-ajout]");
  if (!form) return;

  const champFichiers = form.querySelector("#photos");
  const champAuteur = form.querySelector("#auteur");
  const bouton = form.querySelector("[data-bouton-publier]");
  const statut = form.querySelector("[data-statut-ajout]");
  const progression = form.querySelector("[data-progression]");
  const choix = form.querySelector("[data-fichiers-choisis]");

  /* Le nombre de photos choisies est écrit par nous : le contrôle natif ne
     l'affiche pas de façon fiable, et l'utilisateur doit voir ce qu'il s'apprête
     à publier avant de cliquer. */
  champFichiers.addEventListener("change", () => {
    const nombre = (champFichiers.files || []).length;
    if (!choix) return;
    if (!nombre) {
      choix.textContent = "Aucune photo choisie";
      return;
    }
    choix.textContent = nombre === 1 ? "1 photo choisie" : `${nombre} photos choisies`;
    definirErreurChamp(champFichiers, "");
  });

  form.addEventListener("submit", async (evenement) => {
    evenement.preventDefault();

    const fichiers = [...(champFichiers.files || [])];
    if (!fichiers.length) {
      definirErreurChamp(champFichiers, "Choisissez au moins une photo.");
      champFichiers.focus();
      return;
    }
    definirErreurChamp(champFichiers, "");

    /* Le nom n'est demandé que si le navigateur ne le connaît pas encore. */
    const champAuteurVisible = !document.querySelector("[data-champ-auteur]").hidden;
    const auteurSaisi = champAuteur ? champAuteur.value.trim() : "";
    if (champAuteurVisible && auteurSaisi.length < 2) {
      definirErreurChamp(champAuteur, "Indiquez qui publie (2 caractères minimum).");
      champAuteur.focus();
      return;
    }
    if (champAuteur) definirErreurChamp(champAuteur, "");

    masquerStatut(statut);
    progression.textContent = "";

    /* Verrou pendant tout l'envoi : deux clics rapides publieraient deux fois
       les mêmes photos. */
    bouton.disabled = true;
    champFichiers.disabled = true;
    const libelleInitial = bouton.textContent;
    bouton.textContent = "Publication…";

    let publiees = 0;
    let echouees = 0;

    /* Envoi séquentiel, pas en parallèle : sur une connexion mobile, dix envois
       simultanés se gênent et font expirer les requêtes. Et la progression
       reste lisible. */
    for (const fichier of fichiers) {
      const { item, etat } = ligneProgression(fichier.name);
      progression.append(item);

      etat.textContent = "réduction…";

      let blob;
      try {
        blob = await redimensionner(fichier);
      } catch {
        etat.textContent = "format non reconnu";
        item.classList.add("admin-progression__item--erreur");
        echouees += 1;
        continue;
      }

      etat.textContent = "envoi…";

      const champs = { jeton: jetonSession, photo: new File([blob], "photo.jpg", { type: "image/jpeg" }) };
      /* Le nom n'est transmis qu'à la première photo : ensuite le serveur a
         posé son cookie et le reconnaît tout seul. */
      if (champAuteurVisible && publiees === 0) champs.auteur = auteurSaisi;

      const { ok, donnees } = await appeler("upload", champs);

      if (!ok) {
        etat.textContent = donnees.message || "échec";
        item.classList.add("admin-progression__item--erreur");
        echouees += 1;
        continue;
      }

      etat.textContent = "publiée ✓";
      item.classList.add("admin-progression__item--ok");
      publiees += 1;

      if (donnees.auteur) afficherAuteur(donnees.auteur, dernierAuteursConnus);
    }

    bouton.disabled = false;
    champFichiers.disabled = false;
    bouton.textContent = libelleInitial;

    /* Vider l'input ne déclenche pas d'événement `change` : on remet le texte
       à jour à la main, sinon il annoncerait encore « 3 photos choisies ». */
    champFichiers.value = "";
    if (choix) choix.textContent = "Aucune photo choisie";

    if (publiees && !echouees) {
      afficherStatut(statut, "success", `${publiees} photo(s) publiée(s) sur le site.`);
    } else if (publiees && echouees) {
      afficherStatut(statut, "error", `${publiees} photo(s) publiée(s), ${echouees} en échec.`);
    } else {
      afficherStatut(statut, "error", "Aucune photo n'a pu être publiée.");
    }

    /* On recharge la liste depuis le serveur plutôt que de l'ajuster de tête :
       c'est le serveur qui fait foi. */
    const etatFrais = await appeler("etat");
    if (etatFrais.ok && etatFrais.donnees.connecte) {
      rendreListePhotos(etatFrais.donnees.photos || []);
      dernierAuteursConnus = etatFrais.donnees.auteursConnus || [];
    }
    chargerJournal(true);
  });
}

/* ==========================================================================
   Journal
   ========================================================================== */

const LIBELLES_ACTION = {
  connexion: "Connexion",
  "connexion-echouee": "Échec de connexion",
  "connexion-bloquee": "Connexion bloquée",
  publication: "Publication",
  suppression: "Suppression",
};

let journalCharge = false;

async function chargerJournal(forcer = false) {
  const conteneur = document.querySelector("[data-journal]");
  if (!conteneur) return;
  if (journalCharge && !forcer) return;

  const { ok, donnees } = await appeler("journal");
  conteneur.textContent = "";

  if (!ok) {
    const erreur = document.createElement("p");
    erreur.className = "admin-aide";
    erreur.textContent = donnees.message || "Journal indisponible.";
    conteneur.append(erreur);
    return;
  }

  journalCharge = true;
  const entrees = donnees.entrees || [];

  if (!entrees.length) {
    const vide = document.createElement("p");
    vide.className = "admin-aide";
    vide.textContent = "Aucun événement enregistré.";
    conteneur.append(vide);
    return;
  }

  const table = document.createElement("table");
  table.className = "admin-journal";

  const enTete = document.createElement("thead");
  const ligneEnTete = document.createElement("tr");
  for (const titre of ["Date", "Action", "Qui"]) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = titre;
    ligneEnTete.append(th);
  }
  enTete.append(ligneEnTete);

  const corps = document.createElement("tbody");
  for (const entree of entrees) {
    const ligne = document.createElement("tr");

    const date = document.createElement("td");
    const quand = new Date(entree.date);
    date.textContent = Number.isNaN(quand.getTime())
      ? "—"
      : quand.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });

    const action = document.createElement("td");
    action.textContent = LIBELLES_ACTION[entree.action] || entree.action || "—";

    const qui = document.createElement("td");
    qui.textContent = entree.auteur || "—";

    ligne.append(date, action, qui);
    corps.append(ligne);
  }

  table.append(enTete, corps);

  /* Enveloppe défilante : un tableau à trois colonnes ne rentre pas à 320 px,
     et c'est LUI qui doit défiler, jamais la page entière. */
  const enveloppe = document.createElement("div");
  enveloppe.className = "admin-table-defilante";
  enveloppe.append(table);
  conteneur.append(enveloppe);
}

function brancherJournal() {
  const declencheur = document.querySelector("[data-ouvrir-journal]");
  if (!declencheur) return;
  /* Chargé à la demande : inutile de tirer 100 entrées si personne ne regarde. */
  declencheur.addEventListener("click", () => chargerJournal());
}

let dernierAuteursConnus = [];

/* ==========================================================================
   Bascule entre les deux vues
   ========================================================================== */

function afficherVue(nom) {
  for (const panneau of document.querySelectorAll("[data-vue]")) {
    panneau.hidden = panneau.dataset.vue !== nom;
  }
  const zoneDeconnexion = document.querySelector("[data-zone-deconnexion]");
  if (zoneDeconnexion) zoneDeconnexion.hidden = nom !== "tableau";
}

function entrerDansTableau(donnees) {
  jetonSession = donnees.jeton || "";
  afficherVue("tableau");

  dernierAuteursConnus = donnees.auteursConnus || [];
  afficherAuteur(donnees.auteur || null, dernierAuteursConnus);
  rendreListePhotos(donnees.photos || []);

  const conteneurDiag = document.querySelector("[data-diagnostic]");
  if (conteneurDiag) rendreDiagnostic(conteneurDiag, donnees.diagnostic);

  /* Le focus suit le changement de vue, sinon un utilisateur au clavier ou au
     lecteur d'écran reste sur un formulaire qui n'existe plus. */
  const titre = document.querySelector("#tableau-titre");
  if (titre) titre.focus();
}

/* ==========================================================================
   Connexion / déconnexion
   ========================================================================== */

function brancherConnexion() {
  const form = document.querySelector("[data-form-connexion]");
  if (!form) return;

  const champ = form.querySelector("#motdepasse");
  const bouton = form.querySelector("[data-bouton-connexion]");
  const statut = form.querySelector("[data-statut-connexion]");

  form.addEventListener("submit", async (evenement) => {
    evenement.preventDefault();

    if (!champ.value) {
      definirErreurChamp(champ, "Ce champ est obligatoire.");
      champ.focus();
      return;
    }
    definirErreurChamp(champ, "");
    masquerStatut(statut);

    /* Double soumission : le bouton se verrouille pendant l'appel. Sans ça,
       trois clics rapides consomment trois tentatives sur les cinq permises. */
    bouton.disabled = true;
    const libelleInitial = bouton.textContent;
    bouton.textContent = "Connexion…";

    const { ok, donnees } = await appeler("login", { motdepasse: champ.value });

    bouton.disabled = false;
    bouton.textContent = libelleInitial;

    if (!ok) {
      afficherStatut(statut, "error", donnees.message || "Connexion impossible.");
      champ.value = "";
      champ.focus();
      return;
    }

    champ.value = "";
    entrerDansTableau(donnees);
  });
}

function brancherDeconnexion() {
  const bouton = document.querySelector("[data-deconnexion]");
  if (!bouton) return;

  bouton.addEventListener("click", async () => {
    bouton.disabled = true;
    await appeler("logout");
    jetonSession = "";
    bouton.disabled = false;
    afficherVue("connexion");

    const statut = document.querySelector("[data-statut-connexion]");
    afficherStatut(statut, "success", "Vous êtes déconnecté·e.");
    const champ = document.querySelector("#motdepasse");
    if (champ) champ.focus();
  });
}

/* ==========================================================================
   Démarrage
   ========================================================================== */

export async function initAdmin() {
  brancherConnexion();
  brancherDeconnexion();
  brancherAjout();
  brancherChangementAuteur();
  brancherJournal();

  /* Une session peut déjà être ouverte (rechargement de page) : on demande au
     serveur, on ne devine pas. */
  const { ok, donnees } = await appeler("etat");

  if (ok && donnees.connecte) {
    entrerDansTableau(donnees);
    return;
  }

  afficherVue("connexion");

  /* Serveur injoignable ou mal configuré : on le dit tout de suite plutôt que
     de laisser l'utilisateur découvrir le problème en saisissant son mot de passe. */
  if (!ok && donnees.message) {
    afficherStatut(document.querySelector("[data-statut-connexion]"), "error", donnees.message);
  }
}

/* Exporté pour les tranches suivantes (upload, suppression, journal). */
export function jetonCourant() {
  return jetonSession;
}
