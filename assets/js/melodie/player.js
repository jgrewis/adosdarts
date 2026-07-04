/* Rejeu fidèle d'un Recording (notes, durées, timing, instrument) via
   Tone.Part, avec illumination synchronisée par Tone.Draw.
   Tone est une globale fournie par assets/vendor/tone.min.js. */
/* global Tone */
import { getSampler } from "./instruments.js";

let part = null;
let doneTimer = null;

export function play(recording, { onEventStart, onEventEnd, onDone } = {}) {
  stop(); // « ▶ » pendant une lecture déjà en cours ne doit jamais en superposer une deuxième

  // Astuce de stabilité (CDC §8.3.10) : lookAhead=0 (jeu live) peut faire
  // vaciller un Tone.Part ; on le remonte pendant la lecture non interactive.
  Tone.context.lookAhead = 0.1;

  const events = recording.events;
  part = new Tone.Part((time, ev) => {
    const sampler = getSampler(ev.instrument);
    const duration = Math.max(ev.duration, 0.05);
    sampler?.triggerAttackRelease(ev.notes, duration, time);
    Tone.Draw.schedule(() => onEventStart?.(ev), time);
    Tone.Draw.schedule(() => onEventEnd?.(ev), time + duration);
  }, events.map((ev) => [ev.time, ev]));
  part.start(0);

  const totalDuration = events.reduce((max, ev) => Math.max(max, ev.time + ev.duration), 0);
  part.stop(totalDuration + 0.2);
  Tone.Transport.start();

  doneTimer = setTimeout(() => {
    stop();
    onDone?.();
  }, (totalDuration + 0.3) * 1000);
}

export function stop() {
  if (doneTimer) { clearTimeout(doneTimer); doneTimer = null; }
  if (part) { part.dispose(); part = null; }
  Tone.Transport.stop();
  Tone.Transport.cancel();
  Tone.context.lookAhead = 0;
}

export function isPlaying() { return part !== null; }
