/* Moteur audio : déblocage du contexte et réglage faible latence.
   Tone est une globale fournie par assets/vendor/tone.min.js (CSP : pas de CDN). */
/* global Tone */

let unlocked = false;

export async function unlockAudio() {
  if (unlocked) return;
  await Tone.start();              // DOIT être appelé depuis un geste utilisateur
  Tone.context.lookAhead = 0;      // mode faible latence : le son part immédiatement
  unlocked = true;
}

export function isUnlocked() { return unlocked; }
