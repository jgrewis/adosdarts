# Plan — URLs sans extension `.html`

> Document de travail. Créé le 03/08/2026.
> Référentiels appliqués : `1.Regles.md`, `2.BonnesPratiques.md` (§16 SEO technique),
> `3.Planification.md` (§13.3 migration, §14.3 pic exploratoire, §15 repli).
> Déploiement : `PROCESS-mise-en-ligne.md` (Ionos, dépôt **manuel**).

---

## 1. Résumé des demandes

1. Les adresses du site ne doivent plus afficher `.html` : `adosdarts.fr/contact`, pas
   `adosdarts.fr/contact.html`.
2. **À faire immédiatement** : la communication du festival est en cours, les adresses
   partagées maintenant doivent être les définitives.
3. Motif retenu par JP, et il est juste : une URL sans extension ne dépend pas de la
   technologie du site. Le jour où le site change de socle, `/contact` reste `/contact`.

---

## 2. Hors périmètre

- **Réécriture des noms de fichiers sur le disque.** Les fichiers restent `contact.html`.
  Seule l'adresse publique change. C'est la solution la moins risquée et la seule réversible
  en une ligne.
- **Mots-clés dans les URL** (`/infos-pratiques` au lieu de `/infos`) : ce serait une seconde
  migration d'URL, avec sa propre série de redirections. Les adresses actuelles sont déjà
  courtes et lisibles. À rouvrir si le besoin SEO se confirme, pas dans le même geste.
- **Page 404 personnalisée.** Constaté le 03/08/2026 : le serveur sert la page d'erreur par
  défaut d'Apache, jamais `404.html`, faute de directive `ErrorDocument`. C'est un vrai
  manque, mais c'est un autre sujet — tracé ici pour ne pas l'oublier.
- **URLs des ressources** (`assets/js/layout.js`…) : inchangées. L'extension d'un script ou
  d'une image n'a jamais gêné personne et sert au diagnostic.

---

## 3. Décisions et arbitrages

### 3.1 Découverte qui change le plan initial

**MultiViews est déjà actif sur l'hébergement Ionos.** Constaté le 03/08/2026 :

```
curl -I https://adosdarts.fr/contact
  → HTTP 200 · content-location: contact.html · vary: negotiate
```

Conséquence directe : **les adresses sans `.html` fonctionnent déjà**, aujourd'hui, sans
qu'aucun fichier n'ait été modifié. JP peut communiquer dès maintenant sur
`adosdarts.fr/contact`.

Ce qui manque n'est donc pas la capacité, c'est la **cohérence** : aujourd'hui, chaque page
existe à deux adresses (`/contact` et `/contact.html`) qui répondent toutes deux `200`, et
c'est la forme `.html` que le site désigne lui-même comme officielle (liens internes,
`canonical`, `sitemap.xml`). Pour un moteur de recherche, c'est du contenu dupliqué avec un
signal contradictoire.

**Le travail consiste donc à faire de la forme courte la seule forme officielle.**

### 3.2 Décisions prises seul

| Sujet | Décision | Raison |
|---|---|---|
| Forme retenue | `/contact`, **sans barre oblique finale** | Avec `/contact/`, le navigateur croit être dans un dossier : tous les liens relatifs du site (`href="infos"`, `assets/…`) se résoudraient un cran trop bas et casseraient. Une barre finale saisie à la main sera retirée par une redirection. |
| Accueil | `https://adosdarts.fr/` | Déjà la forme du `canonical`. `index.html` redirige vers `/`. |
| Liens internes | Relatifs et sans extension : `href="contact"`, accueil `href="./"` | Respecte la règle projet « aucun chemin absolu commençant par `/` ». Toutes les pages étant à la racine, un lien relatif sans extension se résout correctement depuis n'importe laquelle. |
| Ne pas dépendre de MultiViews | Les règles de réécriture sont écrites **explicitement** dans le `.htaccess` | MultiViews est une option d'hébergeur : elle peut disparaître d'un changement d'offre sans préavis, et le site entier tomberait en 404. On ne bâtit pas sur une configuration qu'on ne maîtrise pas. |
| Redirection `.html` → forme courte | **Oui, permanente**, mais déposée en `302` d'abord (cf. §3.3) | §16 du référentiel : « toute URL modifiée doit faire l'objet d'une redirection 301 ». Sans elle, les deux formes coexistent et le contenu dupliqué demeure. |
| `pageKey()` de `layout.js` | Inchangé | Il fait déjà `pathname.split("/").pop()` puis retire `.html`. `/contact` donne « contact », `/` donne « index ». Il fonctionne avec les deux formes — vérifié avant de toucher quoi que ce soit. |
| `robots.txt` | `Disallow: /admin.html` **et** `Disallow: /admin` | La page d'administration est atteignable par les deux formes ; interdire une seule des deux ne servirait à rien. |

### 3.3 Arbitrage : `301` tout de suite, ou `302` puis `301` ?

