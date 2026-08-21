# Process de mise en ligne — Adod'arts

> Note de référence pour toute session de travail future sur ce projet.
> Écrite le 28/07/2026, à l'occasion du premier déploiement sur Ionos.
> **À relire avant toute modification destinée à partir en production.**

---

## 1. Où vit le site (état au 28/07/2026)

| | |
|---|---|
| **Domaine de production** | `https://adosdarts.fr` — et `https://www.adosdarts.fr` répond aussi, **sans redirection** (les deux hôtes servent le site directement) |
| **Hébergement** | Ionos, offre mutualisée, serveur **Apache**, PHP disponible |
| **Racine web sur le serveur** | `/adosdart/` (attention : **sans « s »**, contrairement au domaine) |
| **Dépôt Git** | `git@github.com:jgrewis/adosdarts.git` |
| **Déploiement** | **Manuel**, par le gestionnaire de fichiers Ionos. Pas de CI, pas de FTP automatisé, pas de `git pull` côté serveur |

> ⚠️ **Le site n'est plus sur GitHub Pages.** Toute documentation ou mémoire évoquant
> `jgrewis.github.io/adosdarts` est périmée. Conséquence concrète : les en-têtes HTTP
> personnalisés (CSP, X-Frame-Options…) et **le PHP côté serveur sont désormais possibles**,
> alors qu'ils étaient impossibles avant.

---

## 2. La règle qui structure tout : Git n'est pas le déploiement

Le dépôt et le serveur sont **deux mondes séparés**. Committer ne met rien en ligne.
Téléverser ne commit rien. Les deux doivent être faits, et ils peuvent diverger sans bruit.

**Conséquence pratique, à appliquer systématiquement :**

> Ne jamais déduire l'état du site en ligne de l'état du dépôt local.
> **On va le vérifier.**

### Comment vérifier l'écart réel (à faire au début de toute session de déploiement)

Le skill **`mise-en-ligne-ionos`** automatise entièrement cette étape (dire « on déploie » ou
« mets en ligne » le déclenche). Il s'appuie sur ce document comme fichier de configuration.
Son script parcourt **tous** les fichiers déployables — pas une liste écrite à la main, qui
finit toujours par oublier un fichier :

```bash
~/.claude/skills/mise-en-ligne-ionos/scripts/comparer-avec-serveur.sh adosdarts.fr . /tmp/paquet
```

Il classe chaque fichier en **à mettre à jour** / **absent du serveur** / **déjà identique**,
constitue le paquet des seuls fichiers divergents et vérifie sa conformité.
Sur ce projet : ~108 fichiers comparés en une vingtaine de secondes.

À défaut, la version manuelle sur quelques fichiers :

```bash
for f in index.html contact.html assets/js/layout.js assets/css/layout.css; do
  curl -s -o /tmp/live_check "https://adosdarts.fr/$f"
  diff -q "$f" /tmp/live_check >/dev/null 2>&1 \
    && echo "IDENTIQUE          $f" \
    || echo "A METTRE A JOUR    $f"
done
```

Cette boucle a évité, le 28/07/2026, de faire re-téléverser **13 fichiers** au client alors
que **4 seulement** avaient réellement divergé : la bascule de domaine
(`github.io` → `adosdarts.fr`) était déjà en ligne mais toujours non commitée en local.

**Le piège à connaître :** `git status` peut afficher des fichiers modifiés qui sont **déjà
déployés**. L'inverse est vrai aussi. Seule la comparaison avec le serveur fait foi.

---

## 3. Ce qu'on livre au client, et sous quelle forme

Le client déploie **à la main, via une interface web**. Le livrable doit donc être conçu pour
ça, pas pour un développeur :

1. **Un dossier par destination, numéroté, avec le chemin de destination écrit dans son nom.**
   Exemple : `ETAPE-1--a-deposer-a-la-racine--adosdart/`,
   `ETAPE-2--a-deposer-dans--adosdart-assets-data/`.

   > *Évolution du 03/08/2026 :* ce document préconisait auparavant de **reproduire
   > l'arborescence du serveur**. Abandonné : le gestionnaire de fichiers Ionos ne permet pas
   > le glisser-déposer de dossiers entiers, ce qui obligeait le client à traduire mentalement
   > une arborescence en chemin — exactement le moment où l'on se trompe de dossier.
   > Le nom du dossier EST désormais l'instruction.
