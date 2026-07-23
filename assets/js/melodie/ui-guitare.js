/* Rendu de la guitare — V1 : interface boutons-notes sur les 6 cordes à vide
   (Option B du CDC §3.2/§6 : les cordes horizontales grattables sont prévues
   en V1.1, cf. README). Aucune logique audio ici (§5.3) : boutons
   `[data-note]`, joués par pointer-notes.js comme les autres interfaces. */
const STRINGS = ["E2", "A2", "D3", "G3", "B3", "E4"];
const LABELS = { E: "Mi", A: "La", D: "Ré", G: "Sol", B: "Si" };

export function renderGuitare(root) {
  root.innerHTML = "";
  const zone = document.createElement("div");
  zone.className = "guitare-keys";
  zone.setAttribute("data-guitare-zone", "");
  STRINGS.forEach((note) => {
    const step = note[0];
    const octave = note.slice(1);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "melodie-string";
    btn.dataset.note = note;
    btn.setAttribute("aria-label", `Corde ${LABELS[step]}${octave}`);
    // Nom de note visible sur la pastille (sinon les 6 cordes sont des ronds
    // vides, indistinguables). Même classe que le piano : masqué par le même
    // interrupteur « Afficher les lettres ».
    const label = document.createElement("span");
    label.className = "melodie-key__letter";
    label.textContent = LABELS[step];
    btn.appendChild(label);
    zone.appendChild(btn);
  });
  root.appendChild(zone);
  return zone;
}
