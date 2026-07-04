/* Bootstrap de la page du jeu « Compose ta mélodie ». Externalisé pour
   permettre une CSP sans 'unsafe-inline' sur script-src. */
import { renderLayout } from "./layout.js";
import { initNav } from "./nav.js";
import { initCookieBanner } from "./cookie.js";
import { unlockAudio } from "./melodie/engine.js";
import { loadAll, isFallback, noteOn, noteOff } from "./melodie/instruments.js";

renderLayout();
initNav();
initCookieBanner();

const root = document.querySelector("[data-melodie]");
const startBtn = root?.querySelector("[data-melodie-start]");
const intro = root?.querySelector("[data-melodie-intro]");
const loading = root?.querySelector("[data-melodie-loading]");
const testRow = root?.querySelector("[data-melodie-test-row]");

startBtn?.addEventListener("click", async () => {
  await unlockAudio();          // DOIT rester dans ce gestionnaire de clic
  if (intro) intro.hidden = true;
  if (loading) loading.hidden = false;

  await loadAll((progress) => {
    if (loading) loading.textContent = `Chargement des sons… ${Math.round(progress * 100)} %`;
  });

  const fallbackUsed = ["piano", "guitare", "trompette"].some(isFallback);
  if (loading) {
    loading.hidden = true;
    if (fallbackUsed) {
      loading.hidden = false;
      loading.textContent = "Son de remplacement pour certains instruments (réseau indisponible).";
    }
  }
  if (testRow) testRow.hidden = false;
});

testRow?.querySelectorAll("[data-melodie-test]").forEach((btn) => {
  const instrument = btn.dataset.melodieTest;
  btn.addEventListener("pointerdown", () => noteOn(["C4"], instrument));
  btn.addEventListener("pointerup", () => noteOff(["C4"], instrument));
  btn.addEventListener("pointercancel", () => noteOff(["C4"], instrument));
});
