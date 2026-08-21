<?php
declare(strict_types=1);

/* Point d'entrée unique de l'administration de la galerie photos.
 *
 * Toutes les actions passent par ce fichier, en POST, avec un champ `action`.
 * Les réponses sont toujours du JSON — la page d'administration exige
 * JavaScript (elle redimensionne les photos dans le navigateur avant envoi).
 * C'est une différence assumée avec envoi-contact.php, qui doit lui rester
 * utilisable sans JS parce qu'il sert à des visiteurs.
 *
 * Actions implémentées à ce stade : etat, login, logout.
 * upload / supprimer / journal arrivent aux tranches suivantes ; toute action
 * inconnue est refusée par défaut (§17.1 : refus par défaut).
 *
 * Principe directeur : ne jamais faire confiance au client. La page cache des
 * boutons, elle ne protège rien — c'est ici que les droits sont vérifiés, à
 * chaque requête.
 */

/* ==========================================================================
   Configuration
   ========================================================================== */

/* require_once direct = erreur fatale PHP si le fichier manque, avec le chemin
   du serveur affiché au visiteur. On teste d'abord, et on répond proprement. */
$cheminConfig = __DIR__ . '/config-admin.php';
if (!is_file($cheminConfig)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'ok' => false,
        'message' => "L'administration n'est pas configurée sur ce serveur.",
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
require_once $cheminConfig;

const DOSSIER_UPLOADS = __DIR__ . '/../uploads';
const FICHIER_GALERIE = DOSSIER_UPLOADS . '/galerie.json';
const FICHIER_JOURNAL = DOSSIER_UPLOADS . '/journal.jsonl';
const FICHIER_COMPTEUR = DOSSIER_UPLOADS . '/.compteur-connexions.json';

/* Types réellement acceptés, associés à l'extension qui sera FORCÉE à
   l'enregistrement. L'extension vient donc du contenu du fichier constaté par
   getimagesize(), jamais du nom fourni par le client — c'est ce qui rend
   inoffensif un « photo.jpg.php ». */
const TYPES_IMAGE_ACCEPTES = [
    IMAGETYPE_JPEG => 'jpg',
    IMAGETYPE_PNG => 'png',
    IMAGETYPE_WEBP => 'webp',
];

const HOTES_AUTORISES = ['adosdarts.fr', 'www.adosdarts.fr'];

/* Déconnexion automatique après 2 h sans activité. */
const SESSION_INACTIVITE_MAX = 7200;

/* ==========================================================================
   Réponses
   ========================================================================== */

function repondre(array $donnees, int $codeHttp = 200): void
{
    http_response_code($codeHttp);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store');
    /* Une réponse d'API n'a rien à faire dans une iframe ni à être devinée. */
    header('X-Content-Type-Options: nosniff');
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function refuser(string $message, int $codeHttp): void
{
    /* Jamais de 200 porteur d'erreur (§12.1) : le code HTTP dit la vérité. */
    repondre(['ok' => false, 'message' => $message], $codeHttp);
}

/* ==========================================================================
   Environnement
   ========================================================================== */

function estHttps(): bool
{
    if (($_SERVER['HTTPS'] ?? '') !== '' && strtolower((string) $_SERVER['HTTPS']) !== 'off') {
        return true;
    }
    /* Sur mutualisé, le TLS peut être terminé par un frontal : Apache voit
       alors du HTTP en clair et seul cet en-tête dit la vérité. */
    return strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')) === 'https';
}

function estServeurLocal(): bool
{
    /* Serveur de développement `php -S` : pas de HTTPS, pas de contrôle
       d'origine possible. Même repli que envoi-contact.php. */
    return strpos((string) ($_SERVER['SERVER_SOFTWARE'] ?? ''), 'PHP') === 0;
}

function ipClient(): string
{
    /* REMOTE_ADDR uniquement. X-Forwarded-For est fourni par le client et se
       falsifie en une ligne : s'en servir pour la limitation de débit
       reviendrait à offrir le contournement avec le verrou. */
    return (string) ($_SERVER['REMOTE_ADDR'] ?? 'inconnue');
}

/* Contrôle d'origine — duplication assumée avec envoi-contact.php.
   Ce dernier tourne en production et a été douloureux à stabiliser (cf.
   PROCESS-mise-en-ligne.md §3 bis) : on ne le refactorise pas au milieu d'un
   autre chantier. À factoriser dans un commun.php le jour où l'un des deux
   fichiers devra être modifié pour une autre raison. */
function origineAutorisee(): bool
{
    if (estServeurLocal()) {
        return true;
    }

    $enTete = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    if ($enTete === '') {
        return false;
    }

    $hote = parse_url($enTete, PHP_URL_HOST);
    return $hote !== null && in_array($hote, HOTES_AUTORISES, true);
}

/* ==========================================================================
   Session
   ========================================================================== */

function demarrerSession(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name('ADODART_ADMIN');
    session_set_cookie_params([
        'lifetime' => 0,          // cookie de session : fermé avec le navigateur
        'path' => '/',
        'httponly' => true,       // inaccessible au JavaScript (§17.3)
        'secure' => estHttps(),   // false en local, sinon le cookie ne partirait jamais
        'samesite' => 'Strict',   // aucune requête inter-site n'emporte la session
    ]);
    session_start();
}

function estConnecte(): bool
{
    if (($_SESSION['connecte'] ?? false) !== true) {
        return false;
    }

    $derniereActivite = (int) ($_SESSION['derniere_activite'] ?? 0);
    if (time() - $derniereActivite > SESSION_INACTIVITE_MAX) {
        detruireSession();
        return false;
    }

    $_SESSION['derniere_activite'] = time();
    return true;
}

function detruireSession(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $p['path'],
            'httponly' => true,
            'secure' => estHttps(),
            'samesite' => 'Strict',
        ]);
    }
    session_destroy();
}

