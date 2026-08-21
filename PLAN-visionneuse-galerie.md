# Plan — Visionneuse : afficher une photo en grand au clic

> Document de travail. Créé le 03/08/2026.
> Référentiels : `1.Regles.md`, `2.BonnesPratiques.md` (§14 accessibilité, §17.2 injection),
> `3.Planification.md`. Déploiement : `PROCESS-mise-en-ligne.md`.

---

## 1. Résumé de la demande

Au clic sur une vignette de la galerie, la photo s'affiche **en grand**, par-dessus la page.
Vaut pour les deux endroits où les vignettes existent : la grille « En images » de l'accueil
et la page `galerie.html`.

> Ce point était **explicitement hors périmètre** du chantier admin/galerie
> (`PLAN-admin-photos.md` §2, « Lightbox / visionneuse plein écran »). Le client le demande
> maintenant : le périmètre est rouvert pour cette fonction seule.

---

## 2. Hors périmètre

- **Balayage tactile** (glisser pour passer à la photo suivante) : les flèches et le clavier
  couvrent le besoin. À rouvrir si l'usage mobile le réclame.
- **Zoom dans la photo agrandie** : les photos publiées font 1600 px de large, elles sont déjà
  affichées à leur taille maximale utile.
- **Légendes, dates, téléchargement, partage** : rien de tout ça n'existe dans les données
  (`galerie.json` ne contient qu'un nom de fichier et des dimensions).
- **Vignettes « Photo à venir »** (état vide) : elles ne sont pas cliquables, il n'y a rien à
  agrandir.
- **Affiches des éditions passées** (section *Memories* de l'accueil) : ce sont des images
  statiques du HTML, pas la galerie. Non demandées ici, mais l'extension serait simple —
  signalé au client.

---

## 3. Décisions prises seul

| Décision | Pourquoi |
|---|---|
| Élément natif **`<dialog>`** + `showModal()` | Le navigateur fournit gratuitement ce qu'une visionneuse maison rate presque toujours : la fermeture par **Échap**, le **piégeage du focus** dans la fenêtre, l'inertie du reste de la page, et le **retour du focus sur la vignette d'origine** à la fermeture. Réécrire ça à la main, c'est du code en plus et de l'accessibilité en moins. |
| La vignette devient un **`<button>`** autour de l'image | Une `<figure>` cliquable n'est ni focusable ni actionnable au clavier. Le bouton l'est nativement, et il annonce sa fonction aux lecteurs d'écran. |
| **Aucune modification du HTML** des pages | La visionneuse est construite en JavaScript à la première ouverture. Deux fichiers à déployer au lieu de quatre, et rien à maintenir en double entre `index.html` et `galerie.html`. |
| Navigation **précédent / suivant** en plus de l'agrandissement | Ouvrir une photo puis devoir fermer pour en ouvrir une autre est le défaut classique de ces visionneuses. Le coût est faible, le gain d'usage évident. Flèches du clavier ← → également. |
| **Bouclage** (après la dernière, on revient à la première) | Évite un cul-de-sac silencieux ; le compteur « 3 / 12 » dit toujours où l'on est. |
| **Préchargement** de la photo précédente et de la suivante | Sans lui, chaque changement affiche un trou blanc le temps du téléchargement. Deux images d'avance suffisent. |
| Construction en `createElement` / `textContent`, **jamais `innerHTML`** | §17.2 du référentiel, et cohérent avec tout le code existant du chantier. |
| Compteur en `aria-live="polite"` | Sans lui, un utilisateur de lecteur d'écran qui presse « suivante » n'a aucun retour : l'image change, rien ne le dit. |

---

## 4. Points de risque

| # | Risque | Parade |
|---|---|---|
| **V1** | Le fond de page continue de défiler derrière la visionneuse ouverte — **ou, pire, reste figé après la fermeture** | Parade initiale (classe posée en JS, retirée sur l'événement `close`) **abandonnée en cours de route** : la recette a montré que `close` n'est pas dispatché par tous les moteurs, et la page restait bloquée. Remplacée par `body:has(dialog.visionneuse[open])` en CSS, qui suit l'état réel de l'élément : aucun nettoyage, donc aucun blocage possible |
| **V2** | Une photo en portrait déborde de l'écran en hauteur | Taille contrainte en `vh` **et** en `vw`, `object-fit: contain` : l'image entière reste visible quelle que soit son orientation |
| **V3** | Le clic sur le fond noir ne ferme pas (attendu par tout le monde) | Écouteur sur le `<dialog>` lui-même : le fond est la seule zone où l'événement a le dialogue pour cible |
| **V4** | Les cibles tactiles des flèches passent sous 44 px sur mobile | Taille fixée à 44 px minimum, vérifiée à 375 px (`1.Regles.md`) |
| **V5** | Le focus part dans la page derrière au lieu de rester dans la visionneuse | Assuré par `showModal()` — c'est la raison du choix du `<dialog>` natif |
| **V6** | Une photo lente à charger laisse un cadre vide sans explication | Préchargement des voisines + `decoding="async"` ; l'image conserve ses dimensions intrinsèques, donc pas de sursaut |

---

## 5. Approche technique

**Fichiers touchés — deux :**

| Fichier | Modification |
|---|---|
| `assets/js/galerie.js` | La vignette devient un bouton ; construction et pilotage de la visionneuse |
| `assets/css/pages.css` | Styles de la visionneuse, tokens existants uniquement |

**Non touchés :** `index.html`, `galerie.html`, `boot-index.js`, `boot-galerie.js` — la
fonction s'ajoute sans toucher au balisage ni aux points d'entrée.

**Repli :** redéployer les deux fichiers dans leur version précédente. La galerie
redevient une grille non cliquable. Moins de 2 minutes.

---

## 6. Checklist

### 6.1 Demande

- [x] Un clic sur une vignette affiche la photo en grand par-dessus la page
- [x] Fonctionne sur l'accueil (8 vignettes, bouclage 8/8 → 1/8) **et** sur `galerie.html` (toutes les photos)
- [x] On passe à la suivante / précédente sans fermer — *flèches et touches ← → : 1→2→3→2→1→8→1 constaté*
- [x] Fermeture par le bouton et par un clic sur le fond — *constaté ; un clic **sur la photo** ne ferme pas*. Échap est le comportement natif de `<dialog>`, non déclenchable en simulation
- [x] Les cases « Photo à venir » ne sont pas cliquables — *éprouvé index masqué : 0 bouton, 4 cases en pointillés, aucun dialogue créé, console vide*

### 6.2 Référentiel

- [x] Aucun `innerHTML`, `insertAdjacentHTML`, `outerHTML` ni `eval` — *recherche sur le module*
- [x] Navigable au clavier ; **focus rendu à la vignette d'origine** à la fermeture — *`document.activeElement === bouton` vérifié*
- [x] Boutons annoncés (« Agrandir la photo 3 », « Photo suivante »…), compteur en `aria-live`
- [x] Cibles tactiles à 375 px : **44 × 44 px mesurés** sur les flèches et la fermeture
- [x] Tokens uniquement (`--space-*`, `--radius-*`, `--touch-target`) ; seule valeur littérale : l'opacité du fond
- [x] Animation sous `@media (prefers-reduced-motion: no-preference)` uniquement

### 6.3 Vérification réelle

- [x] 375 px : photo 338×507 dans un écran de 375×812, aucun défilement horizontal. 1280 px : 428×643. La photo tient entièrement dans les deux cas
- [x] Portrait **et** paysage — *aucune des 8 photos publiées n'étant en portrait, une photo 1066×1600 a été fabriquée pour l'épreuve*
- [x] Console vide sur l'accueil et sur la galerie, y compris à l'état vide
- [x] Le fond ne défile pas pendant l'ouverture (`overflow: hidden`) et redéfile après fermeture — *les deux constatés*
- [x] Retour à la page dans le même état après fermeture (défilement rendu, focus sur la vignette)

---

## 7. Journal d'avancement

| Date | État |
|---|---|
| 03/08/2026 | Plan rédigé. Contexte : les premières photos réelles ont été publiées en production à 9h39 — l'écriture disque chez Ionos est donc confirmée, la galerie n'est plus vide |
| 03/08/2026 | **Développé et éprouvé** | Deux défauts trouvés en recette, invisibles à la lecture du code : (1) le `<dialog>` s'affichait collé en haut à gauche — la remise à zéro globale des marges écrase le `margin: auto` que le navigateur pose pour centrer un dialogue modal ; (2) le bouton de fermeture, placé en débord, sortait de l'écran (mesuré à y = −13 px) dès que la photo occupait toute la hauteur. Corrigés puis re-vérifiés. Troisième correction : le blocage du défilement passait par une classe posée en JavaScript et retirée sur l'événement `close` — événement qui n'est pas dispatché dans tous les moteurs, ce qui laissait la page figée après fermeture. Remplacé par une règle CSS accrochée à l'état réel du dialogue : plus rien à nettoyer, donc plus rien qui puisse rester coincé |
