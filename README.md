# Festival À Dos d'Arts #8 — Site de la soirée concerts

Site du **Festival À Dos d'Arts** (Rouffach, Haut-Rhin), recentré sur la **soirée
concerts** de la 8ᵉ édition : **samedi 22 août 2026, à L'Escapade de Rouffach**.
Festival **gratuit**, **entrée libre**, sans billetterie ni inscription.

> Construit en **HTML / CSS / JavaScript vanilla**, sans build ni dépendance, pour
> rester lisible par toute l'équipe. Identité reprise de l'affiche officielle 2026
> (palette flat / low-poly, toucan, polices de marque). Déployable tel quel sur
> tout hébergeur statique.

---

## 1. Lancement

Le site charge ses données via `fetch()` sur des fichiers JSON locaux : **un serveur
HTTP local est nécessaire** (l'ouverture directe en `file://` est bloquée par le
navigateur).

```bash
# depuis la racine du projet
python3 -m http.server 8765
# puis ouvrir http://localhost:8765
```

Alternatives : `npx serve .` (Node) ou `php -S localhost:8765` (PHP).
Aucune installation, aucune compilation : il n'y a pas de `package.json`.

---

## 2. Structure

```
Adodart/
├── index.html              # Accueil : hero (affiche), compte à rebours, teaser prog, memories, partenaires
├── programmation.html      # Les 4 groupes (2 scènes), rendus depuis JSON
├── infos.html              # Lieu (Maps), horaires, infos pratiques, éco-responsabilité
├── contact.html            # Formulaire bénévole + formulaire artistes, réseaux
├── principe.html           # « Le principe du festival » (page accessoire, en 3 temps)
│
├── assets/
│   ├── css/
│   │   ├── tokens.css      # SOURCE DE VÉRITÉ : palette affiche, polices @font-face, espacements, ombres
│   │   ├── base.css        # Reset, typographie, accessibilité (focus, skip-link, honeypot)
│   │   ├── layout.css      # Header persistant, nav mobile, footer, grilles
│   │   ├── components.css  # Boutons, cartes, badges, formulaires, compte à rebours, cookies
│   │   ├── pages.css       # Hero d'affiche, programmation, timeline, memories, partenaires
│   │   └── loader.css      # Animation de chargement « entrée dans la jungle »
│   │
│   ├── js/                 # Modules ES (type="module"), une responsabilité par fichier
│   │   ├── boot-index.js / boot-programmation.js / boot-contact.js / boot-simple.js
│   │   │                   #   Points d'entrée par page (scripts externes → CSP stricte sans inline)
│   │   ├── nav.js          # Menu mobile accessible
│   │   ├── countdown.js    # Compte à rebours jusqu'au 22/08/2026 15h00 (Europe/Paris)
│   │   ├── loader.js       # Overlay de chargement (SVG toucan/feuilles), 1×/session, reduced-motion
│   │   ├── programme.js    # Rendu des 4 groupes depuis programmation.json
│   │   ├── partenaires.js  # Rendu organisateurs (mis en avant) + partenaires depuis edition.json
│   │   ├── forms.js        # Validation accessible + honeypot (envoi simulé)
│   │   └── cookie.js       # Bannière de consentement RGPD
│   │
│   ├── data/               # « CMS » de l'ébauche : éditer ici pour mettre à jour le contenu
│   │   ├── edition.json    # Date, lieu, horaires, infos pratiques, organisateurs, partenaires, réseaux
│   │   └── programmation.json  # Les 4 groupes (style, scène, description, image, liens)
│   │
│   ├── fonts/              # Polices de marque (Core Circus 2D Double, Maven Pro, Frutiger)
│   └── img/
│       ├── toucan.svg, elements/   # Toucan + feuilles (hero, loader)
│       ├── affiches/      # Anciennes affiches (memories) : 2026, 2022
│       └── partenaires/   # Logos organisateurs + partenaires
│
├── .gitignore             # Ignore _client_assets/ et le .zip source (lourds, hors livrable)
└── README.md
```