function exigerSession(): void
{
    if (!estConnecte()) {
        refuser('Session expirée ou absente. Reconnectez-vous.', 401);
    }
}

/* Jeton anti-CSRF sur les actions qui modifient quelque chose.
   Le cookie SameSite=Strict couvre déjà l'essentiel ; ce jeton est la seconde
   barrière, pour les navigateurs anciens et les cas où SameSite est ignoré. */
function exigerJeton(): void
{
    $attendu = (string) ($_SESSION['jeton'] ?? '');
    $recu = (string) ($_POST['jeton'] ?? '');

    /* hash_equals : comparaison en temps constant. Un `!==` classique laisse
       fuiter, par sa durée, le nombre de caractères devinés justes. */
    if ($attendu === '' || !hash_equals($attendu, $recu)) {
        refuser('Jeton de sécurité invalide. Rechargez la page.', 403);
    }
}

/* ==========================================================================
   Écriture de fichiers
   ========================================================================== */

function assurerDossierUploads(): bool
{
    if (is_dir(DOSSIER_UPLOADS)) {
        return true;
    }
    /* @ : un échec de mkdir est une information qu'on veut renvoyer proprement
       dans le diagnostic, pas un avertissement PHP au milieu du JSON. */
    return @mkdir(DOSSIER_UPLOADS, 0755, true);
}

/* Écriture atomique : on écrit à côté, puis on renomme. rename() est atomique
   sur un même système de fichiers, donc un lecteur voit soit l'ancien contenu
   complet, soit le nouveau — jamais un fichier à moitié écrit, même si le
   serveur est coupé au milieu. */
function ecrireAtomique(string $chemin, string $contenu): bool
{
    $temporaire = $chemin . '.tmp-' . bin2hex(random_bytes(4));

    if (@file_put_contents($temporaire, $contenu, LOCK_EX) === false) {
        return false;
    }
    if (!@rename($temporaire, $chemin)) {
        @unlink($temporaire);
        return false;
    }
    return true;
}

/* ==========================================================================
   Journal (option B)
   ========================================================================== */

/* Actions : connexion, connexion-echouee, publication, suppression.
   Ce fichier contient un nom et une adresse IP : c'est une donnée personnelle.
   Il n'est jamais servi au public (.htaccess du dossier) et les entrées de plus
   de ADMIN_JOURNAL_RETENTION_JOURS jours sont purgées à chaque écriture.
   Jamais de mot de passe journalisé, même erroné (§12.3). */