2. **Uniquement les fichiers qui ont réellement changé.** Un fichier inutile téléversé est un
   risque d'écrasement d'une correction faite ailleurs, et du temps perdu.
3. **Un `LISEZ-MOI-instructions.md`** contenant, dans cet ordre :
   - la sauvegarde préalable des fichiers qui vont être écrasés (non négociable) ;
   - une étape de vérification de l'environnement **avant** de tout déployer ;
   - le tableau fichier → destination ;
   - les tests de recette, formulés comme des observations concrètes ;
   - la procédure de retour arrière ;
   - **ce que je n'ai pas pu vérifier moi-même**, dit explicitement.

---

## 3 bis. Envoi de mail chez Ionos — contraintes constatées

> Établi le 28/07/2026, **après** que tous les envois du formulaire ont échoué en production.
> Détail complet et checklist : `~/.claude/skills/mise-en-ligne-ionos/references/ionos-specificites.md`

- **`mail()` exige l'expéditeur d'enveloppe** en 5ᵉ paramètre : `mail(..., '-f' . $expediteur)`.
  Sans lui, Ionos refuse le message et `mail()` renvoie `false`. Cause n°1 d'un formulaire muet.
- **L'adresse d'expédition doit être une boîte réelle du domaine** (MX du domaine :
  `mx00/mx01.ionos.fr`). Une adresse `no-reply@` inexistante se fait rejeter ou spammer.
  On utilise `contact@adosdarts.fr` en `From`, et le visiteur en `Reply-To`.
- **Les en-têtes n'acceptent pas l'UTF-8 brut** : sujet et nom d'expéditeur doivent être encodés
  en base64 (RFC 2047). « [Bénévole] … » non encodé peut faire rejeter le message.
- **Le test local ne prouve rien** : macOS accepte tous les envois, `mail()` y renvoie `true`
  même quand rien ne part.

**La leçon de fond, valable au-delà du mail :** le fichier de vérification déposé avant le
déploiement testait `function_exists('mail')`, qui répond « oui » sur un serveur d'où aucun mail
ne peut sortir. **Un test de présence ne prouve rien ; seul un test de bout en bout prouve
quelque chose.** Avant de bâtir sur une capacité serveur, on tente réellement l'opération.

---

## 4. Ce qui n'est pas vérifiable depuis l'environnement de développement

À énoncer au client au lieu de l'enrober ou de le supposer :

| Sujet | Pourquoi ce n'est pas vérifiable ici | Qui vérifie |
|---|---|---|
| **Livraison réelle des e-mails** | `mail()` en local n'envoie rien ; aucun accès à la boîte `contact@adosdarts.fr` | Le client, en recevant un vrai message (**et en regardant le dossier spam**) |
| **Version de PHP / `mail()` activé** | Dépend de la configuration Ionos | Le client, via le fichier de test PHP fourni puis supprimé |
| **Blocage des requêtes d'origine étrangère** | Le contrôle est neutralisé sous `php -S` (serveur de dev) | Constatable seulement en ligne |
| **En-têtes HTTP réels** | Le serveur de dev n'a pas la configuration Apache d'Ionos | À tester en ligne |

> Le mot d'ordre : **« je ne peux pas le vérifier » se dit, ne se contourne pas.**
> Un test présenté comme concluant alors qu'il ne prouve rien coûte bien plus cher
> qu'un point ouvert annoncé franchement.

---

## 5. Vérifier une modification avant de la livrer

Le site étant statique, on le sert en local et on regarde vraiment dans le navigateur :

```bash
php -S localhost:8765          # obligatoire si du PHP est impliqué
# ou, si le PHP n'est pas concerné :
python3 -m http.server 8765
```

> ⚠️ `python3 -m http.server` **n'exécute pas le PHP** : il renvoie le code source du script.
> Dès qu'un formulaire ou un `.php` est dans la boucle, c'est `php -S`.

Points de contrôle systématiques, **constatés, jamais supposés** :

- Largeurs 320 / 375 / 428 / 768 / 1280 px — et **les largeurs charnières juste autour des
  `@media`** : c'est là que les bugs de mise en page se cachent (le chevauchement de l'en-tête
  du 28/07/2026 n'apparaissait qu'entre 380 et 480 px, invisible aux tailles rondes habituelles).
