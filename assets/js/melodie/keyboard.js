/* Clavier physique AZERTY : Q S D F G H J K jouent une octave, note tenue
   tant que la touche reste enfoncée. Rangée A Z E R T Y réservée aux accords
   (branchée à l'étape 5). Filtre event.repeat pour éviter le mitraillage de
   notes au maintien d'une touche (CDC §8.3.5). */
import { getState } from "./store.js";

const NOTE_KEYS = { q: 0, s: 1, d: 2, f: 3, g: 4, h: 5, j: 6, k: 7 };
const NOTE_STEPS = ["C", "D", "E", "F", "G", "A", "B", "C"]; // le 8e Do est l'octave suivante

function noteForKey(key) {
  const idx = NOTE_KEYS[key];
  if (idx === undefined) return null;
  const baseOctave = 4 + getState().octave;
  const octave = idx === 7 ? baseOctave + 1 : baseOctave;
  return `${NOTE_STEPS[idx]}${octave}`;
}

export function attachKeyboard({ onNoteOn, onNoteOff }) {
  // Mémorise la note réellement déclenchée par touche (et non le raccourci),
  // pour la relâcher correctement même si l'octave a changé pendant l'appui.
  const held = new Map();

  function keydown(e) {
    if (e.repeat) return;
    const key = e.key.toLowerCase();
    if (held.has(key)) return;
    const note = noteForKey(key);
    if (!note) return;
    held.set(key, note);
    onNoteOn([note]);
  }

  function keyup(e) {
    const key = e.key.toLowerCase();
    const note = held.get(key);
    if (!note) return;
    held.delete(key);
    onNoteOff([note]);
  }

  document.addEventListener("keydown", keydown);
  document.addEventListener("keyup", keyup);

  return {
    releaseAll() {
      held.forEach((note) => onNoteOff([note]));
      held.clear();
    },
  };
}
