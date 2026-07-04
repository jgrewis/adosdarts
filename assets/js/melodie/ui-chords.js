/* Rendu des 6 pads d'accords. Aucune logique audio ici (§5.3) : les pads
   exposent `[data-note]` (valeur = identifiant d'accord) pour être rejoués
   par la même mécanique multi-touch que le clavier (pointer-notes.js). */
import { CHORDS } from "./chords.js";

const ORDER = ["C", "Dm", "Em", "F", "G", "Am"];

export function renderChords(root) {
  root.innerHTML = "";
  ORDER.forEach((id) => {
    const chord = CHORDS[id];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "melodie-chord";
    btn.dataset.note = id;
    btn.textContent = chord.label;
    const qualifier = id.endsWith("m") ? "" : " majeur";
    btn.setAttribute("aria-label", `Accord ${chord.label}${qualifier}`);
    root.appendChild(btn);
  });
  return root;
}