- Console navigateur vide, aucune ressource en 404.
- Le parcours complet de la fonctionnalité, du premier clic jusqu'au résultat.

**Mesurer plutôt que juger à l'œil.** Pour un chevauchement, une capture d'écran peut tromper
(polices, échelle) : comparer les positions réelles est sans appel.

```js
// À exécuter dans la console du navigateur
const a = document.querySelector('.brand').getBoundingClientRect();
const b = document.querySelector('.nav-toggle').getBoundingClientRect();
console.log({ chevauchement: a.right > b.left, largeur: window.innerWidth });
```

---

## 6. Après le déploiement : refermer la boucle

Une fois le client confirmé que tout fonctionne en ligne :

1. **Committer** le travail (il ne l'est pas automatiquement — cf. §2).
2. **Mettre à jour le `README.md`** s'il décrit encore l'état antérieur.
3. **Mettre à jour la mémoire projet** si l'hébergement, le domaine ou la méthode de
   déploiement ont changé — une mémoire périmée oriente une session future dans le mur.
4. Cocher la checklist du `PLAN-*.md` correspondant, **en distinguant ce qui a été vérifié
   par moi de ce qui l'a été par le client**.

---

## 7. Rappels spécifiques à ce projet

- **Aucun chemin absolu commençant par `/`.** Tous les chemins sont relatifs. La règle datait
  du sous-chemin GitHub Pages ; elle reste appliquée par cohérence et pour la portabilité.
- **Pas de CDN** : la CSP impose `script-src 'self'`. Toute bibliothèque tierce est copiée
  dans `assets/vendor/` avec sa licence.
- **Pas de build, pas de `package.json`.** HTML/CSS/JS vanilla, lisible par toute l'équipe.
  Ne pas introduire d'outillage sans arbitrage explicite du client.
- **L'en-tête et le pied de page sont générés par `assets/js/layout.js`** — un seul endroit à
  modifier, mais toute correction de structure d'en-tête passe par ce fichier **et** par
  `assets/css/layout.css`. Les deux se déploient ensemble.
- **Le contenu éditorial vit dans `assets/data/*.json`**, pas dans le HTML.

### ⛔ `assets/uploads/` ne se téléverse JAMAIS

Depuis la mise en place de la page d'administration (`admin.html`), ce dossier contient du
contenu **créé par le client sur le serveur** : les photos publiées, l'index `galerie.json`
et le journal `journal.jsonl`.

> **Téléverser ce dossier écrase les photos mises en ligne par le client.**
> Elles n'existent nulle part ailleurs : ni dans Git (le dossier est gitignoré),
> ni en local. La perte serait définitive.

| Fichier | Se déploie ? |
|---|---|
| `assets/uploads/.htaccess` | **Oui** — c'est du code, il est versionné |
| `assets/uploads/galerie.json` | **Non**, sauf s'il n'existe pas encore sur le serveur (premier déploiement) |
| `assets/uploads/*.jpg`, `journal.jsonl`, `.compteur-connexions.json` | **Jamais** |

Même logique pour **`assets/php/config-admin.php`** : il contient le hachage du mot de passe,
n'est pas dans le dépôt, et ne doit être déposé qu'une fois — le réécrire par erreur avec le
modèle `.example` couperait l'accès à l'administration.

> ⚠️ **Correction du 03/08/2026 — l'affirmation précédente de ce document était fausse.**
> Il était écrit ici que « le script de comparaison ne voit pas ces fichiers, ils sont
> gitignorés ». **C'est faux : le script n'utilise pas `.gitignore`**, il parcourt le disque et
> applique sa propre liste d'exclusions. Constaté le 03/08/2026 : le paquet généré
> automatiquement contenait `assets/uploads/aab50f224c2df4db.jpg`, `galerie.json`,
> `journal.jsonl`, `.compteur-connexions.json` **et `assets/php/config-admin.php`**
> (le hachage du mot de passe d'administration).
>
> **Conséquence à appliquer systématiquement :** le paquet produit par le script est un
> point de départ, jamais un livrable. **On relit son contenu fichier par fichier et on
> retire à la main** le dossier `assets/uploads/` et `config-admin.php` avant de livrer quoi
> que ce soit au client.

Et **une copie manuelle de tout le dossier `assets/`** les emporterait tout autant.

---

## 8. État du site en ligne — constaté le 21/08/2026

Relevé par comparaison réelle des fichiers servis par `https://adosdarts.fr` avec les fichiers
locaux (cf. §2), pas par lecture de `git status` : 104 fichiers interrogés par le script, plus
les 10 pages HTML comparées **via leurs URLs propres** (voir l'angle mort signalé plus bas).

> **Le chantier `admin-photos` est intégralement en ligne.** Ce document affirmait le contraire
> jusqu'au 21/08/2026 (« `galerie.html`, `admin.html` : 404 », « `.htaccess` racine : absent ») :
> ces lignes décrivaient l'état du 03/08 **avant** le dépôt, et n'ont jamais été corrigées après.
> Le déploiement a bien eu lieu ; seul le commit manquait. C'est exactement le piège du §2, dans
> son sens le moins attendu : ce n'est pas le serveur qui était en retard sur le local, c'est le
> **dépôt Git** qui était en retard sur les deux.

### Tout est en ligne et à jour

| Ensemble | Constat du 21/08/2026 |
|---|---|
| Les 10 pages (`index`, `contact`, `infos`, `jeu-melodie`, `mentions-legales`, `principe`, `programmation`, `galerie`, `admin`, `404`) | **identiques octet pour octet** au local, HTTP 200 sur leur URL propre |
| URLs sans `.html` | actives : `contact.html` renvoie **302 → `/contact`**, `index.html` → `/` |
| `.htaccess` racine | actif : `http://adosdarts.fr` → **301** vers HTTPS, HSTS (`max-age=86400`), CSP `script-src 'self'`, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy |
| `assets/php/admin-api.php`, `envoi-contact.php` | déployés (**405** sur GET : normal, ils n'acceptent que POST) |
| `assets/php/config-admin.php` | présent et **403** |
| `assets/uploads/journal.jsonl`, `.compteur-connexions.json`, `.htaccess` | **403** — le durcissement du dossier fonctionne |
| Galerie du client | **8 photos publiées** sur le serveur |

### Le seul écart signalé par le script — et pourquoi on n'y touche pas

Le script classe `assets/uploads/galerie.json` en « à mettre à jour » et
`assets/uploads/aab50f224c2df4db.jpg` en « absent du serveur ». **Ce sont des résidus de test
locaux du 29/07**, pas du retard de déploiement. Le `galerie.json` local contient 1 photo, celui
du serveur en contient 8 — celles du client.

> **Les téléverser écraserait les 8 photos publiées.** Elles n'existent ni dans Git ni en local.
> Cet écart est **permanent et attendu** : il réapparaîtra à chaque exécution du script. Ce n'est
> pas un travail à faire, c'est un piège à reconnaître (cf. §7).

### ⚠️ Angle mort du script : les URLs propres

Depuis le déploiement du `.htaccess`, **toutes les pages `.html` répondent 302**. Le script les
range donc en « réponses inattendues » et **ne compare pas leur contenu** — il ne reste que les
fichiers `assets/` dans le décompte des « déjà identiques ».

**Un « 302 » dans le rapport ne veut pas dire « à jour ».** Pour comparer réellement les pages,
il faut suivre la redirection (`curl -sL`) et viser l'URL propre :

```bash
for p in "" contact infos jeu-melodie mentions-legales principe programmation galerie admin 404; do
  f="${p:-index}.html"
  curl -sL -o /tmp/live "https://adosdarts.fr/$p"
  diff -q "$f" /tmp/live >/dev/null 2>&1 && echo "IDENTIQUE  $f" || echo "DIFFERENT  $f"
done
```

### Points ouverts, sans urgence

- **`assets/vendor/LICENCES.md` répond 403** : le `.htaccess` bloque les `.md` sans exception,
  alors que les licences MIT/CC des bibliothèques embarquées demandent qu'il reste consultable.
  À corriger par une exception sur ce chemin précis.
- **Les redirections d'URLs propres sont encore en 302** (temporaire), comme prévu au moment du
  dépôt. Le comportement est constaté correct depuis le 03/08 : le passage en **301** réclamé
  par le référentiel SEO peut être fait, en connaissance de cause (une 301 reste en cache chez
  le visiteur et ne se rattrape pas).
