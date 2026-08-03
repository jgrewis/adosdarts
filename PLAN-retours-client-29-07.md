# Plan — Retours client du 29.07

Branche : `retours-client-29-07` (créée depuis `admin-photos`, qui n'a aucun commit d'avance sur `main`).
Source : `Modif du 29.07 (1).md` + capture d'écran fournie pour l'accueil.

---

## 1. Résumé des demandes

1. **Accueil** — ajouter un sur-titre « L'après-midi » au-dessus du titre « Garden party », à la même taille que le sur-titre « La soirée » de la section suivante.
2. **Au programme** — remplacer les cinq descriptions de groupes par les nouveaux textes fournis : Scène ouverte, SYMBIOZ, AORAKI, KIF & LUNIK, SOBEIKH.
3. **Infos pratiques** — remplacer le lien du « parking à côté de l'Escapade de Rouffach » par le lien Google Maps court fourni : `https://maps.app.goo.gl/z43YmjAHdMojPSZL6`.
4. **Mentions légales** — remplacer le §2 « Hébergement » (auto-hébergement NAS) par le texte IONOS fourni.
5. **Mentions légales** — corriger le §4 en conséquence, pour qu'il ne contredise plus le §2 (arbitrage tranché, cf. §3).

---

## 2. Hors périmètre

- **Photos de la galerie (partage Proton Drive)** — tranché avec JP : hors périmètre de cette branche. Les photos seront publiées par JP via `admin.html` une fois le chantier galerie/admin terminé et en ligne. Aucun fichier binaire n'est ajouté ici.
- **Chantier galerie / admin en cours** — `admin.html`, `galerie.html`, `assets/php/`, `assets/uploads/` restent non commités et ne sont pas touchés par cette branche.
- **§1, §3, §5, §6, §7, §8 des mentions légales** — le document client les renvoie mot pour mot identiques à ce qui est déjà en ligne. Comparés ligne à ligne : aucun écart. Rien à faire.
- **SIREN de la CCPAROVIC** — reste « ⚠ à compléter », comme dans le document client.
- **Champs `style`, `scene`, `youtube`, `couleur` des groupes** — non modifiés par le client, conservés tels quels.
- **Harmonisation générale du tutoiement / vouvoiement du site** — les nouveaux textes clients sont au « vous » ; le reste du site est mixte (« reviens vite » sur la Garden party). Non demandé, non fait.

---

## 3. Décisions et arbitrages

### Arbitrages tranchés par JP

| Sujet | Décision retenue |
|---|---|
| Contenu de « L'APRÈS-MIDI » (absent du .md) | Sur-titre seul au-dessus de « Garden party », taille identique à « La soirée ». Le texte de la Garden party ne change pas. |
| §2 IONOS vs §4 NAS (contradiction) | Corriger le §4 pour dire la vérité. Texte soumis à validation ci-dessous. |
| Photos Proton Drive | Hors périmètre (cf. §2). |

### Décisions prises seul

