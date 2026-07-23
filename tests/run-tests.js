/* Harnais de tests maison pour les modules purs du jeu « Compose ta
   mélodie » (recorder, serialize, chords) : pas d'infra npm sur ce site
   (R1), donc une page navigateur avec assert() et un résumé PASS/FAIL. */
import { validateRecording, encodeToUrl, decodeFromUrl } from "../assets/js/melodie/serialize.js";
import { createRecorder } from "../assets/js/melodie/recorder.js";
import { CHORDS } from "../assets/js/melodie/chords.js";
import { createChallenge, createKnownChallenge, CHALLENGE_NOTES } from "../assets/js/melodie/challenge.js";

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

/* ---- challenge : tirage injecté, donc séquences déterministes ---------- */
{
  /* Tire C4, D4, E4, F4, G4… dans l'ordre : la séquence est prévisible. */
  const suite = () => {
    let i = 0;
    return () => CHALLENGE_NOTES[i++ % CHALLENGE_NOTES.length];
  };

  {
    const defi = createChallenge({ pick: suite() });
    const sequence = defi.start();
    assert("challenge : la partie démarre à 3 notes", sequence.length === 3);
    assert("challenge : la partie démarre au niveau 1", defi.getLevel() === 1);
    assert("challenge : séquence attendue C4 D4 E4", sequence.join() === "C4,D4,E4");
  }

  {
    const defi = createChallenge({ pick: suite() });
    defi.start();
    assert("challenge : 1re note juste → correct", defi.submitNote("C4") === "correct");
    assert("challenge : 2e note juste → correct", defi.submitNote("D4") === "correct");
    assert("challenge : dernière note juste → complete", defi.submitNote("E4") === "complete");
  }

  {
    const defi = createChallenge({ pick: suite() });
    defi.start();
    assert("challenge : note fausse → wrong", defi.submitNote("G4") === "wrong");
    assert("challenge : une erreur ne fait pas perdre le niveau", defi.getLevel() === 1);
  }

  {
    const defi = createChallenge({ pick: suite() });
    defi.start();
    defi.submitNote("C4");
    const sequence = defi.retry();
    assert("challenge : retry() conserve la même séquence", sequence.join() === "C4,D4,E4");
    assert("challenge : retry() remet la saisie à zéro", defi.getProgress() === 0);
    assert("challenge : après retry(), la 1re note est de nouveau attendue", defi.submitNote("C4") === "correct");
  }

  {
    const defi = createChallenge({ pick: suite() });
    defi.start();
    const sequence = defi.nextRound();
    assert("challenge : nextRound() ajoute une note", sequence.length === 4);
    assert("challenge : nextRound() incrémente le niveau", defi.getLevel() === 2);
    assert("challenge : nextRound() conserve le début de la séquence", sequence.join() === "C4,D4,E4,F4");
    assert("challenge : nextRound() remet la saisie à zéro", defi.getProgress() === 0);
  }

  {
    const defi = createChallenge({ pick: suite() });
    assert("challenge : soumettre hors partie ne plante pas", defi.submitNote("C4") === "wrong");
    assert("challenge : niveau 0 tant que la partie n'a pas démarré", defi.getLevel() === 0);
  }

  {
    const defi = createChallenge({ pick: suite() });
    const sequence = defi.start();
    sequence.push("Z9");
    assert("challenge : getSequence() ne peut pas être mutée de l'extérieur", defi.getSequence().length === 3);
  }

  assert(
    "challenge : la gamme correspond aux 8 lettres du clavier",
    CHALLENGE_NOTES.join() === "C4,D4,E4,F4,G4,A4,B4,C5"
  );
}

/* ---- known challenge : séquence fixe, score jusqu'à la 1re erreur ------ */
{
  const melodie = ["C4", "D4", "E4", "F4"];

  {
    const k = createKnownChallenge(melodie);
    assert("known : total = nombre de notes", k.getTotal() === 4);
    assert("known : score initial 0", k.getProgress() === 0);
  }

  {
    const k = createKnownChallenge(melodie);
    assert("known : 1re note juste → correct", k.submitNote("C4") === "correct");
    assert("known : score = 1 après une note juste", k.getProgress() === 1);
    assert("known : notes suivantes justes → correct", k.submitNote("D4") === "correct" && k.submitNote("E4") === "correct");
    assert("known : dernière note juste → complete", k.submitNote("F4") === "complete");
    assert("known : score parfait = total", k.getProgress() === 4);
  }

  {
    const k = createKnownChallenge(melodie);
    k.submitNote("C4");
    k.submitNote("D4");
    assert("known : note fausse → wrong", k.submitNote("A4") === "wrong");
    assert("known : score figé aux notes justes avant l'erreur", k.getProgress() === 2);
  }

  {
    const k = createKnownChallenge(melodie);
    assert("known : erreur dès la 1re note → wrong", k.submitNote("G4") === "wrong");
    assert("known : score 0 si erreur immédiate", k.getProgress() === 0);
  }

  {
    const k = createKnownChallenge(melodie);
    k.submitNote("C4");
    k.reset();
    assert("known : reset() remet le score à 0", k.getProgress() === 0);
    assert("known : après reset(), la 1re note est de nouveau attendue", k.submitNote("C4") === "correct");
  }

  {
    const k = createKnownChallenge(melodie);
    const seq = k.getSequence();
    seq.push("Z9");
    assert("known : getSequence() ne peut pas être mutée de l'extérieur", k.getSequence().length === 4);
  }
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
