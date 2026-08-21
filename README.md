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
├── jeu-melodie.html        # « Compose ta mélodie » : instrument jouable (piano/guitare/trompette),
│                           #   accordé au thème du festival, ouvert depuis le menu ou le toucan de l'accueil
├── galerie.html            # Galerie photos complète (alimentée depuis admin.html)
├── admin.html              # ⚠️ Page d'administration privée (mot de passe) : publier / supprimer des photos
│                           #   noindex + Disallow robots.txt. N'est liée depuis aucune page.
│
├── assets/
│   ├── css/
│   │   ├── tokens.css      # SOURCE DE VÉRITÉ : palette affiche, polices @font-face, espacements, ombres
│   │   ├── base.css        # Reset, typographie, accessibilité (focus, skip-link, honeypot)
│   │   ├── layout.css      # Header persistant, nav mobile, footer, grilles
│   │   ├── components.css  # Boutons, cartes, badges, formulaires, compte à rebours, cookies
│   │   ├── pages.css       # Hero d'affiche, programmation, timeline, memories, partenaires
│   │   ├── loader.css      # Animation de chargement « entrée dans la jungle »
│   │   └── jeu-melodie.css # Styles de la page jeu (scène nocturne, clavier, transport…)
│   │
│   ├── vendor/             # Bibliothèques tierces vendorisées (CSP script-src 'self', pas de CDN)
│   │   ├── tone.min.js     # Tone.js 14.7.77 (MIT) — moteur audio du jeu
│   │   ├── lz-string.min.js # lz-string 1.5.0 (MIT) — compression des liens de partage
│   │   └── LICENCES.md     # Origine et licence de chaque lib/sample vendorisé
│   │
│   ├── audio/melodie/      # Samples piano/guitare/trompette (< 3 Mo), licences CC (cf. LICENCES.md)
│   │
│   ├── js/                 # Modules ES (type="module"), une responsabilité par fichier
│   │   ├── boot-index.js / boot-programmation.js / boot-contact.js / boot-simple.js
│   │   │                   #   Points d'entrée par page (scripts externes → CSP stricte sans inline)
│   │   ├── boot-jeu-melodie.js  # Point d'entrée de la page jeu (layout + orchestration du jeu)
│   │   ├── nav.js          # Menu mobile accessible
│   │   ├── countdown.js    # Compte à rebours jusqu'au 22/08/2026 15h00 (Europe/Paris)
│   │   ├── loader.js       # Overlay de chargement (SVG toucan/feuilles), 1×/session, reduced-motion
│   │   ├── programme.js    # Rendu des 4 groupes depuis programmation.json
│   │   ├── partenaires.js  # Rendu organisateurs (mis en avant) + partenaires depuis edition.json
│   │   ├── forms.js        # Validation accessible + honeypot, envoi réel vers assets/php/envoi-contact.php
│   │   ├── cookie.js       # Bannière de consentement RGPD
│   │   └── melodie/        # Modules du jeu (moteur audio, clavier, accords, enregistrement, partage…)
│   │
│   ├── php/                # Le seul code serveur du site (Ionos, PHP)
│   │   ├── envoi-contact.php    # Envoi réel des 2 formulaires de contact (en production)
│   │   ├── admin-api.php        # API de la page d'administration (photos, journal, session)
│   │   └── config-admin.example.php  # Modèle : le vrai config-admin.php (hachage du mot de
│   │                       #   passe) est gitignoré et ne se dépose qu'une fois sur le serveur
│   │
│   ├── uploads/            # ⚠️ CONTENU CRÉÉ PAR LE CLIENT, sur le serveur uniquement.
│   │                       #   Photos publiées + galerie.json + journal.jsonl.
│   │                       #   Gitignoré. NE JAMAIS téléverser ce dossier : ça écraserait
│   │                       #   les photos du client (cf. PROCESS-mise-en-ligne.md §7).
│   │                       #   Seul le .htaccess de durcissement est versionné.
│   │
│   ├── data/               # « CMS » de l'ébauche : éditer ici pour mettre à jour le contenu
│   │   ├── edition.json    # Date, lieu, horaires, infos pratiques, organisateurs, partenaires, réseaux
│   │   ├── programmation.json  # Les 4 groupes (style, scène, description, image, liens)
│   │   └── melodie-demos.json  # 3 démos préenregistrées du jeu (format Recording)
│   │
│   ├── fonts/              # Polices de marque (Core Circus 2D Double, Maven Pro, Frutiger)
│   └── img/
│       ├── toucan.svg, elements/   # Toucan + feuilles (hero, loader)
│       ├── affiches/      # Anciennes affiches (memories) : 2026, 2022
│       └── partenaires/   # Logos organisateurs + partenaires
│
├── tests/
│   └── jeu-melodie.html   # Tests navigateur des modules purs du jeu (noindex, hors sitemap)
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
  validation accessible côté client **et côté serveur**, **envoi réel** vers
  `contact@adosdarts.fr` via `assets/php/envoi-contact.php` — en production depuis
  le 28/07/2026).
