# Plan — Envoi réel des formulaires de contact.html

## 1. Résumé des demandes
- Le site est maintenant en ligne sur un hébergement Ionos réel (offre mutualisée, PHP disponible).
- Les deux formulaires de `contact.html` (bénévole et artistes) doivent réellement envoyer un e-mail, au lieu de simuler un succès côté client comme aujourd'hui (`assets/js/forms.js`, message « démonstration — aucun envoi réel »).
- Les deux formulaires envoient vers `contact@adosdarts.fr` (confirmé par le client), avec un objet permettant de distinguer bénévole / artiste.
- Le honeypot déjà en place suffit comme protection anti-spam pour l'instant (confirmé par le client) ; pas de captcha.

## 2. Hors périmètre
- **Captcha / reCAPTCHA** : reporté, honeypot jugé suffisant pour l'instant.
- **Limitation de débit (rate limiting)** par IP : nécessiterait un stockage persistant (fichier ou base) fragile sur mutualisé ; à envisager seulement si du spam réel apparaît.
- **Sauvegarde des messages en base de données** : le formulaire relaie par e-mail uniquement, sans persistance côté serveur — cohérent avec le texte RGPD déjà publié dans `mentions-legales.html` (« conservation... dans les bases de données actives » = la boîte mail, pas une base applicative).
- **En-têtes de sécurité HTTP réels** (CSP, X-Frame-Options en headers Apache plutôt qu'en `<meta>`) : hors sujet de cette tâche (formulaires), à traiter séparément si souhaité — Ionos le permettrait désormais via `.htaccess`.
- **Accusé de réception automatique** à l'expéditeur : non demandé, non fait.
- **Pièces jointes** : les formulaires n'en proposent pas, aucun changement.

## 3. Décisions et arbitrages

| Sujet | Décision | Raison |
|---|---|---|
| Techno backend | PHP (`mail()`), un seul script | Hébergement mutualisé Ionos confirmé, PHP dispo nativement, cohérent avec la philosophie « statique, sans build » du site (cf. `README.md`) |
| Emplacement du script | `assets/php/envoi-contact.php` | Suit la convention existante (`assets/js`, `assets/css`...) |
| Un seul script pour les 2 formulaires | Oui, avec un champ caché `formulaire` (`benevole` / `artiste`) | Évite la duplication ; le sujet et le corps du mail s'adaptent au type |
| Distinction des soumissions | Objet du mail préfixé `[Bénévole]` ou `[Groupe]` | Demandé par le client pour s'y retrouver dans une boîte unique |
| Mode de communication front/back | `fetch()` JSON (le JS gère déjà `preventDefault` + affichage des statuts) | Réutilise l'UX déjà en place (`forms.js`), pas de rechargement de page |
| Repli sans JavaScript | Le `<form>` reçoit un `action`/`method` pointant vers le même script PHP ; si la requête n'est pas une requête JSON (pas de JS), le script répond par une page HTML minimale de confirmation/erreur au lieu de JSON | Cas limite « JS désactivé » explicitement listé au référentiel (§12.3) ; coût faible, sinon le formulaire ne ferait rien du tout sans JS |
| Adresse `From` du mail envoyé | Adresse technique du domaine (ex. `no-reply@adosdarts.fr`), avec `Reply-To` = e-mail du visiteur | Meilleure délivrabilité (évite le rejet SPF/DMARC des hébergeurs mail qui refusent un `From` usurpé) ; répondre au mail revient bien à contacter le visiteur |
| Validation | Répétée côté serveur (obligatoire, format e-mail, longueur raisonnable), en plus du client existant | Toute entrée est hostile tant qu'elle n'est pas validée côté serveur (référentiel §13.4) |
| Anti-header-injection | Nettoyage des retours à la ligne dans tous les champs utilisés dans les en-têtes du mail | Empêche l'injection d'en-têtes SMTP via un champ texte (faille classique des formulaires `mail()` PHP) |
| Vérification d'origine | Rejet si l'en-tête `Origin`/`Referer` ne correspond pas au domaine du site | Réduit l'usage du script comme relais de spam ouvert depuis l'extérieur |

## 4. Points de risque (pré-mortem)

| Risque | Impact | Parade |
|---|---|---|
| `mail()` de PHP finit en spam / n'arrive jamais | Le client perd des messages sans le savoir | `Reply-To` correct, `From` du domaine ; **on demandera un test réel en boîte de réception avant de considérer que c'est fini** — c'est un point que je ne peux pas vérifier moi-même (pas d'accès à la boîte mail ni au serveur Ionos) |
| Double soumission (double clic) | Deux mails identiques envoyés | Le bouton est désactivé pendant l'envoi côté JS |
| Script PHP accessible directement / abusé comme relais spam | Le nom de domaine se retrouve blacklisté | Vérification honeypot + Origin/Referer + validation stricte des champs |
| Le serveur Ionos n'autorise pas `mail()` tel quel (SMTP externe requis) | Le script ne fonctionne pas en prod malgré des tests OK en apparence | Je ne peux pas tester `mail()` en conditions réelles depuis mon environnement local — **vérification réelle sur le serveur à faire par toi après déploiement**, je le dirai explicitement dans le rendu final |
| Perte du message si le champ est très long / caractères spéciaux | Mise en page du mail cassée | Le corps du mail est du texte brut échappé, pas de HTML interprété |

