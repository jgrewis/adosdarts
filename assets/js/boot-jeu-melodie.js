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
import { CHORDS, chordOn, chordOff } from "./melodie/chords.js";
import { attachPointerNotes } from "./melodie/pointer-notes.js";
import { attachKeyboard } from "./melodie/keyboard.js";
import { createRecorder } from "./melodie/recorder.js";
import { play as playRecording, stop as stopPlayback } from "./melodie/player.js";
import { saveLast, loadLast } from "./melodie/storage.js";
import { renderTransport } from "./melodie/ui-transport.js";

renderLayout();
initNav();
initCookieBanner();

const root = document.querySelector("[data-melodie]");
const startBtn = root?.querySelector("[data-melodie-start]");
const resumeBtn = root?.querySelector("[data-melodie-resume]");
const intro = root?.querySelector("[data-melodie-intro]");
const loading = root?.querySelector("[data-melodie-loading]");
const instrumentPanel = root?.querySelector("[data-melodie-instrument]");
const playRoot = root?.querySelector("[data-melodie-play]");
const chordsRoot = root?.querySelector("[data-melodie-chords]");
const transportRoot = root?.querySelector("[data-melodie-transport]");
const instrumentBtns = root?.querySelectorAll("[data-instrument]");
const lettersToggle = root?.querySelector("[data-melodie-letters]");
const modeInputs = root?.querySelectorAll('[name="melodie-mode"]');

const RENDERERS = { piano: renderPiano, guitare: renderGuitare, trompette: renderTrompette };

if (resumeBtn && loadLast()) resumeBtn.hidden = false;

/* Allume/éteint visuellement une touche ou un pad sans jamais re-rendre le
   clavier (interdit pendant le jeu, cf. CDC §5.4) : uniquement classList. */
function lightKey(container, note, on) {
  container?.querySelectorAll(`[data-note="${note}"]`).forEach((key) => {
    key.classList.toggle("is-active", on);
  });
}

const recorder = createRecorder(() => Tone.now(), {
  onLimit: (recording) => {
    finishRecording(recording);
    if (transportRefs) transportRefs.status.textContent = "Limite atteinte (5 000 notes ou 5 minutes) : enregistrement arrêté automatiquement.";
  },
});

function playNoteOn(notes) {
  const instrument = getState().instrument;
  noteOn(notes, instrument);
  notes.forEach((n) => lightKey(playRoot, n, true));
  recorder.noteOn(notes, instrument);
}
function playNoteOff(notes) {
  const instrument = getState().instrument;
  noteOff(notes, instrument);
  notes.forEach((n) => lightKey(playRoot, n, false));
  recorder.noteOff(notes, instrument);
}
function playChordOn(chordId) {
  const instrument = getState().instrument;
  chordOn(chordId, instrument);
  lightKey(chordsRoot, chordId, true);
  const notes = CHORDS[chordId]?.[instrument];
  if (notes) recorder.noteOn(notes, instrument);
}
function playChordOff(chordId) {
  const instrument = getState().instrument;
  chordOff(chordId, instrument);
  lightKey(chordsRoot, chordId, false);
  const notes = CHORDS[chordId]?.[instrument];
  if (notes) recorder.noteOff(notes, instrument);
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

/* ------------------------------------------------------- Transport ---- */
let transportRefs = null;
let lastRecording = null;
let recordTimerInterval = null;
let recordStartWall = null;
let metronomeSynth = null;
let metronomeTimer = null;

function formatTime(seconds) {
  const s = Math.max(0, Math.round(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function updateRecordTimer() {
  if (!transportRefs || recordStartWall === null) return;
  transportRefs.timer.textContent = formatTime((performance.now() - recordStartWall) / 1000);
}

function startMetronome(bpm) {
  stopMetronome();
  if (!metronomeSynth) metronomeSynth = new Tone.Synth({ volume: -12 }).toDestination();
  metronomeSynth.triggerAttackRelease("C6", "32n");
  metronomeTimer = setInterval(() => metronomeSynth.triggerAttackRelease("C6", "32n"), 60000 / bpm);
}
function stopMetronome() {
  if (metronomeTimer) clearInterval(metronomeTimer);
  metronomeTimer = null;
}

function finishRecording(recording) {
  if (!transportRefs) return;
  const { recordBtn, stopBtn, playBtn, status } = transportRefs;
  clearInterval(recordTimerInterval);
  recordTimerInterval = null;
  recordStartWall = null;
  recordBtn.setAttribute("aria-pressed", "false");
  recordBtn.disabled = false;
  stopBtn.disabled = true;
  if (recording && recording.events.length) {
    lastRecording = recording;
    saveLast(recording);
    playBtn.disabled = false;
    status.textContent = "Enregistrement terminé, prêt à réécouter.";
  } else {
    status.textContent = "Enregistrement arrêté (aucune note jouée).";
  }
}

function triggerPlay() {
  if (!lastRecording || !transportRefs) return;
  const { playBtn, status } = transportRefs;
  playBtn.disabled = true;   // jamais deux lectures superposées
  status.textContent = "Lecture en cours";
  playRecording(lastRecording, {
    onEventStart: (ev) => ev.notes.forEach((n) => lightKey(playRoot, n, true)),
    onEventEnd: (ev) => ev.notes.forEach((n) => lightKey(playRoot, n, false)),
    onDone: () => {
      playBtn.disabled = false;
      status.textContent = "Lecture terminée.";
    },
  });
}

function setupTransport() {
  if (!transportRoot || transportRefs) return;
  transportRefs = renderTransport(transportRoot);
  const { recordBtn, stopBtn, playBtn, timer, status, metronomeToggle, tempoInput, tempoValue, volumeInput } = transportRefs;

  recordBtn.addEventListener("click", () => {
    releaseEverything();
    stopPlayback();
    recorder.start();
    recordStartWall = performance.now();
    timer.textContent = "00:00";
    recordTimerInterval = setInterval(updateRecordTimer, 200);
    recordBtn.setAttribute("aria-pressed", "true");
    recordBtn.disabled = true;
    stopBtn.disabled = false;
    playBtn.disabled = true;
    status.textContent = "Enregistrement en cours";
  });

  stopBtn.addEventListener("click", () => finishRecording(recorder.stop()));
  playBtn.addEventListener("click", triggerPlay);

  metronomeToggle.addEventListener("change", () => {
    if (metronomeToggle.checked) startMetronome(Number(tempoInput.value));
    else stopMetronome();
  });
  tempoInput.addEventListener("input", () => {
    tempoValue.textContent = `${tempoInput.value} BPM`;
    if (metronomeToggle.checked) startMetronome(Number(tempoInput.value));
  });
  volumeInput.addEventListener("input", () => {
    Tone.Destination.volume.value = Number(volumeInput.value);
  });
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
  setupTransport();
}

startBtn?.addEventListener("click", beginSession);
resumeBtn?.addEventListener("click", async () => {
  await beginSession();
  const recording = loadLast();
  if (recording) {
    lastRecording = recording;
    if (transportRefs) transportRefs.playBtn.disabled = false;
    triggerPlay();
  }
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
