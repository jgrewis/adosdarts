/* Rendu des organisateurs (mis en avant) et des partenaires depuis
   edition.json. Échappement défensif des données injectées via innerHTML
   (cf. sanitize.js). */

import { escapeHtml, safeUrl, safeImgSrc } from "./sanitize.js";

function orga(item) {
  const url = safeUrl(item.url);
  const inner = `
    <img src="${escapeHtml(safeImgSrc(item.logo) || "")}" alt="" loading="lazy" />
    <span class="orga__label">${escapeHtml(item.nom)}</span>`;
  return url
    ? `<a class="orga" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
    : `<div class="orga">${inner}</div>`;
}

function partner(item) {
  const url = safeUrl(item.url);
  const img = `<img src="${escapeHtml(safeImgSrc(item.logo) || "")}" alt="${escapeHtml(item.nom)}" loading="lazy" />`;
  return url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${img}</a>`
    : `<span>${img}</span>`;
}

/** Injecte organisateurs + partenaires à la suite du titre déjà présent. */
export function renderPartenaires(container, edition) {
  if (!container || !edition) return;

  const orgas = (edition.organisateurs || []).map(orga).join("");
  const partners = (edition.partenaires || []).map(partner).join("");

  const block = document.createElement("div");
  block.innerHTML = `
    ${orgas ? `<div class="orga-row">${orgas}</div>` : ""}
    ${
      partners
        ? `<p class="eyebrow">Avec le soutien de</p><div class="partners-row">${partners}</div>`
        : ""
    }
  `;
  container.appendChild(block);
}