function journaliser(string $action, ?string $auteur = null, ?string $fichier = null): void
{
    if (!assurerDossierUploads()) {
        return;   // le journal ne doit jamais faire échouer l'action principale
    }

    $entree = [
        'date' => date('c'),
        'action' => $action,
        'auteur' => $auteur,
        'ip' => ipClient(),
        'fichier' => $fichier,
    ];

    $lignes = lireJournal();
    $lignes[] = $entree;

    /* Purge à chaque écriture plutôt qu'au-delà d'une taille seuil : le volume
       est de quelques dizaines de lignes par an, le coût est nul, et la
       promesse de rétention est tenue même si personne ne publie pendant un an. */
    $limite = time() - (ADMIN_JOURNAL_RETENTION_JOURS * 86400);
    $lignes = array_values(array_filter($lignes, static function (array $e) use ($limite): bool {
        return strtotime((string) ($e['date'] ?? '')) >= $limite;
    }));

    $contenu = '';
    foreach ($lignes as $ligne) {
        $contenu .= json_encode($ligne, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    }

    ecrireAtomique(FICHIER_JOURNAL, $contenu);
}

function lireJournal(): array
{
    if (!is_file(FICHIER_JOURNAL)) {
        return [];
    }

    $brut = @file(FICHIER_JOURNAL, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($brut === false) {
        return [];
    }

    $entrees = [];
    foreach ($brut as $ligne) {
        $entree = json_decode($ligne, true);
        /* Une ligne corrompue est ignorée, elle ne fait pas tomber le reste. */
        if (is_array($entree)) {
            $entrees[] = $entree;
        }
    }
    return $entrees;
}

/* ==========================================================================
   Limitation de débit sur la connexion (§17.3)
   ========================================================================== */

/* L'IP est stockée hachée : ce compteur technique n'a pas besoin de la valeur
   en clair, et le fichier peut ainsi rester en place sans accumuler de données
   personnelles supplémentaires. */
function cleCompteur(): string
{
    return hash('sha256', ipClient());
}

function lireCompteur(): array
{
    if (!is_file(FICHIER_COMPTEUR)) {
        return [];
    }
    $donnees = json_decode((string) @file_get_contents(FICHIER_COMPTEUR), true);
    return is_array($donnees) ? $donnees : [];
}

/* Renvoie le nombre de secondes de blocage restantes, 0 si l'accès est libre. */
function blocageRestant(): int
{
    $compteur = lireCompteur();
    $entree = $compteur[cleCompteur()] ?? null;

    if (!is_array($entree)) {
        return 0;
    }
    if ((int) ($entree['echecs'] ?? 0) < ADMIN_ESSAIS_MAX) {
        return 0;
    }

    $finBlocage = (int) ($entree['dernier'] ?? 0) + ADMIN_BLOCAGE_SECONDES;
    return max(0, $finBlocage - time());
}

function enregistrerEchec(): void
{
    if (!assurerDossierUploads()) {
        return;
    }

    $compteur = lireCompteur();
    $cle = cleCompteur();
    $entree = $compteur[$cle] ?? ['echecs' => 0, 'dernier' => 0];

    /* Fenêtre glissante : si le dernier échec est plus vieux que la durée de
       blocage, on repart de zéro plutôt que de bloquer quelqu'un pour des
       tentatives d'il y a trois semaines. */
    if (time() - (int) $entree['dernier'] > ADMIN_BLOCAGE_SECONDES) {
        $entree['echecs'] = 0;
    }

    $entree['echecs'] = (int) $entree['echecs'] + 1;
    $entree['dernier'] = time();
    $compteur[$cle] = $entree;

    /* Ménage : on ne conserve pas indéfiniment les compteurs éteints. */
    foreach ($compteur as $k => $v) {
        if (time() - (int) ($v['dernier'] ?? 0) > ADMIN_BLOCAGE_SECONDES * 4) {
            unset($compteur[$k]);
        }
    }

    ecrireAtomique(FICHIER_COMPTEUR, (string) json_encode($compteur));
}

function reinitialiserCompteur(): void
{
    $compteur = lireCompteur();
    unset($compteur[cleCompteur()]);
    ecrireAtomique(FICHIER_COMPTEUR, (string) json_encode($compteur));
}

/* ==========================================================================
   Index de la galerie
   ========================================================================== */

/* Ce fichier-ci est le SEUL du dossier à être servi au public (cf. .htaccess).
   Il ne doit donc jamais contenir de nom d'auteur ni d'adresse IP : ces
   informations vivent dans le journal, qui n'est pas servi. */
function lireGalerie(): array
{
    if (!is_file(FICHIER_GALERIE)) {
        return [];
    }

    $donnees = json_decode((string) @file_get_contents(FICHIER_GALERIE), true);
    if (!is_array($donnees) || !isset($donnees['photos']) || !is_array($donnees['photos'])) {
        return [];
    }
    return $donnees['photos'];
}

function ecrireGalerie(array $photos): bool
{
    return ecrireAtomique(
        FICHIER_GALERIE,
        (string) json_encode(['photos' => array_values($photos)], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT)
    );
}

/* ==========================================================================
   Auteur de la publication (option B+)
   ========================================================================== */

/* Étiquette de traçabilité, pas une authentification : la personne saisit ce
   qu'elle veut. On la nettoie donc comme n'importe quelle entrée hostile. */
function nettoyerAuteur(string $valeur): string
{
    /* Retrait des caractères de contrôle (dont les retours à la ligne, qui
       casseraient le format « une ligne = une entrée » du journal). */
    $valeur = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $valeur) ?? '';
    $valeur = trim(preg_replace('/\s+/u', ' ', $valeur) ?? '');

    if (function_exists('mb_substr')) {
        return mb_substr($valeur, 0, 40);
    }
    return substr($valeur, 0, 40);
}

function auteurConnu(): ?string
{
    $brut = (string) ($_COOKIE['ADODART_AUTEUR'] ?? '');
    $propre = nettoyerAuteur($brut);
    return $propre === '' ? null : $propre;
}

/* Cookie d'un an : l'accroche est le navigateur, pas l'adresse IP. Une IP
   change (4G, redémarrage de box) et se partage (CGNAT, wifi commun) : elle
   redemanderait le nom sans cesse tout en confondant deux personnes. */
function memoriserAuteur(string $auteur): void
{
    setcookie('ADODART_AUTEUR', $auteur, [
        'expires' => time() + 31536000,
        'path' => '/',
        'httponly' => true,
        'secure' => estHttps(),
        'samesite' => 'Strict',
    ]);
}

/* Noms déjà utilisés, pour la liste de suggestions du formulaire : évite les
   variantes « Marie » / « marie » / « Marie D. » qui rendraient le journal
   illisible. Lisible uniquement par une session connectée. */
function auteursConnus(): array
{
    $noms = [];
    foreach (lireJournal() as $entree) {
        $auteur = $entree['auteur'] ?? null;
        if (is_string($auteur) && $auteur !== '') {
            $noms[$auteur] = true;
        }
    }
    $liste = array_keys($noms);
    sort($liste, SORT_NATURAL | SORT_FLAG_CASE);
    return $liste;
}

/* ==========================================================================
   Diagnostic serveur
   ========================================================================== */

/* Éprouve RÉELLEMENT ce dont l'administration a besoin, au lieu de se contenter
   de is_writable() ou de function_exists(). La leçon vient du formulaire de
   contact : function_exists('mail') répondait « oui » sur un serveur d'où aucun
   mail ne partait (cf. PROCESS-mise-en-ligne.md §3 bis).
   Ici : on crée un fichier, on le relit, on compare, on le supprime. */
/* Convertit une valeur de php.ini (« 2M », « 8M », « 512K ») en octets.
   Ces directives ne sont pas des nombres : les lire telles quelles et les
   comparer à un entier donnerait « 2M » > 3145728 en PHP, soit exactement
   l'inverse de la réalité. */
function iniEnOctets(string $valeur): int
{
    $valeur = trim($valeur);
    if ($valeur === '' || $valeur === '-1') {
        return PHP_INT_MAX;   // -1 = aucune limite
    }

    $nombre = (int) $valeur;
    $suffixe = strtolower(substr($valeur, -1));

    switch ($suffixe) {
        case 'g': return $nombre * 1024 * 1024 * 1024;
        case 'm': return $nombre * 1024 * 1024;
        case 'k': return $nombre * 1024;
        default:  return $nombre;
    }
}

/* Taille réellement acceptable : la plus petite des trois limites en jeu.
   Constaté en local : upload_max_filesize = 2 Mo alors que la limite
   applicative était fixée à 3 Mo. Annoncer 3 Mo aurait produit un rejet
   silencieux par PHP — le fichier n'arrive même pas jusqu'au script. */
function tailleMaxEffective(): int
{
    return min(
        ADMIN_TAILLE_MAX_OCTETS,
        iniEnOctets((string) ini_get('upload_max_filesize')),
        iniEnOctets((string) ini_get('post_max_size'))
    );
}

function diagnostic(): array
{
    $dossierPresent = assurerDossierUploads();

    $ecritureOk = false;
    $detailEcriture = 'Dossier absent et impossible à créer.';

    if ($dossierPresent) {
        $temoin = DOSSIER_UPLOADS . '/.test-ecriture-' . bin2hex(random_bytes(4));
        $attendu = 'temoin-' . bin2hex(random_bytes(8));

        if (@file_put_contents($temoin, $attendu) === false) {
            $detailEcriture = "Le dossier existe mais le serveur refuse d'y écrire.";
        } else {
            $relu = @file_get_contents($temoin);
            if ($relu === $attendu) {
                $ecritureOk = true;
                $detailEcriture = 'Écriture et relecture vérifiées.';
            } else {
                $detailEcriture = 'Fichier écrit mais relu différent — système de fichiers suspect.';
            }
            @unlink($temoin);
        }
    }

    return [
        'php' => PHP_VERSION,
        'https' => estHttps(),
        'dossier' => 'assets/uploads/',
        'dossierPresent' => $dossierPresent,
        'ecritureOk' => $ecritureOk,
        'detailEcriture' => $detailEcriture,
        'uploadsActives' => (bool) ini_get('file_uploads'),
        'tailleMaxFichier' => (string) ini_get('upload_max_filesize'),
        'tailleMaxRequete' => (string) ini_get('post_max_size'),
        'fichiersParRequete' => (string) ini_get('max_file_uploads'),
        'tailleMaxSouhaitee' => ADMIN_TAILLE_MAX_OCTETS,
        'tailleMaxEffective' => tailleMaxEffective(),
        /* Vrai quand c'est l'hébergeur qui impose la limite, pas nous : le
           message affiché doit alors dire la bonne limite, sinon on promet à
           l'utilisateur une taille que le serveur refusera. */
        'limiteImposeeParServeur' => tailleMaxEffective() < ADMIN_TAILLE_MAX_OCTETS,
    ];
}

/* ==========================================================================
   Aiguillage
   ========================================================================== */

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    refuser('Méthode non autorisée.', 405);
}

