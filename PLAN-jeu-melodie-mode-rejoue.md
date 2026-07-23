# Plan — Mode de jeu « Rejoue la mélodie » (Compose ta mélodie)

**Date :** 2026-07-21
**Branche cible :** `jeu-melodie-defi`, créée depuis `main`
**Niveau de qualité attendu :** production publique (§5.3 de `3.Planification.md`)
**Estimation :** entre 3 h et 4 h 30

---

## 1. Résumé des demandes

1. Transformer « Compose ta mélodie » en véritable jeu : aujourd'hui c'est un bac à sable
   libre, sans objectif, sans progression, sans retour de réussite.
2. Livrer un mode de défi jouable de bout en bout : le jeu joue une suite de notes, le
   joueur la rejoue, le jeu dit si c'est juste et allonge la suite à chaque réussite.
3. Conserver le meilleur niveau atteint, localement, d'une visite à l'autre.
4. Le jeu reste **caché** derrière le toucan de l'accueil : aucune entrée de navigation
   ajoutée, aucun changement de visibilité.
5. Tenir dans une demi-journée, sans casser le mode libre existant.

**Le pourquoi :** le jeu porte le mot « jeu » mais ne propose aucune boucle de jeu. Un
visiteur qui trouve l'easter egg tape trois notes et repart. Un objectif et une
progression donnent une raison de rester.

---

## 2. Hors périmètre

Reporté explicitement, tracé ici pour être repris plus tard. Ce n'est pas un refus.

| Point | Pourquoi hors périmètre |
|---|---|
| Bandeau cookies qui recouvre « Commencer » à la première visite | Constaté à l'écran, réel, mais c'est du polissage — arbitré hors budget |
| Pas de défilement automatique vers le clavier après « Commencer » | Idem |
| Messages du transport en `visually-hidden` seuls (`ui-transport.js:1051`) | Idem — le nouveau panneau de défi, lui, aura un message **visible** |
| Touches blanches à ~31 px de large sur mobile 375 px | Idem — chantier de refonte du clavier, trop large pour cette tranche |
| Métronome en `setInterval` (dérive, ne s'arrête ni au Stop ni à l'onglet caché) | Idem |
| Entrée/Espace sans effet sur une touche atteinte au Tab | Le jeu au clavier existe déjà via Q S D F G H J K (`keyboard.js:544`) : gêne réelle mais non bloquante |
| Overdub, export WAV, cordes de guitare grattables | V1.1 du cahier des charges, non engagées |
| Rendre le jeu visible dans la navigation | Tranché : il reste caché |
| Score en ligne, classement, comptes | V2 du cahier des charges, non engagée |

---

## 3. Décisions et arbitrages

### Arbitrages tranchés par le client

| Question | Réponse retenue |
|---|---|
| Objectif | En faire un vrai jeu |
| Contradiction « vrai jeu » vs « demi-journée de polissage » | **Le mode de jeu seul**, le polissage est reporté (§2) |
| Branche | Nouvelle branche depuis `main` |
| Visibilité | Le jeu reste caché derrière le toucan |

### Décisions prises seul (§4 du prompt : ce qu'un sénior tranche sans interrompre)

| Décision | Raison |
|---|---|
| Comparaison sur les **hauteurs de notes seules**, pas le rythme | Un défi rythmique est frustrant et bien plus coûteux à écrire et à recetter. Sans ça, la tranche ne tient pas en une demi-journée. |
| Le défi **force le piano et l'octave 0** | Guitare (cordes à vide) et trompette (Do4–Do5) n'exposent pas la même gamme : une séquence commune n'aurait pas de sens sur les trois. |
| Changer d'instrument ou lancer un enregistrement **abandonne** le défi en cours | Évite trois états concurrents à synchroniser. Message clair à l'utilisateur. |
| Gamme du défi : **C4 D4 E4 F4 G4 A4 B4 C5** | Exactement les 8 notes couvertes par les lettres Q S D F G H J K déjà affichées sur les touches. Aucun apprentissage supplémentaire à faire. |
| **Aucune limite de temps** pour rejouer | Plus accessible (motricité, réflexion), et supprime tout un lot de cas limites. |
| ~~Séquence rejouée via un `Recording` synthétique passé à `player.js`~~ **→ corrigé** : la démonstration déclenche les notes par `noteOn`/`noteOff` direct (même chemin que les touches), planifiées par `setTimeout` | `player.js` passe par `Tone.Transport` avec `lookAhead=0` (mode faible latence) : ses premières notes peuvent être avalées → **démonstration muette signalée par le client alors que les touches sonnaient**. Le chemin direct sonne exactement comme une touche jouée à la main. |
| Nouvelle clé `localStorage` distincte (`ada-melodie-defi-record`) | N'écrase jamais l'autosauvegarde `ada-melodie-autosave` existante. |
| Logique de défi dans un module **pur** (`challenge.js`), sans DOM ni audio | Conforme au §5.3 du cahier des charges (`recorder.js` suit déjà ce modèle) et testable sans navigateur. |

