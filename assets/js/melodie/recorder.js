/* Capture des événements joués (notes ou accords), horodatés avec une
   horloge INJECTÉE (ex. () => Tone.now() en prod) pour rester testable sans
   audio (§5.3 du CDC). Garde-fou : au-delà de 300 s ou 5000 événements, arrêt
   automatique (repli anti-fuite mémoire/URL trop longue). */
export function createRecorder(now, { maxDuration = 300, maxEvents = 5000, onLimit } = {}) {
  let t0 = null;
  let events = [];
  let open = new Map(); // clé "instrument:notes triées" -> événement ouvert
  let running = false;

  function keyFor(notes, instrument) {
    return `${instrument}:${notes.slice().sort().join(",")}`;
  }

  function start() {
    running = true;
    t0 = null;
    events = [];
    open.clear();
  }

  function noteOn(notes, instrument) {
    if (!running) return;
    if (t0 === null) t0 = now();          // t0 fixé au premier noteOn (CDC §7 étape 7)
    const ev = { time: now() - t0, duration: 0, notes: notes.slice(), instrument };
    events.push(ev);
    open.set(keyFor(notes, instrument), ev);

    if (events.length >= maxEvents || now() - t0 >= maxDuration) {
      const recording = stop();
      onLimit?.(recording);
    }
  }

  function noteOff(notes, instrument) {
    if (!running || t0 === null) return;
    const key = keyFor(notes, instrument);
    const ev = open.get(key);
    if (!ev) return;
    ev.duration = now() - t0 - ev.time;
    open.delete(key);
  }

  function stop() {
    if (!running) return null;
    if (t0 !== null) {
      // Ferme les événements encore tenus au moment du Stop.
      open.forEach((ev) => { ev.duration = now() - t0 - ev.time; });
    }
    open.clear();
    running = false;
    return {
      version: 1,
      title: "Ma mélodie",
      createdAt: new Date().toISOString(),
      events: events.slice().sort((a, b) => a.time - b.time),
    };
  }

  function isRecording() { return running; }

  return { start, noteOn, noteOff, stop, isRecording };
}
