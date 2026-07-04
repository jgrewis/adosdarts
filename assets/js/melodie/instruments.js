/* Les 3 instruments samplés : un Tone.Sampler chacun, avec repli synthé si le
   chargement échoue (réseau coupé, sample manquant…).
   Tone est une globale fournie par assets/vendor/tone.min.js (CSP : pas de CDN). */
/* global Tone */

const DEFS = {
  piano: {
    urls: { C3: "C3.mp3", G3: "G3.mp3", C4: "C4.mp3", G4: "G4.mp3", C5: "C5.mp3", G5: "G5.mp3" },
    baseUrl: "assets/audio/melodie/piano/",
    release: 0.4,
  },
  guitare: {
    urls: { E2: "E2.mp3", A2: "A2.mp3", D3: "D3.mp3", G3: "G3.mp3", B3: "B3.mp3", E4: "E4.mp3" },
    baseUrl: "assets/audio/melodie/guitare/",
    release: 0.6,
  },
  trompette: {
    // Les notes des samples ne sont pas exactement C4/F4/A4/C5 (dépôt libre,
    // notes les plus proches disponibles) : A#4 remplace A4 (cf. CDC §2.2.5).
    // Clé Tone.js au format "#" (dièse), fichier sur disque en "s" (interdit n° 8).
    urls: { C4: "C4.mp3", F4: "F4.mp3", G4: "G4.mp3", "A#4": "As4.mp3" },
    baseUrl: "assets/audio/melodie/trompette/",
    release: 0.2,   // fade anti-clic (CDC §3.6)
  },
};

const samplers = {};
const fallback = {};

/** Charge les 3 samplers, appelle onProgress(0..1), résout quand tout est prêt. */
export function loadAll(onProgress) {
  const ids = Object.keys(DEFS);
  let loaded = 0;
  const report = () => onProgress?.(loaded / ids.length);

  return Promise.all(
    ids.map(
      (id) =>
        new Promise((resolve) => {
          const def = DEFS[id];
          const sampler = new Tone.Sampler({
            urls: def.urls,
            baseUrl: def.baseUrl,
            release: def.release,
            onload: () => {
              samplers[id] = sampler;
              loaded += 1;
              report();
              resolve();
            },
            onerror: () => {
              // Repli : synthé polyphonique, avec message discret côté UI.
              sampler.dispose();
              samplers[id] = new Tone.PolySynth(Tone.Synth).toDestination();
              fallback[id] = true;
              loaded += 1;
              report();
              resolve();
            },
          }).toDestination();
        })
    )
  );
}

export function isFallback(instrument) {
  return Boolean(fallback[instrument]);
}

export function noteOn(notes, instrument) {
  samplers[instrument]?.triggerAttack(notes);
}

export function noteOff(notes, instrument) {
  samplers[instrument]?.triggerRelease(notes);
}
