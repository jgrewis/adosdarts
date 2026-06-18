# Handoff #1 — Site Festival « À Dos d'Arts »

> Document de passation de la session de création de l'ébauche du site.
> Reprend le contexte, les décisions, l'architecture technique, l'historique des
> revues, le déploiement et les pistes pour la suite.

| | |
|---|---|
| **Projet** | Ébauche du site du Festival À Dos d'Arts (Rouffach, Haut-Rhin, 68) |
| **Nature** | Prototype / maquette fonctionnelle (pas la version de production) |
| **Stack** | HTML / CSS / JavaScript **vanilla**, multi-fichiers, **sans build**, sans dépendance |
| **Dépôt** | https://github.com/jgrewis/adosdarts (public, branche `main`) |
| **Site en ligne** | **https://jgrewis.github.io/adosdarts/** (GitHub Pages) |
| **Édition mise en avant** | 8ᵉ édition, 28–30 août 2026, thème éditorial **« Jungle »** (toucan) |
| **Dossier de travail** | `/Users/jeanphilippegrewis/Documents/Claude/Projects/Adodart` |

---

## 1. Contexte et point de départ

Le dossier projet contenait un **cahier des charges** détaillé
(`cahier-des-charges-site-adosdarts.md`) pour la refonte « from scratch » du site
officiel `adosdarts.fr` (actuellement un export no-code à remplacer).

Points structurants du cahier :
- Festival **gratuit, en plein air**, **créé par la jeunesse pour tout le monde**.
- Pluridisciplinaire (graff, danse, théâtre, beatbox, impro, percussions, photo,
  vidéo, stand-up, concerts).
- **Récurrence annuelle** : besoin d'une ossature pérenne + habillage rejouable par
  édition (modèle Dekmantel).
- 5 personas, **mobile-first strict**, conversions = inscriptions ateliers +
  candidatures bénévoles (pas de billetterie, festival gratuit).
- Exigences : **WCAG 2.1 AA / RGAA**, **RGPD** (avec soin particulier sur les
  **mineurs**, ateliers 10-17 ans), **SEO local**, **éco-conception**, Core Web Vitals.
- Choix de stack de production (Next.js vs Astro), CMS et hébergeur explicitement
  **laissés ouverts** (« à acter en réunion de cadrage Phase 0 »).

La session a suivi le workflow du skill `creation-site-web` (Lead Developer + 3
sous-agents de revue : sécurité, design, fullstack).

---

## 2. Décisions de cadrage (validées avec l'utilisateur)

Trois arbitrages ont orienté l'ébauche :

| Question | Décision retenue |
|---|---|
| **Nature de l'ébauche** | Prototype **HTML/CSS/JS vanilla** sans build (ne présume pas le choix Next.js/Astro, visible immédiatement, lisible par toute l'équipe). |
| **Direction artistique** | **« Blocs modulaires + typo forte »** (modèle KIKK) — désigné par le cahier comme le plus adapté à la pluridisciplinarité. Cadres nets + ombres dures (modèle Nuits Sonores). |
| **Étendue** | **3 pages clés** : Accueil + Programme + Participer (couvrent les 3 priorités : donner envie / informer / faire agir). |

Ajout en cours de session (demande utilisateur) :
- **Thème éditorial « Jungle »** (palette verte + mascotte **toucan**) appliqué comme
  couche éditoriale de l'édition, en gardant la structure « blocs KIKK ».
- **Intro animée « entrée dans la jungle »** (SVG + CSS, pas de vidéo).

---

## 3. Architecture des fichiers

```
Adodart/
├── index.html                  # Accueil : hero, état temporel, accès rapides, disciplines, infos
├── programme.html              # Programme filtrable (jour/discipline/lieu/public) + favoris
├── participer.html             # Inscription atelier (logique mineur) + candidature bénévole
│
├── assets/
│   ├── css/
│   │   ├── tokens.css          # SOURCE DE VÉRITÉ : couleurs, typo, espacements, rayons,
│   │   │                       #   ombres, z-index, motion. Thèmes clair/sombre + couche Jungle.
│   │   ├── base.css            # Reset, typo globale, accessibilité (focus, skip-link), honeypot CSS
│   │   ├── layout.css          # Header persistant, footer, grille modulaire de blocs (KIKK)
│   │   ├── components.css      # Boutons, cartes, badges, formulaires, compte à rebours, cookies
│   │   ├── pages.css           # Styles accueil/programme/participer + hero (dégradés + feuillage)
│   │   └── intro.css           # Overlay d'intro « jungle » + keyframes
│   │
│   ├── js/                     # Modules ES (type="module"), une responsabilité par fichier
│   │   ├── theme.js            # Bascule clair/sombre, persistée (localStorage)
│   │   ├── nav.js              # Menu mobile accessible
│   │   ├── temporal-state.js   # État avant/pendant/après + compte à rebours (+ escapeHtml/safeUrl)
│   │   ├── programme-filters.js# Filtres, recherche, favoris (localStorage) + escapeHtml/safeSlug
│   │   ├── forms.js            # Validation accessible + logique consentement mineur + honeypot
│   │   ├── cookie.js           # Bannière de consentement RGPD
│   │   └── intro.js            # Injection de l'overlay d'intro (toucan + feuillage SVG inline)
│   │
│   ├── data/                   # Simulent le futur CMS headless (entités §10.2 du cahier)
│   │   ├── edition.json        # Dates, lieux, statut, signature, theme_nom: "Jungle"
│   │   ├── programme.json      # Créneaux : jour, heure, lieu, discipline, public, artistes
│   │   └── ateliers.json       # Ateliers : discipline, public visé, modalités
│   │
│   └── img/
│       └── logo.svg            # Logo placeholder (couche pérenne)
│
├── .gitignore                  # Ignore .env*, node_modules, artefacts
├── .claude/launch.json         # Config serveur de preview local (python3, port 4599)
├── cahier-des-charges-site-adosdarts.md
├── README.md                   # Doc d'install/lancement/déploiement
└── handoff1.md                 # Ce document
```