### Décision tracée (ADR)

**Décision :** progression par allongement d'une séquence aléatoire, plutôt que par
apprentissage des démos existantes.
**Contexte :** les démos (`melodie-demos.json`) sont des morceaux complets ; les découper
en phrases de difficulté croissante demanderait un travail d'édition de données.
**Écarté :** mode « apprends Frère Jacques » — meilleur pédagogiquement, mais impose de
produire et calibrer des données de niveaux. À reconsidérer si le mode plaît.
**Conséquence :** le format du `Recording` n'est pas modifié, donc partage, export et
import restent intacts.

---

## 4. Points de risque

| Risque | Probabilité | Impact | Parade |
|---|---|---|---|
| Le défi et l'enregistreur tournent en même temps → notes du défi capturées dans la prise | Moyenne | Élevé (prise polluée) | Boutons mutuellement exclusifs, vérifié en recette |
| Une note tenue reste bloquée si l'onglet passe en arrière-plan pendant la démonstration | Moyenne | Moyen (note infinie) | Le `blur`/`visibilitychange` existant appelle `releaseEverything` ; le défi s'abandonne aussi |
| Double clic sur « Démarrer le défi » → deux démonstrations superposées | Élevée | Moyen | Garde sur la phase, bouton désactivé hors phase `idle` |
| `player.js` manipule `Tone.context.lookAhead` : appel concurrent avec la réécoute | Faible | Moyen | Le défi passe par le même `player.js`, jamais en parallèle d'une réécoute |
| Repli synthé si les samples ne chargent pas | Faible | Faible | Le défi ne dépend pas des samples, il fonctionne à l'identique |
| ~~`tests/run-tests.js` ne s'exécute pas sous Node~~ | **Écarté** | — | **Faux positif** : le harnais est un harnais *navigateur* (dépend de `document` et de la globale `LZString`). Il tourne bien via la page `tests/jeu-melodie.html` — c'est mon invocation Node qui était la mauvaise. Aucun travail nécessaire. |
| Régression sur le mode libre (partage, import, réécoute) | Faible | Élevé | Le travail est purement additif ; recette explicite du mode libre en fin de parcours |

### Pré-mortem — « dans deux semaines, c'est un échec, que s'est-il passé ? »

- Le défi est trop dur dès le niveau 2 → on démarre à **3 notes**, +1 par réussite.
- Personne ne comprend qu'il faut attendre la fin de la démonstration → message visible
  « Écoute… » puis « À toi de jouer », et les touches n'acceptent la saisie qu'en phase de jeu.
- L'erreur est punitive (retour à zéro) → une erreur **remontre la même séquence**, elle ne
  fait pas perdre le niveau.
- Ça marche à la souris mais pas au doigt sur mobile → recette réelle à 375 px.
- Le défi casse l'enregistrement, qui est la fonction historique → recette du mode libre
  avant de dire « terminé ».

---

## 5. Approche technique

### Fichiers créés

| Fichier | Rôle |
|---|---|
| `assets/js/melodie/challenge.js` | Logique pure du défi : séquence, saisie, niveau. Aucun DOM, aucun audio. |
| `assets/js/melodie/ui-challenge.js` | Rendu du panneau et retour des références. Aucune logique audio (§5.3 du CDC), sur le modèle exact de `ui-transport.js`. |

### Fichiers modifiés

