# Festival À Dos d'Arts — Ébauche de site

Maquette fonctionnelle (prototype) du site du **Festival À Dos d'Arts** (Rouffach, Haut-Rhin) :
festival artistique gratuit, en plein air, créé par la jeunesse, pour tout le monde.

> Statut : **ébauche** destinée à valider la direction artistique, l'arborescence et les
> parcours clés avant la phase de production décrite dans le cahier des charges. Construite
> en HTML/CSS/JavaScript vanilla, sans build ni dépendance, pour rester lisible par toute
> l'équipe et ne présumer aucun choix de stack (Next.js / Astro restent à arbitrer).

---

## 1. Lancement

Le site charge ses données via `fetch()` sur des fichiers JSON locaux : **un serveur HTTP
local est nécessaire** (l'ouverture directe en `file://` est bloquée par le navigateur).

```bash
# depuis la racine du projet
python3 -m http.server 8765
# puis ouvrir http://localhost:8765
```

Alternatives équivalentes :

```bash
npx serve .          # Node
php -S localhost:8765 # PHP
```

Aucune installation, aucune compilation : il n'y a pas de `package.json`.

---

## 2. Structure

```
Adodart/
├── index.html                  # Accueil : hero, état temporel, accès rapides, disciplines, infos
├── programme.html              # Programme filtrable (jour/discipline/lieu/public) + favoris
├── participer.html             # Inscription atelier (logique mineur) + candidature bénévole
│
├── assets/
│   ├── css/
│   │   ├── tokens.css          # Design tokens : SOURCE DE VÉRITÉ (couleurs, typo, espacements,
│   │   │                       #   rayons, ombres, z-index, motion ; thèmes clair/sombre)
│   │   ├── base.css            # Reset, typographie, accessibilité (focus, skip-link, honeypot)
│   │   ├── layout.css          # Header persistant, footer, grille modulaire de blocs (KIKK)
│   │   ├── components.css      # Boutons, cartes, badges, formulaires, compte à rebours, cookies
│   │   └── pages.css           # Styles propres à accueil / programme / participer
│   │
│   ├── js/                     # Modules ES (type="module"), une responsabilité par fichier
│   │   ├── theme.js            # Bascule clair/sombre, persistée (localStorage)
│   │   ├── nav.js              # Menu mobile accessible
│   │   ├── temporal-state.js   # État avant/pendant/après + compte à rebours
│   │   ├── programme-filters.js# Filtres, recherche, favoris (localStorage)
│   │   ├── forms.js            # Validation accessible + logique consentement mineur
│   │   └── cookie.js           # Bannière de consentement RGPD
│   │
│   ├── data/                   # Simulent le futur CMS headless (entités du §10.2 du cahier)
│   │   ├── edition.json        # Dates, lieux, statut, signature de l'édition courante
│   │   ├── programme.json      # Créneaux : jour, heure, lieu, discipline, public, artistes
│   │   └── ateliers.json       # Ateliers : discipline, public visé, modalités
│   │
│   └── img/
│       └── logo.svg            # Logo placeholder (couche pérenne)
│
├── .gitignore
└── README.md
```

---

## 3. Ce qui est couvert dans l'ébauche

- **Accueil dynamique par état temporel** (§4.3) : le site calcule automatiquement
  *avant / pendant / après* à partir des dates de `edition.json`. Aujourd'hui → état *avant*
  avec compte à rebours. Un `statut_override` dans le JSON permet de forcer l'état (comme le
  fera le CMS).
- **Programme filtrable** : filtres jour / discipline / lieu / public, recherche plein texte,
  et **« ma sélection »** (favoris) persistée sur l'appareil.
- **Formulaires** : inscription atelier avec **bloc responsable légal conditionnel** si l'âge
  déclaré est < 18 ans (consentement parental explicite), et candidature bénévole. Validation
  **accessible** (messages liés, `aria-invalid`, focus géré) et honeypot anti-spam.
- **Direction artistique** « blocs modulaires + typo forte » (modèle KIKK), une couleur par
  discipline, cadres nets et ombres dures (modèle Nuits Sonores), déclinée sur la **couche
  éditoriale « Jungle »** de l'édition (palette verte + toucan).
- **Intro animée « entrée dans la jungle »** (`assets/css/intro.css` + `assets/js/intro.js`) :
  feuillage SVG qui s'écarte + toucan, **en SVG/CSS** (aucune vidéo, poids quasi nul). Jouée
  **une seule fois par session**, bouton « Entrer » pour passer, **désactivée** sous
  `prefers-reduced-motion`, sans son — conforme au §8 du cahier des charges.
- **Thème clair/sombre** piloté par tokens, mémorisé entre les visites.
- **Accessibilité** visée WCAG 2.1 AA : HTML sémantique, skip-link, focus visibles,
  contrastes ≥ 4.5:1 (y compris en sombre et sur les couleurs de discipline), cibles
  tactiles 44px, respect de `prefers-reduced-motion`.
- **SEO de base** : `title` / `meta description` par page, Open Graph, **données structurées
  JSON-LD `Event`/`Festival`**, un seul `h1` par page.
- **RGPD** : bannière de consentement (refuser aussi simple qu'accepter, aucun script tiers
  avant accord), minimisation des données, soin particulier sur les données de mineurs.

## 4. Hors périmètre de l'ébauche (= phase de production)

Conformément au cahier des charges, ces points relèvent de la mise en production et **ne sont
pas** implémentés ici :

- **Back-end des formulaires** : l'envoi est *simulé* (message de confirmation, aucune donnée
  transmise). En production : fonctions serverless + e-mail transactionnel, validation
  **côté serveur**, jeton CSRF, rate limiting (§11, §15).
- **CMS headless** réel (les JSON le simulent), CI/CD, hébergement, monitoring (§10, §16).
- En-têtes de sécurité servis en **HTTP réel** (ici en `<meta>` à titre indicatif ;
  `X-Frame-Options`/`frame-ancestors` et CSP doivent être posés côté serveur/CDN).
- Pages restantes de l'arborescence (artistes, infos pratiques détaillées, actualités,
  archives, presse, légal…) et fonctions *Should/Could have* (timetable grille, galeries,
  feed Instagram, `.ics`, multilingue).

---

## 5. Déploiement (piste)

L'ébauche étant 100 % statique, elle se déploie telle quelle sur tout hébergeur statique
(Netlify, Cloudflare Pages, GitHub Pages, un simple Nginx) : il suffit de servir le dossier.
Pour la production, brancher les en-têtes de sécurité au niveau du serveur/CDN et remplacer
les `fetch` sur `/assets/data/*.json` par la source CMS retenue.

---

## 6. Convention de données

Les fichiers de `assets/data/` reprennent les entités du modèle de contenu du cahier des
charges (§10.2). Pour faire évoluer le contenu de l'ébauche, il suffit d'éditer ces JSON :
le rendu (programme, disciplines d'atelier, dates, compte à rebours) se met à jour sans
toucher au code.
