/* Autosauvegarde locale (R7 : donnée fonctionnelle locale, pas de traceur).
   try/catch systématique : le mode privé iOS peut jeter une exception sur
   localStorage. */
const KEY = "ada-melodie-autosave";

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