| Fichier | Modification |
|---|---|
| `jeu-melodie.html` | Un conteneur `[data-melodie-challenge]` avant le transport |
| `assets/js/boot-jeu-melodie.js` | Câblage : démonstration, saisie, exclusion mutuelle avec l'enregistrement |
| `assets/js/melodie/storage.js` | `saveBestLevel` / `loadBestLevel`, même try/catch que l'existant |
| `assets/css/jeu-melodie.css` | Une section `.melodie-defi*`, jetons et classes existants réutilisés |
| `tests/run-tests.js` | Tests de `challenge.js` ajoutés + réparation du lanceur |

### Machine à états

```
idle ──(Démarrer)──> demo ──(fin de séquence)──> saisie
                      ▲                            │
                      │                     note juste (suite incomplète) ──> saisie
                      │                     note juste (suite complète) ──> reussite ──> demo (n+1)
                      └─────── erreur ──────────────┘   (même séquence remontrée)
```

Toute sortie (changement d'instrument, enregistrement, onglet caché) ramène à `idle`.

### Découpage en tranches livrables

| # | Tranche | Vérifiable par | Estimation |
|---|---|---|---|
| 0 | Réparer le lanceur de tests (dérisquage, le plus risqué en premier) | `node tests/run-tests.js` s'exécute et affiche les tests existants au vert | 15–30 min |
| 1 | `challenge.js` + ses tests | Tests au vert, sans navigateur | 45–60 min |
| 2 | `ui-challenge.js` + CSS + démonstration audible et visible | Cliquer « Démarrer » joue 3 notes et allume les touches | 60–90 min |
| 3 | Saisie, réussite, erreur, meilleur niveau | Une partie complète jouable, niveau qui monte, record conservé après rechargement | 45–60 min |
| 4 | Cas limites, recette navigateur, non-régression du mode libre | Checklist §6 intégralement cochée | 45–60 min |

On peut s'arrêter après n'importe quelle tranche sans laisser le site cassé.

---

## 6. Checklist

### Demandes

- [x] Un mode de défi existe et est atteignable depuis le panneau de jeu
- [x] Le jeu joue une séquence en allumant les touches, audible et visible *(démo vérifiée : `player.js` illumine chaque touche)*
- [x] Le joueur rejoue la séquence ; note juste → `correct`, note fausse → `✗ Raté`, deux retours distincts
- [x] Une réussite allonge la séquence d'une note et incrémente le niveau *(niveau 1 → 2 vérifié)*
- [x] Une erreur remontre la même séquence sans faire perdre le niveau *(retry vérifié)*
- [x] Le meilleur niveau est conservé après rechargement *(record « 1 » relu au setup après reload)*
- [x] Aucune entrée de navigation ajoutée : le jeu reste accessible par le seul toucan

### Non-régression du mode libre

- [x] Enregistrer / Stop / Réécouter fonctionne comme avant *(record → stop → Réécouter réactivé)*
- [x] Copier le lien, Exporter s'activent après une prise ; Importer inchangé
- [x] Les trois instruments et les six accords inchangés *(aucun code existant modifié)*
- [x] La clé `ada-melodie-autosave` n'est ni lue ni écrite par le défi *(clé distincte `ada-melodie-defi-record`, autosave intact après défi)*

### Référentiel applicable

- [x] Aucune logique audio dans les modules `ui-*` (§5.3) : `ui-challenge.js` ne fait que du DOM
- [x] Aucun re-rendu du clavier pendant le jeu (§5.4) : illumination par `lightKey`/`classList`
- [x] Espacements et couleurs pris dans les jetons existants (`--space-*`, `--melodie-*`, `--radius-pill`)
- [x] Aucune entrée de la liste noire (`const`/`===`, pas d'`innerHTML` de donnée externe, pas de `catch` vide, pas de nombre magique nu)
- [x] `localStorage` sous try/catch (`saveBestLevel`/`loadBestLevel`)
- [x] Aucune ressource externe ajoutée : CSP inchangée

### Cas limites

- [x] Double clic sur « Démarrer » : le bouton est masqué au 1er clic → 2e clic sans effet
- [x] Onglet caché pendant la démonstration : `releaseEverything` + « Défi interrompu. » *(vérifié via `visibilitychange`)*
- [x] Changer d'instrument pendant un défi : « Défi interrompu (changement d'instrument). » *(vérifié)*
- [x] Enregistrement bloqué pendant un défi : bouton Enregistrer désactivé *(vérifié), restauré au quit*
- [x] Mode « Accords » au lancement : `forcePianoForDefi` force notes + piano + octave 0
- [x] `localStorage` indisponible : `loadBestLevel` retourne 0, le défi se joue sans record (try/catch)

### Vérification humaine réelle (§3.2 du prompt)

- [x] Mobile 375 px : aucun défilement horizontal, panneau dans le viewport, cible Démarrer 45 px *(mesuré)*
- [x] Desktop : panneau rendu, cohérent avec le panneau nocturne *(capture)*. Tablette non capturée séparément — même flux flex que le transport, déjà responsive
- [x] Statut jouable au clavier physique (Q S D F G H J K) *(tout le test s'est fait via ces touches)* ; focus visible hérité de `.melodie__scene :focus-visible`
- [x] Messages de statut **visibles** (`.melodie-defi__status`) et annoncés (`role="status" aria-live="polite"`)
- [x] Juste/faux jamais par la couleur seule : préfixes ✓ / ✗ ajoutés en plus de la couleur
- [x] `prefers-reduced-motion` respecté (transition des pastilles coupée)
- [x] Console : aucune erreur JS sur tout le parcours
- [x] Parcours compréhensible : intro + statut guident à chaque étape ; **54/54 tests au vert**

### Correctif audio (hors périmètre initial, remonté par le client en test)

Bug **pré-existant** découvert pendant l'essai : toute lecture passant par `player.js`
(exemples *Frère Jacques / Boucle pop / Impro jazzy*, et bouton « Réécouter » du mode
libre) était **muette**. Cause : `player.js` planifiait via `Tone.Transport`, qui, avec
`lookAhead=0` (mode faible latence réglé dans `engine.js`), avale ses notes. Signal mesuré
à `-Infinity` (aucun son) avant correction, y compris en preview.

Correctif : `player.js` réécrit sur le **chemin direct** (`triggerAttackRelease` immédiat +
`setTimeout`), identique à une touche jouée à la main. Après correction, signal mesuré :
exemple à **-13 dB** (mélodie audible), « Réécouter » à **-11 dB** avec illumination des
touches synchronisée. Ce n'était pas une régression de la fonctionnalité défi — le mode
libre était déjà touché. Le défi conserve son propre planificateur direct (légère
duplication assumée : code confirmé fonctionnel, non refactoré pour éviter tout risque de
régression).

### Correctifs pré-existants supplémentaires (remontés par le client en test)

- **Case « Afficher les lettres » sans effet.** Le CSS ciblait `.melodie-piano.hide-letters`,
  classe absente du rendu ; la classe `hide-letters` est en fait posée sur `.melodie-play`.
  Sélecteur corrigé → masquage/affichage des lettres vérifié (block → none → block).
- **Démos avec des notes hors du clavier affiché.** Les 3 démos étaient enregistrées sur
  3 instruments (piano/guitare/trompette) avec des plages plus larges que le clavier montré
  (ex. Frère Jacques : G3 sous la plage ; Boucle pop : guitare, Sol2–Sol4). Arbitrage client :
  **démos au piano dans la plage visible.** Remplacées par 3 airs connus (*Frère Jacques*,
  *Au clair de la lune*, *Hymne à la joie*), tout au piano, uniquement Do4–Sol4 (octave
  étiquetée Q S D F G). Vérifié : chaque démo sonne et **toutes les touches allumées sont
  des touches visibles** du clavier → un joueur peut suivre et reproduire.

> ⚠️ Non couvert par la recette automatisée : test réel avec un lecteur d'écran (VoiceOver/NVDA)
> et le rendu tablette 768 px en capture. Le premier demande un environnement dédié ; le second
> est à faible risque (même mécanique flex que le transport, déjà validé sur mobile et desktop).

---

## 7. Repli

Le travail est purement additif : 2 modules créés, 1 bloc HTML, 1 section CSS, un câblage.
Aucun format de données existant n'est modifié — partage, export et import restent
compatibles. Le retour arrière est un `git revert` du commit de la branche, sans migration
ni perte de données (le défi écrit dans sa propre clé `localStorage`).

---

## 9. Évolution — Deux types de défi (demandée le 2026-07-23)

### 9.1 Demande
Le défi propose désormais **deux modes**, choisis par le joueur :
- **Mélodie surprise** = le mode actuel (séquence aléatoire qui s'allonge, niveau + record).
- **Mélodie connue** = nouveau mode noté, basé sur les exemples (Frère Jacques, Au clair de
  la lune, Hymne à la joie). Les exemples **quittent la section « Exemples »** et deviennent
  le matériel de ce mode. Chaque mélodie vaut au maximum son nombre de notes ; le jeu affiche
  le score atteint.

### 9.2 Arbitrages tranchés par le client
| Question | Réponse |
|---|---|
| Comptage du score | **Jusqu'à la première erreur** : score = notes justes enchaînées, sur N |
| Choix de la mélodie | **Une à la fois**, meilleur score conservé par mélodie |
| Réécoute pendant la tentative | **Oui**, bouton « Réécouter » sans pénalité |
| Écoute libre séparée | **Non** : l'écoute passe par la démonstration du défi. La section « Exemples » est retirée |

### 9.3 Décisions prises seul
- Sélecteur de mode = deux boutons `aria-pressed` ; « Mélodie surprise » par défaut. Le mode
  surprise **garde son code intact** (déjà validé), le mode connue s'ajoute à côté.
- La démonstration d'une mélodie connue rejoue **l'enregistrement réel** (avec son rythme) via
  `player.js` — désormais fiable. Le mode surprise garde son planificateur pas-à-pas.
- Mode connue : piano forcé octave 0, notes seules (les démos sont toutes en Do4–Sol4).
- « Réécouter » = rejoue la démonstration depuis le début et **remet la saisie à zéro**, sans
  toucher au meilleur score.
- Comparaison sur les **hauteurs seules** (comme le mode surprise), pas le rythme.
- Meilleur score par mélodie dans sa **propre entrée** `localStorage` — ne touche ni
  l'autosauvegarde ni le « record niveau » du mode surprise.
- Logique pure `createKnownChallenge(sequence)` ajoutée à `challenge.js` + tests unitaires.

### 9.4 Fichiers touchés
| Fichier | Modification |
|---|---|
| `assets/js/melodie/challenge.js` | + `createKnownChallenge(sequence)` (séquence fixe, score) |
| `assets/js/melodie/ui-challenge.js` | Sélecteur de mode + sous-panneau « connue » (choix + score) |
| `assets/js/boot-jeu-melodie.js` | Bascule de mode, flux mode connue, « Réécouter » ; retrait du câblage de la section Exemples |
| `assets/js/melodie/storage.js` | Meilleur score par mélodie (`save/loadBestScore`) |
| `jeu-melodie.html` | Retrait de la section `[data-melodie-demos]` |
| `assets/css/jeu-melodie.css` | Styles du sélecteur de mode et du sous-panneau connue |
| `tests/run-tests.js` | Tests de `createKnownChallenge` |

### 9.5 Cas limites ajoutés — vérifiés
- [x] Basculer de mode pendant une tentative → abandon propre (statut vidé, pane basculée)
- [x] « Réécouter » pendant la saisie → re-démonstration, score remis à zéro *(vérifié)*
- [x] Mélodie réussie en entier → score parfait **14 / 14** enregistré *(Frère Jacques)*
- [x] Erreur → score = notes justes avant l'erreur (**1 / 14** après C4 puis note fausse)
- [x] Rejouer une mélodie déjà réussie : record jamais abaissé (reste 14/14 après un 1/14)
- [x] Meilleur score par mélodie affiché sur le bouton (« Record 14 / 14 ») et stocké
      (`ada-melodie-defi-scores` = `{"Frère Jacques":14}`), clé distincte de l'autosave
- [x] Mode surprise **inchangé** : démonstration → réussite → niveau 2 *(revérifié)*
- [x] Section « Exemples » retirée du HTML ; aucun code ne référence plus `[data-melodie-demos]`
- [x] Démonstration d'un air : signal audio mesuré à **-11 dB**, touches allumées
- [x] Mobile 375 px : pas de scroll horizontal, boutons dans le viewport, cibles ≥ 44 px
- [x] Console sans erreur ; **68 / 68 tests** (dont `createKnownChallenge`)

### 9.6 Point de risque principal
Ne pas casser le mode « surprise » déjà validé : son chemin de code reste **inchangé**, le mode
connue vit en parallèle. Retrait de la section Exemples : vérifier qu'aucun autre code ne
référence `[data-melodie-demos]`.

**Estimation :** entre 2 h 30 et 3 h 30.

---

## 10. Retrait enregistrement + partage (demandé le 2026-07-23)

Avant de brancher Supabase, on retire tout ce qui ne peut rien sauvegarder sans base.
**Les défis ne sont PAS concernés** — les deux modes restent intacts.

### Retiré (validé par le client)
- Barre transport : Enregistrer, Stop, Réécouter, métronome, tempo, volume.
- Partage : Copier le lien, Exporter, Importer.
- Éléments dépendants devenus sans usage : bouton « Reprendre ma dernière création »,
  bannière « Quelqu'un vous a partagé une mélodie » (liens entrants), sauvegarde auto des
  créations (`saveLast`/`loadLast`), décodage du lien `#m=`.
- Script `assets/vendor/lz-string.min.js` (n'était utilisé que par le partage).

### Conservé
- Jeu en direct : piano / guitare / trompette, accords, octaves, lettres.
- Les **deux modes de défi** (surprise + connue) et les scores locaux.
- Textes mis à jour (titre/description SEO, accroche, sous-titre) pour ne plus promettre
  l'enregistrement ni le partage.

### Fichiers désormais inutilisés par la page (candidats à un nettoyage ultérieur)
- `assets/js/melodie/ui-transport.js` — plus importé.
- `assets/js/melodie/recorder.js` — plus importé par la page (encore couvert par les tests).
- `assets/js/melodie/serialize.js` — `validateRecording` reste utilisé (chargement des démos) ;
  les fonctions de partage (`encodeToUrl`/`decodeFromUrl`/`downloadRecording`/`importFromFile`)
  ne sont plus appelées.
Laissés en place pour ne pas élargir le diff ; à supprimer avec leurs tests lors d'une passe dédiée.

### Vérifié
- [x] Transport, partage, « Reprendre », section démos absents de la page
- [x] Jeu en direct : une touche sonne (−10 dB)
- [x] Mode surprise : démonstration → « ✓ Bravo ! Niveau 1 réussi. »
- [x] Mode connue : Frère Jacques → « ✓ Parfait ! 14 / 14 »
- [x] Console sans erreur ; **68 / 68 tests**

---

## 11. Classement en ligne — cadrage (en cours, 2026-07-23)

Direction validée avec le client :
- **Pas de saisie libre de pseudo** (le vrai correctif au risque d'insultes : côté client la
  clé Supabase est publique, un filtre JS est contournable en écrivant en base directement).
- **Pseudos attribués depuis un pool sûr** : `assets/data/melodie-pseudos.json`, **1085 pseudos**
  sur le thème du festival (toucan, koala, méduse, girafe, colibri, panthère, flamant rose ×
  adjectifs accordés + compléments invariables). Accords vérifiés, rien qui moque le physique.
- **Classement global partagé** souhaité.

Décisions encore à prendre AVANT de brancher Supabase :
- **Anti-triche** : un classement public alimenté par le client est spoofable (poster un faux
  score). À traiter par validation serveur (Edge Function + RLS interdisant l'écriture directe),
  sinon les scores ne sont pas fiables.
- **Unicité des pseudos** : ~1085 pseudos = ~1085 joueurs distincts avant épuisement du pool.
  Prévoir la stratégie d'attribution (pseudo pris = retiré du pool ; contrainte d'unicité en base)
  et le dépassement (suffixe discret ou agrandir le pool).
- **RGPD / CSP** : ajout d'une origine tierce (Supabase) → mise à jour CSP + mention légale.
- **Rangement git** (toujours en attente) à faire avant d'ajouter une brique aussi structurante.

---

## 8. Point d'attente avant de commencer

`main` contient déjà le merge de `maj-programme-infos-pratiques` (`abbb749`), mais
6 fichiers modifiés et 5 fichiers non suivis restent en cours dans le répertoire de
travail. **Je ne touche à rien côté git sans accord explicite.** Deux options :

1. Tu commites toi-même ton travail en cours, je crée ensuite `jeu-melodie-defi` depuis `main`.
2. Tu me demandes de le commiter, en me disant sur quelle branche et avec quel message.
