# Plan de réalisation séquentiel — Jeu « Compose ta mélodie »

**Référence obligatoire** : `cahier-des-charges-compose-ta-melodie.md` (version 3.0).
Ce plan est conçu pour être exécuté étape par étape par n'importe quel assistant,
sans décision d'architecture à prendre : toutes les décisions sont déjà prises.

---

## MODE D'EMPLOI DE CE PLAN (à relire au début de chaque session)

1. **Une étape à la fois, dans l'ordre.** Interdiction de commencer l'étape N+1 tant
   que TOUTES les cases de validation de l'étape N ne sont pas cochées.
2. **Avant chaque étape**, relire la section du cahier des charges (CDC) indiquée.
3. **Liste blanche de fichiers** : chaque étape liste les fichiers à créer/modifier.
   Interdiction de toucher à tout autre fichier du site. Si cela semble nécessaire,
   c'est le signe d'une erreur : s'arrêter et relire le CDC.
4. **En cas de blocage** : relire la section CDC citée, puis la section « Pièges » de
   l'étape. Si toujours bloqué, s'arrêter et poser la question à JP. **Ne jamais**
   improviser une autre solution technique (autre lib, CDN, build, framework…).
5. **Serveur local** pour tester (le site utilise `fetch`, `file://` ne marche pas) :
   ```bash
   cd /Users/jeanphilippegrewis/Documents/Claude/Projects/Adodart
   python3 -m http.server 8765
   # puis ouvrir http://localhost:8765/jeu-melodie.html
   ```
