/* Rendu du panneau du défi. Deux modes : « Mélodie surprise » (séquence
   aléatoire qui s'allonge) et « Mélodie connue » (un air d'exemple, noté).
   Aucune logique audio ni de jeu ici (§5.3 du CDC) : boot-jeu-melodie.js câble
   les événements sur les éléments retournés. */

export function renderChallenge(root) {
  root.innerHTML = `
    <div class="melodie-defi">
      <h2 class="melodie-defi__title">Défi</h2>

      <div class="melodie-defi__modes" role="group" aria-label="Type de défi">
        <button type="button" class="melodie-defi__mode" data-defi-mode="surprise" aria-pressed="true">Mélodie surprise</button>
        <button type="button" class="melodie-defi__mode" data-defi-mode="connue" aria-pressed="false">Mélodie connue</button>
      </div>

      <div class="melodie-defi__pane" data-defi-pane="surprise">
        <p class="melodie-defi__intro">Écoute la suite de notes, puis rejoue-la. À chaque réussite, une note s'ajoute.</p>
        <div class="melodie-defi__bar">
          <button type="button" class="melodie-defi__btn melodie-defi__btn--start" data-defi-start>Démarrer</button>
          <button type="button" class="melodie-defi__btn" data-defi-quit hidden>Quitter</button>
          <p class="melodie-defi__score">
            Niveau <b data-defi-level>—</b>
            <span class="melodie-defi__record" data-defi-record-wrap hidden>· Record <b data-defi-record>0</b></span>
          </p>
        </div>
      </div>

      <div class="melodie-defi__pane" data-defi-pane="connue" hidden>
        <p class="melodie-defi__intro">Choisis un air, écoute-le, puis rejoue-le. Le score compte les notes justes jusqu'à la première erreur.</p>
        <div class="melodie-defi__songs" data-defi-songs role="group" aria-label="Choisir une mélodie"></div>
        <div class="melodie-defi__bar">
          <button type="button" class="melodie-defi__btn" data-defi-replay hidden>Réécouter</button>
          <button type="button" class="melodie-defi__btn" data-defi-change hidden>Changer d'air</button>
          <p class="melodie-defi__score melodie-defi__score--known" data-defi-known-score hidden>
            Score <b data-defi-score>—</b> / <b data-defi-total>—</b>
          </p>
        </div>
      </div>

      <p class="melodie-defi__status" data-defi-status role="status" aria-live="polite"></p>
      <ol class="melodie-defi__progress" data-defi-progress aria-hidden="true"></ol>
    </div>
  `;

  return {
    modeBtns: root.querySelectorAll("[data-defi-mode]"),
    panes: root.querySelectorAll("[data-defi-pane]"),
    // mode surprise
    startBtn: root.querySelector("[data-defi-start]"),
    quitBtn: root.querySelector("[data-defi-quit]"),
    level: root.querySelector("[data-defi-level]"),
    record: root.querySelector("[data-defi-record]"),
    recordWrap: root.querySelector("[data-defi-record-wrap]"),
    // mode connue
    songs: root.querySelector("[data-defi-songs]"),
    replayBtn: root.querySelector("[data-defi-replay]"),
    changeBtn: root.querySelector("[data-defi-change]"),
    knownScoreWrap: root.querySelector("[data-defi-known-score]"),
    score: root.querySelector("[data-defi-score]"),
    total: root.querySelector("[data-defi-total]"),
    // partagé
    status: root.querySelector("[data-defi-status]"),
    progress: root.querySelector("[data-defi-progress]"),
  };
}

/** Dessine une pastille par note de la séquence, `done` premières remplies.
    `aria-hidden` sur la liste (posé dans le markup) : l'information est déjà
    portée par le statut textuel. */
export function renderProgress(progressRoot, total, done) {
  progressRoot.innerHTML = "";
  for (let i = 0; i < total; i += 1) {
    const dot = document.createElement("li");
    dot.className = "melodie-defi__dot";
    if (i < done) dot.classList.add("is-done");
    progressRoot.appendChild(dot);
  }
}

/** Construit les boutons de choix des mélodies connues. `melodies` vient des
    démos chargées ; `bestScores` est l'objet { titre: score }. `onPick` reçoit
    la mélodie choisie. */
export function renderSongButtons(container, melodies, bestScores, onPick) {
  container.innerHTML = "";
  melodies.forEach((melodie) => {
    const total = melodie.events.length;
    const best = Number.isInteger(bestScores[melodie.title]) ? bestScores[melodie.title] : null;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "melodie-defi__song";
    btn.innerHTML = `
      <span class="melodie-defi__song-title"></span>
      <span class="melodie-defi__song-best">${best !== null ? `Record ${best} / ${total}` : `${total} notes`}</span>
    `;
    // textContent pour le titre : jamais d'injection depuis les données (§17.2).
    btn.querySelector(".melodie-defi__song-title").textContent = melodie.title;
    btn.addEventListener("click", () => onPick(melodie));
    container.appendChild(btn);
  });
}