---

## 3. Ce qui est couvert

- **Accueil façon affiche** : hero (palette + toucan + feuilles de l'affiche officielle),
  **compte à rebours** jusqu'à l'ouverture des portes (22/08/2026 15h00, heure de Paris,
  via `edition.json > ouverture_iso` avec décalage horaire explicite).
- **Animation de chargement** « entrée dans la jungle » (SVG toucan + feuilles fournis),
  jouée **une seule fois par session**, bouton « Entrer » + touche Échap, **désactivée**
  sous `prefers-reduced-motion`, sans son.
- **Programmation** : les **4 groupes** (SYMBIOZ, AORAKI, KIF & LUNIK, SOBEIKH) sur
  **2 scènes**, rendus depuis `programmation.json` (descriptions, photos et liens
  d'écoute restent à compléter par l'organisation — les liens vides sont masqués).
- **Infos pratiques** : lieu (**lien Google Maps**), horaires, restauration, accessibilité,
  éco-responsabilité.
- **Contact** : **formulaire bénévole** + **formulaire artistes** (honeypot anti-spam,
  validation accessible côté client, **envoi simulé** — pas de backend dans l'ébauche).
- **Memories** : galerie des anciennes affiches.
- **Partenaires** : **2 organisateurs mis en avant** (Foyers Clubs d'Alsace, CCPAROVIC)
  + partenaires institutionnels.
- **Réseaux** : Facebook, Instagram, e‑mail (`contact@adosdarts.fr`). **Pas de TikTok.**
- **Accessibilité** WCAG 2.1 AA : HTML sémantique, skip-link, focus visibles, contrastes
  ≥ 4.5:1, cibles tactiles ≥ 44px, respect de `prefers-reduced-motion`.
- **SEO** : `title` / `meta description` / Open Graph par page, **JSON-LD `MusicEvent`**
  sur l'accueil, un seul `h1` par page.
- **RGPD** : bannière de consentement, aucun traceur tiers actif.
- **Sécurité** : CSP stricte (`script-src 'self'`, scripts externalisés), `nosniff`,
  `Referrer-Policy`, échappement XSS systématique des données injectées.

---

## 4. Mettre à jour le contenu

Tout le contenu éditorial vit dans **`assets/data/`** — pas besoin de toucher au code :

- **`edition.json`** : dates, horaires, lieu/Maps, infos pratiques, organisateurs,
  partenaires, réseaux. Le compte à rebours suit `ouverture_iso`.
- **`programmation.json`** : pour chaque groupe — `style`, `scene`, `description`,
  `image` (chemin relatif dans `assets/img/`), `youtube`, `ecoute`. Mettre une valeur
  `null` masque proprement le lien/visuel correspondant.

---

## 5. Hors périmètre de l'ébauche (= phase de production)

- **Back-end des formulaires** : envoi *simulé*. En production : fonction serverless +
  e-mail transactionnel, validation **côté serveur**, jeton CSRF, rate limiting.
- **En-têtes de sécurité en HTTP réel** : ici en `<meta>`. À reposer côté serveur/CDN
  (`X-Frame-Options`, CSP, etc.). GitHub Pages ne permet pas d'en-têtes personnalisés.
- **Pages légales** : « Mentions légales » et « Accessibilité » sont des placeholders.
- **Licence des polices** : Core Circus et Frutiger sont des polices **commerciales**,
  intégrées à la demande du client. Vérifier la licence d'embarquement web avant mise
  en ligne publique. (Maven Pro est sous OFL.)
- **Contenu groupes** : descriptions, photos et liens d'écoute définitifs à fournir.

---

## 6. Déploiement

100 % statique : se déploie tel quel (GitHub Pages, Netlify, Cloudflare Pages, Nginx…).
**Tous les chemins sont relatifs** → compatible avec un déploiement en sous-chemin
(ex. GitHub Pages `/adosdarts/`). ⚠️ Ne jamais introduire de chemin absolu commençant
par `/` : cela casserait le site en sous-chemin.