**Ce qui est en jeu :** un navigateur met une redirection `301` en cache de façon très
durable, souvent jusqu'à ce que l'utilisateur vide son cache. Une `301` fausse déposée
pendant une campagne de communication ne se rattrape pas d'un simple retour arrière : les
visiteurs qui l'ont reçue restent bloqués dessus.

| Option | Avantage | Coût |
|---|---|---|
| **A — `302` au premier dépôt, `301` après vérification en ligne** *(retenue)* | Entièrement réversible. Une erreur se corrige en supprimant le fichier. | Un second dépôt d'un fichier, dans la foulée |
| B — `301` d'emblée | Un seul dépôt | Aucun retour arrière réel en cas d'erreur |

**Retenu : A.** Le surcoût est un dépôt de fichier ; le risque évité est irréversible.
Une `302` de quelques heures n'a aucune conséquence pour le référencement.

---

## 4. Points de risque (pré-mortem)

> « Nous sommes demain, le site est cassé ou introuvable. Que s'est-il passé ? »

| # | Risque | Prob. | Impact | Parade |
|---|---|---|---|---|
| **U1** | Une règle de réécriture provoque une **boucle de redirection** (`ERR_TOO_MANY_REDIRECTS`) sur tout le site | Moyenne | **Critique** | Les redirections se déclenchent sur `THE_REQUEST` — la ligne de requête d'origine, que les réécritures internes ne modifient pas. Et surtout : **éprouvé sur un vrai Apache local avant livraison** (§5.2), pas seulement relu |
| **U2** | Conflit entre MultiViews (actif chez Ionos) et mod_rewrite → boucle ou 500 | Moyenne | **Critique** | Le harnais de test local rejoue **les deux cas** : MultiViews activé et désactivé |
| **U3** | Une `301` erronée reste en cache chez les visiteurs | Faible | **Élevé** | Dépôt en `302` d'abord (§3.3) |
| **U4** | Un lien interne oublié continue de pointer vers `.html` | Élevée sans parade | Faible | Inventaire exhaustif par recherche (`grep`) : **47 occurrences recensées**, chacune tracée au §5.1. Contrôle final par une recherche qui doit ne plus rien renvoyer |
| **U5** | Les liens déjà partagés en `.html` (Facebook, QR codes, affiches) cessent de fonctionner | Faible | **Élevé** | Les fichiers restent en place et la redirection les rattrape. **Rien de ce qui a été partagé ne casse** — c'est le point à vérifier en priorité en recette |
| **U6** | Une barre oblique finale (`/contact/`) casse les liens relatifs et les feuilles de style | Moyenne | Moyen | Redirection de `/contact/` vers `/contact` |
| **U7** | Le serveur de développement local ne lit pas les `.htaccess` → les liens sans extension renvoient 404 en local, et le développement futur devient pénible | Élevée | Moyen | Le harnais Apache local (§5.2) reproduit le comportement réel. Constaté et à écrire dans le README |
| **U8** | Google met des semaines à basculer, avec du contenu dupliqué en attendant | Élevée | Faible | `canonical` et `sitemap.xml` alignés sur la forme courte **le même jour** que la redirection : c'est ce trio qui fait le signal, pas la redirection seule |

---

## 5. Approche technique

### 5.1 Inventaire des occurrences (recherche exhaustive, 03/08/2026)

| Fichier | Occurrences | Nature |
|---|---|---|
| `.htaccess` | — | **Nouveau bloc** : redirections + réécriture interne |
| `assets/js/layout.js` | 13 | Menu principal (5), liens contextuels (4), marque, pied de page (5) |
| `index.html` | 7 | Boutons hero, programme, galerie, contact (ancres comprises) |
| `sitemap.xml` | 7 | Toutes les `<loc>` |
| `contact.html`, `infos.html`, `principe.html`, `programmation.html`, `jeu-melodie.html`, `mentions-legales.html`, `galerie.html` | 2 chacun | `canonical` + `og:url` |
| `programmation.html`, `principe.html` | 1 chacun | Un lien dans le contenu |
| `admin.html` | 2 | Liens « retour au site » |
| `galerie.html` | 1 | Bouton retour à l'accueil |
| `assets/js/programme.js` | 1 | `PROGRAMME_URL` |
| `robots.txt` | 1 | `Disallow` — **complété, pas remplacé** |

**Laissés volontairement tels quels :** les commentaires de code qui nomment un *fichier*
(`galerie.js`, `boot-simple.js`, `layout.js`) — ils désignent bien un fichier sur le disque,
qui garde son extension — et l'URL externe du Crédit Mutuel dans `edition.json`.

### 5.2 Le harnais de vérification — c'est le cœur du dérisquage

`php -S` **ne lit pas les `.htaccess`** : il est incapable de prouver quoi que ce soit sur
des règles de réécriture. Livrer sur cette base reviendrait à refaire l'erreur du
`function_exists('mail')` du 28/07 — vérifier la présence au lieu de la capacité.

