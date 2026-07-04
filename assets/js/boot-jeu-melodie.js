/* Bootstrap de la page du jeu « Compose ta mélodie ». Externalisé pour
   permettre une CSP sans 'unsafe-inline' sur script-src. */
/* global Tone */
import { renderLayout } from "./layout.js";
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";
import { unlockAudio } from "./melodie/engine.js";

renderLayout();
initNav();
initCookieBanner();

const root = document.querySelector("[data-melodie]");
const startBtn = root?.querySelector("[data-melodie-start]");
const intro = root?.querySelector("[data-melodie-intro]");
const testBtn = root?.querySelector("[data-melodie-test]");

startBtn?.addEventListener("click", async () => {
  await unlockAudio();          // DOIT rester dans ce gestionnaire de clic
  if (intro) intro.hidden = true;
  if (testBtn) testBtn.hidden = false;
});

// Synthé temporaire, remplacé par les vrais samplers à l'étape 2.
const testSynth = new Tone.Synth().toDestination();
testBtn?.addEventListener("pointerdown", () => testSynth.triggerAttack("C4"));
testBtn?.addEventListener("pointerup", () => testSynth.triggerRelease());
testBtn?.addEventListener("pointercancel", () => testSynth.triggerRelease());
