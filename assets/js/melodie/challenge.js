/* Logique pure du défi « Rejoue la mélodie » : séquence, saisie, niveau.
   Aucun DOM, aucun audio (§5.3 du CDC). Le tirage est INJECTÉ, comme l'horloge
   de recorder.js, pour rester testable sans aléa. */

/* Les 8 notes couvertes par les lettres Q S D F G H J K déjà affichées sur les
   touches : le défi n'introduit aucune touche que le joueur n'a pas sous les yeux. */
export const CHALLENGE_NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];

const START_LENGTH = 3;

/**
 * @param {object}   [options]
 * @param {string[]} [options.notes]       Gamme dans laquelle tirer.
 * @param {number}   [options.startLength] Longueur de la séquence au niveau 1.
 * @param {() => string} [options.pick]    Tirage d'une note (injecté par les tests).
 */
export function createChallenge({ notes = CHALLENGE_NOTES, startLength = START_LENGTH, pick } = {}) {
  const pickNote = pick ?? (() => notes[Math.floor(Math.random() * notes.length)]);

  let sequence = [];
  let inputIndex = 0;
  let level = 0;

  function start() {
    sequence = Array.from({ length: startLength }, pickNote);
    inputIndex = 0;
    level = 1;
    return sequence.slice();
  }

  /** Réussite : une note de plus, niveau suivant. */
  function nextRound() {
    sequence = [...sequence, pickNote()];
    inputIndex = 0;
    level += 1;
    return sequence.slice();
  }

  /** Erreur : on remontre la MÊME séquence, le niveau est conservé. */
  function retry() {
    inputIndex = 0;
    return sequence.slice();
  }

  /**
   * Soumet une note jouée par le joueur.
   * @returns {"correct" | "wrong" | "complete"} `complete` = séquence rejouée
   * en entier sans faute. Hors partie (aucune séquence), retourne `wrong` :
   * l'appelant ne doit soumettre qu'en phase de saisie.
   */
  function submitNote(note) {
    if (!sequence.length || note !== sequence[inputIndex]) return "wrong";
    inputIndex += 1;
    return inputIndex === sequence.length ? "complete" : "correct";
  }

  return {
    start,
    nextRound,
    retry,
    submitNote,
    getSequence: () => sequence.slice(),
    getLevel: () => level,
    getProgress: () => inputIndex,
  };
}

/**
 * Défi « mélodie connue » : une séquence FIXE (un air d'exemple) à rejouer.
 * Le score se compte jusqu'à la première erreur ; le maximum est le nombre de
 * notes. Logique pure, sans DOM ni audio (§5.3 du CDC).
 *
 * @param {string[]} sequence  Les notes de la mélodie, dans l'ordre.
 */
export function createKnownChallenge(sequence) {
  const notes = sequence.slice();   // copie défensive : jamais mutée de l'extérieur
  let inputIndex = 0;

  /**
   * @returns {"correct" | "wrong" | "complete"} `wrong` fige le score à sa
   * valeur courante (l'appelant termine la tentative). `complete` = mélodie
   * rejouée en entier sans faute (score maximal).
   */
  function submitNote(note) {
    if (!notes.length || note !== notes[inputIndex]) return "wrong";
    inputIndex += 1;
    return inputIndex === notes.length ? "complete" : "correct";
  }

  return {
    submitNote,
    reset: () => { inputIndex = 0; },      // pour « Réécouter » : on rejoue depuis le début
    getSequence: () => notes.slice(),
    getProgress: () => inputIndex,         // notes justes enchaînées = score courant
    getTotal: () => notes.length,          // score maximal atteignable
  };
}
