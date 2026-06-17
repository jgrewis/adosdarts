# Cahier des charges technique : refonte du site du Festival « À Dos d'Arts »

> Document de cadrage destiné à une équipe de développement web (Fullstack, Dev web front, Dev webdesign, Designer graphiste, Spécialiste ergonomie/UX).
> Objectif : refonte intégrale "from scratch" du site officiel `adosdarts.fr`.

---

## 0. Métadonnées du document

| Champ | Valeur |
|---|---|
| Projet | Refonte du site du Festival À Dos d'Arts (Rouffach, 68) |
| Domaine existant | `https://adosdarts.fr` (export statique d'un constructeur no-code, à remplacer) |
| Commanditaire | À préciser (Fédération des Foyers Clubs d'Alsace + CC Pays de Rouffach, Vignobles et Châteaux / collectif jeunesse) |
| Type de site | Site événementiel saisonnier, vitrine + fonctions transactionnelles légères |
| Destinataires de ce doc | Équipe dev (5 profils, voir §1.5) |
| Niveau attendu | Production, code maintenable, livré clé en main |
| Langue de l'interface | Français (prévoir architecture i18n pour extension future) |

**Convention de lecture.** Chaque section porte des étiquettes de rôle pour que chacun cible directement ce qui le concerne :
`[FS]` Fullstack · `[FRONT]` Dev web (HTML/JS/React) · `[WD]` Dev webdesign (CSS/SCSS/JS) · `[GRAPH]` Designer graphiste · `[UX]` Spécialiste ergonomie.

---

## 1. Contexte et vision

### 1.1 Le festival `[UX] [GRAPH] [tous]`

À Dos d'Arts est un festival artistique pluridisciplinaire qui se tient chaque fin d'été à Rouffach (Haut-Rhin, Alsace), sur les sites de l'Escapade et de la salle polyvalente. Caractéristiques structurantes qui doivent irriguer toute la conception :

* **Organisé par et pour la jeunesse.** Le festival est conçu et animé par un collectif de jeunes (environ 11 à 25 ans). Signature de marque : « le festival artistique créé par la jeunesse pour... tout le monde ». C'est l'axe identitaire numéro un.
* **Gratuité et accès libre.** Entrée gratuite, en plein air. Il n'y a donc pas de billetterie payante classique : la "conversion" se mesure en inscriptions ateliers, candidatures bénévoles, et présence le jour J.
* **Pluridisciplinarité.** Ateliers et représentations : graff, théâtre, danse, percussions, beatbox, impro, vidéo, photo, stand-up, concerts. Le site doit pouvoir présenter des disciplines hétérogènes sans hiérarchie figée.
* **Format hybride.** Ateliers pour les 10-17 ans en journée, représentations tout public en soirée, plus une formule "résidence artistique" de plusieurs jours avec nuitée.
* **Récurrence annuelle.** Édition numérotée (7e édition en 2025). Le site doit gérer le cycle "édition en cours / éditions passées / archives" sans refonte annuelle.
* **Ancrage territorial.** Soutien institutionnel (intercommunalité, Fédération des Foyers Clubs d'Alsace), logique associative, budget contraint, bénévolat.

### 1.2 L'existant `[FS] [FRONT]`

Le site actuel est un export statique généré par un constructeur (métadonnée applicative `export_website`), au contenu très réduit et rendu côté client. Limites observées : contenu pauvre, pas de gestion de contenu autonome par le collectif, structure non pérenne, SEO et performance non maîtrisés. **Décision : reconstruction complète, pas de reprise de code.** Seuls sont à récupérer le nom de domaine, les contenus éditoriaux existants et les éventuels visuels exploitables.

### 1.3 Objectifs du nouveau site `[tous]`

Par ordre de priorité décroissante :

1. **Donner envie** : transmettre l'énergie et l'esprit "jeune et créatif" avant même l'événement (storytelling, direction artistique forte).
2. **Informer sans friction** : dates, lieux, programme, accès, infos pratiques accessibles en 1 ou 2 clics, mobile en priorité.
3. **Faire agir** : inscription aux ateliers, candidature bénévole, contact, suivi des réseaux sociaux. Ce sont les vraies conversions.
4. **Autonomiser l'équipe** : le collectif doit pouvoir mettre à jour programme, artistes, dates et actualités sans développeur (CMS / back-office léger).
5. **Pérenniser** : architecture qui absorbe une nouvelle édition chaque année et capitalise les archives.
6. **Rayonner** : SEO local solide ("festival Rouffach", "festival Alsace gratuit", "festival jeunesse Haut-Rhin"), partage social optimisé.

### 1.4 Indicateurs de succès `[UX] [FS]`

* Taux d'accès au programme et aux infos pratiques en moins de 2 interactions depuis l'arrivée.
* Volume d'inscriptions ateliers et de candidatures bénévoles via le site (vs avant).
* Core Web Vitals au vert sur mobile (voir §12).
* Conformité accessibilité (cible RGAA / WCAG 2.1 AA, voir §13).
* Autonomie : x mises à jour de contenu réalisées par le collectif sans intervention dev sur une saison.

### 1.5 Composition de l'équipe et périmètres `[tous]`

| Rôle | Périmètre principal | Sections clés |
|---|---|---|
| Fullstack `[FS]` | Architecture, back-office/CMS, données, intégrations, déploiement, sécurité | §9, §10, §11, §15, §16 |
| Dev web `[FRONT]` | Intégration React/JS, composants, état, perf runtime, SEO technique | §5, §9, §12 |
| Dev webdesign `[WD]` | CSS/SCSS, design system technique, responsive, motion, qualité visuelle d'intégration | §7, §8, §14 |
| Designer graphiste `[GRAPH]` | Direction artistique, identité, déclinaison éditions, assets, iconographie | §6 |
| Spécialiste ergonomie `[UX]` | Personas, parcours, arborescence, wireframes, tests, accessibilité fonctionnelle | §2, §4, §13 |

### 1.6 Prérogatives du commanditaire (cadre imposé) `[tous]`

* Budget associatif : privilégier des solutions sobres, libres ou peu coûteuses en hébergement et licences.
* Maintenance future légère : le collectif tourne et se renouvelle, le code et le CMS doivent être documentés et pris en main rapidement.
* Pas de dépendance à un prestataire unique : stack standard, documentation livrée.
* Esprit DIY et jeunesse à préserver : un site léché mais jamais corporate ni aseptisé.
* Éco-conception et accessibilité considérées comme des exigences, pas des options.

---

## 2. Cibles, personas et intentions `[UX] [GRAPH]`

### 2.1 Personas

1. **Le festivalier local (16-30 ans).** Vient pour l'ambiance, découvre la prog le soir, mobile à 100 %. Besoins : dates, line-up, lieu, accès, "c'est gratuit ?". Arrive souvent par Instagram.
2. **Le jeune participant / artiste en herbe (10-17 ans).** Veut s'inscrire à un atelier ou à la résidence. Besoins : quelles disciplines, quand, comment s'inscrire, modalités (gratuit, encadré). Souvent accompagné d'un parent.
3. **Le parent.** Cherche du rassurant : encadrement, horaires, sécurité, contact, plan. Besoins : infos pratiques et confiance.
4. **Le bénévole potentiel.** Veut aider (bar, technique, photo). Besoin : formulaire de candidature simple.
5. **Le partenaire / institutionnel / presse.** Cherche dossier de presse, logos, contacts, historique du festival. Besoin : crédibilité et ressources téléchargeables.

### 2.2 Intentions prioritaires par persona (à matérialiser dans l'UI)

| Persona | Intention n°1 | CTA cible |
|---|---|---|
| Festivalier | "C'est quand, où, et quoi ?" | Voir le programme |
| Participant 10-17 | "Je veux participer" | S'inscrire à un atelier |
| Parent | "Est-ce sérieux et encadré ?" | Infos pratiques / Contact |
| Bénévole | "Je veux aider" | Devenir bénévole |
| Partenaire/presse | "Je veux des ressources" | Espace presse / partenaires |

### 2.3 Ton et registre `[GRAPH] [UX]`

Jeune, direct, chaleureux, inclusif, sans jargon. Tutoiement assumé sur les parcours participants et bénévoles (déjà présent dans la communication actuelle : « Tu as entre 10 et 17 ans ? Inscris-toi vite »). Vouvoiement possible sur les pages institutionnelles/partenaires. Le contraste de registre est un parti pris à documenter dans le guide éditorial.

---

## 3. Benchmark sectoriel : sites de référence et bonnes pratiques `[tous]`

> Partie d'analyse demandée. Sélection de sites de festivals reconnus pour leur qualité web, avec pour chacun : ce qui marche, la pratique concrète à reprendre, et l'applicabilité à Adod'art compte tenu de son budget et de son esprit. Tous ne sont pas des cibles "à copier" : certains sont des ambitions hautes, d'autres des modèles directement transposables.

### 3.1 Cou Cool (festival à taille humaine) `[UX] [GRAPH] [FRONT]`
`https://archives.cou.cool/`

Festival à taille humaine porté par des valeurs d'équité et de partage, avec un site immersif et narratif : on clique sur des personnages qui s'adressent au visiteur et l'embarquent dans une mini aventure qui raconte le festival.

* **À reprendre :** le storytelling interactif comme vecteur de valeurs. Pour un festival associatif et humain, l'immersion narrative crée de l'attachement bien plus qu'une page "À propos" classique.
* **Transposabilité Adod'art :** très forte sur l'esprit (taille humaine, valeurs, jeunesse). À adapter en version sobre : une narration légère (illustrations animées, personnages mascottes) sans surcoût technique excessif.

### 3.2 KIKK Festival (cultures numériques et créatives) `[WD] [GRAPH] [UX]`
`https://www.kikk.be/fr/`

Festival pluridisciplinaire (pas uniquement musical), structure claire, blocs bruts, très grosses typographies, animation marquante dès l'arrivée qui pose le caractère.

* **À reprendre :** la grille modulaire en blocs et la typographie comme matière première de l'identité. Permet de présenter des disciplines hétérogènes (graff, danse, théâtre, vidéo...) côte à côte, sans hiérarchie imposée, dans un système visuel cohérent.
* **Transposabilité Adod'art :** très forte. C'est le modèle de structuration de contenu le plus adapté à la pluridisciplinarité du festival.

### 3.3 Festival Musica (Strasbourg, Alsace) `[FRONT] [UX]`
`https://www.festivalmusica.fr/`

Mise en page éditoriale claire et typographique, chaque bloc respire, le contenu culturel est mis en avant (podcasts, appels à participation, focus d'œuvres) sans remplissage. Touche clé : un repère programme/calendrier persistant qui suit l'utilisateur pendant la navigation et donne un accès instantané aux dates et formats sans casser la lecture.

* **À reprendre :** le programme/calendrier persistant (élément d'UI ancré, type barre ou panneau accessible en permanence) et l'approche éditoriale "contenu d'abord". Référence locale en Alsace, donc registre culturel pertinent.
* **Transposabilité Adod'art :** forte. Le composant "programme toujours à portée" est une excellente réponse à l'intention n°1 du festivalier.

### 3.4 Dekmantel (musique électronique) `[FS] [GRAPH] [FRONT]`
`https://dekmantelfestival.com`

Site refondu chaque année avec une nouvelle direction artistique, mais structure stable : grandes listes de noms d'artistes, et chaque artiste dispose de sa propre page avec un logotype stylisé qui reprend l'identité de l'édition.

* **À reprendre :** la séparation nette entre une **ossature pérenne** (templates, routes, modèle de données) et un **habillage rejouable chaque édition** (thème, palette, typographie). C'est exactement ce qu'il faut pour un festival annuel. Modèle "artiste = entité avec sa page".
* **Transposabilité Adod'art :** forte sur l'architecture. À adapter : ici les "artistes" sont des groupes jeunes, des intervenants d'ateliers, des associations partenaires.

### 3.5 Nuits Sonores (Lyon) `[WD] [GRAPH]`
`https://nuits-sonores.com/`

Direction artistique affirmée (néon percutant), bordures nettes qui cadrent menus et cartes, mode clair/sombre assumé qui préserve la hiérarchie et la lisibilité, CTA billetterie toujours visible.

* **À reprendre :** le système de cartes encadrées comme brique d'UI réutilisable, le thème clair/sombre géré au niveau du design system (tokens de couleur), et la persistance du CTA principal.
* **Transposabilité Adod'art :** forte au niveau composants et design tokens. Le dark mode sert aussi l'ambiance "plein air en soirée".

### 3.6 Waking Life (Portugal) `[WD] [FRONT]`
`https://2025.wakinglife.pt/`

Interaction au survol très raffinée : la souris déforme délicatement des photographies argentiques ou des gradients en arrière-plan, comme une surface d'eau. Expérience sobre et élégante.

* **À reprendre :** une interaction signature subtile et performante (effet de distorsion/parallaxe léger sur des visuels), à condition de la rendre optionnelle et désactivable (prefers-reduced-motion, repli mobile).
* **Transposabilité Adod'art :** moyenne. À garder comme "touche signature" facultative, jamais au détriment de la perf ou de l'accessibilité.

### 3.7 Mentions complémentaires (ambitions hautes / repoussoirs)

* **Château Perché** (`chateauperchefestival.com`) : concept rétro "vieil OS", fenêtres flottantes, typographies monospace. Excellent pour montrer jusqu'où peut aller le parti pris ludique. Réservé si budget et temps le permettent.
* **Lollapalooza Paris** (`lollaparis.com`) : univers gamifié en WebGL/Three.js avec mascotte qui suit le curseur. **Ambition haute à manier avec prudence** : coût de dev, perf et accessibilité lourds. À ne pas viser pour un MVP associatif.
* **Pitchfork / Horst Arts & Music** : jeux de calques et de blocs colorés bruts façon galerie/musée. Bons réservoirs d'idées pour la mise en avant visuelle des artistes.

### 3.8 Synthèse : bonnes pratiques à retenir pour Adod'art `[tous]`

**Design et expérience**
* Poser l'ambiance dès l'arrivée (hero fort : visuel/vidéo légère, motion discret) : on doit "déjà y être".
* Storytelling de marque cohérent (valeurs jeunesse et gratuité visibles immédiatement).
* Dimension ludique mesurée : une interaction signature, pas un jeu vidéo.
* Grille modulaire en blocs + typographie forte pour absorber la pluridisciplinarité (modèle KIKK).
* Système de cartes encadrées réutilisable, thème clair/sombre par tokens (modèle Nuits Sonores).

**Architecture et contenu**
* Ossature pérenne + thème rejouable chaque édition (modèle Dekmantel).
* Entités structurées : Édition, Artiste/Intervenant, Atelier, Représentation/Créneau, Lieu, Actualité, Partenaire.
* Programme/calendrier accessible en permanence (modèle Festival Musica).

**Conversion (adaptée à un festival gratuit)**
* Accès en 1 ou 2 clics aux infos critiques (dates, lieu, programme, accès) et CTA persistants (S'inscrire à un atelier, Devenir bénévole).
* Mobile-first strict : la majorité du trafic vient du mobile et des réseaux sociaux.
* Social proof et prolongation post-événement : feeds, galeries photos, replays/playlists, contenus des bénévoles.

**Performance et sobriété**
* Vidéo d'ouverture légère et optimisée mobile (soigner le LCP).
* Animations discrètes au scroll, performantes et accessibles (style "éditorial/brutalist web" sobre).
* Éco-conception : poids maîtrisé, médias optimisés, pas d'effet gadget coûteux par défaut.

---

## 4. Architecture de l'information et arborescence `[UX] [FS] [FRONT]`

### 4.1 Arborescence cible (v1)

```
/ (Accueil)
├── /edition (Édition en cours : pitch, dates, lieux, teaser)
├── /programme (Programme : jours, créneaux, disciplines, filtres)
│   └── /programme/[slug-representation] (détail d'un créneau/spectacle)
├── /artistes (Artistes & intervenants)
│   └── /artistes/[slug] (fiche artiste/groupe/intervenant)
├── /ateliers (Ateliers & résidence : disciplines, public, inscription)
│   └── /ateliers/[slug] (détail d'un atelier)
├── /participer
│   ├── /participer/ateliers (s'inscrire comme participant 10-17)
│   └── /participer/benevole (devenir bénévole)
├── /infos-pratiques (accès, plan, horaires, restauration, FAQ, accessibilité du site)
├── /a-propos (le collectif, l'histoire, les valeurs, partenaires)
├── /actualites (news, billets)
│   └── /actualites/[slug]
├── /editions-passees (archives par année + galeries)
│   └── /editions-passees/[annee]
├── /presse-partenaires (dossier de presse, kit média, contacts)
├── /contact
└── pages légales : /mentions-legales, /politique-confidentialite, /accessibilite
```

### 4.2 Navigation `[UX] [WD]`

* Header persistant avec : logo, accès Programme, Participer (CTA accentué), Infos pratiques, et bascule clair/sombre.
* CTA principal contextuel selon la période (avant : "S'inscrire" ; pendant : "Programme du jour" ; après : "Revivre l'édition").
* Footer riche : récap dates/lieu, réseaux sociaux, appel bénévoles, partenaires, liens légaux, contact.
* Fil d'Ariane sur les pages profondes (fiches, archives).

### 4.3 États temporels du site (clé du projet) `[FS] [FRONT]`

Le site doit basculer automatiquement entre trois états selon la date, pilotés par les dates de l'édition courante :

1. **Avant édition** (teasing) : compte à rebours, appel à inscription ateliers et bénévoles, prog en cours de dévoilement.
2. **Pendant édition** (live) : programme du jour mis en avant, infos pratiques en tête, éventuel direct.
3. **Après édition** (archive) : galeries, remerciements, bascule vers la préparation de l'année suivante.

Implémentation : champ "état" calculé côté serveur/build à partir des dates, avec possibilité de forçage manuel via le CMS (override).

---

## 5. Spécifications fonctionnelles `[FRONT] [FS] [UX]`

Priorisation MoSCoW. "Must" = MVP de la première édition refondue.

### 5.1 Must have

* **Page d'accueil dynamique** selon l'état temporel (§4.3), hero d'ambiance, accès rapides.
* **Programme** : liste des créneaux par jour, par lieu, par discipline, avec filtres (jour, discipline, lieu, public) et recherche. Vue liste + vue calendrier/timetable.
* **Fiches artistes/intervenants** : photo, bio courte, discipline, créneaux associés, liens réseaux.
* **Ateliers et résidence** : présentation, public visé, créneaux, modalités, lien d'inscription.
* **Inscription atelier** : formulaire (participant + parent si mineur, consentement parental, discipline souhaitée, créneau). Stockage + notification e-mail aux organisateurs. Pas de paiement.
* **Candidature bénévole** : formulaire (nom, contact, disponibilités, pôle souhaité, message).
* **Infos pratiques** : accès (carte, transports, parking), horaires, restauration/buvette, FAQ, accessibilité du lieu.
* **Actualités** : liste + détail.
* **Contact** : formulaire + coordonnées + réseaux.
* **Back-office / CMS** (voir §10) : édition autonome des contenus par le collectif.
* **Pages légales et bannière cookies/consentement** conforme.
* **SEO technique** : métadonnées, Open Graph, sitemap, données structurées Event.
* **Responsive mobile-first** et accessibilité AA.

### 5.2 Should have

* **Timetable interactive** type grille horaire multi-scènes avec "ma sélection" (favoris) persistée localement.
* **Galeries photos/vidéos** par édition.
* **Compte à rebours** avant ouverture.
* **Thème clair/sombre** piloté par tokens.
* **Intégration feed Instagram** (esprit social proof) en respectant la perf et le RGPD.
* **Archives par édition** avec habillage figé de l'année.
* **Espace presse/partenaires** avec ressources téléchargeables (logos, dossier de presse PDF).

### 5.3 Could have

* Interaction signature (effet visuel sur le hero, type distorsion/parallaxe légère, désactivable).
* Narration interactive légère (mascottes/personnages, esprit Cou Cool).
* Playlist embarquée (artistes de l'édition) en post-événement.
* Multilingue (FR/DE pertinent en Alsace, voire EN).
* Notifications/rappels (ajout au calendrier .ics par créneau).

### 5.4 Won't have (cette version)

* Billetterie payante et paiement en ligne (festival gratuit).
* Application mobile native.
* Univers 3D/WebGL lourd type Lollapalooza (réévaluable plus tard).

---

## 6. Direction artistique et identité `[GRAPH]`

### 6.1 Plateforme de marque

* Axe central : **"créé par la jeunesse, pour tout le monde"**. Énergie, créativité, spontanéité, inclusion, gratuité.
* Univers pluridisciplinaire : le graff et la street culture comme socle visuel possible (le festival propose des ateliers graff), mais sans enfermer les autres disciplines.
* Éviter l'écueil corporate/institutionnel : le site doit rester vivant et "fait par des jeunes", tout en étant professionnel dans l'exécution technique.

### 6.2 Système graphique rejouable par édition `[GRAPH] [WD]`

Définir deux couches (modèle Dekmantel) :

* **Couche pérenne** : logo À Dos d'Arts, grille, principes typographiques, structure des composants.
* **Couche éditoriale annuelle** : palette de l'année, motif/texture, traitement photo, déclinaison du logotype. Livrée sous forme de thème de design tokens (voir §7) pour qu'un changement d'édition = changement de thème, pas de refonte.

### 6.3 Livrables graphistes

* Charte synthétique : logo et déclinaisons, palette(s) avec valeurs hex et usage, échelle typographique, iconographie, traitement des images (filtres, ratios), motifs/textures.
* Banque d'assets optimisés et exportés aux bons formats (SVG pour le logo et les icônes, WebP/AVIF pour les photos, formats responsive).
* Maquettes haute fidélité des écrans clés (accueil par état, programme, fiche artiste, atelier, formulaire, infos pratiques), desktop et mobile.
* Spécifications de motion concertées avec le dev webdesign (§8).
* Kit réseaux sociaux et OG images (cohérence partage/site).

### 6.4 Iconographie et illustration

* Style d'icônes unifié (trait, remplissage, grille) livré en jeu SVG.
* Option illustration/mascotte si la narration interactive est retenue (§5.3).

---

## 7. Design system et UI technique `[WD] [FRONT]`

### 7.1 Tokens de design (source de vérité)

Centraliser toutes les valeurs dans des **design tokens** (variables CSS custom properties, miroir SCSS), thémables pour le clair/sombre et par édition :

* Couleurs : primaires, secondaires, accent, sémantiques (succès/erreur/info), neutres, surfaces, bordures, états.
* Typographie : familles, échelle modulaire (clamp() pour le fluide), graisses, hauteurs de ligne, interlettrage.
* Espacement : échelle (4/8 px base), gouttières, marges de section.
* Rayons, ombres, bordures (les cadres nets façon Nuits Sonores comme composant).
* Points de rupture responsive (§14).
* Durées et courbes d'animation (§8).
* z-index documentés (couches header, overlays, modales).

### 7.2 Architecture CSS/SCSS `[WD]`

* Méthodologie de nommage cohérente et documentée (BEM, ou utilitaires + composants type approche moderne). Choix à acter et à respecter dans tout le projet.
* Découpage : `tokens` / `base` (reset, typography) / `layout` / `components` / `themes` / `utilities`.
* Aucune valeur en dur dans les composants : tout passe par les tokens.
* Préférer les solutions natives modernes (CSS Grid, container queries, `:has()`, `clamp()`) avec dégradation maîtrisée.
* Si CSS-in-JS ou CSS Modules selon le framework retenu (§9), garder la logique tokens identique.

### 7.3 Bibliothèque de composants `[FRONT] [WD]`

Composants à concevoir comme briques réutilisables et documentées (Storybook recommandé) :

* Header/navigation persistant + bascule de thème.
* Boutons et CTA (variantes, états, focus visibles).
* Carte (artiste, atelier, actualité, créneau) : modèle encadré réutilisable.
* Grille modulaire de blocs (modèle KIKK).
* Composant Programme/Timetable + filtres + favoris.
* Panneau/repère programme persistant (modèle Festival Musica).
* Formulaires (champs, validation, messages d'erreur accessibles).
* Galerie médias (lightbox accessible, lazy-loading).
* Compte à rebours.
* Footer.
* Bannière consentement cookies.
* Composant Hero (avec slot média et motion optionnel).

### 7.4 Documentation `[WD] [FRONT]`

Storybook ou équivalent : chaque composant documenté avec ses props, états, variantes et notes d'accessibilité. Livrable attendu en fin de projet.

---

## 8. Motion et interactions `[WD] [FRONT]`

* **Principe directeur :** le motion sert l'ambiance et la lisibilité, jamais le gadget. Animations discrètes au scroll, transitions douces, micro-interactions sur les CTA et cartes.
* **Interaction signature optionnelle :** effet hero type parallaxe/distorsion légère (inspiration Waking Life), encapsulé, désactivable, repli statique sur mobile et sur `prefers-reduced-motion`.
* **Performance :** animer uniquement `transform` et `opacity`, éviter le reflow. Préférer le CSS et l'API Web Animations ; réserver les libs (GSAP, Framer Motion) aux besoins réels.
* **Accessibilité :** respect strict de `prefers-reduced-motion: reduce` (couper ou réduire). Pas d'autoplay sonore.
* **Vidéo hero :** légère, compressée, formats modernes, poster image, lazy, jamais bloquante pour le LCP.
* Spécifications de durées et courbes centralisées dans les tokens (§7.1), co-définies avec le graphiste.

---

## 9. Architecture technique et stack `[FS] [FRONT]`

### 9.1 Recommandation de stack

Compte tenu des objectifs (SEO, perf, contenu géré par des non-techniciens, budget associatif, maintenabilité) :

* **Framework recommandé : Next.js (React)** en rendu statique/incrémental (SSG/ISR). Justification : excellent SEO, performance, écosystème React demandé par l'équipe, génération statique idéale pour un site événementiel à fort trafic ponctuel et budget d'hébergement réduit.
* **Alternative légère** si l'équipe préfère : Astro (îlots React pour l'interactif). Très pertinent pour un site majoritairement éditorial avec quelques zones interactives (programme, formulaires) ; sortie statique très sobre.
* **Langage :** TypeScript obligatoire (fiabilité, maintenabilité, passation).
* **Styles :** voir §7 (tokens + SCSS / CSS Modules / utilitaires selon choix acté).

> Le choix final Next.js vs Astro est à trancher par l'équipe en réunion de cadrage technique selon l'appétence et le poids des fonctions interactives. Les deux satisfont le cahier des charges.

### 9.2 Rendu et données `[FS] [FRONT]`

* Pages éditoriales : génération statique (build) avec revalidation incrémentale pour les contenus mis à jour via CMS.
* Données dynamiques (formulaires) : routes API / fonctions serverless.
* État client léger pour favoris/timetable : stockage local côté navigateur (le projet n'a pas de compte utilisateur). Ne pas utiliser de stockage navigateur dans des contextes non supportés ; ici site réel hors artefact, `localStorage` autorisé pour les favoris non sensibles.

### 9.3 Qualité de code `[FS] [FRONT] [WD]`

* ESLint + Prettier + config TypeScript stricte, partagés.
* Conventions de commit (Conventional Commits) et PR review obligatoire.
* Tests : unitaires sur la logique (état temporel, filtres programme), tests d'accessibilité automatisés (axe), au moins quelques tests end-to-end sur les parcours critiques (inscription, bénévole).
* Documentation technique (README d'install, variables d'environnement, procédure de build et de déploiement).

---

## 10. Modèle de données et gestion de contenu `[FS]`

### 10.1 CMS

Exigence forte : autonomie éditoriale du collectif. Recommandation : **CMS headless** adapté à un budget associatif et facile à prendre en main :

* Options à évaluer : Sanity, Strapi (auto-hébergé), Directus, ou un CMS git-based léger (Decap/Netlify CMS) si l'on veut zéro coût d'infra et un workflow simple.
* Critères : interface en français claire, gestion des médias, rôles éditeurs, prévisualisation, coût.

### 10.2 Modèle de contenu (entités)

```
Edition
  - annee (number)
  - numero (number, ex: 7)
  - date_debut, date_fin
  - lieux[] (ref Lieu)
  - theme (ref Theme édition : palette, typo, motif)
  - statut (auto: avant/pendant/après + override manuel)
  - pitch, visuel_hero, video_hero

Lieu
  - nom (Escapade, Salle polyvalente...)
  - adresse, coordonnees_geo
  - acces, plan

Artiste / Intervenant
  - nom, type (groupe / artiste / association / intervenant atelier)
  - discipline[] (graff, théâtre, danse, percussions, beatbox, vidéo, photo, stand-up, concert...)
  - bio, photo, liens_reseaux
  - editions[] (ref Edition)

Creneau / Representation
  - titre, edition (ref), jour, heure_debut, heure_fin
  - lieu (ref Lieu), discipline, artistes[] (ref)
  - public (tout public / 10-17 / famille), description

Atelier
  - titre, discipline, public_vise, edition (ref)
  - creneaux[], modalites, encadrant (ref Intervenant)
  - inscription_ouverte (bool)

Actualite
  - titre, slug, date, contenu, image, edition (ref optionnel)

Partenaire
  - nom, logo, type, lien

InscriptionAtelier (données saisies via formulaire, stockées hors CMS public)
CandidatureBenevole (idem)
```

### 10.3 Données structurées SEO `[FS] [FRONT]`

Implémenter le balisage Schema.org `Event` / `Festival` (dates, lieu, offres gratuites, organisateur) sur la page édition et les créneaux, pour l'éligibilité aux résultats enrichis et à Google Events.

---

## 11. Intégrations tierces `[FS]`

* **Formulaires** (inscription atelier, bénévole, contact) : back serverless + e-mail transactionnel (service type Resend/Postmark/SendGrid ou SMTP de l'asso). Anti-spam (honeypot + challenge respectueux de la vie privée, éviter les CAPTCHA intrusifs).
* **Réseaux sociaux** : intégration feed Instagram en respectant perf et RGPD (chargement différé, consentement). Boutons de partage natifs et OG complets.
* **Cartographie** : carte d'accès (privilégier une solution respectueuse vie privée, ex. fonds OpenStreetMap, plutôt qu'un embed lourd traçant par défaut).
* **Calendrier** : génération de fichiers `.ics` par créneau ("Ajouter à mon agenda").
* **Analytics** : solution respectueuse du RGPD et sans bandeau lourd si possible (Plausible, Matomo). Mesurer les vraies conversions (inscriptions, candidatures, accès programme).
* **Médias** : pipeline d'optimisation d'images (formats AVIF/WebP, responsive, lazy).

> Règle de gouvernance : aucune intégration ne doit dégrader les Core Web Vitals ni contourner le consentement. Tout script tiers est chargé après consentement et de façon différée.

---

## 12. Performance et SEO `[FRONT] [FS]`

### 12.1 Performance (cibles)

* Core Web Vitals au vert sur mobile (LCP, INP, CLS).
* Budget de performance défini (poids de page, nombre de requêtes, poids JS). À acter en cadrage.
* Images : formats modernes, dimensions responsive, lazy-loading, `priority` uniquement sur le hero.
* JS : minimiser le bundle, code-splitting, hydratation partielle (atout Astro le cas échéant).
* Vidéo hero non bloquante (poster + chargement différé).
* Mise en cache et CDN (statique).

### 12.2 SEO

* Métadonnées par page, titres et descriptions maîtrisés, Open Graph et Twitter Card cohérents avec le kit graphiste.
* Sitemap.xml et robots.txt.
* URLs propres et stables (slugs), redirections depuis l'ancien site si des URLs existaient.
* Données structurées Event (§10.3).
* SEO local : cibler "festival Rouffach", "festival gratuit Alsace", "festival jeunesse Haut-Rhin", "ateliers artistiques Rouffach". Contenu éditorial riche (à propos, actualités, archives) pour la longue traîne.
* Performance = facteur SEO : voir §12.1.

---

## 13. Accessibilité `[UX] [FRONT] [WD]`

Cible : **RGAA / WCAG 2.1 niveau AA** (le festival a un soutien institutionnel, l'accessibilité est attendue et cohérente avec ses valeurs d'inclusion).

* Contrastes conformes (vérifier la palette graphiste avant intégration, notamment en dark mode et sur les néons/fluos).
* Navigation clavier complète, focus visibles, ordre de tabulation logique, skip links.
* Sémantique HTML correcte, landmarks ARIA si nécessaire (pas d'ARIA superflu).
* Alternatives textuelles sur tous les médias porteurs de sens.
* Formulaires accessibles : labels, messages d'erreur liés, instructions explicites.
* Respect de `prefers-reduced-motion` (§8).
* Composants interactifs (timetable, filtres, lightbox, modales) testés au clavier et au lecteur d'écran.
* Page `/accessibilite` avec déclaration de conformité.
* Tests : automatisés (axe) en CI + tests manuels clavier/lecteur d'écran sur les parcours critiques.

---

## 14. Responsive et mobile-first `[WD] [UX]`

* Conception **mobile d'abord** : la majorité du trafic vient du mobile et des réseaux sociaux.
* Points de rupture documentés dans les tokens (mobile, tablette, desktop, large), avec usage de container queries quand pertinent.
* Cibles tactiles d'au moins 44x44 px, espacements adaptés au pouce.
* Programme/timetable : pensé d'abord en vue mobile (liste filtrable) avant la grille horaire desktop.
* Tester sur appareils réels et conditions réseau dégradées (le festival est en plein air, 4G variable).

---

## 15. Sécurité, RGPD et conformité `[FS]`

* HTTPS partout, en-têtes de sécurité (CSP, HSTS, X-Content-Type-Options, etc.).
* Données personnelles minimisées : ne collecter que le nécessaire dans les formulaires.
* **Mineurs :** l'inscription aux ateliers concerne des 10-17 ans. Prévoir consentement parental explicite, mention de la finalité, durée de conservation limitée, et accès restreint aux données côté organisateurs. Traiter ces données avec un soin particulier.
* Registre des traitements, politique de confidentialité claire, base légale identifiée.
* Bannière de consentement conforme (refus aussi simple que l'acceptation), scripts tiers bloqués avant consentement.
* Stockage des candidatures/inscriptions sécurisé, e-mails de notification vers une adresse maîtrisée par l'association.
* Pas de données sensibles dans les URLs.

---

## 16. Environnements, déploiement, CI/CD et exploitation `[FS]`

* **Versionnage :** Git, branches (main protégée, feature branches, PR + review).
* **Environnements :** local, préproduction (preview), production.
* **CI/CD :** pipeline (lint, types, tests, build, déploiement) déclenché sur PR et merge. Previews automatiques par PR.
* **Hébergement :** privilégier une plateforme statique/JAMstack économique avec CDN (cohérent avec un budget associatif et un trafic saisonnier). CMS headless hébergé séparément ou en SaaS gratuit/peu coûteux.
* **Sauvegardes :** contenu CMS et données de formulaires sauvegardés régulièrement.
* **Monitoring :** disponibilité (uptime), erreurs (logs/Sentry), suivi des Core Web Vitals en production.
* **Documentation de passation :** README complet, procédure de mise à jour de contenu pour le collectif (guide non technique), procédure de "nouvelle édition".

---

## 17. Roadmap et phasage `[tous]`

### Phase 0 : cadrage
Atelier d'équipe : validation de l'arborescence (§4), choix stack final Next.js vs Astro (§9), choix CMS (§10), budgets perf et accessibilité, planning.
Livrables : ce document validé, maquettes basse fidélité (wireframes) `[UX]`.

### Phase 1 : fondations
Design system et tokens `[GRAPH] [WD]`, maquettes haute fidélité des écrans clés `[GRAPH]`, setup projet/CI/CD `[FS] [FRONT]`, modèle de contenu CMS `[FS]`.

### Phase 2 : MVP (Must have, §5.1)
Accueil par état, programme + filtres, fiches artistes, ateliers, formulaires inscription et bénévole, infos pratiques, actualités, contact, CMS opérationnel, SEO technique, accessibilité AA, responsive.

### Phase 3 : enrichissements (Should have, §5.2)
Timetable interactive + favoris, galeries, thème clair/sombre, feed Instagram, archives, espace presse.

### Phase 4 : signature et finitions (Could have, §5.3)
Interaction signature, narration légère, multilingue, .ics, playlist post-événement.

### Phase 5 : recette, lancement, passation
Tests (perf, a11y, e2e), recette avec le collectif, formation à l'édition de contenu, mise en production, documentation de passation.

---

## 18. Definition of Done et critères d'acceptation `[tous]`

Une fonctionnalité est "terminée" quand :

* Elle est responsive et conforme aux maquettes validées.
* Elle est accessible (clavier + lecteur d'écran sur parcours critiques, axe au vert).
* Elle respecte les design tokens (aucune valeur en dur).
* Elle est typée (TypeScript) et passe lint + tests en CI.
* Elle est documentée (Storybook pour les composants, README pour les fonctions).
* Elle respecte les budgets de performance (Core Web Vitals au vert sur mobile).
* Le contenu associé est éditable via le CMS quand c'est attendu.
* Elle est conforme RGPD lorsqu'elle traite des données.
* Elle a été relue (PR review) et validée en préprod.

Critères d'acceptation globaux du site :

* Les 5 intentions de personas (§2.2) sont atteignables en 1 ou 2 clics depuis l'accueil.
* La bascule d'état temporel (avant/pendant/après) fonctionne automatiquement et est forçable manuellement.
* Le collectif peut publier une actualité, ajouter un artiste et un créneau, et ouvrir une nouvelle édition sans intervention dev.
* Conformité accessibilité AA documentée sur `/accessibilite`.
* Lighthouse mobile au vert sur les pages clés.

---

## 19. Annexes

### 19.1 Récapitulatif "qui fait quoi" (RACI léger)

| Domaine | Pilote | Contributeurs |
|---|---|---|
| Personas, parcours, arborescence, wireframes, tests a11y | `[UX]` | `[GRAPH]` `[FRONT]` |
| Identité, charte, maquettes HF, assets | `[GRAPH]` | `[WD]` `[UX]` |
| Design system technique, CSS/SCSS, responsive, motion | `[WD]` | `[FRONT]` `[GRAPH]` |
| Intégration React/JS, composants, état, perf runtime, SEO technique | `[FRONT]` | `[WD]` `[FS]` |
| Architecture, CMS, données, intégrations, sécurité, RGPD, déploiement | `[FS]` | `[FRONT]` |

### 19.2 Sources et références

Festival À Dos d'Arts :
* Site officiel : `https://adosdarts.fr`
* Ville de Rouffach (édition 2025, 7e édition) : `https://www.ville-rouffach.fr/actualites/665-festival-a-dos-d-art`
* Office de tourisme Eguisheim-Rouffach : `https://www.tourisme-eguisheim-rouffach.com/FR/Festival-Dos-Arts-f253003145.html`
* JDS (historique éditions) : `https://www.jds.fr/manifestations/festival/festival-a-dos-d-arts-5-278109_A`
* Facebook officiel : `https://www.facebook.com/festivaladosdarts/`

Benchmark sites de festivals (sélection et analyse) :
* Veille design 2025, Quentin Renaux : `https://quentinrenaux.com/sites-festivals-inspirations/`
* Cou Cool : `https://archives.cou.cool/`
* KIKK Festival : `https://www.kikk.be/fr/`
* Festival Musica : `https://www.festivalmusica.fr/`
* Dekmantel : `https://dekmantelfestival.com`
* Nuits Sonores : `https://nuits-sonores.com/`
* Waking Life : `https://2025.wakinglife.pt/`
* Château Perché : `https://chateauperchefestival.com`
* Lollapalooza Paris : `https://www.lollaparis.com/`

---

*Fin du document. Toute décision laissée ouverte (choix de stack, CMS, hébergeur, méthodologie CSS) est à acter en réunion de cadrage Phase 0 et à reporter dans ce document en version suivante.*