macOS embarque Apache 2.4.62. On lance donc **un vrai Apache local**, sur le vrai dossier du
projet, avec `AllowOverride All`, et on interroge les URLs pour de bon. Question posée avant
de commencer, boîte de temps 45 min :

> « Une requête sur `/contact`, `/contact.html`, `/contact/`, `/`, `/index.html` et une
>   adresse inexistante donnent-elles le bon code HTTP et la bonne destination, avec
>   MultiViews activé **et** désactivé ? »

### 5.3 Ordre des tranches

| # | Tranche | Vérifiable par |
|---|---|---|
| 1 | Harnais Apache local + règles du `.htaccess` | Les 6 URLs ci-dessus, dans les deux configurations |
| 2 | Liens internes, `canonical`, `og:url`, `sitemap.xml`, `robots.txt` | Recherche `grep` finale à zéro occurrence + parcours du site dans le navigateur |
| 3 | Recette complète et paquet de déploiement | Checklist §6 |

### 5.4 Plan de repli

Supprimer le bloc ajouté au `.htaccess` (ou le fichier entier) : le serveur revient à son
comportement d'aujourd'hui, où **les deux formes fonctionnent déjà** grâce à MultiViews.
Les liens internes en forme courte continueraient donc de fonctionner même sans le `.htaccess`.
**Moins d'une minute, et aucune page ne tombe.**

---

## 6. Checklist

### 6.1 Demandes

- [x] `https://adosdarts.fr/contact` affiche la page contact — *déjà vrai avant le chantier (MultiViews), et confirmé sur le harnais local sans MultiViews*
- [x] `https://adosdarts.fr/contact.html` redirige vers `/contact` — *un seul saut, 302, dans les deux configurations*
- [x] `https://adosdarts.fr/index.html` redirige vers `/` — *et `/index` aussi, sinon l'accueil aurait trois adresses*
- [x] `https://adosdarts.fr/contact/` redirige vers `/contact` — *un saut sans MultiViews, deux avec (mod_negotiation passe avant) ; destination correcte dans les deux cas*
- [x] Aucun lien du site ne mène à une adresse en `.html` — *recherche finale : ne restent que des commentaires de code qui nomment un fichier, et le `Disallow` de `robots.txt`, complété par `/admin`*
- [x] Les adresses déjà partagées en `.html` fonctionnent toujours — *redirigées, jamais cassées ; les fichiers restent en place*

### 6.2 Référentiel — `2.BonnesPratiques.md` §16

- [x] `canonical` unique par page, sur la forme courte — *8 pages relues*
- [x] `og:url` aligné sur le `canonical` — *même valeur, page par page*
- [x] `sitemap.xml` : 8 adresses, toutes en forme courte
- [x] Redirection en place pour **chaque** URL modifiée — *en 302 au premier dépôt, 301 après constat en ligne (§3.3)*
- [x] Aucun `noindex` résiduel ; `robots.txt` interdit désormais **les deux formes** de l'adresse d'administration

### 6.3 Vérification réelle

- [x] **16 adresses** éprouvées sur un vrai Apache local (2.4.62), MultiViews activé **et** désactivé — *dont `/reindex-test`, pour vérifier que la règle de l'accueil ne détourne pas une adresse contenant « index »*
- [x] Aucune boucle de redirection — *chaque adresse atteint sa destination et un `200` ; suivi saut par saut, plafond à 5*
- [x] Parcours dans le navigateur sur le harnais : `/`, `/contact#benevole`, clic « Au programme » → `/programmation`, `/galerie`, `/infos` — aucune 404, l'ancre est conservée
- [x] Console vide et **20 requêtes en 200** relevées depuis `/programmation` : polices, CSS, JS, JSON, images — les chemins relatifs résistent
- [x] La page active reste surlignée — *« Accueil » sur `/`, « Contact » sur `/contact`, « Au programme » sur `/programmation`*
- [x] 375 px et 1280 px : aucun débordement horizontal (mesuré, pas jugé à l'œil), rendu inchangé

### 6.4 Ce que je ne peux pas vérifier moi-même

- [ ] Le comportement réel chez Ionos — l'Apache local n'est pas l'Apache d'Ionos.
      Vérification en ligne à faire par moi **juste après le dépôt**, avant de passer en `301`.
- [ ] Le délai de prise en compte par Google (semaines, hors de portée)

---

## 7. Journal d'avancement

| Date | Tranche | État |
|---|---|---|
| 03/08/2026 | Cadrage | Plan rédigé. Découverte : MultiViews déjà actif, les URLs courtes fonctionnent déjà — le chantier porte sur la cohérence, pas sur la capacité |
| 03/08/2026 | **Tranches 1 à 3 — faites** | Règles de réécriture écrites et éprouvées sur un Apache local (le seul moyen : `php -S` ne lit pas les `.htaccess`). 47 occurrences de `.html` reprises. Paquet de déploiement prêt : `Dépôt des sites dans ionos/adosdarts.fr/2026-08-03-urls-propres/` |
