/* Rendu de la trompette : une rangée de 8 gros pistons ronds sur la gamme de
   Do (Do4 à Do5). Aucune logique audio ici (§5.3) : boutons `[data-note]`,
   joués par pointer-notes.js comme les autres interfaces. */
const NOTES = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
const LABELS = { C: "Do", D: "Ré", E: "Mi", F: "Fa", G: "Sol", A: "La", B: "Si" };

export function renderTrompette(root) {
  root.innerHTML = "";
  const zone = document.createElement("div");
  zone.className = "trompette-keys";
  zone.setAttribute("data-trompette-zone", "");
  NOTES.forEach((note) => {
    const step = note[0];
    const octave = note.slice(1);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "melodie-piston";
    btn.dataset.note = note;
    btn.setAttribute("aria-label", `Note ${LABELS[step]}${octave}`);
    zone.appendChild(btn);
  });
  root.appendChild(zone);
  return zone;
}