- **Memories** : galerie des anciennes affiches.
- **Galerie photos** : grille « En images » sur l'accueil (**8 photos les plus récentes**)
  et page `galerie.html` (toutes les photos). Alimentée par la page d'administration.
  Tant qu'aucune photo n'est publiée, les cases en pointillés « Photo à venir » restent
  affichées — c'est aussi ce que voit un visiteur sans JavaScript.
- **Administration** (`admin.html`) : protégée par mot de passe (bcrypt, limitation de
  débit, session `HttpOnly`/`SameSite`, jeton anti-CSRF). Permet de **publier** et de
  **supprimer** des photos, de consulter un **journal** des actions et l'**état du serveur**.
  Les photos sont **réduites à 1600 px dans le navigateur** avant l'envoi, ce qui supprime
  au passage leurs métadonnées EXIF (dont la géolocalisation).
- **Partenaires** : **2 organisateurs mis en avant** (Foyers Clubs d'Alsace, CCPAROVIC)
  + partenaires institutionnels.
- **Réseaux** : Facebook, Instagram, e‑mail (`contact@adosdarts.fr`). **Pas de TikTok.**
- **Compose ta mélodie** (`jeu-melodie.html`) : instrument jouable en direct (piano,
  guitare, trompette samplés via Tone.js vendorisée), notes et accords, multi-touch
  mobile avec glissando, clavier physique AZERTY, enregistrement/relecture fidèle,
  autosauvegarde locale, partage par lien compressé (lz-string) ou export/import
  JSON, 3 démos animées. Accessible depuis le menu (« Le jeu ») ou en cliquant sur
  le toucan de l'accueil. Détail complet : `cahier-des-charges-compose-ta-melodie.md`
  et `plan-compose-ta-melodie.md`.
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

- **Back-end des formulaires** : ✅ **fait** (28/07/2026). Les deux formulaires de contact
  envoient réellement un e-mail via `assets/php/envoi-contact.php` (validation côté serveur,
  honeypot, protection anti-injection d'en-têtes, vérification d'origine). Restent hors
  périmètre : captcha, limitation de débit, accusé de réception automatique.
- **En-têtes de sécurité en HTTP réel** : ici en `<meta>`. À reposer côté serveur
  (`X-Frame-Options`, CSP, etc.) — **désormais possible** via `.htaccess` sur l'hébergement
  Apache d'Ionos, ça ne l'était pas sur GitHub Pages.
- **Pages légales** : « Mentions légales » et « Accessibilité » sont des placeholders.
- **Licence des polices** : Core Circus et Frutiger sont des polices **commerciales**,
  intégrées à la demande du client. Vérifier la licence d'embarquement web avant mise
  en ligne publique. (Maven Pro est sous OFL.)
- **Contenu groupes** : descriptions, photos et liens d'écoute définitifs à fournir.
- **Guitare (V1)** : interface boutons-notes sur les 6 cordes à vide plutôt que des
  cordes horizontales grattables (décision prise à l'étape 6, cf. plan de
  développement) ; les cordes grattables, l'overdub et l'export WAV sont prévus en V1.1.

### Bibliothèques et licences vendorisées (jeu « Compose ta mélodie »)

Aucun CDN (CSP `script-src 'self'`) : deux bibliothèques sont copiées dans
`assets/vendor/` en version figée, détaillées avec leurs licences dans
`assets/vendor/LICENCES.md` :

- **Tone.js 14.7.77** (MIT) — moteur audio (Sampler, horloge, rejeu)
- **lz-string 1.5.0** (MIT) — compression des liens de partage

Les samples audio (`assets/audio/melodie/`) proviennent du dépôt libre
`nbrosowsky/tonejs-instruments` (licences CC, créditées dans `LICENCES.md` et en
bas de la page du jeu).

---

## 6. Déploiement

**En production sur `https://adosdarts.fr`** — hébergement mutualisé **Ionos** (Apache, PHP),
racine web `/adosdart/`. Le déploiement est **manuel**, via le gestionnaire de fichiers Ionos :
committer ne met rien en ligne.

📄 **Procédure complète, vérifications et pièges : [`PROCESS-mise-en-ligne.md`](PROCESS-mise-en-ligne.md)
— à lire avant toute mise en ligne.**

Le site reste 100 % statique hormis le script d'envoi des formulaires.
**Tous les chemins sont relatifs.** ⚠️ Ne jamais introduire de chemin absolu commençant
par `/`.
