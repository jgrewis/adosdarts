/* Utilitaires d'assainissement partagés (programme.js, partenaires.js).
   Source unique : toute donnée issue des JSON passe par ici avant innerHTML. */

/* Échappe les 5 caractères sensibles — y compris les guillemets, car le
   résultat est injecté dans des contextes d'attribut (href, alt, title…). */
export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* N'autorise que des URL http(s) pour les liens externes. */
export function safeUrl(url) {
  const value = String(url || "").trim();
  return /^https?:\/\//i.test(value) ? value : null;
}

/* Source d'image : on n'accepte qu'un chemin relatif same-origin (assets
   locaux). Tout schéma (javascript:, data:, http:, //…) est écarté.
   Retourne null si la valeur est vide ou refusée. */
export function safeImgSrc(src) {
  const value = String(src || "").trim();
  if (!value) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null; // schéma explicite refusé
  if (value.startsWith("//") || value.startsWith("/")) return null; // protocole-relatif / absolu
  return value;
}
