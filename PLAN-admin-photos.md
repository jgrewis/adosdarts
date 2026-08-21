# Plan — Page d'administration & galerie photos

> Document de travail. Créé le 28/07/2026.
> Référentiels appliqués : `1.Regles.md`, `2.BonnesPratiques.md`, `3.Planification.md`.
> Process de déploiement : `PROCESS-mise-en-ligne.md` (Ionos, dépôt **manuel**).

---

## 0. Localisation des réceptacles existants (réponse à la 1ʳᵉ demande)

| Emplacement | Fichier | État |
|---|---|---|
| **Grille « En images »** (section *Memories*) | `index.html` l. 214-221 — `<div class="gallery" data-galerie>` + 4 `figure.gallery__item--empty` « Photo à venir » | **Vide, cible du chantier.** L'attribut `data-galerie` existe mais **aucun JS ne le lit** : la grille est statique. |
| Styles associés | `assets/css/pages.css` l. 499-519 (`.gallery`, `.gallery__item`, `.gallery__item--empty`) | Déjà écrits, réutilisés tels quels |
| Photos des groupes | `assets/data/programmation.json` — 4 × `"image": null` | Vide, **hors périmètre** (arbitrage du 28/07) |
| Affiches *Memories* | `index.html` l. 177-210 | Déjà remplies (8 affiches), non concernées |

---

## 1. Résumé des demandes

1. Localiser les réceptacles à photos de la page d'accueil. → §0.
2. Créer une page d'administration protégée par mot de passe.
3. Depuis cette page, un détenteur du mot de passe peut **téléverser des photos**.
4. Depuis cette page, il peut aussi **voir les photos en ligne et en supprimer**.
5. Les photos publiées remplissent la grille « En images » de l'accueil : **les 8 plus récentes**.
6. Une **page galerie dédiée** (`galerie.html`) affiche l'intégralité des photos.
7. **(A)** Forcer HTTPS sur tout le site et poser les en-têtes de sécurité côté serveur.
8. **(B)** Journaliser les connexions et les publications, consultable depuis l'admin.
9. **(B+)** Demander à la personne qui publie **qui elle est**, une seule fois par appareil. Ce nom
   n'apparaît **jamais** dans ce que le site public sert ; il ne vit que dans l'interface d'administration.

---

## 2. Hors périmètre

- **Photos des groupes** (`programmation.json`) — restent à la main d'un dev.
- **Comptes multiples / rôles** : un seul mot de passe partagé, pas de gestion d'utilisateurs. Le nom
  demandé à la publication (§3.3) est une **étiquette de traçabilité, pas une authentification** :
  il n'ouvre aucun droit et n'est pas vérifiable.
