/* Sérialisation d'un Recording : JSON <-> lz-string pour le partage par URL
   compressée, export/import fichier, et validation stricte à l'entrée
   (jamais de confiance aveugle dans une URL ou un fichier reçu, CDC §5.2).
   LZString est une globale fournie par assets/vendor/lz-string.min.js. */
/* global LZString */

/** @typedef {"piano" | "guitare" | "trompette"} InstrumentId */
/**
 * @typedef {Object} NoteEvent
 * @property {number} time
 * @property {number} duration
 * @property {string[]} notes
 * @property {InstrumentId} instrument
 */
/**
 * @typedef {Object} Recording
 * @property {1} version
 * @property {string} title
 * @property {string} createdAt
 * @property {NoteEvent[]} events
 */

const NOTE_RE = /^[A-G](#|b)?[0-8]$/;
const KNOWN_INSTRUMENTS = new Set(["piano", "guitare", "trompette"]);
const MAX_EVENTS = 5000;
const MAX_EVENT_DURATION = 30;
const MAX_TOTAL_DURATION = 300;
const MAX_URL_CODE_LENGTH = 8000;

/** Valide un objet quelconque et retourne un Recording propre, ou null. */
export function validateRecording(obj) {
  if (!obj || typeof obj !== "object") return null;
  if (obj.version !== 1) return null;
  if (typeof obj.title !== "string") return null;
  if (typeof obj.createdAt !== "string") return null;
  if (!Array.isArray(obj.events) || obj.events.length > MAX_EVENTS) return null;

  let totalEnd = 0;
  const events = [];
  for (const ev of obj.events) {
    if (!ev || typeof ev !== "object") return null;
    if (typeof ev.time !== "number" || !Number.isFinite(ev.time) || ev.time < 0) return null;
    if (typeof ev.duration !== "number" || !Number.isFinite(ev.duration) || ev.duration < 0 || ev.duration > MAX_EVENT_DURATION) return null;
    if (!KNOWN_INSTRUMENTS.has(ev.instrument)) return null;
    if (!Array.isArray(ev.notes) || ev.notes.length === 0) return null;
    if (!ev.notes.every((n) => typeof n === "string" && NOTE_RE.test(n))) return null;

    totalEnd = Math.max(totalEnd, ev.time + ev.duration);
    events.push({ time: ev.time, duration: ev.duration, notes: ev.notes.slice(), instrument: ev.instrument });
  }
  if (totalEnd > MAX_TOTAL_DURATION) return null;

  return { version: 1, title: obj.title, createdAt: obj.createdAt, events };
}

/** Encode un Recording en URL compressée. Retourne null si le lien serait
    trop long (> 8000 caractères) : l'UI proposera alors l'export fichier. */
export function encodeToUrl(recording) {
  const json = JSON.stringify(recording);
  const code = LZString.compressToEncodedURIComponent(json);
  if (code.length > MAX_URL_CODE_LENGTH) return null;
  return `${location.origin}${location.pathname}#m=${code}`;
}

/** Décode un fragment d'URL (`#m=...`) en Recording validé, ou null. */
export function decodeFromUrl(hash) {
  const match = /^#m=(.+)$/.exec(hash || "");
  if (!match) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(match[1]);
    if (!json) return null;
    return validateRecording(JSON.parse(json));
  } catch {
    return null;
  }
}

/** Déclenche le téléchargement d'un Recording au format `titre.melodie.json`. */
export function downloadRecording(recording) {
  const json = JSON.stringify(recording, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeTitle = (recording.title || "melodie").replace(/[^a-z0-9-_]+/gi, "-");
  a.download = `${safeTitle}.melodie.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Lit un fichier `.melodie.json` importé et retourne un Recording validé,
    ou null (jamais d'exception qui remonte). */
export async function importFromFile(file) {
  try {
    const text = await file.text();
    return validateRecording(JSON.parse(text));
  } catch {
    return null;
  }
}
