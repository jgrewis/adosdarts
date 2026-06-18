/* Compte à rebours jusqu'à l'ouverture des portes (samedi 22 août 2026, 15h00,
   heure de Paris). La cible est fournie en ISO avec décalage horaire explicite
   dans edition.json (ouverture_iso), ce qui rend le calcul indépendant du
   fuseau du visiteur. */

const UNITS = [
  { key: "jours", div: 86_400_000 },
  { key: "heures", div: 3_600_000, mod: 24 },
  { key: "min", div: 60_000, mod: 60 },
  { key: "sec", div: 1_000, mod: 60 },
];

/**
 * Démarre un compte à rebours accessible dans `el` vers la date ISO `targetIso`.
 * Affiche un message de bascule lorsque l'échéance est atteinte.
 */
export function startCountdown(el, targetIso) {
  if (!el || !targetIso) return;
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return;

  el.className = "countdown";
  el.setAttribute("role", "timer");
  el.setAttribute("aria-label", "Compte à rebours avant l'ouverture des portes");

  let timer;

  const render = () => {
    const diff = target - Date.now();

    if (diff <= 0) {
      el.innerHTML =
        '<p class="countdown__live">C\'est aujourd\'hui — rendez-vous à L\'Escapade !</p>';
      el.removeAttribute("role");
      clearInterval(timer);
      return;
    }

    el.innerHTML = UNITS.map(({ key, div, mod }) => {
      let value = Math.floor(diff / div);
      if (mod) value %= mod;
      return `
        <div class="countdown__unit">
          <span class="countdown__value">${String(value).padStart(2, "0")}</span>
          <span class="countdown__label">${key}</span>
        </div>`;
    }).join("");
  };

  render();
  timer = setInterval(render, 1000);
}