**Principe directeur** : aucune valeur de couleur/typo/espacement en dur dans les
composants — tout passe par les **design tokens** de `tokens.css`. Le jour où un
framework + CMS sont branchés, seules les sources de données changent, pas la logique
de présentation.

---

## 4. Détails techniques notables

### 4.1 Données / chargement
- Les pages chargent leurs données via `fetch()` sur les **JSON locaux** → **un serveur
  HTTP est obligatoire** (l'ouverture en `file://` est bloquée par le navigateur).
- Lancement local : `python3 -m http.server 8765` puis `http://localhost:8765`.

### 4.2 État temporel (mécanique centrale, §4.3 du cahier)
- `temporal-state.js > computeState()` calcule **avant / pendant / après** à partir des
  dates de `edition.json`. Un champ `statut_override` permet de **forcer** l'état (comme
  le fera le CMS).
- Aujourd'hui (édition au 28/08/2026) → état **« avant »** avec **compte à rebours**.

### 4.3 Thème clair/sombre + couche « Jungle »
- Bascule via `theme.js`, persistée en `localStorage` (`adodart-theme`), valeur initiale
  selon `prefers-color-scheme`.
- `tokens.css` définit des variables de marque **jungle** (`--brand-canopy`,
  `--brand-leaf`, `--brand-toucan-*`, etc.) et re-mappe les surfaces/accent/bordures :
  - **Clair** : fond crème-vert, accent vert canopée (`#0b6b3a`, texte blanc ≈ 6.5:1).
  - **Sombre** : fond sous-bois, accent jaune toucan (`#ffd23a`, texte encre).
- Les **couleurs par discipline** gardent volontairement leur arc-en-ciel
  (pluridisciplinarité) ; chacune a un token de **texte associé** `--discipline-*-on`
  calibré ≥ 4.5:1 (corrige le piège « blanc sur fluo »).

### 4.4 Intro animée « entrée dans la jungle »
- `intro.js` **injecte** l'overlay dans le DOM (progressif : sans JS, la page s'affiche
  normalement). Le toucan et le feuillage sont des **SVG inline** (aucune image lourde).
- **Une seule fois par session** : drapeau `sessionStorage` `adodart-intro-seen`.
- **Désactivée** sous `prefers-reduced-motion` (retour anticipé côté JS + garde-fou CSS),
  **sans son**, bouton **« Entrer »** + touche **Échap** pour passer.
- Durée ≈ **3 s** : `AUTO_MS = 3000` (intro.js) ; keyframes intro.css = feuillage 2100 ms,
  toucan 1500 ms, titre 900 ms.