6. **Git** : travailler sur la branche `jeu-melodie` (la créer à l'étape 0). Un commit
   par étape validée, avec le message indiqué (en français, comme l'historique).
7. **Style de code** : s'inspirer des fichiers existants (`game-poubelle.js`,
   `layout.js`) — commentaires en français qui expliquent le POURQUOI, une
   responsabilité par module, pas de sur-ingénierie.

### Les 8 interdits absolus (violation = étape à refaire)

| # | Interdit | À la place |
|---|---|---|
| 1 | `npm install`, `package.json`, build, transpilation | JS vanilla, modules ES |
| 2 | Script ou CSS depuis un CDN / une URL externe | Fichiers vendorisés dans `assets/vendor/` (étapes 1 et 8 uniquement) |
| 3 | Script inline ou attribut `onclick=""`, `oninput=""`… dans le HTML | `addEventListener` dans les fichiers JS |
| 4 | Chemin absolu commençant par `/` | Chemins relatifs (`assets/...`) |
| 5 | Couleur/police/espacement en dur dans le CSS du jeu | `var(--melodie-...)` et tokens existants de `tokens.css` |
| 6 | Nouvelle police, nouvelle lib au-delà de Tone.js et lz-string | Maven Pro / Frutiger via tokens ; code maison |
| 7 | Modifier un fichier hors liste blanche de l'étape | S'arrêter, relire le CDC |
| 8 | Nom de fichier audio contenant `#` (ex. `A#3.mp3`) | Dièse noté `s` : `As3.mp3`, mappé `{ "A#3": "As3.mp3" }` |

---

## ÉTAPE 0 — La page dans le site *(CDC §0, §3.1, phase 0)*

**Objectif** : une 6ᵉ page vide mais parfaitement intégrée au site.

**Créer** : `jeu-melodie.html`, `assets/js/boot-jeu-melodie.js`, `assets/css/jeu-melodie.css` (quasi vide).
**Modifier** : `assets/js/layout.js`, `sitemap.xml`.

**Actions**
1. `git checkout -b jeu-melodie`
2. Créer `jeu-melodie.html` en copiant la structure de `principe.html` :
   même `<head>` (CSP identique, favicons, preload Maven Pro, les 6 CSS du site
   + `assets/css/jeu-melodie.css` en plus), même squelette `<body>`
   (skip-link → `[data-site-header]` → `<main id="main">` → `[data-site-footer]`
   → bannière cookies → script de boot).
   - `<title>` : `Compose ta mélodie — le jeu musical | À Dos d'Arts`
   - `meta description` : jeu musical gratuit du festival — piano, guitare, trompette jouables en ligne
   - `canonical` / `og:url` : `https://jgrewis.github.io/adosdarts/jeu-melodie.html`
   - Dans `<main>` : section `page-head` (eyebrow « Le jeu », `h1` « Compose ta mélodie »,
     phrase d'accroche) + une `<section>` vide avec `class="melodie"` et
     `data-melodie` qui accueillera le jeu.
   - En fin de body : `<script type="module" src="assets/js/boot-jeu-melodie.js"></script>`
     (les scripts vendor seront ajoutés à l'étape 1).
3. Créer `assets/js/boot-jeu-melodie.js` sur le modèle de `boot-simple.js`
   (`renderLayout()`, `initNav()`, `initCookieBanner()`) — l'init du jeu viendra plus tard.
4. Dans `assets/js/layout.js` :
   - Ajouter dans `NAV`, entre « Le festival » et « Infos pratiques » :
     `{ key: "jeu-melodie", href: "jeu-melodie.html", label: "Le jeu" }`
   - Ajouter dans `CTA` : `"jeu-melodie": { label: "Comment venir", href: "infos.html" }`
5. Ajouter la page dans `sitemap.xml` (priorité `0.7`).
6. Créer `assets/css/jeu-melodie.css` avec seulement le commentaire d'en-tête
   (rôle du fichier) et la règle `.melodie { }` vide.

**Validation (tout cocher)**
- [ ] `http://localhost:8765/jeu-melodie.html` affiche header, footer, bannière cookies identiques aux autres pages
- [ ] L'entrée « Le jeu » apparaît dans le menu de TOUTES les pages, surlignée (`aria-current`) sur la page du jeu
- [ ] Le menu mobile (hamburger) fonctionne sur la page
- [ ] Aucune erreur dans la console navigateur
- [ ] Aucun chemin commençant par `/` dans les nouveaux fichiers (`grep -n 'src="/\|href="/' jeu-melodie.html` ne renvoie rien)

**Commit** : `Jeu mélodie : squelette de page intégré au site (menu, boot, sitemap)`

---

## ÉTAPE 1 — Vendoriser Tone.js + premier son *(CDC §2.2, phase 1)*

**Objectif** : un bouton de test qui produit un son immédiat, tenu, relâché.

**Créer** : `assets/vendor/tone.min.js`, `assets/vendor/LICENCES.md`, `assets/js/melodie/engine.js`.
**Modifier** : `jeu-melodie.html`, `assets/js/boot-jeu-melodie.js`.

**Actions**
1. Télécharger Tone.js (fichier unique UMD, version FIGÉE) :
   ```bash
   curl -L -o assets/vendor/tone.min.js https://cdn.jsdelivr.net/npm/tone@14.7.77/build/Tone.min.js
   ```
   Vérifier : le fichier fait plusieurs centaines de Ko et commence par du JavaScript
   (pas une page d'erreur HTML). En cas d'échec, repli :
   `https://unpkg.com/tone@14.7.77/build/Tone.js`.
2. Créer `assets/vendor/LICENCES.md` : nom, version, origine (URL), licence (MIT) de
   Tone.js. (lz-string et les samples y seront ajoutés plus tard.)
3. Dans `jeu-melodie.html`, en fin de `<body>`, AVANT le script module :
   ```html
   <script src="assets/vendor/tone.min.js"></script>
   <script type="module" src="assets/js/boot-jeu-melodie.js"></script>
   ```
   (Script classique sans `defer` : l'ordre d'exécution est ainsi garanti.)
4. Créer `assets/js/melodie/engine.js` :
   ```js
   /* Moteur audio : déblocage du contexte et réglage faible latence.
      Tone est une globale fournie par assets/vendor/tone.min.js (CSP : pas de CDN). */
   /* global Tone */

   let unlocked = false;

   export async function unlockAudio() {
     if (unlocked) return;
     await Tone.start();              // DOIT être appelé depuis un geste utilisateur
     Tone.context.lookAhead = 0;      // mode faible latence : le son part immédiatement
     unlocked = true;
   }

   export function isUnlocked() { return unlocked; }
   ```
5. Dans la section `data-melodie` du HTML : un écran d'accueil du jeu (accroche +
   `<button data-melodie-start>Commencer</button>`) et, caché derrière lui, un bouton
   de test `<button data-melodie-test>Do</button>`.
6. Dans le boot : au clic sur « Commencer » → `await unlockAudio()` → masquer
   l'accueil, montrer le bouton de test. Sur le bouton de test, avec un
   `new Tone.Synth().toDestination()` temporaire :
   - `pointerdown` → `synth.triggerAttack("C4")`
   - `pointerup` et `pointercancel` → `synth.triggerRelease()`

**Validation**
- [ ] Sur desktop : appui = son immédiat, maintien = note tenue, relâchement = fin de note
- [ ] Sur un vrai smartphone (via IP locale, ex. `http://192.168.x.x:8765`) : idem, son instantané au toucher
- [ ] Rechargement de la page → aucun son avant d'avoir cliqué « Commencer », aucune erreur console
- [ ] La console n'affiche AUCUN avertissement « AudioContext was not allowed to start »  après le clic

**Pièges** : `Tone.start()` doit être dans le gestionnaire du clic (pas au chargement) ;
utiliser `pointerdown`, jamais `click`.

**Commit** : `Jeu mélodie : Tone.js vendorisée, déblocage audio et premier son`

---

## ÉTAPE 2 — Les vrais instruments *(CDC §3.6, phase 2)*

**Objectif** : piano, guitare, trompette échantillonnés, chargés avec pourcentage.

**Créer** : `assets/audio/melodie/{piano,guitare,trompette}/*.mp3`, `assets/js/melodie/instruments.js`.
**Modifier** : `assets/js/boot-jeu-melodie.js`, `jeu-melodie.html`, `assets/vendor/LICENCES.md`.

**Actions**
1. Récupérer les samples (source libre, une seule pour les 3 instruments) :
   ```bash
   git clone --depth 1 https://github.com/nbrosowsky/tonejs-instruments.git /tmp/tonejs-instruments
   ls /tmp/tonejs-instruments/samples/piano
   ls /tmp/tonejs-instruments/samples/guitar-nylon
   ls /tmp/tonejs-instruments/samples/trumpet
   ```
2. Copier 4 à 6 fichiers `.mp3` par instrument, espacés d'environ une quarte/quinte,
   couvrant : piano ~C3→G5, guitare ~E2→E4, trompette ~C4→C5. Listes cibles (si un
   fichier n'existe pas dans le dépôt, prendre la note disponible la plus proche) :
   - `piano/` : C3, G3, C4, G4, C5, G5
   - `guitare/` : E2, A2, D3, G3, B3, E4
   - `trompette/` : C4, F4, A4, C5
   **Renommer les dièses** : `A#3.mp3` → `As3.mp3` (interdit n° 8).
3. Vérifier le budget : `du -sh assets/audio/melodie/` → **doit être < 5 Mo**.
   Sinon, retirer des samples (4 par instrument suffisent, le Sampler interpole).
4. Compléter `assets/vendor/LICENCES.md` : origine des samples (dépôt
   tonejs-instruments), licences CC, crédits requis.
5. Créer `assets/js/melodie/instruments.js` :
   - Trois `Tone.Sampler` avec `baseUrl` **relatif** (`"assets/audio/melodie/piano/"`)
     et mapping notes → fichiers, ex. :
     ```js
     new Tone.Sampler({
       urls: { "C3": "C3.mp3", "G3": "G3.mp3", "C4": "C4.mp3",
               "G4": "G4.mp3", "C5": "C5.mp3", "G5": "G5.mp3" },
       baseUrl: "assets/audio/melodie/piano/",
       release: 0.4,
     }).toDestination();
     ```
     Trompette : ajouter `release: 0.2` minimum (fade anti-clic).
   - `export function loadAll(onProgress)` : charge les 3 samplers, appelle
     `onProgress(0..1)` (compter les buffers chargés via les callbacks `onload` de
     chaque sampler, ou `Tone.loaded()` + compteur par sampler), résout quand tout est prêt.
   - Fallback : si un sampler échoue (`onerror`), le remplacer par
     `new Tone.PolySynth(Tone.Synth).toDestination()` et noter `fallback = true`
     pour afficher un message discret « son de remplacement ».
   - `export function noteOn(notes, instrument)` → `sampler.triggerAttack(notes)`
   - `export function noteOff(notes, instrument)` → `sampler.triggerRelease(notes)`
     (les samplers Tone acceptent un tableau de notes).
6. Dans le boot : après « Commencer », afficher « Chargement des sons… XX % »
   (élément avec `role="status"` `aria-live="polite"`), puis à 100 % afficher trois
   boutons de test (un par instrument) jouant C4 au `pointerdown`.

**Validation**
- [ ] Les 3 instruments jouent C4 avec leur timbre propre (piano ≠ guitare ≠ trompette)
- [ ] Aucun clic/craquement au relâchement de la trompette
- [ ] Le pourcentage de chargement s'affiche et progresse jusqu'à 100 %
- [ ] `du -sh assets/audio/melodie/` < 5 Mo
- [ ] Réseau coupé après chargement de la page : le fallback synthé joue et le message discret apparaît (tester en bloquant le dossier audio via l'onglet Réseau des DevTools)
- [ ] Aucun nom de fichier ne contient `#` : `find assets/audio -name "*#*"` ne renvoie rien

**Commit** : `Jeu mélodie : samplers piano/guitare/trompette, chargement avec progression et fallback`

---

## ÉTAPE 3 — Le clavier de piano jouable *(CDC §3.2, §5.4, phase 3 — CŒUR DU JEU)*

**Objectif** : un clavier multi-touch avec glissando, sans jamais une note bloquée.

**Créer** : `assets/js/melodie/ui-piano.js`, `assets/js/melodie/pointer-notes.js`, `assets/js/melodie/store.js`.
**Modifier** : `assets/js/boot-jeu-melodie.js`, `assets/css/jeu-melodie.css`, `jeu-melodie.html`.

**Actions**
1. `store.js` — store minimal :
   ```js
   const state = { instrument: "piano", mode: "notes", statutRec: "idle", octave: 0 };
   const listeners = new Set();
   export function getState() { return state; }
   export function setState(patch) {
     Object.assign(state, patch);
     listeners.forEach((fn) => fn(state));
   }
   export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
   ```
2. `ui-piano.js` : générer le clavier Do4→Sol5 en `<button>` :
   - chaque touche : `class="melodie-key"` (+ `melodie-key--black` pour les noires),
     `data-note="C4"`, `aria-label="Note Do4"`, lettre AZERTY affichée (préparation étape 4)
   - touches noires positionnées en absolu au-dessus des blanches
   - boutons octave − / + (déplacent la fenêtre d'une octave, bornes C2–C7, via `store`)
3. `pointer-notes.js` — LE module délicat. Suivre EXACTEMENT le patron du CDC §5.4
   (capture implicite tactile ⇒ pas de `pointerenter`, tout sur le conteneur) :
   ```js
   /* Suivi multi-touch : un seul jeu d'écouteurs sur le conteneur de la zone de
      jeu. La touche sous chaque doigt est retrouvée par elementFromPoint, ce qui
      contourne la capture implicite des pointeurs tactiles (sinon le glissando
      ne fonctionne pas sur mobile). */
   export function attachPointerNotes(zone, { onNoteOn, onNoteOff }) {
     const active = new Map(); // pointerId -> note tenue

     const noteAt = (e) => {
       const el = document.elementFromPoint(e.clientX, e.clientY);
       const key = el && el.closest("[data-note]");
       return key ? key.dataset.note : null;
     };
     const press = (e) => {
       const note = noteAt(e);
       if (!note) return;
       e.preventDefault();
       active.set(e.pointerId, note);
       onNoteOn([note]);
     };
     const glide = (e) => {
       if (!active.has(e.pointerId)) return;
       const note = noteAt(e);
       const prev = active.get(e.pointerId);
       if (note === prev) return;
       if (prev) onNoteOff([prev]);
       if (note) onNoteOn([note]);
       active.set(e.pointerId, note);
     };
     const lift = (e) => {
       const prev = active.get(e.pointerId);
       if (prev) onNoteOff([prev]);
       active.delete(e.pointerId);
     };

     zone.addEventListener("pointerdown", press);
     zone.addEventListener("pointermove", glide);
     zone.addEventListener("pointerup", lift);
     zone.addEventListener("pointercancel", lift);

     return {
       releaseAll() {
         active.forEach((note) => note && onNoteOff([note]));
         active.clear();
       },
     };
   }
   ```
4. Câblage dans le boot : `onNoteOn` → `noteOn(notes, instrumentActif)` + ajouter la
   classe `is-active` sur la/les touches (`querySelector('[data-note="..."]')`) ;
   `onNoteOff` → l'inverse. **Jamais de re-rendu du clavier pendant le jeu** :
   uniquement `classList`.
5. CSS : `touch-action: none;` sur la zone de jeu (obligatoire), touches ≥ 48 px de
   large au doigt, `user-select: none`, illumination `.is-active` (couleurs via
   tokens provisoires — les vrais tokens arrivent à l'étape 9 ; en attendant utiliser
   `var(--brand-teal)` etc., jamais d'hexadécimal).

**Validation**
- [ ] Souris : cliquer une touche joue la note, la touche s'illumine pendant l'appui
- [ ] Souris : glisser en maintenant le bouton enchaîne les notes (glissando)
- [ ] Smartphone : accord à 3 doigts = 3 notes simultanées
- [ ] Smartphone : glisser le doigt sur le clavier enchaîne les notes
- [ ] Smartphone : le doigt qui glisse HORS du clavier puis se lève ne laisse aucune note qui sonne à l'infini
- [ ] La page ne scrolle pas pendant qu'on joue sur le clavier
- [ ] Octave −/+ déplacent la tessiture, bornes respectées

**Commit** : `Jeu mélodie : clavier de piano multi-touch avec glissando`

---

## ÉTAPE 4 — Clavier physique + sélecteur d'instrument *(CDC §3.4, phase 4)*

**Créer** : `assets/js/melodie/keyboard.js`.
**Modifier** : boot, `jeu-melodie.html`, `assets/css/jeu-melodie.css`, `ui-piano.js` (affichage des lettres).

**Actions**
1. `keyboard.js` : mapping `event.key` (minuscule) → note :
   `q,s,d,f,g,h,j,k` → `C4,D4,E4,F4,G4,A4,B4,C5` (décalé par l'octave du store).
   - `keydown` : si `event.repeat` → `return` (sinon mitraillage) ; si la touche est
     déjà tenue → `return` ; sinon `onNoteOn`.
   - `keyup` : `onNoteOff`.
   - Tenir un `Set` des touches enfoncées.
   - La rangée `a,z,e,r,t,y` est réservée aux accords (étape 5) — prévoir le branchement.
2. « Panic » : sur `window` `blur` ET `document` `visibilitychange` (masqué) →
   relâcher toutes les notes (clavier physique + `releaseAll()` du pointer) —
   sinon Alt+Tab pendant une note tenue = note infinie.
3. Sélecteur d'instrument : 3 cartes (`<button>`, image/pictogramme + nom), instrument
   actif dans le store, changement instantané (les samplers sont déjà chargés).
   Bascule de l'aide visuelle : case à cocher « Afficher les lettres du clavier ».

**Validation**
- [ ] Une mélodie jouée sur Q S D F G H J K sonne, notes tenues tant que la touche est enfoncée
- [ ] Maintenir une touche n'enclenche PAS de répétition de la note
- [ ] Clavier physique + un doigt/souris sur l'écran en même temps : pas de conflit
- [ ] Alt+Tab (ou changement d'onglet) pendant une note tenue : la note s'arrête
- [ ] Le changement d'instrument est immédiat et change le timbre des touches suivantes

**Commit** : `Jeu mélodie : clavier AZERTY, panic au blur et sélecteur d'instrument`

---

## ÉTAPE 5 — Mode accords *(CDC §3.3, phase 5)*

**Créer** : `assets/js/melodie/chords.js`, `assets/js/melodie/ui-chords.js`.
**Modifier** : boot, `keyboard.js` (rangée AZERTY), HTML, CSS.

**Actions**
1. `chords.js` — les 6 accords de Do majeur, voicings PAR INSTRUMENT :
   ```js
   export const CHORDS = {
     C:  { label: "Do",   piano: ["C4","E4","G4"],  guitare: ["C3","E3","G3","C4","E4"],      trompette: ["C4","E4","G4"] },
     Dm: { label: "Ré m", piano: ["D4","F4","A4"],  guitare: ["D3","A3","D4","F4"],           trompette: ["D4","F4","A4"] },
     Em: { label: "Mi m", piano: ["E4","G4","B4"],  guitare: ["E2","B2","E3","G3","B3","E4"], trompette: ["E4","G4","B4"] },
     F:  { label: "Fa",   piano: ["F3","A3","C4"],  guitare: ["F3","A3","C4","F4"],           trompette: ["F4","A4","C5"] },
     G:  { label: "Sol",  piano: ["G3","B3","D4"],  guitare: ["G2","B2","D3","G3","B3","G4"], trompette: ["G4","B4","D5"] },
     Am: { label: "La m", piano: ["A3","C4","E4"],  guitare: ["A2","E3","A3","C4","E4"],      trompette: ["A4","C5","E5"] },
   };
   ```
   Exporter `chordOn(chordId, instrument)` / `chordOff(chordId, instrument)` :
   - piano et trompette : toutes les notes d'un coup (`noteOn(notes, instrument)`)
   - guitare : **strum** — décaler chaque corde de ~40 ms :
     `notes.forEach((n, i) => sampler.triggerAttack(n, Tone.now() + i * 0.04))`
     (le relâchement, lui, est simultané).
2. `ui-chords.js` : 6 gros pads `<button data-chord="C">` (≥ 64 px), `aria-label`
   « Accord Do majeur »…, gérés par le MÊME `pointer-notes.js` (le patron accepte un
   second attribut : soit généraliser `data-note`/`data-chord` dans `noteAt`, soit
   attacher une seconde instance sur la zone des pads).
3. Interrupteur 3 positions **Notes / Accords / Les deux** (boutons radio stylés,
   `fieldset` + `legend` masquée) piloté par le store : affiche clavier seul, pads
   seuls, ou pads au-dessus + clavier en dessous.
4. `keyboard.js` : `a,z,e,r,t,y` → les 6 pads (mêmes règles : repeat, Set des tenues).

**Validation**
- [ ] Enchaîner Do → Sol → La m → Fa au doigt « sonne bien » sur les 3 instruments
- [ ] Sur guitare, l'accord est légèrement arpégé (strum audible mais serré)
- [ ] Mode « Les deux » : un pad tenu à gauche + mélodie à droite = pas de conflit
- [ ] Les pads répondent au clavier physique A Z E R T Y
- [ ] Chaque pad s'illumine pendant qu'il sonne

**Commit** : `Jeu mélodie : mode accords avec strum guitare et pads AZERTY`

---

## ÉTAPE 6 — Interfaces guitare et trompette *(CDC §3.2, phase 6)*

**Créer** : `assets/js/melodie/ui-trompette.js`, `assets/js/melodie/ui-guitare.js`.
**Modifier** : boot, CSS.

**Actions**
1. `ui-trompette.js` : une rangée de 8 gros pistons ronds (`data-note`, gamme de Do :
   C4→C5), réutilise `pointer-notes.js` tel quel. Lueur corail.
2. `ui-guitare.js` — **décision produit à prendre ICI, pas avant** :
   - **Option A (cible)** : 6 cordes horizontales pleine largeur (`data-note` =
     E2, A2, D3, G3, B3, E4). Le geste : un pointeur enfoncé qui **traverse** une
     corde la fait sonner (le patron `pointer-notes` gère déjà cela : passer d'une
     corde à l'autre déclenche la suivante — c'est le même mécanisme que le
     glissando). Animation de vibration de la corde touchée (CSS, ~300 ms).
     Différence voulue avec le piano : quitter une corde ne coupe PAS sa résonance
     (une corde grattée sonne jusqu'au bout) → pour la guitare, `onNoteOff` ne fait
     rien, on utilise `triggerAttackRelease(note, 2)` au passage de corde.
   - **Option B (repli si l'option A n'est pas convaincante en une journée)** :
     boutons-notes comme la trompette. Noter dans le README que les cordes passent
     en V1.1.
3. Bascule d'interface selon l'instrument actif (store) : piano → clavier,
   guitare → cordes/boutons, trompette → pistons. Les pads d'accords restent
   disponibles dans tous les cas selon le mode.

**Validation**
- [ ] Trompette : 8 pistons jouables, multi-touch, lueur corail
- [ ] Guitare : « gratter » les 6 cordes d'un seul geste vertical produit un strum naturel
- [ ] Changer d'instrument bascule l'interface sans erreur ni note bloquée
- [ ] (Option A) une corde traversée vibre visuellement

**Commit** : `Jeu mélodie : interfaces trompette (pistons) et guitare (cordes grattables)` *(adapter si option B)*

---

## ÉTAPE 7 — Enregistrement et relecture *(CDC §3.5, §5.2, phase 7)*

**Créer** : `assets/js/melodie/recorder.js`, `assets/js/melodie/player.js`, `assets/js/melodie/ui-transport.js`, `assets/js/melodie/storage.js`.
**Modifier** : boot, HTML, CSS.

**Actions**
1. `recorder.js` — pur et testable, l'horloge est INJECTÉE :
   ```js
   export function createRecorder(now /* () => secondes, ex: () => Tone.now() */) { ... }
   ```
   - `start()` : arme l'enregistrement ; `t0` est fixé au **premier** noteOn suivant
   - `noteOn(notes, instrument)` : mémorise `{ time: now() - t0, notes, instrument }` (événement ouvert)
   - `noteOff(notes)` : complète la `duration` des événements ouverts correspondants
   - `stop()` : ferme les événements encore ouverts (`duration = now() - t0 - time`),
     retourne un objet `Recording` conforme au CDC §5.2 (`version: 1`, `title`,
     `createdAt` ISO, `events` triés par `time`)
   - Garde-fou : au-delà de 300 s ou 5000 événements, stop automatique + message
2. Câblage : les fonctions `noteOn/noteOff` du boot notifient AUSSI le recorder
   (mêmes appels que l'audio — CDC §5.3 : le recorder capture ce qui est joué,
   quelle que soit la source : souris, tactile, clavier, pads).
3. `player.js` :
   - `play(recording, { onEventStart, onEventEnd, onDone })`
   - construire `new Tone.Part((time, ev) => { ... triggerAttackRelease(ev.notes, ev.duration, time) ... }, events.map(ev => [ev.time, ev]))`, `part.start(0)`, `Tone.Transport.start()`
   - illumination pendant la lecture : `Tone.Draw.schedule(() => onEventStart(ev), time)` et l'extinction à `time + ev.duration`
   - astuce stabilité (CDC §8.3.10) : au lancement de la lecture, `Tone.context.lookAhead = 0.1` ; à la fin ou au stop, le remettre à `0`
   - `stop()` : `part.dispose()`, `Tone.Transport.stop()` + `cancel()`, éteindre toutes les touches
4. `ui-transport.js` : barre fixe sous l'instrument — boutons ● Enregistrer
   (point rouge + libellé, état visible), ■ Stop, ▶ Réécouter, compteur `mm:ss`,
   métronome on/off + tempo 60–180 (tic discret via `Tone.Transport.scheduleRepeat`
   + petit synthé percussif ; le métronome n'est PAS enregistré), volume master.
   Tous les états annoncés en ARIA (`aria-pressed`, `role="status"` pour « Enregistrement en cours »).
5. `storage.js` : `saveLast(recording)` / `loadLast()` sur la clé
   `ada-melodie-autosave`, `try/catch` autour de `localStorage` (mode privé iOS peut
   jeter une exception). Autosauvegarde à chaque ■ Stop ; au chargement de la page,
   si une sauvegarde existe, proposer « Reprendre ma dernière création ».

**Validation**
- [ ] Jouer ~20 s (notes tenues, accords, changement d'instrument en cours de prise), réécouter : le rejeu est indiscernable de la prise
- [ ] Le compteur tourne pendant l'enregistrement, le point rouge est visible
- [ ] Le métronome tick au bon tempo et ne s'entend PAS dans la relecture
- [ ] Recharger la page → « Reprendre ma dernière création » restaure et rejoue la prise
- [ ] ▶ pendant une lecture déjà en cours ne superpose pas deux lectures

**Commit** : `Jeu mélodie : enregistrement horodaté, relecture fidèle et autosauvegarde`

---

## ÉTAPE 8 — Partage et démos *(CDC §3.7, §3.8, phase 8)*

**Créer** : `assets/vendor/lz-string.min.js`, `assets/js/melodie/serialize.js`, `assets/js/melodie/demos.js`, `assets/data/melodie-demos.json`, `tests/jeu-melodie.html`.
**Modifier** : boot, `jeu-melodie.html` (scripts vendor + UI partage), `assets/vendor/LICENCES.md`.

**Actions**
1. Vendoriser lz-string :
   ```bash
   curl -L -o assets/vendor/lz-string.min.js https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js
   ```
   L'ajouter au HTML (script classique, avant le module) et à `LICENCES.md` (MIT).
2. `serialize.js` (`/* global LZString */`) :
   - `encodeToUrl(recording)` → JSON → `LZString.compressToEncodedURIComponent` →
     retourne l'URL complète `location.origin + location.pathname + "#m=" + code` ;
     si `code.length > 8000` → retourner `null` (l'UI proposera l'export fichier)
   - `decodeFromUrl(hash)` → décompression → `JSON.parse` dans un `try/catch` →
     **`validateRecording(obj)`** → `Recording` ou `null`
   - `validateRecording(obj)` : implémenter EXACTEMENT les règles du CDC §5.2
     (version, bornes, regex des notes, instruments connus, durée totale ≤ 300 s).
     Toute entrée douteuse → `null`, jamais d'exception qui remonte.
   - export fichier : `Blob` JSON téléchargé sous `titre.melodie.json` ; import via
     `<input type="file">` → même validation.
3. UI partage dans le transport : « Copier le lien » (`navigator.clipboard.writeText`
   + retour visuel « Lien copié ! » ; si `encodeToUrl` renvoie `null`, message
   « Performance trop longue pour un lien — exportez le fichier » ), « Exporter »,
   « Importer ».
4. Au chargement de la page : si `location.hash` commence par `#m=` →
   décoder/valider → afficher « Quelqu'un vous a partagé une mélodie — ▶ Écouter »
   (la lecture ne démarre qu'au clic : l'audio n'est pas encore débloqué). Hash
   invalide → message propre « Lien illisible », pas d'erreur console.
5. `melodie-demos.json` : tableau de 3 `Recording` (`title` : « Frère Jacques »,
   « Boucle pop », « Impro jazzy »). Méthode de fabrication : **utiliser le jeu
   lui-même** — enregistrer chaque démo, l'exporter en JSON, coller dans le fichier.
   Frère Jacques (piano), pour mémoire : C4 D4 E4 C4 ×2 · E4 F4 G4 ×2 ·
   G4 A4 G4 F4 E4 C4 ×2 · C4 G3 C4 ×2. Boucle pop = accords C G Am F ×2 (guitare).
   `demos.js` : menu « Exemples » → fetch du JSON (chemin relatif), validation, lecture
   avec touches illuminées.
6. `tests/jeu-melodie.html` : page autonome (`<meta name="robots" content="noindex">`,
   PAS ajoutée au sitemap) qui importe `serialize.js`, `chords.js`, `recorder.js` et
   affiche une liste PASS/FAIL (fonction `assert(nom, condition)` maison, compteur
   final). Tests minimum :
   - recorder avec horloge factice : 2 notes séquentielles + 1 accord → `time`/`duration` exacts
   - recorder : note encore tenue au `stop()` → durée fermée correctement
   - serialize : aller-retour `encode(decode(x))` identique
   - `validateRecording` : accepte une prise valide ; rejette : version ≠ 1, note `"<script>"`, `time` négatif, 6000 événements, durée 400 s
   - chords : chaque accord a ≥ 3 notes et des voicings pour les 3 instruments

**Validation**
- [ ] « Copier le lien » sur un appareil → ouvrir sur UN AUTRE appareil → la performance se rejoue à l'identique
- [ ] URL trafiquée à la main (`#m=nimportequoi`) → message propre, zéro erreur console
- [ ] Export puis import du fichier `.melodie.json` → prise restaurée
- [ ] Les 3 démos se jouent avec les touches illuminées
- [ ] `tests/jeu-melodie.html` : 100 % PASS

**Commit** : `Jeu mélodie : partage par lien compressé, export/import, démos et tests navigateur`

---

## ÉTAPE 9 — Design, accessibilité, polissage *(CDC §4, §3.9, phase 9)*

**Modifier** : `assets/css/tokens.css`, `assets/css/jeu-melodie.css`, `jeu-melodie.html`, `README.md`. *(Optionnel, sur accord de JP : une carte teaser sur `index.html`.)*

**Actions**
1. `tokens.css` : ajouter la section commentée « Jeu Compose ta mélodie » avec les
   9 tokens du CDC §4.2 — chacun référence un token de marque existant,
   **zéro nouvelle valeur hexadécimale**.
2. `jeu-melodie.css` : remplacer les couleurs provisoires par les `--melodie-*`.
   Le panneau scène : fond `var(--melodie-bg)`, coins `var(--radius-lg)`, ombre
   `var(--shadow-block-night)`. Lueur active : `box-shadow` de la couleur de
   l'instrument, allumage instantané, extinction `transition: box-shadow 300ms`
   UNIQUEMENT à la désactivation (`.is-active { transition: none; }`).
3. `prefers-reduced-motion: reduce` : pas de halo animé ni vibration de corde —
   simple changement de fond des touches actives.
4. Passe accessibilité complète : navigation Tab logique, focus visible sur fond
   nuit (`outline` clair), `aria-label` sur chaque touche/pad/bouton de transport,
   états `aria-pressed`, contrastes AA vérifiés sur le panneau nuit (texte crème
   sur bleu nuit : conforme ; vérifier les libellés SUR les touches).
5. Mobile approfondi : portrait ET paysage, iOS Safari en priorité. Détection du cas
   « iOS + pas de son » impossible de façon fiable → afficher sous le bouton
   « Commencer », sur iOS uniquement (`navigator.userAgent`), une ligne d'aide :
   « iPhone/iPad : pensez à désactiver le mode silencieux pour entendre le son. »
6. SEO/partage : vérifier title/description/OG de la page, `og:image` (réutiliser
   l'affiche comme les autres pages).
7. Crédits : ligne discrète en bas de la section jeu « Sons : samples libres
   (tonejs-instruments, licences CC) » + section crédits du README.
8. `README.md` : ajouter la page dans l'arborescence (§2), une entrée « Compose ta
   mélodie » dans « Ce qui est couvert » (§3), et les libs vendorisées + licences
   samples dans les sections adéquates.

**Validation (recette finale V1)**
- [ ] Lighthouse sur `jeu-melodie.html` : Performance > 90, Accessibilité > 95
- [ ] Test du vrai monde : une personne qui ne connaît pas le projet joue, enregistre et partage depuis son téléphone SANS aide orale
- [ ] Toute la checklist des étapes 1 à 8 repassée une fois sur iOS Safari ET sur Android Chrome
- [ ] `grep -rn '#[0-9a-fA-F]\{3,6\}' assets/css/jeu-melodie.css` ne renvoie rien (aucune couleur en dur)
- [ ] `grep -n 'src="/\|href="/' jeu-melodie.html` ne renvoie rien
- [ ] Les 5 autres pages du site sont inchangées visuellement (seul le menu a gagné « Le jeu »)

**Commit** : `Jeu mélodie : direction artistique scène nocturne, accessibilité et recette finale`

---

## ÉTAPE 10 — Mise en ligne

**Actions**
1. Repasser une dernière fois les interdits absolus (tableau du début) sur `git diff main...jeu-melodie`
2. Merge de `jeu-melodie` dans `main`, push → GitHub Pages déploie
3. Vérifier EN PRODUCTION (`https://jgrewis.github.io/adosdarts/jeu-melodie.html`) :
   la page charge, les sons jouent, un lien de partage généré en production fonctionne
   (c'est LE test qui attrape les chemins absolus oubliés)
4. En cas de problème : `git revert` du merge, push, puis corriger sur la branche

**Validation**
- [ ] Le jeu fonctionne en production sur mobile et desktop
- [ ] Les 5 autres pages fonctionnent toujours en production

---

## Hors périmètre de ce plan

- **V2 (comptes, galerie, likes)** : annexe optionnelle du CDC §7 — NE PAS développer
  sans décision explicite du client (prérequis CSP + RGPD à lever d'abord)
- **V1.1** : cordes de guitare avancées (si option B retenue), overdub, export WAV
  (`Tone.Offline`), quantification légère optionnelle
