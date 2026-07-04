/* Bootstrap de la page du jeu « Compose ta mélodie ». Externalisé pour
   permettre une CSP sans 'unsafe-inline' sur script-src. */
import { renderLayout } from "./layout.js";
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";
import { unlockAudio } from "./melodie/engine.js";
import { loadAll, isFallback, noteOn, noteOff } from "./melodie/instruments.js";
import { getState, setState } from "./melodie/store.js";
import { renderPiano } from "./melodie/ui-piano.js";
import { renderGuitare } from "./melodie/ui-guitare.js";
import { renderTrompette } from "./melodie/ui-trompette.js";
import { renderChords } from "./melodie/ui-chords.js";
import { chordOn, chordOff } from "./melodie/chords.js";
import { attachPointerNotes } from "./melodie/pointer-notes.js";
import { attachKeyboard } from "./melodie/keyboard.js";

renderLayout();
initNav();
initCookieBanner();

const root = document.querySelector("[data-melodie]");
const startBtn = root?.querySelector("[data-melodie-start]");
const intro = root?.querySelector("[data-melodie-intro]");
const loading = root?.querySelector("[data-melodie-loading]");
const instrumentPanel = root?.querySelector("[data-melodie-instrument]");
const playRoot = root?.querySelector("[data-melodie-play]");
const chordsRoot = root?.querySelector("[data-melodie-chords]");
const instrumentBtns = root?.querySelectorAll("[data-instrument]");
const lettersToggle = root?.querySelector("[data-melodie-letters]");
const modeInputs = root?.querySelectorAll('[name="melodie-mode"]');

const RENDERERS = { piano: renderPiano, guitare: renderGuitare, trompette: renderTrompette };

/* Allume/éteint visuellement une touche ou un pad sans jamais re-rendre le
   clavier (interdit pendant le jeu, cf. CDC §5.4) : uniquement classList. */
function lightKey(container, note, on) {
  container?.querySelectorAll(`[data-note="${note}"]`).forEach((key) => {
    key.classList.toggle("is-active", on);
  });
}

function playNoteOn(notes) {
  noteOn(notes, getState().instrument);
  notes.forEach((n) => lightKey(playRoot, n, true));
}
function playNoteOff(notes) {
  noteOff(notes, getState().instrument);
  notes.forEach((n) => lightKey(playRoot, n, false));
}
function playChordOn(chordId) {
  chordOn(chordId, getState().instrument);
  lightKey(chordsRoot, chordId, true);
}
function playChordOff(chordId) {
  chordOff(chordId, getState().instrument);
  lightKey(chordsRoot, chordId, false);
}

let pointerHandle = null;
let chordsPointerHandle = null;
let keyboardHandle = null;

function releaseEverything() {
  pointerHandle?.releaseAll();
  chordsPointerHandle?.releaseAll();
  keyboardHandle?.releaseAll();
}

function applyMode(mode) {
  if (playRoot) playRoot.hidden = mode === "chords";
  if (chordsRoot) chordsRoot.hidden = mode === "notes";
}

/* Bascule l'interface de jeu selon l'instrument actif : clavier (piano),
   cordes/boutons (guitare) ou pistons (trompette). Les pads d'accords
   restent disponibles quel que soit l'instrument (gérés à part). */
function renderInstrumentUI(instrument) {
  if (!playRoot) return;
  pointerHandle?.releaseAll();
  const render = RENDERERS[instrument] || renderPiano;
  const zone = render(playRoot);
  pointerHandle = attachPointerNotes(zone, { onNoteOn: playNoteOn, onNoteOff: playNoteOff });
}

startBtn?.addEventListener("click", async () => {
  await unlockAudio();          // DOIT rester dans ce gestionnaire de clic
  if (intro) intro.hidden = true;
  if (loading) loading.hidden = false;

  await loadAll((progress) => {
    if (loading) loading.textContent = `Chargement des sons… ${Math.round(progress * 100)} %`;
  });

  const fallbackUsed = ["piano", "guitare", "trompette"].some(isFallback);
  if (loading) {
    loading.hidden = !fallbackUsed;
    if (fallbackUsed) loading.textContent = "Son de remplacement pour certains instruments (réseau indisponible).";
  }

  if (instrumentPanel) instrumentPanel.hidden = false;
  renderInstrumentUI(getState().instrument);
  if (chordsRoot) {
    const zone = renderChords(chordsRoot);
    chordsPointerHandle = attachPointerNotes(zone, {
      onNoteOn: (ids) => ids.forEach(playChordOn),
      onNoteOff: (ids) => ids.forEach(playChordOff),
    });
  }
  keyboardHandle = attachKeyboard({
    onNoteOn: playNoteOn,
    onNoteOff: playNoteOff,
    onChordOn: playChordOn,
    onChordOff: playChordOff,
  });
  applyMode(getState().mode);
});

/* « Panic » : un Alt+Tab ou changement d'onglet pendant une note tenue ne
   doit jamais la laisser sonner à l'infini (CDC §8.3.3). */
window.addEventListener("blur", releaseEverything);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) releaseEverything();
});

instrumentBtns?.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.instrument === getState().instrument) return;
    releaseEverything();
    setState({ instrument: btn.dataset.instrument });
    instrumentBtns.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
    renderInstrumentUI(btn.dataset.instrument);
  });
});

lettersToggle?.addEventListener("change", () => {
  playRoot?.classList.toggle("hide-letters", !lettersToggle.checked);
});

modeInputs?.forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked) return;
    releaseEverything();
    setState({ mode: input.value });
    applyMode(input.value);
  });
});
