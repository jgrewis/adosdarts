/* Les 6 accords de Do majeur, avec un voicing par instrument. La guitare est
   grattée (strum) : chaque corde décalée de ~40 ms, comme un vrai grattage.
   Tone est une globale fournie par assets/vendor/tone.min.js. */
/* global Tone */
import { noteOn, noteOff, getSampler } from "./instruments.js";

export const CHORDS = {
  C:  { label: "Do",   piano: ["C4", "E4", "G4"], guitare: ["C3", "E3", "G3", "C4", "E4"],      trompette: ["C4", "E4", "G4"] },
  Dm: { label: "Ré m", piano: ["D4", "F4", "A4"], guitare: ["D3", "A3", "D4", "F4"],            trompette: ["D4", "F4", "A4"] },
  Em: { label: "Mi m", piano: ["E4", "G4", "B4"], guitare: ["E2", "B2", "E3", "G3", "B3", "E4"], trompette: ["E4", "G4", "B4"] },
  F:  { label: "Fa",   piano: ["F3", "A3", "C4"], guitare: ["F3", "A3", "C4", "F4"],            trompette: ["F4", "A4", "C5"] },
  G:  { label: "Sol",  piano: ["G3", "B3", "D4"], guitare: ["G2", "B2", "D3", "G3", "B3", "G4"], trompette: ["G4", "B4", "D5"] },
  Am: { label: "La m", piano: ["A3", "C4", "E4"], guitare: ["A2", "E3", "A3", "C4", "E4"],      trompette: ["A4", "C5", "E5"] },
};

const STRUM_STEP = 0.04; // secondes entre deux cordes grattées

export function chordOn(chordId, instrument) {
  const notes = CHORDS[chordId]?.[instrument];
  if (!notes) return;
  if (instrument === "guitare") {
    const sampler = getSampler(instrument);
    const now = Tone.now();
    notes.forEach((note, i) => sampler?.triggerAttack(note, now + i * STRUM_STEP));
    return;
  }
  noteOn(notes, instrument);
}

export function chordOff(chordId, instrument) {
  const notes = CHORDS[chordId]?.[instrument];
  if (!notes) return;
  noteOff(notes, instrument);   // relâchement toujours simultané, même à la guitare
}