## 5. Approche technique

**Fichiers touchés :**
- `assets/php/envoi-contact.php` *(nouveau)* — traitement serveur, validation, envoi du mail
- `contact.html` — ajout d'un champ caché `formulaire` par form + attributs `action`/`method` sur les deux `<form>`
- `assets/js/forms.js` — remplacer la simulation par un vrai `fetch()` POST vers le script PHP, gestion de la réponse (succès/erreur serveur), désactivation du bouton pendant l'envoi

**Ordre :**
1. Écrire `envoi-contact.php` (validation, honeypot, anti-injection, envoi, réponse JSON ou HTML selon le contexte).
2. Adapter `contact.html` (champs cachés + action/method de repli).
3. Adapter `forms.js` (fetch réel, état d'envoi en cours, gestion des erreurs serveur, réutilisable pour les deux formulaires).
4. Vérifier en local autant que possible (le script tourne avec `php -S localhost:8765`, mais `mail()` ne partira pas réellement sans serveur mail configuré en local — donc vérification du **flux** en local, vérification de la **livraison réelle** annoncée comme à faire par toi une fois déployé sur Ionos).

## 6. Checklist

> **Clos le 03/08/2026.** Les mentions « à vérifier en ligne » ci-dessous ont été levées :
> JP a testé l'envoi des mails en production, tout fonctionne. Détail au §7.

- [x] Le formulaire bénévole envoie réellement un e-mail à contact@adosdarts.fr avec objet `[Bénévole]` — vérifié en local, puis **en production par JP (mail reçu)**
- [x] Le formulaire artistes envoie réellement un e-mail à contact@adosdarts.fr avec objet `[Groupe]` — vérifié en local, puis **en production par JP (mail reçu)**
- [x] `Reply-To` du mail reçu = l'adresse saisie par le visiteur — vérifié en lisant le code (`envoi-contact.php`), puis **constaté sur un mail réellement reçu**
- [x] Validation serveur : champs obligatoires manquants → erreur claire, aucun mail envoyé — testé via curl (`{"ok":false,"message":"Le nom est obligatoire."}`, HTTP 422)
- [x] Validation serveur : e-mail mal formé → erreur claire, aucun mail envoyé — testé via curl (HTTP 422)
- [x] Honeypot rempli → succès silencieux affiché, aucun mail envoyé — testé via curl (HTTP 200, pas d'appel à `mail()` dans ce chemin de code)
- [x] Requête cross-origin (Origin/Referer étranger) → rejetée — vérifié par lecture de code ; le check est désactivé volontairement en local (`php -S`), **actif et vérifié en ligne** (cf. §7)
- [x] Double clic sur « Envoyer » → un seul mail part (bouton désactivé pendant l'envoi) — `submitButton.disabled = true` posé avant l'appel fetch
- [x] En cas d'erreur serveur, message d'erreur affiché et champs saisis conservés (pas de `form.reset()`) — `form.reset()` n'est appelé que dans la branche succès
- [x] Sans JavaScript, la soumission native du formulaire fonctionne quand même (repli PHP) — testé via curl sans header `X-Requested-With` : réponse HTML de confirmation
- [x] Aucune régression sur la validation client existante (champs requis, pattern URL, etc.) — logique de `validateField` inchangée
- [x] Aucune erreur console, aucune requête 404 — vérifié dans le navigateur (page contact.html rechargée, soumission testée)
- [x] Testé responsive mobile (375px) — capture vérifiée, formulaire intact ; desktop déjà vérifié pendant les tests fonctionnels
- [x] Point signalé explicitement en fin de tâche : la livraison réelle du mail depuis le serveur Ionos était **à vérifier par toi** — **fait le 03/08/2026, les mails arrivent** (cf. §7)

---

## 7. Vérification en production — 03/08/2026

Le script est **en ligne sur `https://adosdarts.fr` et confirmé fonctionnel par JP**.
Les points laissés ouverts au §6 parce qu'ils n'étaient pas vérifiables depuis
l'environnement de développement sont donc refermés :

| Point ouvert au §6 | Statut | Vérifié par |
|---|---|---|
| Livraison réelle du mail depuis le serveur Ionos | ✅ Les messages arrivent dans la boîte `contact@adosdarts.fr` | JP, en réception réelle |
| Rejet des requêtes d'origine étrangère (neutralisé sous `php -S`) | ✅ Actif en ligne | Constaté en production |
| Version de PHP / `mail()` réellement autorisé | ✅ | Fichier de test PHP déposé puis supprimé |

### Ce qu'il a fallu corriger après le premier déploiement

La première mise en ligne a échoué : aucun mail ne partait, alors que tous les tests
locaux étaient au vert. Trois corrections, toutes propres à Ionos (détail dans
`PROCESS-mise-en-ligne.md` §3 bis) :

1. **Expéditeur d'enveloppe** — `mail(..., '-f' . EXPEDITEUR)` en 5ᵉ paramètre.
   Sans lui, Ionos refuse le message et `mail()` renvoie `false`.
2. **Adresse d'expédition = boîte réelle du domaine** — `contact@adosdarts.fr` en `From`
   (le visiteur reste en `Reply-To`), au lieu du `no-reply@` inexistant prévu au §3.
   La décision d'origine du §3 est donc **révisée** : la délivrabilité chez Ionos exige
   une boîte qui existe, pas seulement un domaine qui correspond.
3. **En-têtes encodés en base64 (RFC 2047)** — sujet et nom d'expéditeur, sinon
   « [Bénévole] … » en UTF-8 brut peut faire rejeter le message.

**La leçon retenue :** le fichier de vérification déposé avant le déploiement testait
`function_exists('mail')`, qui répond « oui » sur un serveur d'où aucun mail ne sort.
Un test de présence ne prouve rien ; seul un test de bout en bout prouve quelque chose.

### Toujours hors périmètre

Captcha, limitation de débit par IP, accusé de réception automatique, pièces jointes :
inchangés, non demandés. À rouvrir seulement si du spam réel apparaît.

### État du fichier au dépôt

`assets/php/envoi-contact.php`, `contact.html` et `assets/js/forms.js` sont **identiques
au serveur** (comparaison faite le 03/08/2026 avec les fichiers servis par
`https://adosdarts.fr`). Le travail est commité et déployé : rien à rejouer.
