/* Harnais de tests maison pour les modules purs du jeu « Compose ta
   mélodie » (recorder, serialize, chords) : pas d'infra npm sur ce site
   (R1), donc une page navigateur avec assert() et un résumé PASS/FAIL. */
import { validateRecording, encodeToUrl, decodeFromUrl } from "../assets/js/melodie/serialize.js";
import { createRecorder } from "../assets/js/melodie/recorder.js";
import { CHORDS } from "../assets/js/melodie/chords.js";

const results = [];
function assert(name, condition) {
  results.push({ name, pass: Boolean(condition) });
}

/* ---- recorder : deux notes séquentielles + un accord, horloge factice --- */
{
  let t = 0;
  const rec = createRecorder(() => t);
  rec.start();
  t = 0; rec.noteOn(["C4"], "piano"); t = 0.5; rec.noteOff(["C4"], "piano");
  t = 1; rec.noteOn(["D4"], "piano"); t = 1.3; rec.noteOff(["D4"], "piano");
  t = 2; rec.noteOn(["C4", "E4", "G4"], "piano"); t = 2.6; rec.noteOff(["C4", "E4", "G4"], "piano");
  const recording = rec.stop();

  assert("recorder : 3 événements capturés", recording.events.length === 3);
  assert("recorder : time du 1er événement", recording.events[0].time === 0);
  assert("recorder : duration du 1er événement", Math.abs(recording.events[0].duration - 0.5) < 1e-9);
  assert("recorder : time du 2e événement", recording.events[1].time === 1);
  assert("recorder : duration du 2e événement", Math.abs(recording.events[1].duration - 0.3) < 1e-9);
  assert("recorder : accord — time et duration exacts", recording.events[2].time === 2 && Math.abs(recording.events[2].duration - 0.6) < 1e-9);
  assert("recorder : accord — 3 notes", recording.events[2].notes.length === 3);
}

/* ---- recorder : note encore tenue au stop() -------------------------- */
{
  let t = 0;
  const rec = createRecorder(() => t);
  rec.start();
  t = 0; rec.noteOn(["G4"], "piano");
  t = 5; // pas de noteOff avant le stop
  const recording = rec.stop();
  assert("recorder : note tenue fermée correctement au stop()", Math.abs(recording.events[0].duration - 5) < 1e-9);
}

/* ---- serialize : aller-retour JSON/lz-string -------------------------- */
{
  const sample = {
    version: 1,
    title: "Test",
    createdAt: new Date().toISOString(),
    events: [{ time: 0, duration: 0.5, notes: ["C4"], instrument: "piano" }],
  };
  const url = encodeToUrl(sample);
  const hash = url ? url.slice(url.indexOf("#")) : "";
  const decoded = decodeFromUrl(hash);
  assert("serialize : encode() produit une URL", typeof url === "string" && url.includes("#m="));
  assert("serialize : round-trip titre identique", decoded && decoded.title === sample.title);
  assert("serialize : round-trip events identiques", decoded && JSON.stringify(decoded.events) === JSON.stringify(sample.events));
}

/* ---- validateRecording : cas valides et malveillants ------------------ */
{
  const valid = {
    version: 1,
    title: "Valide",
    createdAt: new Date().toISOString(),
    events: [{ time: 0, duration: 0.5, notes: ["C4"], instrument: "piano" }],
  };
  assert("validateRecording : accepte une prise valide", validateRecording(valid) !== null);
  assert("validateRecording : rejette version ≠ 1", validateRecording({ ...valid, version: 2 }) === null);
  assert(
    "validateRecording : rejette une note invalide (<script>)",
    validateRecording({ ...valid, events: [{ time: 0, duration: 0.5, notes: ["<script>"], instrument: "piano" }] }) === null
  );
  assert(
    "validateRecording : rejette un time négatif",
    validateRecording({ ...valid, events: [{ time: -1, duration: 0.5, notes: ["C4"], instrument: "piano" }] }) === null
  );
  const manyEvents = Array.from({ length: 6000 }, (_, i) => ({ time: i * 0.01, duration: 0.05, notes: ["C4"], instrument: "piano" }));
  assert("validateRecording : rejette 6000 événements", validateRecording({ ...valid, events: manyEvents }) === null);
  assert(
    "validateRecording : rejette une durée totale de 400 s",
    validateRecording({ ...valid, events: [{ time: 0, duration: 30, notes: ["C4"], instrument: "piano" }, { time: 370, duration: 30, notes: ["C4"], instrument: "piano" }] }) === null
  );
}

/* ---- chords : voicings pour les 3 instruments ------------------------- */
{
  const instruments = ["piano", "guitare", "trompette"];
  Object.entries(CHORDS).forEach(([id, chord]) => {
    instruments.forEach((instrument) => {
      assert(`chords : ${id} a un voicing ${instrument} d'au moins 3 notes`, Array.isArray(chord[instrument]) && chord[instrument].length >= 3);
    });
  });
}

/* ---- Rendu des résultats ----------------------------------------------- */
const list = document.getElementById("results");
const summary = document.getElementById("summary");
let passCount = 0;
results.forEach(({ name, pass }) => {
  if (pass) passCount += 1;
  const li = document.createElement("li");
  li.textContent = `${pass ? "PASS" : "FAIL"} — ${name}`;
  li.style.color = pass ? "green" : "red";
  list.appendChild(li);
});
summary.textContent = `${passCount} / ${results.length} tests réussis`;
