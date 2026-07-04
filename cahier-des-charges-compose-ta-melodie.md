# Cahier des charges : « Compose ta mélodie »

**Version** : 3.0 (adaptée au site À Dos d'Arts) · **Date** : juillet 2026 · **Statut** : validé pour développement

> **Note de version 3.0** — La v2 ciblait une application autonome (React + Vite +
> TypeScript + Zustand, déployée sur Vercel). Le jeu est désormais **une page du site
> existant du festival À Dos d'Arts** : site 100 % statique en HTML/CSS/JS vanilla,
> sans build, hébergé sur GitHub Pages. Toutes les exigences **produit** (latence,
> multi-touch, mode accords, enregistrement fidèle, partage) sont conservées à
> l'identique ; seule la **stack** et l'**intégration** changent.

| Ce qui change vs v2 | Pourquoi |
|---|---|
| React/Vite/TS → HTML/CSS/JS vanilla (modules ES) | Le site n'a ni build ni `package.json` ; c'est un choix documenté du projet |
| Zustand → petit store maison (pub/sub) | Aucune dépendance npm possible |
| Vercel → GitHub Pages (dépôt existant) | Le site est déjà en ligne sur `jgrewis.github.io/adosdarts/` |
| Tone.js via npm → Tone.js **vendorisée** localement | La CSP `script-src 'self'` interdit les CDN ; la lib reste indispensable (Sampler, horloge, rejeu) |
| CSS Modules → fichier CSS dédié + `tokens.css` | `tokens.css` est la source de vérité du site (aucune couleur en dur) |
| Fraunces/Inter → Maven Pro / Frutiger | Polices de marque déjà chargées ; pas de nouvelle police |
| Vitest → page de tests navigateur + checklist | Pas d'infra npm ; les modules purs restent testés |
| V2 Supabase → **annexe optionnelle**, non engagée | Exige évolutions CSP + RGPD (pages légales) : décision client préalable |

---

## 0. Contexte d'intégration : le site À Dos d'Arts (À LIRE AVANT TOUT)

Le jeu s'intègre au site du Festival À Dos d'Arts (Rouffach, 68) : 5 pages statiques,
identité graphique de l'affiche 2026 (palette flat, toucan, jungle), accessibilité
WCAG 2.1 AA, RGPD sans traceur. Le jeu devient la **6ᵉ page** : `jeu-melodie.html`.

### Règles NON NÉGOCIABLES du site (toute violation = travail refusé)

- **R1 — Zéro build, zéro npm.** JavaScript vanilla en modules ES (`type="module"`),
  aucun `package.json`, aucune compilation. Le site doit tourner en clonant le dépôt
  et en lançant un simple serveur HTTP.
- **R2 — CSP stricte.** `script-src 'self'` : aucun script depuis un CDN, aucun
  script inline dans le HTML, **aucun attribut `onclick=""` / `oninput=""`** etc.
  Tout le JS vit dans des fichiers locaux attachés par `<script>`.
- **R3 — Chemins relatifs uniquement.** Le site est servi en sous-chemin
  (`/adosdarts/`). Jamais de chemin commençant par `/` (ex. `/assets/...` est interdit,
  `assets/...` est correct).
- **R4 — `assets/css/tokens.css` est la source de vérité.** Aucune couleur, police ou
  espacement en dur dans le CSS du jeu : uniquement des `var(--...)`. Les nouveaux
  tokens du jeu (préfixe `--melodie-`) sont ajoutés dans `tokens.css` et référencent
  la palette de marque existante (§4).
- **R5 — Gabarit de page du site.** En-tête/pied de page injectés par
  `assets/js/layout.js` (conteneurs `[data-site-header]` / `[data-site-footer]`),
  skip-link, bannière cookies, un point d'entrée `assets/js/boot-jeu-melodie.js`
  par page. Prendre `principe.html` + `boot-simple.js` comme modèles.
- **R6 — Accessibilité WCAG 2.1 AA** comme le reste du site : HTML sémantique, un
  seul `h1`, focus visibles, contrastes ≥ 4.5:1, cibles tactiles ≥ 48 px pour le jeu,
  `prefers-reduced-motion` respecté.
- **R7 — RGPD.** Aucun traceur, aucun appel réseau vers un tiers. Le `localStorage`
  n'est utilisé que pour des données fonctionnelles locales (autosauvegarde).
- **R8 — Bibliothèques vendorisées uniquement.** Deux libs sont autorisées, copiées
  dans `assets/vendor/` avec version figée et licence libre documentée :
  **Tone.js 14.7.77** (MIT) et **lz-string 1.5.0** (MIT). Rien d'autre.

---

## 1. Vision du produit

### 1.1 Pitch
« Compose ta mélodie » est un instrument de musique jouable dans le navigateur,
directement sur le site du festival. L'utilisateur choisit un instrument (piano,
guitare ou trompette) et **joue en direct** : chaque clic ou appui sur une note (ou
un accord) produit le son immédiatement, comme sur un vrai instrument. Il peut
**enregistrer sa performance**, la réécouter et la partager par lien.

