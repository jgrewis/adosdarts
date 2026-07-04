/* Rendu du clavier de piano : 1,5 octave (Do à Sol), touches noires
   positionnées en absolu au-dessus des blanches. Aucune logique audio ici
   (§5.3 du CDC) : seulement des boutons `[data-note]`, joués par
   pointer-notes.js. Les octaves sont bornées C2–C7. */
import { getState, setState } from "./store.js";

const HAS_BLACK_AFTER = new Set(["C", "D", "F", "G", "A"]);
const LABELS = { C: "Do", D: "Ré", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" };
const LETTERS = ["Q", "S", "D", "F", "G", "H", "J", "K"];
const OCTAVE_MIN = 2;
const OCTAVE_MAX = 6; // baseOctave + 1 (le Sol final) ne dépasse jamais 7

/* 12 touches blanches, de Do(baseOctave) à Sol(baseOctave+1). */
function whiteKeys(baseOctave) {
  const seq = ["C", "D", "E", "F", "G", "A", "B", "C", "D", "E", "F", "G"];
  let octave = baseOctave;
  return seq.map((step, i) => {
    if (i > 0 && step === "C") octave = baseOctave + 1;
    return { step, octave };
  });
}

function renderKeys(zone) {
  const { octave } = getState();
  const baseOctave = 4 + octave;
  const whites = whiteKeys(baseOctave);
  const total = whites.length;

  zone.innerHTML = "";
  whites.forEach((k, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "melodie-key melodie-key--white";
    btn.dataset.note = `${k.step}${k.octave}`;
    btn.style.left = `${(i / total) * 100}%`;
    btn.style.width = `${(1 / total) * 100}%`;
    btn.setAttribute("aria-label", `Note ${LABELS[k.step]}${k.octave}`);
    if (i < LETTERS.length) {
      const letter = document.createElement("span");
      letter.className = "melodie-key__letter";
      letter.textContent = LETTERS[i];
      btn.appendChild(letter);
    }
    zone.appendChild(btn);

    if (i < total - 1 && HAS_BLACK_AFTER.has(k.step)) {
      const black = document.createElement("button");
      black.type = "button";
      black.className = "melodie-key melodie-key--black";
      black.dataset.note = `${k.step}#${k.octave}`;
      black.style.left = `${((i + 1) / total) * 100}%`;
      black.style.width = `${((1 / total) * 100 * 0.6).toFixed(3)}%`;
      black.setAttribute("aria-label", `Note ${LABELS[k.step]} dièse ${k.octave}`);
      zone.appendChild(black);
    }
  });
}

/** Construit le clavier dans `root` et retourne la zone `[data-note]` à
    passer à attachPointerNotes(). */
export function renderPiano(root) {
  root.innerHTML = `
    <div class="piano-octaves">
      <button class="btn btn--ghost btn--sm" type="button" data-piano-octave="-1" aria-label="Octave inférieure">Octave −</button>
      <button class="btn btn--ghost btn--sm" type="button" data-piano-octave="1" aria-label="Octave supérieure">Octave +</button>
    </div>
    <div class="piano-keys" data-piano-zone></div>
  `;
  const zone = root.querySelector("[data-piano-zone]");
  renderKeys(zone);

  root.querySelectorAll("[data-piano-octave]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const delta = Number(btn.dataset.pianoOctave);
      const next = getState().octave + delta;
      const baseOctave = 4 + next;
      if (baseOctave < OCTAVE_MIN || baseOctave > OCTAVE_MAX) return;
      setState({ octave: next });
      renderKeys(zone);
    });
  });

  return zone;
}
