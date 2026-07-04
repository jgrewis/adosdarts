/* Bootstrap de la page du jeu « Compose ta mélodie ». Externalisé pour
   permettre une CSP sans 'unsafe-inline' sur script-src. */
import { renderLayout } from "./layout.js";
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";
import { unlockAudio } from "./melodie/engine.js";
import { loadAll, isFallback, noteOn, noteOff } from "./melodie/instruments.js";
import { getState } from "./melodie/store.js";
import { renderPiano } from "./melodie/ui-piano.js";
import { attachPointerNotes } from "./melodie/pointer-notes.js";

renderLayout();
initNav();
initCookieBanner();

const root = document.querySelector("[data-melodie]");
const startBtn = root?.querySelector("[data-melodie-start]");
const intro = root?.querySelector("[data-melodie-intro]");
const loading = root?.querySelector("[data-melodie-loading]");
const instrumentPanel = root?.querySelector("[data-melodie-instrument]");
const pianoRoot = root?.querySelector("[data-melodie-piano]");

/* Allume/éteint visuellement une touche sans jamais re-rendre le clavier
   (interdit pendant le jeu, cf. CDC §5.4). */
function lightNote(note, on) {
  pianoRoot?.querySelectorAll(`[data-note="${note}"]`).forEach((key) => {
    key.classList.toggle("is-active", on);
  });
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
  if (pianoRoot) {
    const zone = renderPiano(pianoRoot);
    attachPointerNotes(zone, {
      onNoteOn: (notes) => {
        const instrument = getState().instrument;
        noteOn(notes, instrument);
        notes.forEach((n) => lightNote(n, true));
      },
      onNoteOff: (notes) => {
        const instrument = getState().instrument;
        noteOff(notes, instrument);
        notes.forEach((n) => lightNote(n, false));
      },
    });
  }
});