Le principe fondamental : **pas de grille, pas de programmation de notes**. On joue,
en temps réel, avec ses doigts. Le jeu capture ce qu'on joue. C'est le prolongement
ludique du thème du festival : la musique live, accessible à tous.

### 1.2 Objectifs
| Objectif | Indicateur de succès |
|---|---|
| Sensation instrumentale | Latence perçue entre l'appui et le son < 30 ms |
| Accessibilité totale | Une personne sans notion de musique produit quelque chose d'agréable dès la première minute (mode accords) |
| Qualité sonore réelle | Sons échantillonnés de vrais instruments |
| Zéro friction | Aucune inscription ; page (hors sons) chargée < 3 s ; sons chargés < 5 s en 4G après le clic « Commencer » |
| Mémoire | On peut enregistrer, réécouter et partager sa performance |
| Intégration | La page est indiscernable du reste du site (navigation, identité, qualité) |

### 1.3 Cibles
- Le public du festival (ados, familles), aucune compétence musicale requise
- Enfants (usage ludique et pédagogique)
- Musiciens amateurs qui veulent improviser sans matériel

### 1.4 Ce que le projet N'EST PAS
- Un séquenceur ou un DAW : on ne place pas de notes sur une timeline, on joue
- Une application native (mais la page doit être excellente sur mobile tactile)
- Un outil de notation musicale
- Un projet à part : c'est une page du site, soumise à toutes ses règles (§0)

---

## 2. Stack technique

### 2.1 Choix et justifications

| Brique | Technologie | Pourquoi ce choix |
|---|---|---|
| Structure | **HTML/CSS/JS vanilla, modules ES** | Stack du site existant (R1) ; lisible par toute l'équipe |
| Moteur audio | **Tone.js 14.7.77 vendorisée** (`assets/vendor/tone.min.js`, MIT) | Sampler polyphonique, horloge précise pour horodater, rejeu fidèle via `Tone.Part`. Chargée en script **classique** (global `window.Tone`) avant le module de boot, uniquement sur la page du jeu |
| Sons | **Samples .mp3** issus du dépôt libre `tonejs-instruments` (piano, guitare nylon, trompette), copiés dans `assets/audio/melodie/` | De vrais enregistrements sonnent infiniment mieux qu'un oscillateur ; budget total < 5 Mo |
| Styles | `assets/css/jeu-melodie.css` + tokens `--melodie-*` dans `tokens.css` | Convention du site (R4) : styles par page, zéro valeur en dur |
| État global | **Store maison** (`store.js`, ~30 lignes : état + `subscribe`/`set`) | Suffisant pour instrument actif + mode + statut d'enregistrement |
| Compression URL | **lz-string 1.5.0 vendorisée** (`assets/vendor/lz-string.min.js`, MIT) | Partage par URL compressée, API synchrone triviale |
| Hébergement | **GitHub Pages** (dépôt existant `jgrewis/adosdarts`) | Déjà en place ; push sur `main` = déploiement |
| Qualité | **Page de tests navigateur** (`tests/jeu-melodie.html`) + checklist manuelle | Teste les modules purs (recorder, serialize, accords, validation) sans npm |
| Données démos | `assets/data/melodie-demos.json` | Convention « CMS » du site : le contenu éditorial vit dans `assets/data/` |

### 2.2 Contraintes critiques à connaître avant d'écrire une ligne

1. **Déblocage audio** : les navigateurs bloquent tout son avant la première
   interaction. Règle absolue : `await Tone.start()` dans le gestionnaire du premier
   clic (bouton « Commencer »). Sinon : silence total et heures de debug.
2. **Latence** : pour un instrument live, la réactivité est LE critère. Trois leviers :
   - Écouter `pointerdown`, jamais `click` (`click` attend le relâchement, ~100 ms perdues)
   - Précharger tous les samples (après le clic « Commencer », avec pourcentage) avant d'afficher l'instrument
   - Régler `Tone.context.lookAhead = 0` et déclencher les notes avec `triggerAttack` immédiat, sans passer par le Transport
3. **CSP et vendoring** (R2/R8) : Tone.js et lz-string sont des **fichiers locaux**.
   Ordre de chargement en fin de `<body>` : d'abord les deux scripts classiques
   (`tone.min.js`, `lz-string.min.js`, sans `defer`), puis
   `<script type="module" src="assets/js/boot-jeu-melodie.js">`. Les modules du jeu
   utilisent les globales `Tone` et `LZString` (commentaire `/* global Tone */` en tête).
4. **Chemins relatifs** (R3) : `baseUrl` des samplers, liens, imports — tout est
   relatif à la racine du site. Un seul chemin absolu casse le site en production.
5. **Noms de fichiers samples sans `#`** : un fichier `A#3.mp3` est inutilisable en
   URL (`#` démarre un fragment). Les dièses sont nommés `s` sur disque (`As3.mp3`)
   et mappés dans le code : `{ "A#3": "As3.mp3" }`.

