/* Suivi multi-touch : un seul jeu d'écouteurs sur le conteneur de la zone de
   jeu. La touche sous chaque doigt est retrouvée par elementFromPoint, ce qui
   contourne la capture implicite des pointeurs tactiles (sinon le glissando
   ne fonctionne pas sur mobile). */
export function attachPointerNotes(zone, { onNoteOn, onNoteOff }) {
  const active = new Map(); // pointerId -> note tenue

  const noteAt = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const key = el && el.closest("[data-note]");
    return key ? key.dataset.note : null;
  };
  const press = (e) => {
    const note = noteAt(e);
    if (!note) return;
    e.preventDefault();
    active.set(e.pointerId, note);
    onNoteOn([note]);
  };
  const glide = (e) => {
    if (!active.has(e.pointerId)) return;
    const note = noteAt(e);
    const prev = active.get(e.pointerId);
    if (note === prev) return;
    if (prev) onNoteOff([prev]);
    if (note) onNoteOn([note]);
    active.set(e.pointerId, note);
  };
  const lift = (e) => {
    const prev = active.get(e.pointerId);
    if (prev) onNoteOff([prev]);
    active.delete(e.pointerId);
  };

  zone.addEventListener("pointerdown", press);
  zone.addEventListener("pointermove", glide);
  zone.addEventListener("pointerup", lift);
  zone.addEventListener("pointercancel", lift);

  return {
    releaseAll() {
      active.forEach((note) => note && onNoteOff([note]));
      active.clear();
    },
  };
}
