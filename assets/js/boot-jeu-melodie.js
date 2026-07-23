/* Bootstrap de la page du jeu « Compose ta mélodie ». Externalisé pour
   permettre une CSP sans 'unsafe-inline' sur script-src.
   Tone est une globale fournie par assets/vendor/tone.min.js. */
/* global Tone */
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
import { play as playRecording, stop as stopPlayback } from "./melodie/player.js";
import { loadBestLevel, saveBestLevel, loadBestScores, saveBestScore } from "./melodie/storage.js";
import { createChallenge, createKnownChallenge, CHALLENGE_NOTES } from "./melodie/challenge.js";
import { renderChallenge, renderProgress, renderSongButtons } from "./melodie/ui-challenge.js";
import { loadDemos } from "./melodie/demos.js";

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
const challengeRoot = root?.querySelector("[data-melodie-challenge]");

const RENDERERS = { piano: renderPiano, guitare: renderGuitare, trompette: renderTrompette };

/* iOS coupe le son si le commutateur silencieux physique est activé, sans
   moyen fiable de le détecter : on affiche juste une astuce pour cette
   plateforme (CDC §3.9, §9 étape 9). */
const iosHint = root?.querySelector("[data-melodie-ios-hint]");
if (iosHint && /iPad|iPhone|iPod/.test(navigator.userAgent)) iosHint.hidden = false;

/* Allume/éteint visuellement une touche ou un pad sans jamais re-rendre le
   clavier (interdit pendant le jeu, cf. CDC §5.4) : uniquement classList. */
function lightKey(container, note, on) {
  container?.querySelectorAll(`[data-note="${note}"]`).forEach((key) => {
    key.classList.toggle("is-active", on);
  });
}

function playNoteOn(notes) {
  const instrument = getState().instrument;
  noteOn(notes, instrument);
  notes.forEach((n) => lightKey(playRoot, n, true));
  submitDefiNote(notes[0]);   // no-op hors du défi (voir setupChallenge)
}
function playNoteOff(notes) {
  const instrument = getState().instrument;
  noteOff(notes, instrument);
  notes.forEach((n) => lightKey(playRoot, n, false));
}
function playChordOn(chordId) {
  const instrument = getState().instrument;
  chordOn(chordId, instrument);
  lightKey(chordsRoot, chordId, true);
}
function playChordOff(chordId) {
  const instrument = getState().instrument;
  chordOff(chordId, instrument);
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
   boutons-notes (guitare) ou pistons (trompette). Les pads d'accords
   restent disponibles quel que soit l'instrument (gérés à part). */
function renderInstrumentUI(instrument) {
  if (!playRoot) return;
  pointerHandle?.releaseAll();
  const render = RENDERERS[instrument] || renderPiano;
  const zone = render(playRoot);
  pointerHandle = attachPointerNotes(zone, { onNoteOn: playNoteOn, onNoteOff: playNoteOff });
}

/* --------------------------------------------------------- Défi ------- */
/* Deux modes : « surprise » (séquence aléatoire qui s'allonge) et « connue »
   (un air d'exemple, noté jusqu'à la première erreur). Les deux forcent le
   piano à l'octave 0 : c'est le seul instrument dont toutes les notes du défi
   sont visibles à l'écran. */
const DEMO_STEP = 0.6;      // secondes entre deux notes (mode surprise)
const DEMO_DURATION = 0.45; // durée d'une note démontrée (mode surprise)
let defiRefs = null;
let defiMode = "surprise";  // "surprise" | "connue"
let defiPhase = "off";      // "off" | "demo" (saisie bloquée) | "input" | "result"
let demoTimers = [];
let challenge = null;       // mode surprise
let knownChallenge = null;  // mode connue
let currentSong = null;     // mélodie connue en cours
let demoMelodies = [];      // airs chargés depuis les démos

/* Coupe toute démonstration en cours (surprise ET connue) : annule les notes
   programmées, arrête la lecture d'un air, relâche et éteint les touches. */
function stopDemonstration() {
  demoTimers.forEach(clearTimeout);
  demoTimers = [];
  stopPlayback();
  CHALLENGE_NOTES.forEach((n) => {
    noteOff([n], "piano");
    lightKey(playRoot, n, false);
  });
}

function setDefiStatus(text, variant) {
  if (!defiRefs) return;
  defiRefs.status.className = "melodie-defi__status" + (variant ? ` melodie-defi__status--${variant}` : "");
  defiRefs.status.textContent = text;
}

/* Force piano + octave 0 + mode notes, sans passer par les gestionnaires de
   clic (qui, eux, interrompraient le défi). */
function forcePianoForDefi() {
  releaseEverything();
  setState({ instrument: "piano", octave: 0, mode: "notes" });
  instrumentBtns?.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.instrument === "piano")));
  modeInputs?.forEach((i) => { i.checked = i.value === "notes"; });
  renderInstrumentUI("piano");
  applyMode("notes");
}