---

## 3. Fonctionnalités V1 (sans compte)

### 3.1 F1 : La page et son écran d'accueil
- Page `jeu-melodie.html` avec l'en-tête/pied de page du site, entrée « Le jeu »
  dans le menu principal, `h1` « Compose ta mélodie »
- Écran d'accueil du jeu : accroche courte + bouton « Commencer » (débloque l'audio
  via `Tone.start()` puis lance le chargement des sons avec pourcentage)
- Sélection de l'instrument : 3 cartes visuelles (Piano, Guitare, Trompette)
- Instrument changeable à tout moment, y compris pendant un enregistrement

### 3.2 F2 : L'instrument jouable en direct (cœur du jeu)
Chaque instrument a une interface de jeu adaptée à son identité, mais un comportement commun :

- **Appui = son immédiat** (`triggerAttack` au `pointerdown`)
- **Relâchement = fin de note** (`triggerRelease` au `pointerup`), donc les notes tenues sont possibles
- **Polyphonie** : plusieurs notes simultanées (pads d'accords à la souris, ou plusieurs doigts sur mobile)
- **Multi-touch complet sur mobile** : chaque doigt est suivi indépendamment (pointer events, suivi par `pointerId`)
- **Glissando** : glisser le doigt/la souris (bouton enfoncé) d'une note à l'autre enchaîne les notes, comme sur un vrai clavier

Interfaces par instrument :

| Instrument | Interface de jeu | Étendue |
|---|---|---|
| **Piano** | Clavier réaliste, touches blanches et noires | 1,5 octave (Do4 à Sol5), extensible via boutons octave +/- |
| **Guitare** | 6 cordes horizontales que l'on « gratte » (un trait sur une corde la fait sonner) | Cordes à vide + notes de la gamme |
| **Trompette** | Rangée de gros pistons-boutons, un par note | 1 octave, notes de la gamme de Do |

En V1, la guitare peut démarrer avec une interface simplifiée « boutons-notes »
identique à la trompette, et évoluer vers les cordes grattables en V1.1. À trancher
en phase 6 (§6).

### 3.3 F3 : Mode accords (la fonctionnalité « facile »)
Un interrupteur **Notes / Accords / Les deux** change ce que produit l'interface :

- **Mode Notes** : chaque touche joue une note seule
- **Mode Accords** : une rangée de 6 gros pads joue des accords complets de la tonalité de Do majeur : **Do, Ré m, Mi m, Fa, Sol, La m**
- Sur piano : l'accord plaqué. Sur guitare : les cordes de l'accord légèrement arpégées (strum de ~40 ms entre cordes, très réaliste). Sur trompette : l'accord en tierces superposées
- Intérêt : un débutant total enchaîne Do, Sol, La m, Fa et obtient instantanément quelque chose qui « sonne »
- **Mode « Les deux »** : pads d'accords au-dessus, notes en dessous, pour jouer accords main gauche + mélodie main droite

### 3.4 F4 : Clavier physique (desktop)
- Mapping AZERTY (via `event.key`) : `Q S D F G H J K` = Do Ré Mi Fa Sol La Si Do ;
  rangée `A Z E R T Y` = les 6 pads d'accords
- Appui maintenu = note tenue, plusieurs touches = accord ; filtrer `event.repeat`
- Aide visuelle : les lettres sont affichées sur les touches à l'écran (désactivable)

### 3.5 F5 : Enregistrement de la performance
C'est ce qui transforme « jouer » en « composer » :

- Bouton **● Enregistrer** : capture chaque événement (note ou accord, instant de début, instant de fin, instrument) avec l'horloge précise de Tone.js
- Bouton **■ Stop**, puis **▶ Réécouter** : la performance est rejouée à l'identique via `Tone.Part` (mêmes notes, mêmes durées, même timing, même instrument)
- **Métronome optionnel** (désactivé par défaut) : un tic discret, tempo réglable 60-180 BPM
- **Overdub** (V1.1, optionnel) : réenregistrer par-dessus sa prise
- Pas de quantification en V1 : on garde le jeu humain tel quel. La fidélité avant la correction

### 3.6 F6 : Les 3 instruments (audio)
| Instrument | Source sonore | Particularité |
|---|---|---|
| Piano | Samples piano du dépôt `tonejs-instruments` | Enveloppe naturelle, relâchement progressif |
| Guitare | Samples guitare nylon du même dépôt | Strum sur les accords, légère réverbération |
| Trompette | Samples trompette du même dépôt | Attaque franche, `release` court (fade anti-clic) |

Chaque instrument = un `Tone.Sampler` (polyphonique par nature) avec 4 à 6 samples
(le Sampler interpole le reste), préchargé après « Commencer » avec pourcentage.
Fallback : si un sample échoue au chargement, `Tone.PolySynth` de secours + message
discret « son de remplacement ». Les licences des samples (CC) sont créditées dans
le README et en bas de page du jeu.

### 3.7 F7 : Sauvegarde locale et partage (sans compte)
- **Autosauvegarde** du dernier enregistrement dans `localStorage` (clé `ada-melodie-autosave`, donnée fonctionnelle locale, conforme R7)
- **Export JSON** (fichier `.melodie.json`) et **import** (avec validation stricte)
- **Partage par URL** : l'enregistrement compressé (lz-string) dans le fragment `#m=...`. Ouvrir le lien = écouter la performance. Si l'URL dépasse ~8 Ko, proposer l'export fichier à la place
- **Export audio WAV** (V1.1) : rejouer l'enregistrement dans `Tone.Offline` et télécharger le fichier audio

### 3.8 F8 : Démos
3 performances préenregistrées (« Frère Jacques », une boucle d'accords pop, une
impro jazzy) dans `assets/data/melodie-demos.json`, menu « Exemples » : l'utilisateur
voit les touches s'illuminer pendant la lecture, ce qui lui apprend visuellement à jouer.

### 3.9 F9 : Accessibilité et responsive
- Tout jouable au clavier physique (c'est déjà le cas par design) ; chaque touche est un `<button>` focusable
- Labels ARIA sur chaque touche (« Note Do4 », « Accord Fa majeur »)
- Contrastes AA, focus visible, `prefers-reduced-motion` : les lueurs deviennent un simple changement d'état sans animation
- Mobile : cibles tactiles ≥ 48 px, interface pensée paysage ET portrait, `touch-action: none` sur la zone de jeu pour bloquer le scroll pendant qu'on joue

---

## 4. Direction artistique

### 4.1 Concept
« Scène de concert du festival, la nuit » : la page garde l'en-tête, le fond crème et
la typographie du site, mais la **zone de jeu est un grand panneau nocturne** (le
dégradé bleu nuit du toucan, déjà défini dans les tokens du site) où l'instrument est
le héros lumineux. Quand une note joue, sa touche s'illumine et émet une courte lueur
(glow). Jouer doit être beau à regarder — c'est aussi ce qui donne envie de filmer
son écran et de partager.

### 4.2 Tokens de design
Les tokens du jeu sont ajoutés **dans `tokens.css`** (section commentée « Jeu
Compose ta mélodie ») et ne référencent QUE des tokens de marque existants —
aucune nouvelle valeur hexadécimale :

| Token | Valeur | Usage |
|---|---|---|
| `--melodie-bg` | `var(--gradient-night)` | Fond du panneau scène (dégradé bleu nuit existant) |
| `--melodie-surface` | `var(--brand-toucan-deep)` | Barre de transport, panneaux internes |
| `--melodie-text` | `var(--brand-cream)` | Texte sur fond nuit (contraste très élevé) |
| `--melodie-key-white` | `var(--brand-cream)` | Touches blanches du piano |
| `--melodie-key-black` | `var(--brand-ink)` | Touches noires du piano |
| `--melodie-glow-piano` | `var(--brand-teal)` | Lueur des touches piano |
| `--melodie-glow-guitare` | `var(--brand-yellow)` | Lueur des cordes guitare |
| `--melodie-glow-trompette` | `var(--brand-coral)` | Lueur des pistons trompette |
| `--melodie-rec` | `var(--brand-red)` | Point rouge d'enregistrement |

- **La couleur de lueur change avec l'instrument** : signature visuelle
- Typographie : `var(--font-display)` (Maven Pro) pour les titres, `var(--font-body)`
  (Frutiger) pour l'interface. **Aucune nouvelle police.**
- Micro-interaction signature : à chaque note, la touche s'illumine **instantanément**
  (jamais d'animation à l'allumage, pour ne pas suggérer de latence) puis la lueur
  s'éteint en ~300 ms. Lueurs en `box-shadow`/`opacity` (propriétés composites, pas
  de reflow). Sous `prefers-reduced-motion` : changement d'état sec, sans halo animé.

---

## 5. Architecture du code

### 5.1 Arborescence (dans le dépôt existant)
```
adosdarts/
├── jeu-melodie.html               # la page (gabarit du site : header/footer/cookies)
├── assets/
│   ├── vendor/
│   │   ├── tone.min.js            # Tone.js 14.7.77 (MIT) — global window.Tone
│   │   ├── lz-string.min.js       # lz-string 1.5.0 (MIT) — global window.LZString
│   │   └── LICENCES.md            # versions, origines, licences des libs et samples
│   ├── audio/melodie/
│   │   ├── piano/                 # 4-6 mp3 (ex. C3, G3, C4, G4, C5, G5)
│   │   ├── guitare/               # 4-6 mp3 (ex. E2, A2, D3, G3, B3, E4)
│   │   └── trompette/             # 4-6 mp3 (ex. C4, F4, A4, C5)
│   ├── css/jeu-melodie.css        # styles de la page (uniquement var(--...))
│   ├── data/melodie-demos.json    # les 3 démos (format Recording, §5.2)
│   └── js/
│       ├── boot-jeu-melodie.js    # point d'entrée : layout, nav, cookies + init du jeu
│       └── melodie/
│           ├── engine.js          # unlockAudio() : Tone.start(), lookAhead=0, volume
│           ├── instruments.js     # 3 Tone.Sampler + fallback, loadAll(onProgress), noteOn()/noteOff()
│           ├── chords.js          # les 6 accords + voicings par instrument + strum
│           ├── recorder.js        # capture des événements horodatés (horloge injectable)
│           ├── player.js          # rejeu via Tone.Part + illumination via Tone.Draw
│           ├── store.js           # état global maison : get/set/subscribe
│           ├── pointer-notes.js   # multi-touch : pointerdown/move/up par pointerId
│           ├── keyboard.js        # clavier AZERTY : keydown/keyup, filtre repeat
│           ├── serialize.js       # Recording <-> JSON <-> lz-string (+ validation stricte)
│           ├── storage.js         # localStorage (autosauvegarde)
│           ├── ui-piano.js        # rendu clavier + octave +/-
│           ├── ui-guitare.js      # rendu cordes (ou boutons en V1)
│           ├── ui-trompette.js    # rendu pistons
│           ├── ui-chords.js       # les 6 pads d'accords
│           ├── ui-transport.js    # ● ■ ▶, compteur, métronome, volume, partage
│           └── demos.js           # chargement/lecture des démos
├── tests/
│   └── jeu-melodie.html           # tests navigateur des modules purs (noindex)
└── ... (reste du site inchangé)
```

Fichiers **existants** modifiés (liste exhaustive) : `assets/js/layout.js` (entrée de
menu + CTA), `assets/css/tokens.css` (tokens `--melodie-*`), `sitemap.xml`,
`README.md`. Rien d'autre.

### 5.2 Modèle de données central
```js
/** @typedef {"piano" | "guitare" | "trompette"} InstrumentId */

/**
 * Un événement = une note ou un accord joué.
 * @typedef {Object} NoteEvent
 * @property {number} time        secondes depuis le début de l'enregistrement
 * @property {number} duration    durée de maintien en secondes
 * @property {string[]} notes     ["C4"] pour une note, ["C4","E4","G4"] pour un accord
 * @property {InstrumentId} instrument
 */

/**
 * @typedef {Object} Recording
 * @property {1} version
 * @property {string} title
 * @property {string} createdAt   ISO 8601
 * @property {NoteEvent[]} events
 */
```
Ce format unique circule partout : recorder, player, localStorage, URL, export,
démos (et backend en V2 éventuelle). **Le figer tôt évite de tout casser ensuite.**
Les types sont documentés en JSDoc dans `serialize.js`, qui contient aussi
`validateRecording(obj)` : version === 1, `events` ≤ 5000, `time` ≥ 0 fini,
`duration` entre 0 et 30 s, notes conformes à `/^[A-G](#|b)?[0-8]$/`, instrument
connu, durée totale ≤ 300 s. **Ne jamais lire une URL ou un fichier importé sans
cette validation.**

### 5.3 Principes de séparation
- Les modules d'interface (`ui-*.js`) ne contiennent aucune logique audio : ils appellent `noteOn(notes)` / `noteOff(notes)` exposés par `instruments.js`
- `recorder.js` s'abonne aux mêmes `noteOn/noteOff` : l'enregistrement capture exactement ce qui est joué, quelle que soit la source (souris, tactile, clavier physique)
- Avantage : ajouter une source d'entrée (ex. MIDI en V3) ne demande aucune modification du reste
- `recorder.js` reçoit son horloge en paramètre (`createRecorder(now)` avec `now = () => Tone.now()` en prod) : testable sans audio

### 5.4 Le chemin d'une note (à comprendre absolument)
```
pointerdown sur la zone de jeu
  -> pointer-notes détecte la touche visée (elementFromPoint + data-note)
  -> noteOn(["C4"])
       -> sampler.triggerAttack("C4")        (le son sort, < 30 ms)
       -> recorder.push({start})             (si enregistrement actif)
       -> la touche reçoit la classe .is-active (elle s'illumine)
pointerup / pointercancel
  -> noteOff(["C4"])
       -> sampler.triggerRelease("C4")
       -> recorder.complete({duration})
       -> la touche perd .is-active
```

**Piège majeur du multi-touch** : sur écran tactile, le navigateur applique une
*capture implicite* du pointeur sur l'élément touché — les `pointerenter` des touches
voisines ne se déclenchent alors jamais, ce qui casse le glissando. La solution
retenue : écouter `pointerdown` / `pointermove` / `pointerup` / `pointercancel` sur
le **conteneur** de la zone de jeu, retrouver la touche sous le doigt avec
`document.elementFromPoint(e.clientX, e.clientY)` + `closest("[data-note]")`, et
tenir une `Map` `pointerId -> note active`. Un seul jeu d'écouteurs, pas de capture,
le glissando et le multi-touch fonctionnent partout.

---

## 6. Plan de développement pas à pas (V1)

> Le détail exécutable de chaque phase (commandes, extraits de code, checklists) est
> dans **`plan-compose-ta-melodie.md`**. Ne pas passer à la phase suivante tant que
> le critère de validation n'est pas atteint.

### Phase 0 : La page dans le site (une demi-journée)
Squelette `jeu-melodie.html` sur le gabarit de `principe.html`, entrée « Le jeu »
dans `layout.js`, `boot-jeu-melodie.js`, CSS vide, sitemap.

✅ **Validation** : la page est accessible depuis le menu sur toutes les pages, avec
en-tête/pied de page/cookies identiques au reste du site, sans erreur console.

### Phase 1 : Premier son immédiat (1 jour)
Vendoriser Tone.js. `engine.js` : `unlockAudio()` avec `await Tone.start()` et
`Tone.context.lookAhead = 0`. Bouton « Commencer », puis un bouton de test
`triggerAttack("C4")` au `pointerdown` / `triggerRelease` au `pointerup`
(`Tone.Synth` temporaire).

✅ **Validation** : sur mobile, appui = son instantané, maintien = note tenue,
relâchement = fin de note.

### Phase 2 : Les vrais instruments (1 à 2 jours)
Récupérer les samples (dièses renommés `s`, cf. §2.2.5), `instruments.js` avec les
trois `Tone.Sampler`, `loadAll(onProgress)`, écran de chargement avec pourcentage,
fallback `PolySynth`, fade anti-clic sur la trompette.

✅ **Validation** : les 3 instruments jouent la même note avec leur timbre propre,
sans clic ni craquement au relâchement ; budget total samples < 5 Mo.

### Phase 3 : Le clavier de piano jouable (2 jours, cœur du jeu)
`ui-piano.js` (1,5 octave, touches noires en absolu), `pointer-notes.js` selon le
patron du §5.4 (conteneur + `elementFromPoint` + `Map` par `pointerId`), glissando,
illumination immédiate, `touch-action: none`.

✅ **Validation** : sur smartphone, jouer un accord à 3 doigts fonctionne ; glisser
le doigt sur le clavier enchaîne les notes proprement ; un doigt qui sort de l'écran
ne laisse jamais une note bloquée.

### Phase 4 : Clavier physique + sélecteur d'instrument (1 jour)
`keyboard.js` (`keydown`/`keyup`, ignorer `event.repeat`), lettres AZERTY affichées,
sélecteur d'instrument instantané, « panic » : tout relâcher au `blur` de la fenêtre.

✅ **Validation** : on joue une mélodie au clavier physique pendant qu'un doigt tient
un accord à l'écran, sans conflit ni note bloquée après un Alt+Tab.

### Phase 5 : Mode accords (1 jour)
`chords.js` (6 accords de Do majeur, voicings par instrument), `ui-chords.js`
(6 gros pads), strum guitare ~40 ms entre cordes, interrupteur Notes / Accords / Les deux.

✅ **Validation** : un non-musicien enchaîne Do, Sol, La m, Fa au doigt et ça sonne
bien sur les 3 instruments.

### Phase 6 : Interfaces guitare et trompette (1 à 2 jours)
`ui-trompette.js` (pistons, réutilise `pointer-notes.js`), `ui-guitare.js` (6 cordes
horizontales grattables, vibration animée). Décision produit : si les cordes s'avèrent
trop complexes dans le temps imparti, livrer la guitare en interface boutons (comme la
trompette) et planifier les cordes en V1.1.

✅ **Validation** : « gratter » les 6 cordes d'un geste produit un strum naturel.

### Phase 7 : Enregistrement et relecture (2 jours)
`recorder.js` (t0 au premier `noteOn` après « ● », `time = now() - t0`, `duration` au
`noteOff`, notes encore tenues fermées au Stop), `player.js` (`Tone.Part` +
illumination via `Tone.Draw`), `ui-transport.js` (● ■ ▶, compteur, métronome 60-180
BPM), autosauvegarde `localStorage`.

✅ **Validation** : jouer 20 secondes librement, réécouter : le rejeu est
indiscernable de la prise (timing, durées, accords, changements d'instrument).

### Phase 8 : Partage et démos (1 jour)
Vendoriser lz-string. `serialize.js` (JSON -> `compressToEncodedURIComponent` ->
fragment `#m=`, et retour, avec `validateRecording` à l'import), chargement auto si
`#m=` présent, bouton « Copier le lien », export/import `.melodie.json`, les 3 démos
dans `melodie-demos.json` avec touches illuminées.

✅ **Validation** : un lien partagé rejoue exactement la performance sur un autre
appareil ; une URL corrompue affiche un message propre sans planter la page.

### Phase 9 : Design, accessibilité, polissage (2 jours)
Tokens `--melodie-*` dans `tokens.css`, lueurs par instrument, passe accessibilité
(ARIA, focus, contrastes, reduced motion), passe mobile approfondie (portrait/paysage,
iOS Safari, message d'aide si le commutateur silencieux iOS coupe le son), meta/OG de
la page, sitemap, crédits samples, mise à jour du README.

✅ **Validation V1 finale** : un proche débutant joue, enregistre et partage une
performance sans aucune aide orale, sur son téléphone ; Lighthouse Performance > 90
et Accessibilité > 95 sur la page.

**Estimation totale V1 : 10 à 13 jours de travail effectif pour un développeur débutant assidu.**

---

## 7. ANNEXE OPTIONNELLE — V2 : comptes utilisateurs et galerie

> ⚠️ **Non engagée. NE PAS DÉVELOPPER sans décision explicite du client.**
> Techniquement possible depuis un site statique (Supabase s'utilise côté client),
> mais trois prérequis bloquants doivent être levés d'abord :
> 1. **CSP** : ajouter `https://<projet>.supabase.co` à `connect-src` sur la page du jeu
> 2. **RGPD** : des comptes = des données personnelles → politique de confidentialité
>    et mentions légales réelles obligatoires (actuellement absentes du site)
> 3. **R8** : `supabase-js` devrait être vendorisée (3ᵉ lib) — dérogation à valider

### 7.1 Fonctionnalités
- **F10 Authentification** : email (magic link) + Google OAuth
- **F11 Sauvegarde cloud** : bouton « Sauvegarder », liste « Mes créations » (renommer, dupliquer, supprimer)
- **F12 Galerie publique** : passer une création en « publique » ; page galerie avec lecture directe, tri récentes/populaires
- **F13 J'aime** : un like par utilisateur et par création

### 7.2 Schéma de base de données
```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text unique not null check (char_length(username) between 3 and 20),
  created_at timestamptz default now()
);

create table recordings (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references profiles(id) on delete cascade,
  title text not null default 'Sans titre' check (char_length(title) <= 60),
  data jsonb not null,               -- l'objet Recording du §5.2, tel quel
  duration_seconds numeric not null check (duration_seconds between 0 and 300),
  is_public boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table likes (
  user_id uuid references profiles(id) on delete cascade,
  recording_id uuid references recordings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, recording_id)
);
```

### 7.3 Sécurité : Row Level Security (OBLIGATOIRE)
Sans RLS, n'importe qui peut lire/écrire toute la base via l'API publique Supabase.

```sql
alter table recordings enable row level security;

create policy "lecture" on recordings for select
  using (is_public = true or owner = auth.uid());
create policy "creation" on recordings for insert
  with check (owner = auth.uid());
create policy "modification" on recordings for update
  using (owner = auth.uid());
create policy "suppression" on recordings for delete
  using (owner = auth.uid());
```
(Politiques équivalentes sur `profiles` et `likes`.)

Règles complémentaires :
- **Valider `data` côté client au chargement** (via `validateRecording`) : une création corrompue ne doit jamais planter le lecteur
- Limiter la taille du JSON (rejet au-delà de 100 Ko)
- Ne jamais exposer d'autre clé que la clé `anon` publique (elle est faite pour être publiée, la sécurité repose sur la RLS)

### 7.4 Plan de développement V2 (5 à 7 jours, après levée des prérequis)
1. Projet Supabase, exécuter le SQL, activer les providers d'auth
2. Vendoriser `supabase-js`, client dans `assets/js/melodie/supabase.js` (clé anon publique en dur : c'est sa nature)
3. Connexion/Inscription + création du `username` au premier login
4. CRUD « Mes créations » (l'enregistrement local devient un brouillon importable)
5. Galerie publique paginée (20 par page), lecture au clic
6. Likes (upsert/delete) + compteur via vue SQL agrégée
7. Tester les politiques RLS avec un second compte

✅ **Validation V2** : deux comptes distincts, données privées étanches, galerie et likes fonctionnels.

---

## 8. Qualité, tests et performance

### 8.1 Tests
| Type | Outil | Priorités |
|---|---|---|
| Unitaires | Page `tests/jeu-melodie.html` (mini-harnais `assert` maison, résultats affichés dans la page, `meta noindex`, absente du sitemap) | recorder (horodatage, durées — via horloge factice injectée), serialize (aller-retour JSON/lz-string), `validateRecording` (cas valides ET malveillants), définitions d'accords |
| Manuels | Checklist (dans le plan) | latence perçue iOS/Android, Safari, multi-touch 5 doigts, key repeat, glissando, notes bloquées, partage inter-appareils |

### 8.2 Performance
- Samples en `.mp3`, budget total < 5 Mo, chargés **après** le clic « Commencer » (pas de téléchargement imposé aux visiteurs qui ne jouent pas), avec progression
- `tone.min.js` (~350 Ko) et `lz-string.min.js` (~4 Ko) chargés **uniquement** sur `jeu-melodie.html`
- `lookAhead = 0`, événements `pointerdown`, illumination par `classList` directe (jamais de re-rendu global)
- Lueurs en `box-shadow`/`opacity` composités, jamais de reflow
- Lighthouse cible sur la page : Performance > 90, Accessibilité > 95

### 8.3 Pièges connus (à lire avant de coder)
1. **Audio muet** : `Tone.start()` appelé hors d'une interaction utilisateur
2. **Latence molle** : `click` au lieu de `pointerdown`, ou `lookAhead` laissé par défaut
3. **Notes bloquées** : oublier `pointercancel` (doigt qui sort de l'écran) ; prévoir un « panic » qui relâche tout au `blur` de la fenêtre
4. **Glissando cassé sur mobile** : capture implicite du pointeur tactile — suivre le patron du §5.4 (conteneur + `elementFromPoint`), ne pas se reposer sur `pointerenter`
5. **Key repeat** : sans le filtre `event.repeat`, une touche maintenue mitraille des noteOn
6. **iOS** : le commutateur silencieux physique peut couper le Web Audio ; message d'aide
7. **CSP** : un seul script CDN ou un seul `onclick=""` inline et rien ne s'exécute — tout le JS en fichiers locaux (R2)
8. **Chemins** : un `src="/assets/..."` marche en local et **casse en production** (sous-chemin GitHub Pages) — toujours relatif (R3)
9. **`#` dans les noms de samples** : `A#3.mp3` est injoignable en URL — dièses nommés `s` sur disque (§2.2.5)
10. **Rejeu légèrement instable** : avec `lookAhead = 0`, la lecture d'un `Tone.Part` peut micro-vaciller ; pendant la lecture (non interactive), remonter temporairement `lookAhead` à 0.1 puis le remettre à 0

---

## 9. Déploiement et suivi

- **Branches** : `main` = production (GitHub Pages). Travailler sur une branche `jeu-melodie`, commits par phase validée (messages en français, comme l'historique du dépôt), merge sur `main` en fin de V1 (ou par lots de phases stables)
- **Aucune variable d'environnement, aucun secret** en V1 : tout est statique et public
- **Suivi d'erreurs / analytics** : rien par défaut (R7). Plausible ou Umami possibles plus tard, avec accord client + évolution CSP
- **Rollback** : `git revert` du commit fautif et push — GitHub Pages redéploie

---

## 10. Ressources pour le développeur

| Sujet | Ressource |
|---|---|
| Tone.js (v14) | Documentation officielle tonejs.github.io — voir `Sampler`, `Part`, `Draw`, `Transport` |
| Tone.js vendorisée | `https://cdn.jsdelivr.net/npm/tone@14.7.77/build/Tone.min.js` (télécharger et committer dans `assets/vendor/`) |
| lz-string vendorisée | `https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js` (idem) |
| Samples (piano, guitare nylon, trompette) | Dépôt GitHub `nbrosowsky/tonejs-instruments`, dossier `samples/` (licences CC — créditer dans `assets/vendor/LICENCES.md` et le README) |
| Pointer Events multi-touch | MDN « Pointer events » (et la note sur la capture implicite tactile) |
| Gabarits du site | `principe.html` (page), `boot-simple.js` (boot), `game-poubelle.js` (jeu existant, pour le style de code), `tokens.css` (source de vérité) |

### Glossaire express
- **Latence** : délai entre l'appui et le son ; en dessous de 30 ms le cerveau perçoit « instantané »
- **Polyphonie** : capacité à jouer plusieurs notes en même temps
- **Sampler** : instrument virtuel qui rejoue de vrais enregistrements en les transposant
- **triggerAttack / triggerRelease** : démarrer / arrêter une note (comme enfoncer / relâcher une touche)
- **Tone.Part** : lecteur qui rejoue une liste d'événements horodatés, utilisé pour la relecture
- **Strum** : grattage des cordes d'un accord légèrement décalées dans le temps
- **Vendoriser** : copier une bibliothèque dans le dépôt (version figée) au lieu de la charger depuis un CDN ou npm
- **CSP** : Content Security Policy — ici, elle n'autorise que les scripts du site lui-même
- **localStorage** : petit stockage dans le navigateur, persiste au rafraîchissement

---

## 11. Récapitulatif des livrables

**V1** : une nouvelle page `jeu-melodie.html` intégrée au site du festival (menu,
identité, accessibilité) : instrument live (piano, guitare, trompette samplés), notes
ET accords, multi-touch mobile, clavier AZERTY, latence < 30 ms,
enregistrement/relecture fidèle, autosauvegarde locale, partage par URL, export/import
JSON, 3 démos animées, le tout conforme aux règles du site (R1-R8) : zéro build, CSP
stricte, chemins relatifs, tokens, RGPD.

**V2 (annexe optionnelle, non engagée)** : auth Supabase, créations par compte,
galerie publique avec likes, RLS vérifiée — uniquement après levée des prérequis
CSP/RGPD et décision client.

**Critère de réussite global** : une personne qui n'a jamais fait de musique joue
quelque chose d'agréable en 1 minute, l'enregistre et le partage en moins de 5, sur
mobile comme sur desktop — sans que le site du festival ne perde un point de
Lighthouse ni ne viole une seule de ses règles.
