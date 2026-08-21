<?php
declare(strict_types=1);

/* MODÈLE de configuration de l'administration — à copier en `config-admin.php`.
 *
 * Ce fichier-ci (`.example.php`) est versionné et ne contient AUCUN secret.
 * Le vrai `config-admin.php` n'est jamais commité (cf. .gitignore) et vit
 * uniquement sur le serveur.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * COMMENT GÉNÉRER LE HACHAGE
 * ─────────────────────────────────────────────────────────────────────────
 * Depuis un terminal, sur votre machine :
 *
 *     php -r 'echo password_hash(readline("Mot de passe : "), PASSWORD_DEFAULT), "\n";'
 *
 * Copiez la chaîne obtenue (elle commence par $2y$) à la place de la valeur
 * ci-dessous, puis déposez le fichier sur le serveur.
 *
 * ⚠️ Le mot de passe en clair ne doit être écrit NULLE PART dans ce fichier,
 *    ni dans le dépôt, ni dans un message. Seul le hachage voyage.
 *
 * ⚠️ Ce mot de passe est la seule barrière entre Internet et la publication
 *    d'images sur le site. 16 caractères minimum, ou 4 mots aléatoires.
 *    À conserver dans un gestionnaire de mots de passe, pas sur un post-it :
 *    il n'existe aucune procédure de récupération (c'est délibéré).
 */

/* Hachage bcrypt du mot de passe d'administration.
   La valeur ci-dessous est un exemple INVALIDE : elle ne correspond à aucun
   mot de passe. Tant qu'elle n'est pas remplacée, la connexion est refusée. */
const ADMIN_MOTDEPASSE_HACHE = '$2y$12$REMPLACER_PAR_VOTRE_PROPRE_HACHAGE_GENERE_AVEC_LA_COMMANDE_CI_DESSUS';

/* Nombre d'échecs de connexion tolérés par adresse IP avant blocage. */
const ADMIN_ESSAIS_MAX = 5;

/* Durée du blocage, en secondes (900 = 15 minutes). */
const ADMIN_BLOCAGE_SECONDES = 900;

/* Durée de conservation du journal, en jours.
   Au-delà, les entrées sont purgées automatiquement (minimisation RGPD :
   le journal contient un nom et une adresse IP). */
const ADMIN_JOURNAL_RETENTION_JOURS = 365;

/* Poids maximal accepté pour une photo, en octets, APRÈS redimensionnement
   par le navigateur. 3 Mo laisse une marge confortable : une image de
   1600 px de large en JPEG pèse typiquement 200 à 500 Ko. */
const ADMIN_TAILLE_MAX_OCTETS = 3145728;
