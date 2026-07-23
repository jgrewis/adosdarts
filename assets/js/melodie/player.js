/* Rejeu fidèle d'un Recording (notes, durées, timing, instrument).

   On planifie chaque note par setTimeout puis on la déclenche par un
   triggerAttackRelease IMMÉDIAT sur le sampler — exactement le chemin d'une
   touche jouée à la main, qui, lui, sonne. On n'utilise PAS Tone.Transport :
   avec lookAhead=0 (mode faible latence du jeu, réglé dans engine.js), le
   Transport peut avaler ses premières notes et rendre la lecture muette
   (exemples et « Réécouter »). L'illumination est déclenchée dans le même
   setTimeout que la note : synchro à quelques millisecondes.
   Tone est une globale fournie par assets/vendor/tone.min.js. */
/* global Tone */
import { getSampler } from "./instruments.js";

let timers = [];
let doneTimer = null;
let playing = false;

export function play(recording, { onEventStart, onEventEnd, onDone } = {}) {
  stop(); // « ▶ » pendant une lecture déjà en cours ne doit jamais en superposer une deuxième
  playing = true;

  const events = recording.events;
  events.forEach((ev) => {
    const duration = Math.max(ev.duration, 0.05);
    timers.push(setTimeout(() => {
      getSampler(ev.instrument)?.triggerAttackRelease(ev.notes, duration);
      onEventStart?.(ev);
      timers.push(setTimeout(() => onEventEnd?.(ev), duration * 1000));
    }, ev.time * 1000));
  });

  const totalDuration = events.reduce((max, ev) => Math.max(max, ev.time + ev.duration), 0);
  doneTimer = setTimeout(() => {
    stop();
    onDone?.();
  }, (totalDuration + 0.3) * 1000);
}

export function stop() {
  timers.forEach(clearTimeout);
  timers = [];
  if (doneTimer) { clearTimeout(doneTimer); doneTimer = null; }
  playing = false;
}

export function isPlaying() { return playing; }