if (!origineAutorisee()) {
    refuser('Requête refusée.', 403);
}

demarrerSession();

$action = (string) ($_POST['action'] ?? '');

switch ($action) {

    /* ---- État courant : sert à décider quoi afficher au chargement --------
       Volontairement accessible sans session, mais ne renvoie alors que
       `connecte: false`. Aucune donnée n'en sort tant qu'on n'est pas connecté. */
    case 'etat':
        if (!estConnecte()) {
            repondre(['ok' => true, 'connecte' => false]);
        }
        repondre([
            'ok' => true,
            'connecte' => true,
            'jeton' => (string) ($_SESSION['jeton'] ?? ''),
            'auteur' => auteurConnu(),
            'auteursConnus' => auteursConnus(),
            'photos' => lireGalerie(),
            'diagnostic' => diagnostic(),
        ]);
        // no break — repondre() sort du script

    /* ---- Connexion ------------------------------------------------------- */
    case 'login':
        $restant = blocageRestant();
        if ($restant > 0) {
            journaliser('connexion-bloquee');
            refuser(
                'Trop de tentatives. Réessayez dans ' . (int) ceil($restant / 60) . ' minute(s).',
                429
            );
        }

        $motdepasse = (string) ($_POST['motdepasse'] ?? '');

        /* password_verify compare en temps constant : la durée de la réponse ne
           renseigne pas l'attaquant sur la validité du mot de passe. */
        if ($motdepasse === '' || !password_verify($motdepasse, ADMIN_MOTDEPASSE_HACHE)) {
            enregistrerEchec();
            journaliser('connexion-echouee');
            /* Petit délai : rend la force brute nettement plus coûteuse sans
               être perceptible pour quelqu'un qui tape son mot de passe. */
            usleep(400000);
            /* Message non discriminant (§17.3) : on ne dit jamais si c'est le
               mot de passe qui est faux ou la configuration qui est absente. */
            refuser('Mot de passe incorrect.', 401);
        }

        reinitialiserCompteur();

        /* Rotation de l'identifiant de session à la connexion (§17.3) : neutralise
           la fixation de session, où un attaquant impose son propre identifiant
           à la victime avant qu'elle ne se connecte. */
        session_regenerate_id(true);
        $_SESSION['connecte'] = true;
        $_SESSION['derniere_activite'] = time();
        $_SESSION['jeton'] = bin2hex(random_bytes(32));

        journaliser('connexion', auteurConnu());

        repondre([
            'ok' => true,
            'connecte' => true,
            'jeton' => $_SESSION['jeton'],
            'auteur' => auteurConnu(),
            'auteursConnus' => auteursConnus(),
            'photos' => lireGalerie(),
            'diagnostic' => diagnostic(),
        ]);

    /* ---- Déconnexion ----------------------------------------------------- */
    case 'logout':
        detruireSession();
        repondre(['ok' => true, 'connecte' => false]);

    /* ---- Publication d'une photo ----------------------------------------- */
    case 'upload':
        exigerSession();
        exigerJeton();

        /* L'auteur est demandé une seule fois par navigateur. Le champ n'est
           envoyé que si le cookie était absent. */
        $auteur = auteurConnu();
        $auteurSaisi = nettoyerAuteur((string) ($_POST['auteur'] ?? ''));
        if ($auteurSaisi !== '') {
            $auteur = $auteurSaisi;
            memoriserAuteur($auteur);
        }
        /* mb_strlen n'est pas garanti sur un mutualisé — même prudence que
           l'encodage d'en-têtes de envoi-contact.php. */
        $longueurAuteur = $auteur === null
            ? 0
            : (function_exists('mb_strlen') ? mb_strlen($auteur) : strlen($auteur));
        if ($auteur === null || $longueurAuteur < 2) {
            refuser('Indiquez qui publie cette photo (2 caractères minimum).', 422);
        }

        $fichier = $_FILES['photo'] ?? null;
        if (!is_array($fichier) || !isset($fichier['error'])) {
            refuser('Aucun fichier reçu.', 422);
        }

        /* Un dépassement de la limite PHP se traite AVANT tout le reste : le
           fichier n'est alors pas arrivé, et tester sa taille n'aurait aucun
           sens. C'est le cas le plus fréquent et le plus déroutant. */
        if ((int) $fichier['error'] === UPLOAD_ERR_INI_SIZE || (int) $fichier['error'] === UPLOAD_ERR_FORM_SIZE) {
            refuser(
                'Photo trop lourde pour ce serveur (limite : '
                . round(tailleMaxEffective() / 1048576, 1) . ' Mo).',
                413
            );
        }
        if ((int) $fichier['error'] === UPLOAD_ERR_NO_FILE) {
            refuser('Aucun fichier reçu.', 422);
        }
        if ((int) $fichier['error'] !== UPLOAD_ERR_OK) {
            refuser("Le téléversement a échoué (code {$fichier['error']}).", 500);
        }

        /* is_uploaded_file : garantit que le chemin vient bien d'un envoi HTTP
           et n'a pas été forgé pour désigner un fichier système. */
        $temporaire = (string) $fichier['tmp_name'];
        if (!is_uploaded_file($temporaire)) {
            refuser('Fichier invalide.', 422);
        }

        if ((int) $fichier['size'] > tailleMaxEffective()) {
            refuser(
                'Photo trop lourde (limite : ' . round(tailleMaxEffective() / 1048576, 1) . ' Mo).',
                413
            );
        }

        /* Type RÉEL, lu dans le contenu du fichier. Le nom d'origine et le
           Content-Type annoncé par le navigateur sont ignorés : tous deux sont
           fournis par le client, donc hostiles (§17.6). */
        $infos = @getimagesize($temporaire);
        if ($infos === false || !isset($infos[2], TYPES_IMAGE_ACCEPTES[$infos[2]])) {
            refuser("Ce fichier n'est pas une image JPEG, PNG ou WebP.", 415);
        }

        $largeur = (int) $infos[0];
        $hauteur = (int) $infos[1];
        if ($largeur < 1 || $hauteur < 1) {
            refuser('Image illisible.', 415);
        }

        if (!assurerDossierUploads()) {
            refuser("Le serveur ne peut pas enregistrer de fichier. Prévenez l'administrateur du site.", 500);
        }

        /* Nom aléatoire : le nom d'origine peut contenir une traversée de
           répertoire (« ../.. »), une double extension, ou simplement le prénom
           de quelqu'un. On ne le conserve nulle part. */
        $nomFichier = bin2hex(random_bytes(8)) . '.' . TYPES_IMAGE_ACCEPTES[$infos[2]];
        $destination = DOSSIER_UPLOADS . '/' . $nomFichier;

        if (!@move_uploaded_file($temporaire, $destination)) {
            refuser("L'enregistrement de la photo a échoué.", 500);
        }
        @chmod($destination, 0644);

        $photo = [
            'fichier' => $nomFichier,
            'largeur' => $largeur,
            'hauteur' => $hauteur,
            'ajoutee' => date('c'),
        ];

        /* Insertion en tête : la galerie se lit de la plus récente à la plus
           ancienne, sans avoir à trier à l'affichage. */
        $photos = lireGalerie();
        array_unshift($photos, $photo);

        if (!ecrireGalerie($photos)) {
            /* L'index n'a pas pu être écrit : on retire le fichier plutôt que
               de laisser une photo orpheline, invisible et non supprimable. */
            @unlink($destination);
            refuser("L'index de la galerie n'a pas pu être mis à jour.", 500);
        }

        journaliser('publication', $auteur, $nomFichier);

        repondre(['ok' => true, 'photo' => $photo, 'auteur' => $auteur], 201);

    /* ---- Suppression d'une photo ----------------------------------------- */
    case 'supprimer':
        exigerSession();
        exigerJeton();

        $nom = (string) ($_POST['fichier'] ?? '');

        /* Liste blanche stricte sur la forme du nom : 16 caractères
           hexadécimaux + extension connue. Aucun « ../ », aucun caractère
           inattendu ne peut passer. */
        if (!preg_match('/^[a-f0-9]{16}\.(jpg|png|webp)$/', $nom)) {
            refuser('Nom de fichier invalide.', 422);
        }

        $photos = lireGalerie();
        $restantes = [];
        $trouvee = false;
        foreach ($photos as $p) {
            if (($p['fichier'] ?? '') === $nom) {
                $trouvee = true;
                continue;
            }
            $restantes[] = $p;
        }

        /* Seconde barrière : on ne supprime que ce qui est référencé dans
           l'index. Même avec un nom bien formé, un fichier hors galerie n'est
           pas touché. */
        if (!$trouvee) {
            refuser('Cette photo n\'existe pas ou a déjà été supprimée.', 404);
        }

        if (!ecrireGalerie($restantes)) {
            refuser("L'index de la galerie n'a pas pu être mis à jour.", 500);
        }

        /* L'ordre compte : l'index d'abord, le fichier ensuite. Si la
           suppression du fichier échoue, la photo a déjà disparu du site — on
           laisse un fichier orphelin plutôt qu'une image morte dans la grille. */
        @unlink(DOSSIER_UPLOADS . '/' . $nom);

        journaliser('suppression', auteurConnu(), $nom);

        repondre(['ok' => true, 'photos' => lireGalerie()]);

    /* ---- Journal --------------------------------------------------------- */
    case 'journal':
        exigerSession();

        /* Plus récent en premier, et borné : le journal n'a pas vocation à
           être relu intégralement dans le navigateur. */
        $entrees = array_reverse(lireJournal());
        repondre(['ok' => true, 'entrees' => array_slice($entrees, 0, 100)]);

    default:
        /* Refus par défaut : tout ce qui n'est pas explicitement autorisé
           ci-dessus est rejeté. */
        exigerSession();
        refuser('Action inconnue.', 400);
}