/* Retour à l'état inactif, quel que soit le mode : abandonne toute tentative. */
function resetDefi(message) {
  defiPhase = "off";        // avant stopDemonstration : neutralise les timers en vol
  stopDemonstration();
  releaseEverything();
  challenge = null;
  knownChallenge = null;
  currentSong = null;
  if (!defiRefs) return;
  defiRefs.startBtn.hidden = false;
  defiRefs.quitBtn.hidden = true;
  defiRefs.level.textContent = "—";
  defiRefs.replayBtn.hidden = true;
  defiRefs.changeBtn.hidden = true;
  defiRefs.knownScoreWrap.hidden = true;
  setDefiStatus(message || "");
  renderProgress(defiRefs.progress, 0, 0);
}

/* --- Mode surprise ---------------------------------------------------- */
function updateSurpriseScore() {
  if (!defiRefs) return;
  defiRefs.level.textContent = challenge ? String(challenge.getLevel()) : "—";
  const best = loadBestLevel();
  if (best > 0) {
    defiRefs.recordWrap.hidden = false;
    defiRefs.record.textContent = String(best);
  }
}

/* Rejoue la séquence par le MÊME chemin que les touches (noteOn/noteOff →
   sampler direct), et non par Tone.Transport : avec lookAhead=0 (mode faible
   latence), le Transport peut avaler ses premières notes. */
function demoSequence(sequence) {
  stopDemonstration();
  defiPhase = "demo";
  renderProgress(defiRefs.progress, sequence.length, 0);
  setDefiStatus("Écoute bien…");

  const stepMs = DEMO_STEP * 1000;
  const durMs = DEMO_DURATION * 1000;

  sequence.forEach((note, i) => {
    demoTimers.push(setTimeout(() => {
      if (defiPhase !== "demo") return;
      noteOn([note], "piano");
      lightKey(playRoot, note, true);
      demoTimers.push(setTimeout(() => {
        noteOff([note], "piano");
        lightKey(playRoot, note, false);
      }, durMs));
    }, i * stepMs));
  });

  const endMs = (sequence.length - 1) * stepMs + durMs + 200;
  demoTimers.push(setTimeout(() => {
    if (defiPhase !== "demo") return;
    defiPhase = "input";
    setDefiStatus("À toi de jouer !");
  }, endMs));
}

function startDefi() {
  if (!defiRefs) return;
  forcePianoForDefi();
  challenge = createChallenge();
  defiRefs.startBtn.hidden = true;
  defiRefs.quitBtn.hidden = false;
  const sequence = challenge.start();
  updateSurpriseScore();
  demoSequence(sequence);
}

function submitSurpriseNote(note) {
  const result = challenge.submitNote(note);

  if (result === "wrong") {
    defiPhase = "demo";   // bloque la saisie jusqu'à la nouvelle démonstration
    setDefiStatus("✗ Raté. Réécoute la mélodie…", "wrong");
    const sequence = challenge.retry();
    setTimeout(() => { if (defiPhase === "demo") demoSequence(sequence); }, 900);
    return;
  }

  renderProgress(defiRefs.progress, challenge.getSequence().length, challenge.getProgress());
  if (result !== "complete") return;

  const clearedLevel = challenge.getLevel();
  if (clearedLevel > loadBestLevel()) saveBestLevel(clearedLevel);
  defiPhase = "demo";
  setDefiStatus(`✓ Bravo ! Niveau ${clearedLevel} réussi.`, "ok");
  const sequence = challenge.nextRound();
  updateSurpriseScore();
  setTimeout(() => { if (defiPhase === "demo") demoSequence(sequence); }, 1100);
}

/* --- Mode connue ------------------------------------------------------ */
function renderKnownSongs() {
  if (!defiRefs) return;
  renderSongButtons(defiRefs.songs, demoMelodies, loadBestScores(), pickSong);
}

/* Démonstration d'un air : rejoue l'enregistrement réel (avec son rythme) via
   player.js — fiable depuis la correction du chemin de lecture. */
