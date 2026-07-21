# Plan — Mise à jour Au programme, Infos pratiques & Mentions légales

Branche : `maj-programme-infos-pratiques`
Date : 21/07/2026

## 1. Résumé des demandes

### Page « Au programme » (programmation.html)
1. Remplacer le bandeau « Samedi 22 août 2026 · dès 19h » par « … · dès 15h ». **Uniquement ce bandeau** (arbitrage client), le reste du site conserve la distinction ouverture 15h / concerts 19h.
2. La carte « Scène ouverte » doit apparaître en première position, entre le bloc « La playlist du festival » et SYMBIOZ, sans numéro. Ordre final attendu : (sans n°) Scène ouverte, 1 SYMBIOZ, 2 AORAKI, 3 KIF & LUNIK, 4 SOBEIKH.
3. Un espace visible doit séparer le bloc « La playlist du festival » de la carte « Scène ouverte ».
4. Supprimer la phrase « Descriptions, photos et liens d'écoute des groupes sont complétés au fil de l'été. Reviens vite ! ».

### Page « Infos pratiques » (infos.html)
5. Remplacer le texte de la carte « Comment venir — En voiture » par : « Stationnement possible sur le parking à côté de l'Escapade de Rouffach. Pour simplifier votre accès et réduire l'impact écologique, n'oubliez pas de privilégier le covoiturage. »
6. Rendre « parking à côté de l'Escapade de Rouffach » cliquable vers les coordonnées 47.957064, 7.299417.

### Nouvelle page
7. Créer la page Mentions légales avec le texte fourni par le client, les informations manquantes signalées en rouge, et rétablir le lien légal dans le pied de page.

## 2. Hors périmètre