- **Récupération de mot de passe** : pas de « mot de passe oublié » (aucune boîte mail dédiée, et ça ouvrirait une surface d'attaque). Perte du mot de passe = on regénère le hash et on redéploie un fichier.
- **Légendes et réordonnancement manuel** : les photos s'affichent de la plus récente à la plus ancienne. Le texte alternatif est générique.
- **Recadrage, rotation, filtres, albums par édition.**
- **Lightbox / visionneuse plein écran** au clic sur une photo.
- **Modération / validation** : ce qui est téléversé est publié immédiatement.
- **Sauvegarde automatique des photos** : elles vivent uniquement sur le serveur Ionos (cf. risque R3).
- **Fonctionnement sans JavaScript** de la page d'admin (le redimensionnement se fait dans le navigateur). Le site public, lui, reste correct sans JS : il affiche l'état vide.

---

## 3. Décisions et arbitrages

### 3.1 Arbitrages tranchés par le client (28/07/2026)

| Question | Réponse retenue |
|---|---|
| Périmètre des photos | Galerie « En images » uniquement |
| Affichage | Accueil = 8 dernières + page `galerie.html` complète |
| Fonctions de l'admin | Uploader + supprimer |
| Dérisquage serveur | **Pas de test préalable** : on construit, on éprouve une fois en ligne |
| Options de sécurité A / B / C | **Les trois retenues** (HTTPS forcé, journal, en-têtes serveur) |
| Identification de l'auteur | Demandée **une seule fois par appareil**, jamais servie au public |
| Accroche de cette identification | **Cookie de navigateur, pas l'IP** — voir §3.4 |

> ⚠️ Conséquence assumée du dernier point : les capacités d'écriture disque et la taille maximale de téléversement d'Ionos ne sont **pas connues**. Parade retenue (§4, R1) : minimiser la dépendance au serveur (redimensionnement côté navigateur, aucune extension PHP requise) et intégrer un **panneau de diagnostic dans la page d'admin elle-même**, qui teste réellement l'écriture au premier accès. Ainsi la première connexion en ligne fait office de test de bout en bout, sans aller-retour supplémentaire.

### 3.2 Décisions prises seul (de développeur)

| Décision | Pourquoi |
|---|---|
| **Redimensionnement dans le navigateur** (`<canvas>`, max 1600 px, JPEG q=0.82) avant envoi | Une photo de téléphone fait 4-8 Mo : envoyée telle quelle elle tuerait la page d'accueil et se heurterait aux limites d'Ionos. Le canvas **supprime aussi les métadonnées EXIF** (géolocalisation du domicile, modèle d'appareil) — sujet RGPD réel. Et ça n'exige **aucune extension serveur** (GD/Imagick non requis), donc aucune inconnue Ionos de plus. |
| **Un seul point d'entrée PHP** `assets/php/admin-api.php`, action passée en POST | Calqué sur `envoi-contact.php` (convention du projet : un fichier, un `switch`). |
| **Index des photos dans un JSON** `assets/uploads/galerie.json`, écrit par PHP, lu par le site en `fetch()` | Pas de base de données sur ce mutualisé. Cohérent avec le « CMS JSON » du projet (`assets/data/*.json`). Écriture protégée par `flock`. |
| **Tout ce que le serveur écrit vit sous `assets/uploads/`**, jamais dans `assets/data/` ni `assets/img/` | Sépare radicalement le *contenu déployé par le dev* du *contenu créé par le client*. Un déploiement manuel ne pourra donc jamais écraser les photos (cf. R3). |
| **Mot de passe stocké haché** (`password_hash`, bcrypt) dans `assets/php/config-admin.php`, **fichier gitignoré** | §17.5 : aucun secret dans le dépôt. **Je ne manipule jamais le mot de passe en clair** : JP le choisit et génère le hash lui-même (commande fournie en §7). Un `config-admin.example.php` est commité comme modèle. |
| **Session PHP**, cookie `HttpOnly` + `Secure` + `SameSite=Strict`, régénérée à la connexion | §17.3. Pas de jeton en `localStorage`. |
| **Limitation de débit** : 5 échecs par IP / 15 min, compteur dans un fichier | §17.3. Le formulaire est public, il sera trouvé par des robots. |
| **Noms de fichiers générés aléatoirement** (`random_bytes`), extension `.jpg` forcée | Le nom d'origine est une entrée hostile (traversée de répertoire, double extension `.jpg.php`). |
| **`galerie.html` accessible par un bouton sous la grille de l'accueil + un lien de pied de page**, PAS par le menu principal | Le menu compte déjà 5 entrées et un CTA ; un 6ᵉ item ferait resurgir le chevauchement d'en-tête corrigé le 28/07 entre 380 et 480 px. Décision réversible. |
| **`admin.html` en `noindex`** + `Disallow` dans `robots.txt`, hors `sitemap.xml` | Ne pas exposer la page dans les moteurs. Ce n'est pas une mesure de sécurité (elle repose sur le mot de passe), c'est de l'hygiène. |
| **Redirection HTTP → HTTPS + HSTS avant toute chose** (option A) | Constaté le 28/07 : `http://adosdarts.fr` répond `200` **sans redirection**. Un mot de passe saisi sur `http://` voyagerait en clair, et le cookie `Secure` ne partirait pas. Bloquant. |
| **En-têtes de sécurité en `.htaccess`** (option C) | Dette identifiée dans le README depuis la sortie de GitHub Pages. Aucun en-tête n'est posé aujourd'hui (vérifié en production). |

### 3.3 Identification de l'auteur d'une publication (option B+)

**Demande :** savoir qui publie, sans que ce nom sorte jamais en production, et sans le redemander à chaque fois.

**Écarté — lier le nom à l'IP.** L'IP n'identifie pas une personne :
- *même personne → IP changeantes* : en 4G l'IP change au déplacement, une box en reprend une autre à chaque redémarrage → on redemanderait le nom sans arrêt ;
- *personnes différentes → même IP* : le partage d'adresse opérateur (CGNAT) place des milliers d'abonnés mobiles derrière une seule IP ; deux personnes sur le même wifi sont indistinguables → attribution erronée.

**Retenu — lier le nom au navigateur**, par un cookie de longue durée (1 an, `HttpOnly` + `Secure` + `SameSite=Strict`) posé par le serveur à la première publication. L'IP peut changer, le nom suit.

- Première publication depuis un appareil → champ « Qui publie ? » obligatoire (2 à 40 caractères).
- Ensuite → « Tu publies en tant que **X** · *changer* », plus aucune question.
- Repli (cookie effacé, navigation privée, autre appareil) → on redemande, sans jamais bloquer.
- Les noms déjà utilisés sont proposés en `datalist` pour éviter « Marie » / « marie » / « Marie D. ».

**Limites énoncées, pas contournées :** c'est une **étiquette de confort, pas une preuve** — la personne saisit le nom qu'elle veut, et la serrure reste unique pour tout le monde. Et c'est **par appareil** : téléphone et ordinateur demanderont le nom une fois chacun.

**Cloisonnement des données — cœur de la consigne :**

| Fichier | Contenu | Servi au public |
|---|---|---|
| `assets/uploads/galerie.json` | nom de fichier, dimensions, date | **Oui** — aucun nom de personne, jamais |
| `assets/uploads/journal.jsonl` | horodatage, action, auteur, IP, fichier | **Non** — accès web refusé par `.htaccess`, lisible uniquement à travers l'admin connectée |

L'admin rapproche les deux à l'affichage (jointure sur le nom de fichier). Le nom n'entre à aucun moment dans ce que télécharge un visiteur.

**RGPD :** ce journal contient des données personnelles (nom + IP). Donc — minimisation (rien d'autre n'est collecté), **purge automatique des entrées de plus de 12 mois** à chaque écriture, aucune exposition publique, et pas de bannière cookie sur l'admin (cookie strictement nécessaire à un service demandé par la personne, derrière authentification).

### 3.4 Écart assumé au référentiel

`2.BonnesPratiques.md` §17.6 proscrit le « téléversement de fichiers sans vérification de type réel, de taille, et **sans stockage hors de la racine web** ».

Le stockage hors racine web est **inapplicable ici** : ces fichiers ont vocation à être servis publiquement comme images. Un service via un script PHP relais serait plus lent, casserait le cache navigateur et ajouterait une surface d'attaque pour un gain nul.

L'intention de la règle (empêcher l'exécution d'un fichier téléversé) est satisfaite autrement, en défense en profondeur :
1. type réel vérifié par `getimagesize()` (pas la seule extension, pas le seul `Content-Type` déclaré) ;
2. taille plafonnée côté serveur ;
3. nom aléatoire, extension `.jpg` forcée ;
4. `.htaccess` dans `assets/uploads/` : `php_flag engine off` + refus d'exécution de tout handler.

C'est le seul écart au référentiel de ce chantier ; il est tracé ici.

---

## 4. Points de risque (pré-mortem)

> « Nous sommes dans deux semaines, la fonctionnalité est un échec. Que s'est-il passé ? »

| # | Risque | Prob. | Impact | Parade |
|---|---|---|---|---|
| **R1** | Ionos interdit l'écriture disque ou plafonne le téléversement plus bas que prévu → rien ne s'enregistre | Moyenne | Élevé | Aucune extension PHP requise ; **panneau de diagnostic intégré à l'admin** qui tente réellement une écriture et affiche `upload_max_filesize` / `post_max_size` ; message d'erreur serveur explicite au lieu d'un échec muet |
| **R2** | Le mot de passe est trouvé par force brute → n'importe qui publie des images sur le site | Moyenne | Élevé | bcrypt + limitation de débit + message non discriminant + consigne de mot de passe long. Le fichier de config est hors dépôt. |
| **R3** | **Un déploiement manuel futur écrase le dossier des photos** → tout le contenu client disparaît | Moyenne | **Critique** | `assets/uploads/` gitignoré, absent de tout paquet de déploiement, et **règle écrite dans `PROCESS-mise-en-ligne.md`**. Le `galerie.json` initial n'est déposé **que s'il n'existe pas**. |
| **R4** | Un fichier PHP déguisé en image est téléversé et exécuté | Faible | Critique | Quadruple parade §3.4 |
| **R5** | Photos très lourdes → page d'accueil de 30 Mo | Élevée sans parade | Moyen | Redimensionnement navigateur à 1600 px + `loading="lazy"` + `width`/`height` sur chaque image (pas de décalage de mise en page) |
| **R6** | Métadonnées EXIF (GPS du domicile) publiées avec les photos | Élevée sans parade | Moyen (RGPD) | Le passage par `<canvas>` régénère l'image sans EXIF |
| **R7** | Le `fetch()` de `galerie.json` échoue (404 avant le premier upload) → grille cassée / erreur console | Élevée | Faible | 404 et JSON invalide traités comme « galerie vide » → les 4 cases pointillées actuelles restent affichées |
| **R8** | Photo d'un mineur publiée sans autorisation | Réelle (festival, public jeune) | Juridique | Hors de ma portée technique : **rappel du droit à l'image affiché dans la page d'admin**, avant le bouton de publication |
| **R9** | Publication accidentelle → impossible de retirer | Moyenne | Moyen | La suppression est dans le périmètre, avec confirmation explicite |
| **R10** | Double clic / double soumission → photo publiée deux fois | Élevée | Faible | Bouton désactivé pendant l'envoi + état d'envoi visible |
| **R11** | **Mot de passe saisi sur `http://` → transmis en clair** (constaté : aucune redirection en production) | Élevée sans parade | **Critique** | Option A : redirection 301 vers HTTPS + HSTS, **posée avant la mise en ligne de l'admin** |
| **R12** | Le journal (noms + IP) devient lisible publiquement → fuite de données personnelles | Moyenne | Élevé (RGPD) | `.htaccess` refusant tout ce qui n'est pas une image dans `assets/uploads/`, **vérifié en ligne par une requête directe sur le fichier** |
| **R13** | Le `.htaccess` de durcissement provoque une erreur 500 selon le mode d'exécution PHP d'Ionos (module vs FastCGI) | Moyenne | Moyen | Écrire la forme robuste (`RemoveHandler` + `Require all denied` sur les non-images) plutôt que `php_flag engine off` ; tester la page juste après dépôt, retour arrière = supprimer le fichier |
| **R14** | Le cookie d'identification est effacé → on redemande le nom, la personne croit à un bug | Élevée | Négligeable | Le champ réapparaît avec un libellé explicite, sans jamais bloquer la publication |

---

## 5. Approche technique

### 5.1 Modèle de données

`assets/uploads/galerie.json` — écrit par PHP, lu par le site :

```json
{
  "photos": [
    { "fichier": "a3f9c2b1d4e5f607.jpg", "largeur": 1600, "hauteur": 1067, "ajoutee": "2026-07-28T21:14:03+02:00" }
  ]
}
```

- Ordre du tableau : **le plus récent en premier** (insertion en tête).
- `largeur`/`hauteur` sont stockées pour poser les attributs `width`/`height` en HTML → pas de décalage de mise en page au chargement.
- **Aucune donnée personnelle** : pas de nom d'auteur, pas d'IP. Ce fichier est servi à tous les visiteurs.
- Aucune valeur calculable n'est dupliquée (l'URL se déduit du nom).

`assets/uploads/journal.jsonl` — **privé**, une ligne JSON par événement, jamais servi au public :

```
{"date":"2026-07-28T21:14:03+02:00","action":"publication","auteur":"Marie","ip":"…","fichier":"a3f9c2b1d4e5f607.jpg"}
{"date":"2026-07-28T21:19:47+02:00","action":"connexion-echouee","auteur":null,"ip":"…","fichier":null}
```

- Format « une ligne par entrée » : ajout en fin de fichier, pas de relecture-réécriture complète.
- **Purge automatique des entrées de plus de 12 mois** à chaque écriture (minimisation RGPD).
- Actions journalisées : `connexion`, `connexion-echouee`, `publication`, `suppression`.
- **Jamais de mot de passe journalisé**, même erroné (§12.3).

### 5.2 Contrat de l'API (`assets/php/admin-api.php`, POST uniquement)

| `action` | Entrée | Sortie | Codes |
|---|---|---|---|
| `login` | `motdepasse` | `{ok, message}` | 200 / 401 / 429 |
| `logout` | — | `{ok}` | 200 |
| `etat` | — | `{ok, connecte, auteur, diagnostic:{…}, photos:[…], auteursConnus:[…]}` | 200 |
| `upload` | fichier `photo`, `jeton`, `auteur` (si cookie absent) | `{ok, photo:{…}}` | 201 / 401 / 413 / 415 / 422 / 500 |
| `supprimer` | `fichier`, `jeton` | `{ok}` | 200 / 401 / 404 |
| `journal` | `page` | `{ok, entrees:[…]}` | 200 / 401 |

`auteur` et le contenu du journal ne sont renvoyés **que si la session est valide**. Le fichier
`galerie.json` servi au public ne les contient jamais.

Toute action hors `login`/`etat` exige une session valide **et** le jeton anti-CSRF de session. Refus par défaut (§17.1). Erreurs au bon code HTTP, jamais un `200` porteur d'erreur (§12.1).

### 5.3 Fichiers touchés

**Créés**
```
admin.html                        Connexion + tableau de bord (une page, deux états)
galerie.html                      Galerie publique complète
assets/css/admin.css              Styles propres à l'admin (tokens réutilisés)
assets/js/boot-admin.js           Point d'entrée de l'admin
assets/js/admin.js                Connexion, redimensionnement canvas, upload, suppression
assets/js/galerie.js              Rendu de la grille (accueil + page galerie)
assets/js/boot-galerie.js         Point d'entrée de galerie.html
assets/php/admin-api.php          API : login / logout / etat / upload / supprimer
assets/php/config-admin.example.php   Modèle commité (hash à remplacer)
assets/php/config-admin.php       Hash réel — GITIGNORÉ, généré par JP
assets/uploads/.htaccess          Interdiction d'exécution + refus de tout ce qui n'est pas une image
.htaccess (racine)                Options A + C : redirection HTTPS, HSTS, CSP, nosniff, frame-ancestors
```

**Modifiés**
```
index.html            Grille dynamique + bouton « Voir toutes les photos »
assets/js/boot-index.js   Branchement de galerie.js
assets/js/layout.js   Lien « Galerie » dans le pied de page (menu principal inchangé)
assets/css/pages.css  Ajouts galerie (bouton, état vide) — pas de refonte
robots.txt            Disallow /admin.html
sitemap.xml           Ajout de galerie.html
.gitignore            assets/uploads/ + assets/php/config-admin.php
README.md             Section galerie/admin
PROCESS-mise-en-ligne.md   Règle « ne jamais téléverser assets/uploads/ »
```

**Réutilisé sans le dupliquer** : tokens et composants CSS existants (`.gallery`, `.btn`, `.field`, `.form-status`), `assets/js/sanitize.js`, le motif de réponse JSON/HTML de `envoi-contact.php`, le motif de validation accessible de `forms.js`.

### 5.4 Découpage en tranches (vertical, risque décroissant)

| # | Tranche | Vérifiable par | Estim. |
|---|---|---|---|
| 0 | **Option A — HTTPS forcé + HSTS** en `.htaccess` racine | `curl -I http://adosdarts.fr` renvoie un `301` vers `https://` (en ligne) | 0 h 30 |
| 1 | **Squelette de bout en bout** : `admin-api.php` (login + diagnostic d'écriture réelle), `admin.html` connexion | Se connecter en local, voir le diagnostic serveur | 1 h 30 |
| 2 | **Upload + identification (B+)** : redimensionnement canvas, champ « Qui publie ? », cookie d'auteur, écriture du JSON | Téléverser une photo, la voir apparaître ; recharger → le nom n'est plus demandé | 2 h |
| 3 | **Affichage public** : `galerie.js`, grille accueil (8 dernières), `galerie.html` | La photo de la tranche 2 apparaît sur l'accueil et la galerie, **sans aucun nom d'auteur** | 1 h 30 |
| 4 | **Suppression + journal (B)** : liste, confirmation, `journal.jsonl`, purge 12 mois, onglet journal dans l'admin | Supprimer une photo, retrouver les deux événements datés et signés dans le journal | 1 h 30 |
| 5 | **Durcissement (C) & recette** : en-têtes serveur, `.htaccess` des uploads, robots/sitemap, responsive 320→1280, clavier, console, doc, paquet de déploiement | Checklist §6 intégralement | 2 h |

**Estimation : entre 7 h et 11 h** (décomposé 9 h × 1,25 — inconnue Ionos non levée).

Ordre volontaire : la tranche 0 lève le risque critique R11 **avant** qu'un mot de passe circule ;
la tranche 1 éprouve la capacité d'écriture d'Ionos (R1) avant qu'on ait construit dessus.

### 5.5 Plan de repli

- Retrait complet = supprimer `admin.html`, `galerie.html`, `assets/php/admin-api.php` sur le serveur, et remettre la version précédente d'`index.html`. **Moins de 5 minutes**, sauvegarde préalable exigée dans les instructions de déploiement.
- Les photos déjà téléversées survivent à un retrait du code (dossier `assets/uploads/` intact).
- Côté dépôt : le travail se fait sur une branche dédiée, `git revert` possible.

---

## 6. Checklist

### 6.1 Demandes du client

- [x] Les réceptacles photo de l'accueil sont localisés et documentés (§0)
- [x] `admin.html` existe et demande un mot de passe avant tout accès aux fonctions
- [x] Un mot de passe correct ouvre le tableau de bord ; un mot de passe faux ne dit pas pourquoi
- [x] Un utilisateur connecté peut téléverser une ou plusieurs photos et les voir apparaître
      (constaté : 3000 × 2000 / 241 Ko → 1600 × 1067 / 29 Ko, ratio conservé)
- [x] Un utilisateur connecté voit la liste des photos en ligne et peut en supprimer une
      (confirmation en deux temps ; fichier réellement effacé du disque, index et journal cohérents)
- [x] Un utilisateur **non connecté** qui appelle directement l'API se fait refuser (testé à la main :
      `POST action=upload` sans session → 401, sans avoir eu besoin de connaître l'existence de l'action)
- [x] La grille « En images » de l'accueil affiche les **8 photos les plus récentes**
      (limite posée dans `boot-index.js` ; lien « Voir toutes les photos » révélé au-delà)
- [x] `galerie.html` affiche **toutes** les photos, avec le compteur
- [x] Aucune photo publiée ne contient de métadonnées EXIF — vérifié sur le fichier réel
      publié via le navigateur : `SectionsFound` vide, aucune section GPS/Make/Model
- [x] **(A)** `http://adosdarts.fr` **et** `http://www.adosdarts.fr` redirigent en `301` vers `https://` — *les deux constatés en ligne le 03/08/2026*
- [x] **(B)** Le journal enregistre connexions, échecs, blocages, publications et suppressions
      (21 entrées constatées, horodatées, ordre antéchronologique)
- [x] **(B)** Le journal est consultable depuis l'admin — **inaccessible par URL : à constater en ligne**,
      `php -S` ignorant les `.htaccess` (il répond 200 en local, cf. §6.5)
- [x] **(B+)** Le nom est demandé à la 1ʳᵉ publication, puis plus jamais sur le même navigateur
- [x] **(B+)** Le nom n'apparaît **dans aucun fichier servi au public** — `galerie.json` relu :
      il ne contient que `fichier`, `largeur`, `hauteur`, `ajoutee`. Le nom n'est que dans `journal.jsonl`
- [x] **(B+)** Le bouton « changer » redonne la main sur le nom, focus placé sur le champ
- [x] **(C)** En-têtes présents dans la réponse HTTP réelle — *relevés le 03/08/2026 : `Strict-Transport-Security: max-age=86400`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, la CSP complète et `X-Frame-Options: DENY`*

### 6.2 Référentiel — `2.BonnesPratiques.md`

- [x] §17.3 Mot de passe haché (bcrypt coût 12), jamais en clair, jamais dans le dépôt
- [x] §17.3 Session en cookie `HttpOnly` + `SameSite=Strict`, régénérée à la connexion
      — `HttpOnly` **prouvé** (`document.cookie` vide une fois connecté) ; `Secure` est
      conditionné à HTTPS et ne peut être constaté qu'en ligne (cf. §6.5)
- [x] §17.3 Limitation de débit effective sur la connexion (constaté : essais 1-5 → 401,
      6ᵉ → 429, et le **bon** mot de passe est refusé pendant le blocage)
- [x] §17.3 Message d'erreur non discriminant
- [x] §17.1 Contrôle d'accès côté serveur sur **chaque** action, refus par défaut
- [x] §17.6 Type réel vérifié, taille plafonnée, nom aléatoire — **éprouvé par 5 attaques** :
      fichier PHP renommé `.jpg` → 415 · en-tête JPEG valide + code PHP collé derrière → 415 ·
      suppression par traversée `../../index.html` → 422 · suppression d'un fichier non
      référencé dans l'index → 404 · appel du journal sans session → 401
- [x] §17.3 Jeton anti-CSRF exigé sur publication et suppression (upload sans jeton → 403)
- [ ] §17.6 Exécution PHP neutralisée dans le dossier de téléversement (écart §3.4 tracé)
- [x] §17.2 Aucune donnée injectée en `innerHTML` — vérifié par recherche sur `admin.js`,
      `galerie.js` et les deux `boot-*` : aucune occurrence de `innerHTML`, `insertAdjacentHTML`,
      `outerHTML` ni `eval`. Tout est construit en `createElement` / `textContent`
- [x] §12.1 Codes HTTP justes ; aucune erreur renvoyée en `200` (constaté : 405 / 401 / 429 / 403)
- [x] §12.2 Toute entrée validée côté serveur — éprouvé par les 5 attaques ci-dessus,
      toutes menées **en contournant l'interface** (appels directs en `curl`)
- [x] §12.3 Aucun mot de passe journalisé (même erroné) — journal relu ligne à ligne après les
      7 tentatives de force brute ; le caractère inatteignable du journal reste à constater en ligne
- [x] RGPD : purge automatique du journal — **testée avec deux entrées antidatées** : celle de
      400 jours a été supprimée à l'écriture suivante, celle de 100 jours conservée
- [x] §14 Formulaires étiquetés : les 3 champs ont un `<label for>` et un `aria-describedby`,
      4 régions `aria-live`, un seul `<h1>` et hiérarchie de titres sans saut de niveau (h1→h2→h3)
- [x] Aucun chemin absolu commençant par `/` (règle projet) — seule exception : `Disallow: /admin.html`
      dans `robots.txt`, où la syntaxe du format l'impose
- [x] Aucune dépendance tierce ajoutée, aucun CDN (CSP `script-src 'self'`)

### 6.3 Référentiel — `1.Regles.md`

- [x] Tous les espacements pris dans l'échelle de tokens — vérifié par recherche : aucune valeur
      de `margin`/`padding`/`gap` en dur dans `admin.css`. Les seuls `px` restants sont des
      épaisseurs de bordure (1-2 px), conformes à l'usage déjà en place dans `components.css`
- [x] Espace inter-groupe > intra-groupe : label↔champ `space-2xs` (8 px), aide collée au champ,
      puis `space-lg` (32 px) avant le groupe suivant — ratio 4:1
- [x] Cibles tactiles ≥ 44 px — mesuré à 375 px sur **tous** les boutons, liens et labels de
      la page : plus aucune cible sous 44 px (le lien de marque, à 40 px, a été corrigé)
- [x] Gouttières présentes à tous les breakpoints, rien ne colle au bord (320 / 375 / 640 / 1280)
- [x] Zoom 200 % sans casse (éprouvé à 640 × 450, équivalent d'un 1280 zoomé ×2)

### 6.4 Vérification humaine réelle (phase 3.2)

- [x] 320 / 375 / 640 / 1280 px : aucun débordement, aucun scroll horizontal (mesuré par
      `scrollWidth > innerWidth`, pas jugé à l'œil), grille de photos comprise.
      Le tableau du journal défile **dans sa propre boîte**, jamais la page
- [x] Console vide, aucune 404 sur la page d'administration
- [x] État **vide** : index absent (404) → les 4 cases pointillées reviennent, **aucune erreur console**
- [x] État **chargement** : « réduction… » puis « envoi… » par photo, puis « publiée ✓ »
- [x] État **erreur** : serveur injoignable simulé → « Le serveur est injoignable. Vérifiez votre
      connexion. » par photo + bilan global, formulaire **réactivé** (non figé)
- [x] Double clic sur « Publier » ne crée pas deux photos (bouton et champ verrouillés pendant l'envoi)
- [x] Fichier non-image renommé en `.jpg` → refusé (415)
- [x] Navigation clavier complète sur l'admin, focus visible partout : ordre de tabulation correct
      (lien d'évitement en premier), focus visible mesuré à 3 px, focus déplacé au titre après
      connexion, au champ après déconnexion, sur « Oui, supprimer » à la confirmation et rendu
      au bouton d'origine après annulation
- [x] Textes alternatifs présents sur toutes les images publiées
- [x] Le rappel du droit à l'image est visible juste avant le bouton « Publier » (R8)

### 6.5 Ce que je ne pourrai pas vérifier moi-même

À énoncer au client, pas à supposer (`PROCESS-mise-en-ligne.md` §4) :

- [ ] Écriture disque réellement autorisée par Ionos → **premier accès à l'admin en ligne**
- [ ] `upload_max_filesize` / `post_max_size` réels → affichés par le diagnostic en ligne
- [ ] Comportement des cookies `Secure` — session et auteur (impossible à éprouver en `http://localhost`)
- [ ] Prise en compte du `.htaccess` **du dossier de téléversement** — *`journal.jsonl` répond bien `403` en ligne, mais ce n'est pas une preuve isolante : le `.htaccess` de la racine refuse déjà les `.jsonl`. Départageable seulement après la première photo publiée.*
- [x] Effet réel de la redirection HTTPS et des en-têtes — *vérifié en ligne, aucune erreur 500 : le `.htaccess` est bien pris en compte par l'Apache d'Ionos*

---

## 7. Dépendance externe — à faire par JP (à demander maintenant, §14.1)

Le mot de passe ne doit **jamais** transiter par moi ni par le dépôt. JP le choisit et génère lui-même le hash :

```bash
php -r 'echo password_hash(readline("Mot de passe : "), PASSWORD_DEFAULT), "\n";'
```

La chaîne obtenue (commençant par `$2y$`) est à coller dans `assets/php/config-admin.php`, déposé **uniquement sur le serveur**. Consigne : 4 mots aléatoires ou 16 caractères minimum — c'est la seule barrière entre Internet et la publication d'images sur le site.

---

## 8. Journal d'avancement

| Date | Tranche | État |
|---|---|---|
| 28/07/2026 | Cadrage | Plan rédigé |
| 28/07/2026 | Cadrage — v2 | Options A+B+C retenues, identification de l'auteur par cookie (et non par IP) ajoutée. Constat production : aucune redirection HTTPS (R11). Feu vert donné |
| 28/07/2026 | **Tranche 0 — faite** | `.htaccess` racine (HTTPS + HSTS prudent à 1 jour + CSP/nosniff/frame-ancestors) et `.htaccess` du dossier de téléversement. Syntaxe validée par `httpd -t` (« Syntax OK »), comportement réel à constater en ligne |
| 28/07/2026 | **Tranche 1 — faite** | API (`etat`/`login`/`logout`), page de connexion, diagnostic serveur, journal, limitation de débit. Recette locale complète, console vide |
| 29/07/2026 | **Tranches 2 à 5 — faites** | Publication (redimensionnement navigateur, identification de l'auteur), suppression avec confirmation, journal consultable, galerie publique (accueil + `galerie.html`), durcissement, documentation. Recette locale complète |
| 29/07/2026 | Mot de passe | Réglé à la demande explicite de JP, qui a choisi la valeur et assumé le risque de la transmettre. Le hachage est dans `assets/php/config-admin.php` (gitignoré) |
| 29/07/2026 | **Bug trouvé en recette** | Le champ « Qui publie ? » s'affichait EN MÊME TEMPS que « Vous publiez en tant que… ». Cause : l'attribut `hidden` est écrasé par le `display: flex` de `.field`. Corrigé par `.admin-panneau .field[hidden] { display: none }`. Les 7 autres éléments masqués de la page ont été revus : tous couverts |
| 29/07/2026 | Bug trouvé en recette | Le bouton natif du `<input type="file">` s'affichait sans libellé (pastille vide). Remplacé par un couple `<label>` + input masqué mais focusable, qui affiche en plus le nombre de photos choisies |
| 29/07/2026 | Incident de recette | Une session tierce (auteur « test ») a publié et supprimé des photos pendant mes tests, depuis le même navigateur de prévisualisation. Sans conséquence — et le **journal a permis de le reconstituer en une lecture**, ce qui valide l'option B au passage |
| 28/07/2026 | Découverte en tranche 1 | `upload_max_filesize` = 2 Mo en local, **sous** la limite applicative de 3 Mo prévue au plan. Corrigé : la limite effective est désormais le minimum des trois plafonds, et le diagnostic affiche laquelle s'applique. Sans ça, un fichier de 2,5 Mo aurait été rejeté par PHP avant d'atteindre le script — panne muette |
| 03/08/2026 | **Paquet de déploiement prêt** | 21 fichiers, 7 étapes, dans `Dépôt des sites dans ionos/adosdarts.fr/2026-08-03-admin-photos/`. Ordre imposé : `.htaccess` racine en premier (R11, arrêt et vérification en ligne avant la suite), `.htaccess` du dossier de téléversement avant la première photo (R12), pages non liées au site avant leur JS, `index.html` en dernier. **Exclus du paquet à la main** : `assets/uploads/` (photos, index et journal de mes tests locaux) et `config-admin.example.php` — le script de comparaison les avait embarqués, comme annoncé dans `PROCESS-mise-en-ligne.md` §7 |
| 03/08/2026 | **Déployé** | JP a déposé les 7 étapes dans la journée. Vérifié en ligne par comparaison fichier par fichier : les 13 fichiers du chantier sont **identiques au serveur**. Options A et C **confirmées en production**. L'API répond (`POST action=etat` → `{"ok":true,"connecte":false}`), le contrôle d'origine accepte l'apex et le `www.` et **refuse une requête sans origine (403)** — chemin jamais éprouvable en local, où il est neutralisé. Reste suspendu à la première connexion de JP : l'écriture disque et les limites réelles de téléversement |