| Sujet | Décision | Raison |
|---|---|---|
| Implémentation du sur-titre | `<p class="eyebrow">L'après-midi</p>`, composant existant, **zéro CSS ajouté** | C'est exactement le composant utilisé par « La soirée ». `.eyebrow` est en `--text-sm`, donc la taille demandée est obtenue sans nouvelle règle. |
| Casse du sur-titre | Écrit « L'après-midi » en HTML | `.eyebrow` applique `text-transform: uppercase` en CSS. Le rendu sera « L'APRÈS-MIDI » comme sur la capture, sans figer la casse dans le contenu. |
| Couleur du sur-titre | Aucune règle ajoutée | `.section--alt .eyebrow` est déjà défini sur `--brand-toucan` (#27367e) précisément pour le contraste sur le fond crème — commentaire déjà présent dans `pages.css:34`. C'est le bleu nuit visible sur la capture. |
| Taille sur la capture | Ignorée au profit de la consigne écrite | Sur la capture, « L'APRÈS-MIDI » est plus gros que « LA SOIRÉE ». JP a précisé à l'oral que la taille de référence est celle de « La soirée ». La capture fait foi pour l'emplacement, la consigne pour la taille. |
| Lien parking | Le lien court client remplace l'URL `google.com/maps/search/?api=1&query=47.957064,7.299417` | Demande explicite du client, qui a barré lui-même la variante `geo:`. La page contient déjà un lien `maps.app.goo.gl` pour le lieu : cohérent. |
| Puce « Email » du §2 IONOS | Rendue comme une note en fin de section plutôt qu'en puce de liste | Le contenu fourni n'est pas une adresse mais une phrase explicative (« IONOS ne communique pas d'adresse email directe… »). Une puce « Email : (note de deux lignes) » serait illisible. Le fond de l'information est conservé intégralement. |

### Texte du §4 soumis à validation

**Phrase actuellement en ligne (devenue fausse) :**

> L'hébergement de ces informations s'effectue sur un serveur NAS personnel situé en France, à Guebwiller (68500). Aucune donnée ne quitte le territoire national, ce qui assure le respect des règles applicables au transfert de données hors de l'Union européenne.

**Remplacement proposé :**

> Les messages sont transmis par le serveur du site, hébergé par IONOS SE au sein de l'Union européenne, puis acheminés vers la boîte de réception de l'association. Ils ne sont enregistrés dans aucune base de données : seule la boîte de réception de l'équipe en conserve une copie. L'ensemble du traitement s'effectue au sein de l'Union européenne, sans transfert vers un pays tiers.

**Fondement factuel :** vérifié dans `assets/php/envoi-contact.php` — le script relaie le message par `mail()` vers `contact@adosdarts.fr` et n'écrit strictement rien sur le serveur (aucun `file_put_contents`, aucun `fopen`, aucun journal). L'affirmation « aucune donnée ne quitte le territoire national » n'est plus tenable avec un hébergeur allemand ; « au sein de l'Union européenne » l'est.

Le reste du §4 (durée de conservation d'un an, droits RGPD, CNIL, absence de traceurs) reste inchangé et demeure exact.

---

## 4. Points de risque

| Risque | Impact | Parade |
|---|---|---|
| **Les fichiers touchés portent déjà des modifications non commitées** du chantier galerie/admin (`index.html` surtout : bloc galerie + URLs canoniques). | Un commit « retours client » embarquerait du travail en cours étranger. | Aucun commit n'est fait sans demande de JP. Au moment de committer, il faudra soit sélectionner les hunks (`git add -p`), soit assumer que `index.html` porte aussi le bloc galerie. **Point à trancher au moment du commit, signalé ici.** |
| Les nouveaux textes de groupes sont **nettement plus longs** que les actuels (SYMBIOZ passe de ~330 à ~350 caractères, AORAKI de ~200 à ~330, KIF & LUNIK de ~180 à ~330, Scène ouverte de ~130 à ~340). | Les cartes de la grille programmation peuvent se déséquilibrer ou déborder, sur l'accueil comme sur la page programme. | Vérification visuelle obligatoire en 375 / 768 / 1280 px sur `index.html` **et** `programmation.html`, les deux consommant le même JSON. |
| `programmation.json` est consommé par deux pages via `programme.js`. | Une erreur de syntaxe JSON casse silencieusement l'affichage des deux pages (« Chargement de la programmation… » figé). | Validation JSON après édition + contrôle console (0 erreur) sur les deux pages. |
| Le lien court `maps.app.goo.gl` est opaque : sa destination n'est pas lisible dans l'URL. | Si le client s'est trompé de lien, le visiteur atterrit ailleurs. | Le lien vient du client et remplace un lien qu'il a lui-même barré. Je ne peux pas garantir sa destination sans l'ouvrir ; **je l'ouvrirai en vérification et je rapporterai où il mène.** |
| Le §2 IONOS est une **information juridique** publiée. | Erreur = mention légale inexacte. | Texte repris mot pour mot du document client, sauf la puce « Email » (cf. §3). |
| Apostrophes typographiques dans les textes fournis (« l'énergie », « d'inoubliable »). | Encodage cassé si mal recopié. | Fichiers en UTF-8 ; contrôle visuel du rendu après édition. |

---

## 5. Approche technique

**Fichiers touchés (4) :**

| Fichier | Nature de la modification |
|---|---|
| `index.html` | +1 ligne : `<p class="eyebrow">L'après-midi</p>` dans la section Garden party |
| `assets/data/programmation.json` | 5 champs `description` remplacés |
| `infos.html` | 1 `href` remplacé (lien parking) |
| `mentions-legales.html` | §2 réécrit, 1 paragraphe du §4 réécrit |

**Aucun fichier CSS ni JS touché. Aucun nouveau fichier de code.**

**Ordre des tranches :**

1. Accueil — sur-titre (le plus simple, valide qu'on ne casse rien).
2. Programmation — les 5 textes (le plus risqué visuellement, donc tôt).
3. Infos pratiques — lien parking.
4. Mentions légales — §2 + §4.
5. Recette complète (§6).

**Repli :** aucune modification n'est structurelle. `git checkout -- <fichier>` annule chaque tranche indépendamment. Rien n'est déployé par ce travail (mise en ligne Ionos manuelle, séparée).

---

## 6. Checklist — recette du 03/08/2026

### Demandes

- [x] Accueil : le sur-titre « L'APRÈS-MIDI » s'affiche au-dessus de « Garden party », à la même taille que « LA SOIRÉE » — *mesuré : 16px / graisse 800 / uppercase / tracking 1.92px des deux côtés, identiques*
- [x] Programmation : description **Scène ouverte** conforme au document client, `#jamsession` compris — *comparaison automatique caractère par caractère*
- [x] Programmation : description **SYMBIOZ** conforme — *idem*
- [x] Programmation : description **AORAKI** conforme — *idem*
- [x] Programmation : description **KIF & LUNIK** conforme — *idem*
- [x] Programmation : description **SOBEIKH** conforme — *idem*
- [x] Infos pratiques : le lien parking pointe vers `https://maps.app.goo.gl/z43YmjAHdMojPSZL6` — *href relu dans le DOM*
- [x] Mentions légales : §2 IONOS complet (adresse, téléphone cliquable, site web, note e-mail, paragraphe LCEN)
- [x] Mentions légales : plus aucune trace de « NAS », « Guebwiller », « WESSANG » ni « territoire national » — *grep : aucune occurrence*
- [x] Mentions légales : diff limité au §2, à un paragraphe du §4 et à la date de mise à jour — *diff relu ligne à ligne*

### Référentiel applicable

- [x] Aucune règle CSS ni JS ajoutée : `.eyebrow` et `.legal` réutilisés tels quels
- [x] Contraste du sur-titre sur fond crème : **9,24:1** — *niveau AAA (seuil AA = 4,5)*
- [x] Liens externes : `rel="noopener noreferrer"` + `target="_blank"` conservés sur le lien parking, appliqués au lien IONOS
- [x] Hiérarchie des titres des mentions légales préservée — *h2 1→8, h3 uniquement sous le §1, aucun saut de niveau*
- [x] JSON valide, apostrophes droites (0x27) conformes à la convention du reste du site
- [x] Date de mise à jour des mentions légales portée au 03/08/2026 *(décision prise seul : le contenu légal change, la date doit suivre)*

### Vérification humaine réelle

- [x] `programmation.html` 1280 px : 5 cartes, hauteurs **strictement égales (772 px)**, 0 troncature, 0 débordement
- [x] `programmation.html` 768 px : 0 troncature, écart de hauteur 28 px entre cartes (grille à 2 colonnes, sans effet visible)
- [x] `programmation.html` 375 px : 0 troncature, colonne unique, texte intégral affiché *(capture à l'appui sur Scène ouverte)*
- [x] `index.html` 375 px : teaser à 5 cartes, aucune tronquée, sur-titre contenu dans l'écran (119 px de large)
- [x] Aucun scroll horizontal sur `index.html`, `programmation.html`, `infos.html`, `mentions-legales.html` en 375 / 768 / 1280 px
- [x] Console : **0 erreur** sur les 4 pages
- [x] Réseau : **0 ressource en 404**, toutes les requêtes en 200
- [x] Focus clavier : le lien parking est focusable ; la règle globale `:focus-visible { outline: 3px solid }` s'applique — *comportement inchangé par cette tâche (seul le `href` a bougé)*
- [x] Destination du lien court vérifiée et rapportée (cf. §7)

---

## 7. Résultat de la vérification du lien parking

Le lien court du client a été résolu :

```
https://maps.app.goo.gl/z43YmjAHdMojPSZL6
  → google.com/maps/place/Parking/@47.9531951,7.297301  (47.9532954, 7.2975246)
```

Distances calculées depuis L'Escapade de Rouffach (47.9524311, 7.2991145, elle-même résolue depuis le lien du lieu déjà présent sur la page) :

| Lien | Destination | Distance à L'Escapade |
|---|---|---|
| **Nouveau (client)** | POI « Parking » identifié | **152 m** |
| Ancien (coordonnées) | point brut sans POI | 516 m |

**Conclusion : le changement demandé est une correction réelle.** L'ancien lien envoyait le visiteur 360 m trop loin, sur un point qui n'était pas un parking référencé. Le nouveau pointe un parking identifié à 152 m du lieu.

---

## 8. Ce que je ne peux pas vérifier moi-même

- **L'exactitude juridique du §2 IONOS** : le texte vient du client, je l'ai transcrit sans le valider sur le fond.
- **Le numéro SIREN de la CCPAROVIC**, laissé « ⚠ à compléter » par le client : toujours en attente.
- **La mise en ligne** : ~~rien n'est déployé par ce travail~~ → **fait le 03/08/2026 par JP** (dépôt manuel Ionos), et vérifié contre le serveur : cf. §10.

---

## 9. Commit — tranché le 03/08/2026

Les 4 fichiers modifiés portaient aussi des modifications non commitées du chantier galerie/admin :

| Fichier | Contenu 29.07 | Contenu galerie/admin déjà présent |
|---|---|---|
| `index.html` | sur-titre | bloc galerie, lien « Voir toutes les photos », URLs canoniques |
| `infos.html` | lien parking | URLs canoniques |
| `mentions-legales.html` | §2, §4, date | URLs canoniques |
| `assets/data/programmation.json` | 5 textes | *(rien)* |

**Décision retenue : commit sélectif.** Commit `d14283e` ne contient que les retours du 29.07
(sur-titre, 5 textes, lien parking, §2/§4 des mentions légales, date). Le bloc galerie de
`index.html` et le reste du chantier admin sont restés hors du commit, pour la branche
`admin-photos`.

---

## 10. Mise en ligne — 03/08/2026

Déployé sur `https://adosdarts.fr` par JP (dépôt manuel Ionos, cf. `PROCESS-mise-en-ligne.md`),
puis **vérifié en comparant les fichiers servis par le serveur aux fichiers locaux** :

| Fichier | État en ligne |
|---|---|
| `index.html` | ✅ à jour (le seul écart restant est le bloc galerie, non déployé, chantier en cours) |
| `infos.html` | ✅ identique |
| `mentions-legales.html` | ✅ identique |
| `assets/data/programmation.json` | ✅ identique |
| `contact.html`, `assets/js/forms.js`, `404.html`, `assets/css/layout.css` | ✅ identiques *(formulaires + bascule de domaine, cf. `PLAN-formulaires-production.md`)* |

**Cette branche est close.** Ce qui reste non commité dans l'arbre de travail
(`admin.html`, `galerie.html`, `assets/php/admin-api.php`, `assets/js/galerie.js`,
`assets/js/boot-galerie.js`, `.htaccess`, plus les hunks galerie de `index.html`,
`robots.txt`, `sitemap.xml`, `assets/js/layout.js`, `assets/js/boot-index.js`,
`assets/css/pages.css`, `README.md`) appartient au chantier `admin-photos`, **qui n'est pas
déployé** : `galerie.html` et `admin.html` répondent 404 en ligne au 03/08/2026.