- **Toucan** : style géométrique plat (aplats de couleur, inspiré d'une réf. fournie) —
  bec jaune à droite + liseré rouge, aile bleue, plastron blanc, contour d'œil
  jaune/orange, œil cyan, pattes bleues sur branche. Défini dans `toucanSvg()`.
- **Pour la revoir** : nouvel onglet / fenêtre privée, ou
  `sessionStorage.removeItem('adodart-intro-seen')` puis recharger.

### 4.5 Formulaires (participer.html)
- **Validation côté client uniquement** (volontaire pour l'ébauche). `novalidate` sur les
  `<form>` pour laisser `forms.js` gérer les messages d'erreur **accessibles**.
- **Logique mineur** : si l'âge déclaré < 18, le bloc « responsable légal » apparaît et ses
  champs + le **consentement parental** deviennent obligatoires.
- **Honeypot** anti-spam (`data-honeypot`, champ `.hp-field` masqué) : succès silencieux si
  rempli.
- **Pas de back-end** : l'envoi est *simulé* (message de confirmation, aucune donnée
  transmise).

### 4.6 Sécurité / RGPD / SEO (déjà en place)
- En-têtes via `<meta>` sur les 3 pages : **CSP** (`default-src 'self'`, `img-src 'self'
  data:`, `object-src 'none'`, `frame-ancestors 'none'`…), `X-Content-Type-Options:
  nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Échappement XSS** systématique (`escapeHtml`) sur toute donnée injectée via
  `innerHTML` ; `safeUrl()` (anti `javascript:`) et `safeSlug()` (anti-injection
  d'attribut CSS) dans les modules concernés.
- **Bannière de consentement** (`cookie.js`) : refus aussi simple qu'accepter, choix
  persisté, **aucun script tiers avant accord** (l'analytics y est prévu mais inactif).
- **SEO de base** : `title` + `meta description` par page, Open Graph, **JSON-LD
  `Event`/`Festival`** (sur l'accueil), un seul `<h1>` par page.
- **Liens externes** en `rel="noopener noreferrer"`.

---

## 5. Historique des revues (3 passes par sous-agents)

| Phase | Constats & corrections clés |
|---|---|
| **Sécurité** | Renforcement de l'échappement XSS (temporal-state, programme-filters), ajout CSP/headers `<meta>`, honeypot sur les 2 formulaires, création `.gitignore`. Aucun secret en dur. |
| **Design** | **Point critique** : contrastes des couleurs de discipline (blanc sur fluo échouait) → tokens texte `-on` ≥ 4.5:1, accent magenta assombri, états sémantiques relevés en dark mode, cibles tactiles toutes à **44px**, états interactifs (hover/focus/active/disabled) homogénéisés. |
| **Fullstack** | **Bug bloquant corrigé** : `novalidate` manquant neutralisait toute la validation JS des formulaires. Aussi : `aria-controls`/`id` du menu réparés, référence orpheline (README) corrigée. |

Arbitrage en cas de conflit : **sécurité > fonctionnalité > esthétique**.

### Vérifications finales
- 19/19 assets en **HTTP 200** (aucun 404), 6/6 modules JS valides (ES modules), 3/3
  JSON valides, **1 seul `<h1>` par page**, **console navigateur propre** (vérifiée en
  réel sur les 3 pages, thèmes clair **et** sombre).

---

## 6. Déploiement (réalisé cette session)

- `git init` + commit initial, remote SSH `git@github.com:jgrewis/adosdarts.git`, push
  sur `main` (24 fichiers).
- **GitHub Pages activé** via API (`source: main / racine`).
- Site **en ligne et testé** : accueil, programme, participer + CSS/JS/JSON tous en 200.
- **Sous-chemin** `/adosdarts/` : OK car **tous les chemins sont relatifs** — ⚠️ ne
  jamais introduire de chemin absolu commençant par `/` (casserait le site sur Pages).
- **Mise à jour** : `git push` sur `main` → rebuild Pages automatique (~1-2 min).

> Note environnement : le disque temporaire système (`/private/tmp`) était **saturé**
> en fin de session, ce qui a gêné quelques commandes shell (sans impact sur le
> déploiement). Un nettoyage de `/private/tmp` est recommandé.

---

## 7. Hors périmètre de l'ébauche (= phase de production)

Conformément au cahier des charges, **non** implémentés ici :
- **Back-end des formulaires** : fonctions serverless + e-mail transactionnel, validation
  **côté serveur**, jeton **CSRF**, rate limiting (§11, §15).
- **CMS headless** réel (les JSON le simulent), CI/CD, hébergement de prod, monitoring.
- En-têtes de sécurité servis en **HTTP réel** (CSP/X-Frame-Options en en-têtes serveur,
  pas seulement `<meta>`).
- Pages restantes de l'arborescence (artistes, infos pratiques détaillées, actualités,
  archives, presse, légal…) et fonctions *Should/Could have* (timetable grille, galeries,
  feed Instagram, `.ics`, multilingue, narration).
- Choix de la **stack de production** (Next.js vs Astro) — l'ébauche reste réutilisable
  comme référence visuelle ; tokens et JSON sont transposables tels quels.

---

## 8. Pistes / prochaines étapes

1. **Intégrer les SVG propres de l'utilisateur** (toucan/feuillage) : déposer les `.svg`
   dans `assets/img/` ou coller le code ; je remplace le contenu de `toucanSvg()` /
   `foliageSvg()` dans `intro.js` (garder la classe `intro__toucan` pour conserver
   l'animation). SVG idéalement optimisés (SVGO), légers, `currentColor` si suivi du thème.
2. **Affiner l'intro** : durée/vitesse, toucan qui **s'envole** en fin d'anim, feuille de
   monstera derrière le toucan, plus/moins de feuillage.
3. **Reskin jungle** plus poussé sur Programme et Participer si souhaité.
4. **Domaine personnalisé** : brancher `adosdarts.fr` (cible du cahier) sur le déploiement
   Pages existant (CNAME + DNS).
5. **Trancher la stack de prod** puis **brancher un CMS headless** (Sanity/Strapi/Directus/
   Decap) sur le modèle de `assets/data/`.
6. **Back serverless** des formulaires (validation serveur + e-mail + RGPD mineurs).

---

## 9. Référence rapide (commandes)

```bash
# Lancer en local (depuis la racine du projet)
python3 -m http.server 8765        # → http://localhost:8765

# Pousser une mise à jour en ligne
git add -A
git commit -m "..."                # finir par Co-Authored-By si généré par l'IA
git push                           # rebuild GitHub Pages automatique (~1-2 min)

# Revoir l'intro (console navigateur)
sessionStorage.removeItem('adodart-intro-seen')   // puis recharger
```

*Fin du handoff #1.*
