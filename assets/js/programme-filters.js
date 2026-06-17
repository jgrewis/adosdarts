/* Programme : rendu des créneaux groupés par jour, filtres (jour / discipline /
   lieu / public), recherche et favoris persistés en localStorage (§5.1 / §5.2). */

const FAV_KEY = "adodart-favoris";

const DISCIPLINE_LABELS = {
  graff: "Graff",
  danse: "Danse",
  theatre: "Théâtre",
  beatbox: "Beatbox",
  impro: "Impro",
  percussions: "Percussions",
  photo: "Photo",
  video: "Vidéo",
  concert: "Concert",
  "stand-up": "Stand-up",
};

const PUBLIC_LABELS = {
  "tout-public": "Tout public",
  "10-17": "10-17 ans",
  famille: "En famille",
};

function loadFavs() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAV_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveFavs(set) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
}

function formatDay(dateStr) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

/* Une discipline est utilisée pour construire un nom de variable CSS et
   est interpolée dans un attribut style/data : on la réduit à un slug sûr
   (lettres, chiffres, tiret) pour empêcher toute injection d'attribut. */
function safeSlug(str) {
  return String(str || "").toLowerCase().replace(/[^a-z0-9-]/g, "");
}

export function initProgramme({ creneaux, lieux }, root) {
  const favs = loadFavs();
  const lieuLabels = Object.fromEntries(lieux.map((l) => [l.id, l.nom]));

  const state = { jour: "", discipline: "", lieu: "", public: "", q: "", favOnly: false };

  const listEl = root.querySelector("[data-programme-list]");
  const favCountEl = root.querySelector("[data-fav-count]");

  // Remplit dynamiquement les options de filtre à partir des données.
  const fill = (selector, values, labels) => {
    const sel = root.querySelector(selector);
    if (!sel) return;
    values.forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = labels[v] || v;
      sel.appendChild(opt);
    });
  };
  fill('[data-filter="jour"]', [...new Set(creneaux.map((c) => c.jour))],
    Object.fromEntries(creneaux.map((c) => [c.jour, formatDay(c.jour)])));
  fill('[data-filter="discipline"]', [...new Set(creneaux.map((c) => c.discipline))], DISCIPLINE_LABELS);
  fill('[data-filter="lieu"]', lieux.map((l) => l.id), lieuLabels);
  fill('[data-filter="public"]', [...new Set(creneaux.map((c) => c.public))], PUBLIC_LABELS);

  function matches(c) {
    if (state.jour && c.jour !== state.jour) return false;
    if (state.discipline && c.discipline !== state.discipline) return false;
    if (state.lieu && c.lieu !== state.lieu) return false;
    if (state.public && c.public !== state.public) return false;
    if (state.favOnly && !favs.has(c.id)) return false;
    if (state.q) {
      const artistes = Array.isArray(c.artistes) ? c.artistes.join(" ") : "";
      const haystack = (c.titre + " " + c.description + " " + artistes).toLowerCase();
      if (!haystack.includes(state.q.toLowerCase())) return false;
    }
    return true;
  }

  function cardHtml(c) {
    const pressed = favs.has(c.id);
    const disciplineSlug = safeSlug(c.discipline);
    const artistes = Array.isArray(c.artistes) ? c.artistes.join(", ") : "";
    const disciplineVars = `--discipline-color: var(--discipline-${disciplineSlug}); --discipline-on: var(--discipline-${disciplineSlug}-on)`;
    return `
      <article class="card card--link" style="${disciplineVars}">
        <span class="card__discipline-bar" aria-hidden="true"></span>
        <div class="card__meta">
          <span class="badge badge--discipline" style="${disciplineVars}">${escapeHtml(DISCIPLINE_LABELS[c.discipline] || c.discipline)}</span>
          <span class="badge">${escapeHtml(PUBLIC_LABELS[c.public] || c.public)}</span>
        </div>
        <h3 class="card__title">${escapeHtml(c.titre)}</h3>
        <p class="card__meta">${escapeHtml(c.heure_debut)}–${escapeHtml(c.heure_fin)} · ${escapeHtml(lieuLabels[c.lieu] || c.lieu)}</p>
        <p class="card__desc">${escapeHtml(c.description)}</p>
        <p class="card__desc"><strong>Avec :</strong> ${escapeHtml(artistes)}</p>
        <div class="card__footer">
          <button type="button" class="fav-btn" aria-pressed="${pressed}"
            data-fav="${escapeHtml(c.id)}" title="Ajouter à ma sélection">
            <span aria-hidden="true">${pressed ? "★" : "☆"}</span>
            <span class="visually-hidden">${pressed ? "Retirer de" : "Ajouter à"} ma sélection : ${escapeHtml(c.titre)}</span>
          </button>
        </div>
      </article>`;
  }

  function render() {
    const visible = creneaux.filter(matches);
    favCountEl.textContent = favs.size;

    if (visible.length === 0) {
      listEl.innerHTML = `<p class="programme-empty">Aucun créneau ne correspond à ces filtres. <button type="button" class="btn btn--sm btn--ghost" data-reset>Réinitialiser</button></p>`;
      return;
    }

    const byDay = {};
    visible.forEach((c) => (byDay[c.jour] ||= []).push(c));

    listEl.innerHTML = Object.keys(byDay)
      .sort()
      .map((day) => {
        const cards = byDay[day]
          .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut))
          .map(cardHtml)
          .join("");
        return `
          <section class="programme-day" aria-label="Programme du ${formatDay(day)}">
            <h2 class="programme-day__title">${formatDay(day)}</h2>
            <div class="block-grid">${cards}</div>
          </section>`;
      })
      .join("");
  }

  // --- Écouteurs ---
  root.querySelectorAll("[data-filter]").forEach((el) => {
    el.addEventListener("change", () => {
      state[el.dataset.filter] = el.value;
      render();
    });
  });

  const search = root.querySelector("[data-search]");
  if (search) {
    search.addEventListener("input", () => {
      state.q = search.value.trim();
      render();
    });
  }

  const favToggle = root.querySelector("[data-fav-only]");
  if (favToggle) {
    favToggle.addEventListener("change", () => {
      state.favOnly = favToggle.checked;
      render();
    });
  }

  // Délégation : favoris et reset.
  listEl.addEventListener("click", (event) => {
    const favBtn = event.target.closest("[data-fav]");
    if (favBtn) {
      const id = favBtn.dataset.fav;
      favs.has(id) ? favs.delete(id) : favs.add(id);
      saveFavs(favs);
      render();
      return;
    }
    if (event.target.closest("[data-reset]")) resetAll();
  });

  function resetAll() {
    Object.assign(state, { jour: "", discipline: "", lieu: "", public: "", q: "", favOnly: false });
    root.querySelectorAll("[data-filter]").forEach((el) => (el.value = ""));
    if (search) search.value = "";
    if (favToggle) favToggle.checked = false;
    render();
  }

  render();
}
