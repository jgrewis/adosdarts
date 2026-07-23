/* Autosauvegarde locale (R7 : donnée fonctionnelle locale, pas de traceur).
   try/catch systématique : le mode privé iOS peut jeter une exception sur
   localStorage. */
const KEY = "ada-melodie-autosave";
/* Clé distincte de l'autosauvegarde : le défi n'écrase jamais la dernière
   création du joueur. */
const DEFI_KEY = "ada-melodie-defi-record";
/* Meilleurs scores du mode « mélodie connue », un objet { titre: score }. */
const DEFI_SCORES_KEY = "ada-melodie-defi-scores";

export function saveLast(recording) {
  try {
    localStorage.setItem(KEY, JSON.stringify(recording));
  } catch {
    // Stockage indisponible (quota, mode privé) : on continue sans bloquer le jeu.
  }
}

export function loadLast() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Meilleur niveau atteint au défi. Retourne 0 si rien n'est enregistré ou si
    la valeur stockée a été altérée (on ne fait pas confiance au stockage). */
export function loadBestLevel() {
  try {
    const level = Number(localStorage.getItem(DEFI_KEY));
    return Number.isInteger(level) && level > 0 ? level : 0;
  } catch {
    return 0;
  }
}

export function saveBestLevel(level) {
  try {
    localStorage.setItem(DEFI_KEY, String(level));
  } catch {
    // Stockage indisponible (quota, mode privé) : le défi se joue sans record.
  }
}

/** Meilleurs scores du mode « mélodie connue » : objet { titre: score }.
    Toujours un objet, même si le stockage est vide ou corrompu. */
export function loadBestScores() {
  try {
    const obj = JSON.parse(localStorage.getItem(DEFI_SCORES_KEY) || "{}");
    return obj && typeof obj === "object" && !Array.isArray(obj) ? obj : {};
  } catch {
    return {};
  }
}

/** Enregistre le score d'une mélodie s'il bat le précédent. Retourne le
    meilleur score courant (nouveau ou conservé) pour affichage immédiat. */
export function saveBestScore(title, score) {
  try {
    const scores = loadBestScores();
    const previous = Number.isInteger(scores[title]) ? scores[title] : 0;
    if (score > previous) {
      scores[title] = score;
      localStorage.setItem(DEFI_SCORES_KEY, JSON.stringify(scores));
      return score;
    }
    return previous;
  } catch {
    return score;   // stockage indisponible : on affiche au moins le score du tour
  }
}