- **Photos des 4 groupes** : non fournies par le client. Le champ `image` de chaque groupe reste `null` (les cartes s'affichent sans photo, comportement déjà géré). À traiter dans un lot ultérieur.
- **Page Accessibilité** : mentionnée dans le commentaire du pied de page, non demandée. Le lien légal n'exposera que Mentions légales (pas de lien mort).
- **Horaires ailleurs sur le site** : accueil, timeline Infos pratiques et `edition.json` restent inchangés (arbitrage n°1).
- **Complétion du SIREN CCPAROVIC** : le client doit le fournir ; le placeholder reste visible en rouge.

## 3. Décisions et arbitrages

### Arbitrages tranchés par le client
| Sujet | Décision retenue |
|---|---|
| Portée du passage 19h → 15h | Bandeau de la page Au programme uniquement |
| Parkings (En voiture) | Remplacement intégral : suppression assumée du parking du Lycée Agricole et du lien « avant du bâtiment » |
| Lien cartographique | URL Google Maps `https://` au lieu de l'URI `geo:` fournie — mêmes coordonnées, fonctionne aussi sur ordinateur |
| Mentions légales | Page créée immédiatement, informations manquantes en rouge |

### Décisions prises seul
- Le lien Maps utilise le format `https://www.google.com/maps/search/?api=1&query=47.957064,7.299417` : format officiel documenté, ouvre l'application Maps sur mobile, la carte web sur ordinateur. L'URI `geo:` aurait de plus été rejetée par `safeUrl()` du site.
- Le lien reprend les attributs `target="_blank" rel="noopener noreferrer"` des autres liens externes de la page, par cohérence.
- La page Mentions légales réutilise la structure existante (`page-head`, `section`, `container`) et le boot `boot-simple.js` comme les autres pages statiques — aucun composant nouveau.
- Signalement des manquants : classe utilitaire dédiée (fond + texte contrastés) plutôt qu'un `style` inline, la CSP du site interdisant les styles inline.
- Le contenu légal est intégré en HTML statique dans la page, pas en JSON : ce n'est pas de la donnée éditoriale récurrente.

## 4. Points de risque

| Risque | Dérisquage |
|---|---|
| Demandes 2 et 3 déjà satisfaites dans le code (`ordre: 0` en tête et `[data-playlist] + .band-grid { margin-top: clamp(48px, 6vw, 64px) }`) | Vérification visuelle réelle dans le navigateur avant de conclure. Si l'écart paraît insuffisant à l'œil, je l'augmente ; sinon je le signale au client sans toucher au CSS. |
| Suppression de la phrase (demande 4) : elle porte la classe `mt-12` qui espaçait le bas de section | Contrôler visuellement le bas de la grille des groupes après suppression. |
| Suppression du parking du Lycée Agricole : perte d'information utile un soir d'affluence | Décision explicite du client, tracée ici. |
| Rétablir la colonne « Légal » du pied de page = 4 colonnes sur toutes les pages | Vérifier le pied de page en mobile / tablette / desktop sur au moins deux pages. |
| Page légale longue : lisibilité et hiérarchie | Titres `h2` numérotés, largeur de ligne limitée, vérification mobile. |
| Texte légal = contenu contractuel | Recopié à l'identique, sans reformulation ni correction de style. |

## 5. Approche technique

Fichiers touchés :
- `programmation.html` — bandeau (l. 39), suppression du paragraphe (l. 51-53)
- `infos.html` — carte En voiture (l. 115)
- `mentions-legales.html` — création
- `assets/js/layout.js` — colonne « Légal » du pied de page
- `assets/css/pages.css` (ou `base.css`) — style du marqueur « information manquante »
- `sitemap.xml` — ajout de la nouvelle page

Tranches :
1. Page Au programme (demandes 1 à 4) + vérification navigateur
2. Page Infos pratiques (demandes 5 et 6) + vérification du lien
3. Page Mentions légales + pied de page + sitemap
4. Recette complète et responsive

## 6. Checklist

### Au programme
- [x] Le bandeau affiche « Samedi 22 août 2026 · dès 15h » — constaté à l'écran
- [x] Aucun autre horaire du site n'a été modifié — `grep` : seule occurrence restante de « dès 19h » = accueil, conforme à l'arbitrage n°1
- [x] La carte Scène ouverte est la première de la grille, immédiatement sous le bloc playlist — capture desktop
- [x] La carte Scène ouverte n'affiche aucun numéro ; SYMBIOZ=1, AORAKI=2, KIF & LUNIK=3, SOBEIKH=4 — texte de page relevé
- [x] Un espace clairement visible sépare le bloc playlist de la carte Scène ouverte — mesuré à 48 px (contre 24 px de gap interne, ratio 2:1) à 375, 768 et 1280 px
- [x] La phrase « … Reviens vite ! » n'apparaît plus — absente du texte de page
- [x] Le bas de la section reste correctement espacé — le `padding-block` de `.section` (64 px) prend le relais, vérifié à l'écran

### Infos pratiques
- [x] La carte En voiture affiche exactement le texte fourni par le client — texte relevé au caractère près
- [x] « parking à côté de l'Escapade de Rouffach » est un lien cliquable
- [x] Le lien pointe vers les coordonnées 47.957064, 7.299417 et s'ouvre réellement sur la carte — Google Maps reçoit les coordonnées intactes (vérifié jusqu'à l'écran de consentement, non franchi volontairement)
- [x] Le lien est visuellement identifiable — souligné, encre #1a1430
- [x] Les mentions du Lycée Agricole et de « l'avant du bâtiment » ont disparu — `grep` sans résultat

### Mentions légales
- [x] La page reprend l'intégralité du texte fourni, sans reformulation
- [x] Les informations manquantes (SIREN) sont signalées en rouge — `#c8360f`, 4.9:1 sur le crème
- [x] Le signalement ne repose pas uniquement sur la couleur — pictogramme ⚠, graisse 800 et liseré pointillé
- [x] Le lien vers les mentions légales est présent dans le pied de page de toutes les pages — pied de page mutualisé dans `layout.js`
- [x] Aucun lien mort dans le pied de page — les 8 liens vérifiés, page Accessibilité volontairement non exposée
- [x] La page est référencée dans le sitemap
- [x] Titre, meta description, canonical, Open Graph et CSP alignés sur les autres pages

### Vérification humaine réelle
- [x] Aucun chevauchement, débordement ou texte tronqué sur les 3 pages touchées — aucun élément dépassant la largeur du document
- [x] Responsive vérifié à 375 px, 768 px et 1280 px, sans scroll horizontal
- [x] Contrastes suffisants, y compris pour le marqueur rouge (4.9:1, seuil AA 4.5:1)
- [x] Navigation clavier et focus visible sur les nouveaux liens — Tab réel atteint le lien Maps, `:focus-visible` actif, outline 3 px
- [x] Aucune erreur JavaScript et aucune ressource 404 — console vide, toutes les requêtes en 200
- [x] Suite de tests du projet : 35/35 dans le navigateur (`tests/jeu-melodie.html`)

## 7. Points ouverts signalés au client

- **Photos des 4 groupes** : toujours attendues.
- **SIREN de la CCPAROVIC** : marqué en rouge sur la page.
- **Numéro d'identification de la FDFC68** (RNA ou SIREN) : absent du texte fourni alors que la LCEN l'exige pour une association éditrice. Non ajouté d'office — à confirmer par le client.
- **Domaine** : le texte légal désigne « adosdarts.fr » alors que le site est actuellement publié sur `jgrewis.github.io/adosdarts`. À aligner lors de la mise en ligne du domaine définitif.
- **Cible tactile des liens du pied de page** : 42 px de haut, soit 2 px sous la recommandation de la charte (44 px), mais au-dessus du minimum normatif WCAG 2.2 AA (24 px). Comportement préexistant et identique sur les 8 liens — non modifié pour ne pas toucher toutes les pages sans arbitrage.
- **Suite de tests non exécutable sous Node** : `node tests/run-tests.js` échoue (`Cannot use import statement outside a module`) faute de `package.json` avec `"type": "module"`. Préexistant, sans rapport avec ces modifications ; le runner navigateur, lui, passe.
