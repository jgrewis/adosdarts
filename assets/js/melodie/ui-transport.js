/* Rendu de la barre de transport (enregistrement, relecture, métronome,
   volume). Aucune logique audio ici (§5.3) : boot-jeu-melodie.js câble les
   événements sur les éléments retournés. */
export function renderTransport(root) {
  root.innerHTML = `
    <div class="melodie-transport">
      <button type="button" class="melodie-transport__btn melodie-transport__btn--record" data-transport-record aria-pressed="false">
        <span class="melodie-transport__dot" aria-hidden="true"></span> Enregistrer
      </button>
      <button type="button" class="melodie-transport__btn" data-transport-stop disabled>■ Stop</button>
      <button type="button" class="melodie-transport__btn" data-transport-play disabled>▶ Réécouter</button>
      <span class="melodie-transport__timer" data-transport-timer>00:00</span>
      <p class="visually-hidden" role="status" aria-live="polite" data-transport-status></p>

      <label class="melodie-transport__option">
        <input type="checkbox" data-transport-metronome />
        Métronome
      </label>
      <label class="melodie-transport__option">
        Tempo
        <input type="range" min="60" max="180" step="1" value="100" data-transport-tempo aria-label="Tempo du métronome en battements par minute" />
        <span data-transport-tempo-value>100 BPM</span>
      </label>
      <label class="melodie-transport__option">
        Volume
        <input type="range" min="-40" max="0" step="1" value="-6" data-transport-volume aria-label="Volume général" />
      </label>
    </div>
  `;

  return {
    recordBtn: root.querySelector("[data-transport-record]"),
    stopBtn: root.querySelector("[data-transport-stop]"),
    playBtn: root.querySelector("[data-transport-play]"),
    timer: root.querySelector("[data-transport-timer]"),
    status: root.querySelector("[data-transport-status]"),
    metronomeToggle: root.querySelector("[data-transport-metronome]"),
    tempoInput: root.querySelector("[data-transport-tempo]"),
    tempoValue: root.querySelector("[data-transport-tempo-value]"),
    volumeInput: root.querySelector("[data-transport-volume]"),
  };
}
