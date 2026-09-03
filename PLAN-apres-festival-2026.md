# Plan — Bascule « après festival » (édition #8 passée)

**Branche** : `preprod` · **Recette en direct** : https://jgrewis.github.io/adosdarts/
**Source des demandes** : `Notes ADODARTS.md` (client, via JP) · **Cadrage validé le** : 03/09/2026

---

## 1. Résumé des demandes

Le festival a eu lieu le 22 août 2026. Le site continue de l'annoncer au futur. Il faut basculer
le site en mode « édition passée, rendez-vous l'an prochain ».

| # | Demande |
|---|---|
| D1 | Avertir clairement le visiteur que le festival est terminé, depuis la page d'accueil. |
| D2 | Poser un encart en haut de **toutes les autres pages** (7 au total : mentions légales incluse) : festival terminé, merci aux participants, bénévoles et partenaires, + lien vers l'accueil pour lire le mot complet. |
| D3 | Ne pas toucher au hero : on arrive sur le toucan comme aujourd'hui. |
| D4 | Remonter la section **Memories** juste en dessous du hero. |
| D5 | Dans le titre de Memories, le compteur s'anime : **7** devient **8** (corrigé par JP le 03/09 — l'édition qui vient d'avoir lieu est la huitième). |
| D6 | L'affiche 2026 **vient se mettre en place** dans le mur des affiches (entrée animée). |
| D7 | Conserver : le texte, le toucan, la **playlist**, **Memories**, les **partenaires**, et les **liens vers les deux formulaires** (bénévoles / artistes). |
| D8 | Publier le pavé « MERCI À TOUS ! » validé par le client, sur la page d'accueil, **après** Memories. |
| D9 | Montrer que tout est en standby jusqu'à l'année prochaine. |

**Bug constaté en plus (non demandé, mais bloquant)** : le compte à rebours de l'accueil affiche
depuis le 22 août, en permanence, « Ouverture des portes dans / C'est aujourd'hui — rendez-vous à
L'Escapade ! ». Vérifié en ligne le 03/09/2026. Traité dans ce lot.

---

## 2. Hors périmètre

- **Le contenu des autres pages** (programmation, infos pratiques, principe, contact, galerie) :
  arbitré par JP, elles reçoivent l'encart et **rien d'autre**. Leurs textes restent au futur.
- **Le menu principal** : aucune entrée retirée.
- **`admin.html`** (back-office du client) et **`404.html`** : pas d'encart. Le premier n'est pas
  une page publique, le second n'a pas d'en-tête mutualisé.
- **Contenu de l'édition #9** : aucune date, aucune affiche, aucune programmation. Rien à annoncer
  au-delà de « l'an prochain ».
- **La page galerie et l'administration photos** : inchangées, le client continue de publier ses
  photos normalement.
- **Le jeu « Compose ta mélodie »** : inchangé (l'encart s'y pose comme sur les autres pages).

---

## 3. Décisions et arbitrages

### 3.1 Tranchés par JP le 03/09/2026

| Sujet | Décision retenue |
|---|---|
| Quel chiffre s'anime | Le compteur du titre de Memories. **Correction JP du 03/09 : 7 → 8**, et non 8 → 9. L'édition passée étant la huitième, le mur passe de sept à huit affiches sous les yeux du visiteur. |
| Quelle affiche | Celle de 2026, déjà présente dans le mur : on lui donne une entrée animée. |
| Sections devenues fausses | **Basculées au passé**, pas supprimées (barre de faits, Garden party, teaser concerts). |
| Autres pages | **Encart seul**, contenu inchangé. |

### 3.2 Décisions prises seul

| Sujet | Décision | Motif |
|---|---|---|
| Compte à rebours | Supprimé de l'accueil ; `countdown.js`, son import et son appel retirés. | Il affiche une information fausse. Laisser le module inutilisé serait du code mort (`2.BonnesPratiques` §24). Le fichier reste récupérable dans Git pour l'édition #9. |
| Ce qui remplace le compte à rebours | Une mention courte dans le hero : « Édition #8 terminée — merci à tous · Rendez-vous en 2027 ». | D3 demande de ne pas bouger le design ; on remplace un bloc par un autre au même endroit, sans toucher à la structure du hero. Et D1 exige que l'avertissement soit visible **avant** de défiler. |
| Où vit l'encart transverse | Injecté par `layout.js`, comme l'en-tête et le pied de page. | `2.BonnesPratiques` §2.1 interdit de copier-coller un bloc commun dans chaque `.html`. Une seule source, six pages servies. |
| Le pavé MERCI reste en HTML statique | Écrit en dur dans `index.html`. | `2.BonnesPratiques` §16 : le contenu essentiel doit être dans le HTML servi. C'est le message principal, il doit exister sans JavaScript et pour les moteurs. |
| Ordre des sections de l'accueil | Hero → Memories → MERCI → faits → Garden party → concerts + playlist → formulaires → partenaires. | D4 place Memories juste sous le hero, D8 place le pavé « après ». L'avertissement immédiat est assuré par la mention du hero. |
| Playlist | Sortie de la section « 4 concerts, 2 scènes » pour devenir sa propre section. | D7 exige de la conserver ; la laisser dans une section de teaser au passé la ferait disparaître si cette section évolue. |
| Métadonnées | `<title>`, description, Open Graph et JSON-LD `MusicEvent` mis au passé sur `index.html`. | Le site annonce aujourd'hui un événement à venir dans les résultats de recherche et les partages sociaux. |
| Attributs `width`/`height` des 8 affiches | Ajoutés. | Absents aujourd'hui (`2.BonnesPratiques` §24). L'animation d'entrée de l'affiche 2026 provoquerait un décalage de mise en page sans eux. |

