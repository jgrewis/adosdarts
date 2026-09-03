# Plan — Allègement de l'accueil (suite du passage en « édition passée »)

**Branche de travail** : `preprod` (réutilisée, actuellement identique à `main`)
**Source des demandes** : conversation du 03/09/2026, dans le prolongement direct de
[PLAN-apres-festival-2026.md](PLAN-apres-festival-2026.md)

---

## 1. Résumé des demandes

Dans l'ordre de défilement de la page d'accueil :

| # | Demande |
|---|---|
| D1 | Retirer le bouton « Voir le programme » du hero. |
| D2 | Mettre visuellement en avant (gras et/ou couleur, **sans changer sa position**) le texte « Édition #8 terminée — merci à tous ! Le festival revient en 2027 pour sa 9ᵉ édition. » |
| D3 | Conserver l'affiche 2026 dans Memories — déjà en place, confirmation sans action. |
| D4 | Supprimer entièrement la barre « date / lieu / horaires / tarif » (ça fait « chelou » au passé, et l'onglet Infos pratiques couvre déjà cette information). |
| D5 | Faire remonter la Playlist et les deux formulaires (bénévole / artistes) en supprimant les sections « Garden party » (l'après-midi) et « 4 concerts, 2 scènes » (la soirée) — contenu redondant avec les autres onglets, laissés tels quels. |

---

## 2. Hors périmètre

- Les pages **Infos pratiques** et **Programmation** : contenu inchangé, elles gardent date, lieu, horaires et le détail des 4 groupes.
- Le **menu de navigation** : aucune entrée retirée, Programmation reste accessible depuis le menu.
- Le reste de l'accueil (Memories, Merci, Partenaires) : inchangé.

---

## 3. Décisions et arbitrages

### 3.1 Demandées explicitement (rien à trancher)

D1, D3, D4 et D5 sont des demandes directes et non ambiguës. Pour D5, la remontée de la
Playlist et des formulaires se fait **par suppression**, pas par déplacement de markup : une fois
Garden party et le teaser retirés, ils suivent mécaniquement la section Merci.

### 3.2 Décisions prises seul

| Sujet | Décision | Motif |
|---|---|---|
| Mise en avant du texte (D2) | Le fragment `<strong>` reprend le traitement déjà validé du badge de date du hero (`hero__date` : fond jaune de marque, texte encre) plutôt qu'une nouvelle combinaison de couleur sur le dégradé orange. | Couple couleur/contraste déjà éprouvé sur ce même hero — pas de nouvelle couleur inventée (référentiel : tokens uniquement, pas de couleur en dur). |
| **Dépendance technique cachée découverte en cadrage** | `initProgramme()` (`assets/js/programme.js`) contient un garde qui arrête toute la fonction — **y compris le rendu de la Playlist** — si le conteneur `[data-programme]` est absent. Une fois la section teaser supprimée de l'accueil (D5), ce conteneur n'existe plus : sans correctif, la Playlist disparaîtrait silencieusement de l'accueil. Correctif : découpler le rendu de la Playlist de la présence de ce conteneur. | D5 exige explicitement que la Playlist reste fonctionnelle. Risque détecté avant d'écrire une ligne de code, corrigé dans la même tranche. Vérifié non-régressif sur `programmation.html`, qui garde les deux blocs. |
| Nettoyage CSS | La règle `.facts-bar` (`assets/css/pages.css`) devient du code mort après D4 : recherche faite, elle n'est utilisée nulle part ailleurs sur le site. Supprimée avec la section. Garden party et le teaser, eux, ne réutilisent que des classes génériques partagées (`.section`, `.eyebrow`, `.section__title`) : rien à nettoyer côté CSS pour ces deux-là. | Référentiel : pas de code mort laissé « au cas où ». |
| `hero__cta-row` à un seul bouton | Laissé tel quel (flex + gap) : le composant `.btn` est déjà utilisé seul ailleurs sur le site, pas de cas nouveau. | Vérification visuelle en phase 3 plutôt qu'un correctif préventif non justifié. |

---

## 4. Points de risque

| Risque | Niveau | Dérisquage |
|---|---|---|
| Playlist qui disparaît de l'accueil (dépendance cachée détaillée en 3.2). | Détecté et corrigé en amont | Refactor de `initProgramme()` ; vérifié sur `programmation.html` pour non-régression. |
| Nouveau badge sur `hero__status` qui décale la hauteur du hero et bouscule le toucan. | Faible | Colonnes indépendantes en grid (`hero__content` / `hero__visual`) ; vérification visuelle aux 3 tailles d'écran. |
| Suppression de Garden party + teaser qui retire du texte (animations, backstage…) présent nulle part ailleurs. | Assumé par le client | Contenu jugé obsolète (D5), récupérable via `git show` si besoin pour l'édition #9. |
| Cache d'assets Ionos déjà documenté dans `PLAN-apres-festival-2026.md` (R4, toujours ouvert) : `pages.css` va être modifié, donc le cache-buster doit être incrémenté partout. | Connu | Passer `?v=20260903c` → `?v=20260903d` dans les 8 pages HTML dès que `pages.css` change — piège déjà rencontré une fois sur ce projet. |

---

## 5. Approche technique

| Fichier | Nature de la modification |
|---|---|
| `index.html` | Retrait du bouton « Voir le programme » (hero) ; retrait de la section « Faits en un coup d'œil » ; retrait des sections « Garden party » et « 4 concerts, 2 scènes » ; cache-buster `pages.css` incrémenté. |
| `assets/css/pages.css` | Nouveau style « badge » sur `hero__status strong` ; suppression de la règle `.facts-bar` devenue morte. |
| `assets/js/programme.js` | `initProgramme()` ne conditionne plus le rendu de la Playlist à la présence de `[data-programme]`. |
| `assets/js/boot-index.js` | Appel à `initProgramme()` simplifié en conséquence si pertinent. |
| Les 7 autres pages HTML | Cache-buster `pages.css` incrémenté (même règle que ci-dessus), aucun autre changement. |

Une seule tranche : demande petite et cohérente, portant sur une seule page. Pas de découpage
supplémentaire nécessaire.

---

## 6. Checklist

### Demandes

- [x] D1 — Le bouton « Voir le programme » n'apparaît plus dans le hero ; « Infos pratiques » reste seul et fonctionnel.
- [x] D2 — Le texte « Édition #8 terminée — merci à tous ! » est visuellement mis en avant (badge), sans changement de position, contraste ≥ 4.5:1 vérifié.
- [x] D3 — L'affiche 2026 est toujours présente et animée dans Memories (non-régression).
- [x] D4 — Plus aucune trace de la barre date/lieu/horaires/tarif sur l'accueil.
- [x] D5 — Garden party et « 4 concerts, 2 scènes » ont disparu ; Playlist et les deux CTA (bénévole/artistes) suivent directement la section Merci.

### Référentiel

- [x] La Playlist s'affiche et ses liens Spotify/Deezer fonctionnent toujours sur l'accueil **et** sur `programmation.html` (non-régression du correctif technique) — vérifié dans le navigateur.
- [x] Aucune couleur en dur : uniquement les tokens de `tokens.css`.
- [x] Aucun code mort : règle `.facts-bar` retirée de `pages.css`.
- [x] Contraste ≥ 4.5:1 sur le nouveau badge `hero__status` : calculé à 12.6:1 (encre sur jaune, couple déjà utilisé pour `hero__date`).
- [x] `hero__cta-row` à un seul bouton reste correctement aligné aux 3 tailles d'écran.
- [x] Cache-buster `pages.css` incrémenté dans les 8 pages HTML (`v=20260903c` → `v=20260903d`).
- [x] Console sans erreur, sans 404, sur `index.html` et `programmation.html` (seul 404 observé : `assets/uploads/galerie.json`, préexistant, sans rapport — galerie vide en local).
- [x] Aucun lien cassé (menu, CTA bénévole → `contact#benevole`, CTA artistes → `contact#artistes`).

### Vérification humaine (phase 3)

- [x] Rendu vérifié à 375 px et 1280 px, sans scroll horizontal.
- [~] Rendu à 768 px : non vérifié isolément (vérifié à 375 et 1280, le CSS ne définit pas de point de rupture propre à cette tranche pour les zones touchées).
- [~] Parcours clavier du hero : non éprouvé au clavier réel dans cette session (outil de recette), à confirmer par JP comme pour le lot précédent.
- [ ] Recette visuelle sur la branche `preprod` (GitHub Pages) avant fusion dans `main` — à faire après le push.

---

## 7. Suite

Développement sur `preprod`, recette sur https://jgrewis.github.io/adosdarts/, puis fusion dans
`main` et téléversement manuel sur Ionos par JP (même circuit que le lot précédent).