function demoKnown(recording) {
  stopDemonstration();
  defiPhase = "demo";
  renderProgress(defiRefs.progress, recording.events.length, 0);
  setDefiStatus("Écoute bien…");
  playRecording(recording, {
    onEventStart: (ev) => ev.notes.forEach((n) => lightKey(playRoot, n, true)),
    onEventEnd: (ev) => ev.notes.forEach((n) => lightKey(playRoot, n, false)),
    onDone: () => {
      if (defiPhase !== "demo") return;
      defiPhase = "input";
      setDefiStatus("À toi de jouer !");
    },
  });
}

function pickSong(melodie) {
  if (!defiRefs) return;
  forcePianoForDefi();
  currentSong = melodie;
  knownChallenge = createKnownChallenge(melodie.events.map((ev) => ev.notes[0]));
  defiRefs.replayBtn.hidden = false;
  defiRefs.changeBtn.hidden = false;
  defiRefs.knownScoreWrap.hidden = false;
  defiRefs.score.textContent = "0";
  defiRefs.total.textContent = String(knownChallenge.getTotal());
  demoKnown(melodie);
}

function replaySong() {
  if (!currentSong || !knownChallenge) return;
  knownChallenge.reset();
  defiRefs.score.textContent = "0";
  demoKnown(currentSong);
}

function endKnownAttempt(perfect) {
  defiPhase = "result";     // plus de saisie notée, mais Réécouter/Arrêter restent possibles
  const score = knownChallenge.getProgress();
  const total = knownChallenge.getTotal();
  saveBestScore(currentSong.title, score);
  defiRefs.score.textContent = String(score);
  setDefiStatus(
    perfect ? `✓ Parfait ! ${score} / ${total}` : `✗ Raté — score : ${score} / ${total}`,
    perfect ? "ok" : "wrong"
  );
  renderKnownSongs();       // rafraîchit les records affichés sur les boutons d'airs
}

function submitKnownNote(note) {
  if (!knownChallenge) return;
  const result = knownChallenge.submitNote(note);
  if (result === "wrong") {
    endKnownAttempt(false);
    return;
  }
  const progress = knownChallenge.getProgress();
  defiRefs.score.textContent = String(progress);
  renderProgress(defiRefs.progress, knownChallenge.getTotal(), progress);
  if (result === "complete") endKnownAttempt(true);
}

/* --- Aiguillage saisie + bascule de mode ------------------------------ */
function submitDefiNote(note) {
  if (defiPhase !== "input" || !note) return;
  if (defiMode === "connue") submitKnownNote(note);
  else if (challenge) submitSurpriseNote(note);
}

function setDefiMode(mode) {
  if (mode === defiMode || !defiRefs) return;
  resetDefi("");
  defiMode = mode;
  defiRefs.modeBtns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.defiMode === mode)));
  defiRefs.panes.forEach((p) => { p.hidden = p.dataset.defiPane !== mode; });
}

async function setupChallenge() {
  if (!challengeRoot || defiRefs) return;
  defiRefs = renderChallenge(challengeRoot);
  updateSurpriseScore();
  demoMelodies = await loadDemos();
  renderKnownSongs();

  defiRefs.startBtn.addEventListener("click", startDefi);
  defiRefs.quitBtn.addEventListener("click", () => resetDefi("Défi quitté."));
  defiRefs.replayBtn.addEventListener("click", replaySong);
  defiRefs.changeBtn.addEventListener("click", () => resetDefi(""));
  defiRefs.modeBtns.forEach((btn) => btn.addEventListener("click", () => setDefiMode(btn.dataset.defiMode)));
}

/* --------------------------------------------------------- Démarrage -- */
let sessionStarted = false;

async function beginSession() {
  if (sessionStarted) return;
  sessionStarted = true;

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
  await setupChallenge();
}

startBtn?.addEventListener("click", beginSession);

/* « Panic » : un Alt+Tab ou changement d'onglet pendant une note tenue ne
   doit jamais la laisser sonner à l'infini (CDC §8.3.3). */
window.addEventListener("blur", releaseEverything);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) return;
  releaseEverything();
  // Onglet caché pendant un défi : on l'interrompt (une démonstration en cours
  // deviendrait incohérente au retour).
  if (defiPhase !== "off") resetDefi("Défi interrompu.");
});

instrumentBtns?.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.instrument === getState().instrument) return;
    if (defiPhase !== "off") resetDefi("Défi interrompu (changement d'instrument).");
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
    if (defiPhase !== "off") resetDefi("Défi interrompu (changement de mode).");
    releaseEverything();
    setState({ mode: input.value });
    applyMode(input.value);
  });
});