### 3.3 L'animation du compteur — tranchée

Corrigée par JP le 03/09/2026 : **7 → 8**, et non 8 → 9. L'édition du 22 août 2026 était la
huitième ; le mur comptait sept affiches avant elle.

> État au chargement : « **7** éditions de souvenirs », mur à sept affiches
> Au défilement : l'affiche 2026 vient se mettre en place **et** le compteur passe à « **8** »

Les deux états sont exacts, et l'état final correspond à la réalité. Cela lie D5 et D6 en un seul
geste : le chiffre change parce que l'affiche arrive.

**Sens de l'amélioration progressive** : le HTML servi contient l'état **final et vrai** (huit
affiches, « 8 éditions de souvenirs »). C'est le JavaScript qui recule l'affichage à l'état « 7 »
avant de l'animer. Sans JavaScript, sans animation, ou pour un moteur de recherche, la page dit
donc la vérité (`2.BonnesPratiques` §16) — jamais un compteur figé sur 7.

---

## 4. Points de risque

| Risque | Niveau | Dérisquage |
|---|---|---|
| **Incohérence assumée** : l'encart annonce un festival terminé, les pages Infos/Programmation continuent d'annoncer « ouverture des portes à 15h00 », « buvette dès 18h00 ». | Assumé par JP | Aucun. Tracé ici. Rattrapable en un second lot si le client le remonte. |
| Sans JavaScript, le compteur resterait bloqué sur « 7 » et le mur à sept affiches — une information fausse. | Écarté | Le HTML servi porte l'état final vrai ; le JS ne fait que reculer l'affichage avant de l'animer (§3.3). |
| L'encart est injecté par JS : invisible sans JavaScript et pour un moteur qui n'exécute pas le JS. | Moyen | Le pavé MERCI de l'accueil, lui, est en HTML statique : le message principal reste lu sans JS sur la page d'entrée. Même compromis que l'en-tête et le menu actuels, déjà documenté dans `layout.js`. |
| Suppression de `countdown.js` : perte du compte à rebours pour l'édition #9. | Faible | Récupérable par `git show` sur le commit précédent. Noté ici. |
| Casser la mise en page du hero en retirant le bloc du compte à rebours. | Faible | Bloc remplacé, pas retiré : la colonne garde sa hauteur. Vérification visuelle aux 3 tailles d'écran. |
| L'animation gêne un visiteur sensible au mouvement. | Faible | `prefers-reduced-motion` déjà géré globalement dans `base.css` ; vérification que les deux nouvelles animations tombent bien sous cette règle et que l'état final reste lisible. |
| Régression sur les pages non liées (galerie, jeu, contact) par la modification de `layout.js`. | Moyen | `layout.js` est chargé par les 7 pages. Recette page par page après modification. |
| **Cache d'assets.** Défaut réellement rencontré en recette le 03/09 : `pages.css` a été modifié deux fois sous le même `?v=20260903`, le navigateur a donc gardé la version d'avant et l'animation du compteur ne s'appliquait pas. | Corrigé | Version passée à `v=20260903b`. **Règle** : toute modification de `pages.css` impose de changer ce suffixe dans les 8 pages, sinon un visiteur déjà venu garde l'ancienne feuille. |
| Les modules JS (`layout.js`, `memories.js`, `boot-*.js`) n'ont, eux, aucun numéro de version, et Ionos ne renvoie ni `Cache-Control` ni `Expires` — seulement un ETag. | Ouvert | Le navigateur revalide et finit par récupérer les nouveaux fichiers, mais avec un délai imprévisible. Non traité dans ce lot : la correction propre est une politique de cache dans `.htaccess`, à décider séparément. |

---

## 5. Approche technique

### Fichiers touchés

