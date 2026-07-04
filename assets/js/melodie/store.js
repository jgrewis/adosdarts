/* Store minimal (état global + pub/sub), sans dépendance externe. */

const state = { instrument: "piano", mode: "notes", statutRec: "idle", octave: 0 };
const listeners = new Set();

export function getState() { return state; }

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