| Fichier | Nature de la modification |
|---|---|
| `index.html` | Réordonnancement des sections, mise au passé, pavé MERCI, métadonnées, `width`/`height` des affiches. |
| `assets/js/layout.js` | Encart transverse (nouvelle fonction, injectée sur toutes les pages sauf l'accueil) + pied de page au passé. |
| `assets/js/boot-index.js` | Retrait de l'import et de l'appel `startCountdown`. |
| `assets/js/countdown.js` | **Supprimé.** |
| `assets/css/pages.css` | Styles de l'encart, du pavé MERCI, des deux animations. Tokens existants uniquement. |
| `assets/js/memories.js` | **Nouveau.** Déclenche les deux animations au défilement (`IntersectionObserver`). |

### Tranches livrables

| # | Tranche | Contenu | Vérifiable par |
|---|---|---|---|
| T1 | **L'avertissement** | Encart transverse (`layout.js` + CSS), pavé MERCI et mention du hero, retrait du compte à rebours. | L'information « c'est terminé » est visible sur les 7 pages. |
| T2 | **Mise au passé de l'accueil** | Barre de faits, Garden party, teaser concerts, extraction de la playlist, CTA bénévoles/artistes, pied de page. | Plus aucune formulation au futur sur l'accueil. |
| T3 | **Memories** | Remontée de la section, animation 8 → 9, entrée animée de l'affiche 2026, `width`/`height`. | Les deux animations se déclenchent au défilement et se neutralisent en mouvement réduit. |
| T4 | **Métadonnées** | `title`, description, Open Graph, JSON-LD. | Le HTML servi ne présente plus l'événement comme à venir. |

Chaque tranche est livrable seule : le site reste cohérent si l'on s'arrête entre deux.

---

## 6. Checklist

### Demandes

- [x] D1 — L'accueil dit clairement que l'édition #8 est terminée, **avant tout défilement**.
- [x] D2 — Un encart en haut de programmation, principe, infos, contact, galerie, jeu-mélodie : festival terminé + remerciements + lien vers l'accueil.
- [x] D3 — Le hero est inchangé : toucan, logo, dégradé, mise en page identiques.
- [x] D4 — Memories est la première section sous le hero.
- [x] D5 — Le compteur du titre Memories passe de 7 à 8 au défilement, en même temps que l'affiche.
- [x] D6 — L'affiche 2026 a une entrée animée dans le mur.
- [x] D7 — Playlist, Memories, partenaires et les deux liens de formulaire sont toujours présents et fonctionnels.
- [x] D8 — Le pavé MERCI est publié intégralement, sans coupe ni reformulation, après Memories.
- [x] D9 — Plus aucune formulation au futur sur l'accueil (« vous donne rendez-vous », « dès 19h », compte à rebours).

### Référentiel

- [x] Aucune valeur d'espacement hors échelle : uniquement les tokens `--space-*` (`1.Regles` §4).
- [x] Aucune couleur en dur : uniquement les tokens de `tokens.css` (`1.Regles` §13).
- [x] Contraste ≥ 4.5:1 sur le texte de l'encart et du pavé, ≥ 3:1 sur ses bordures (`2.BonnesPratiques` §14.2).
- [x] Corps de texte du pavé MERCI contraint à `--measure` (65ch) (`1.Regles` §8).
- [x] Espace au-dessus des titres > espace en dessous (`1.Regles` §5).
- [~] Les deux animations sous `prefers-reduced-motion` : **non éprouvé en navigateur** — l'outil de recette ne permet pas de basculer cette préférence. Vérifié par lecture du code (sortie anticipée de `initMemories`) et par l'état servi, qui est déjà l'état final. À confirmer par JP sur son Mac (Réglages → Accessibilité → Réduire les animations).
- [x] Le lien de l'encart est explicite hors contexte (pas de « en savoir plus ») (`2.BonnesPratiques` §14.3).
- [x] Toutes les images ont `alt`, `width` et `height` — **sauf** les deux feuilles décoratives du hero (`hero__leaf`), qui n'en avaient pas avant ce lot. Laissées en l'état : le hero est hors périmètre (D3), et ces SVG sont en position absolue, donc incapables de décaler la mise en page.
- [x] Aucun bloc dupliqué entre les pages : l'encart a une source unique (`2.BonnesPratiques` §2.1).
- [x] Aucun code mort laissé « au cas où » (`2.BonnesPratiques` §24).
- [x] Aucun `console.log`, aucun `!important` non justifié (`2.BonnesPratiques` §24).
- [x] `<title>` et `meta description` uniques et exacts sur l'accueil (`2.BonnesPratiques` §16).

### Vérification humaine (phase 3)

- [x] Rendu vérifié à 375 px, 768 px et 1280 px, sans défilement horizontal.
- [x] Rendu vérifié à 320 px (seuil WCAG 1.4.10).
- [x] Reflow vérifié à 320 px de large, soit l'équivalent d'un zoom à 400 % sur un écran de 1280 px (WCAG 1.4.10) — plus exigeant que le zoom 200 % visé.
- [~] Clavier : le lien de l'encart est focusable et sa règle `:focus-visible` résout bien en jaune de marque (3.52:1 sur le fond teal, seuil 3). **Les frappes réelles n'ont pas pu être envoyées** : le panneau de recette replié fait expirer les événements clavier. Parcours complet à refaire à la main sur adosdarts.fr.
- [x] Les 7 pages publiques portent bien l'encart, aucune n'est cassée par la modification de `layout.js`.
- [x] Console sans erreur et sans 404 sur chacune des 7 pages.
- [x] Les liens des deux formulaires mènent bien à `contact#benevole` et `contact#artistes`.
- [x] Les liens playlist (Spotify / Deezer) sont toujours actifs.
- [x] La galerie photos de l'accueil se remplit toujours (ou affiche son état vide).
- [x] Le mur d'affiches ne provoque aucun décalage de mise en page au chargement.

---

## 7. Suite

Recette sur `preprod` via GitHub Pages, puis fusion dans `main` et téléversement manuel sur Ionos
par JP. Rappel : sur Pages, les formulaires de contact et l'administration ne fonctionnent pas
(pas de PHP) — ces deux points ne se vérifient que sur adosdarts.fr après mise en ligne.

---

## 8. État à la fin de la session du 03/09/2026

### Fait, déployé sur `preprod` et vérifié en ligne

Branche `preprod`, 7 commits en avance sur `main`, recette faite sur
https://jgrewis.github.io/adosdarts/ — **rien n'est encore en production.**

| Tranche | État |
|---|---|
| T1 — l'avertissement | Encart sur les 7 pages publiques hors accueil, pavé MERCI, mention du hero, compte à rebours supprimé. |
| T2 — accueil au passé | Barre de faits, Garden party, teaser concerts, playlist extraite, CTA bénévoles, pied de page. |
| T3 — Memories | Section remontée sous le hero, compteur 7 → 8, révélation de l'affiche 2026 (volet + reflet). |
| T4 — métadonnées | `title`, description, Open Graph, JSON-LD. |

Trois défauts trouvés **et corrigés** pendant la recette :
1. `pages.css` modifié deux fois sous le même `?v=` → l'animation ne s'appliquait pas ;
2. la révélation attendait `img.decode()`, promesse qui peut ne jamais aboutir → l'affiche
   pouvait rester invisible pour de bon ;
3. un `2px` en dur là où `--border-width` existe.

### Reste à faire

| # | Sujet | Qui |
|---|---|---|
| R1 | **Mise en production sur Ionos** : fusionner `preprod` dans `main`, puis téléverser à la main. Fichiers concernés : les 8 `.html`, `assets/css/pages.css`, `assets/css/components.css`, `assets/js/{layout,boot-index,programme,memories}.js`, et **supprimer `assets/js/countdown.js` du serveur**. Ne jamais téléverser `assets/uploads/`. | JP |
| R2 | Vérifier `prefers-reduced-motion` (Réglages → Accessibilité → Réduire les animations) : le compteur doit afficher 8 d'emblée et l'affiche être visible sans animation. | JP |
| R3 | Parcours clavier complet sur le site en ligne (Tab depuis le haut : lien d'évitement → marque → menu → encart). | JP |
| R4 | **Décision à prendre** : politique de cache des assets. Ionos n'envoie ni `Cache-Control` ni `Expires`. Les modules JS n'ont aucun numéro de version : après un téléversement, un visiteur déjà venu peut garder l'ancien script pendant quelques jours — donc **sans encart**. Cas réellement observé en recette. Correction propre : quelques lignes de `Cache-Control` dans `.htaccess`. Non fait : c'est une modification de configuration serveur, hors du périmètre validé. | JP puis dev |
| R5 | Formulaires de contact et administration photos : **non testables sur GitHub Pages** (pas de PHP). À recetter sur adosdarts.fr après mise en ligne. | JP |
| R6 | Le texte du client est repris mot pour mot, « 8ème » compris, là où le reste du site écrit « 8ᵉ ». Normalisation possible en une ligne si le client le souhaite. | À arbitrer |
| R7 | Rappel : les pages Infos et Programmation restent au futur (arbitrage assumé). Second lot si le client le remonte. | À arbitrer |

### Règle à ne pas oublier

**Toute modification de `assets/css/pages.css` impose de changer le suffixe `?v=` dans les
8 fichiers HTML.** Version actuelle : `v=20260903c`. C'est le piège qui a coûté une passe de
recette ce jour-là.
