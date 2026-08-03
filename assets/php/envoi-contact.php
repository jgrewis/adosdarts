<?php
declare(strict_types=1);

/* Traitement des deux formulaires de contact.html (bénévole et artistes).
   Un seul point d'entrée : le champ caché "formulaire" indique lequel.
   Répond en JSON pour l'appel fetch() de forms.js, ou en page HTML minimale
   si le formulaire est soumis nativement (JavaScript désactivé). */

const DESTINATAIRE = 'contact@adosdarts.fr';

/* Expéditeur technique du mail. DOIT être une adresse réellement existante
   sur le domaine hébergé chez Ionos, sinon l'envoi est rejeté ou classé en
   spam. On réutilise donc la boîte de contact (qui existe forcément), et le
   Reply-To pointe vers le visiteur pour que « Répondre » lui écrive bien.
   Si une boîte dédiée no-reply@adosdarts.fr est créée un jour, la mettre ici. */
const EXPEDITEUR = 'contact@adosdarts.fr';

const HOTES_AUTORISES = ['adosdarts.fr', 'www.adosdarts.fr'];

function estAppelAjax(): bool
{
    return ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'fetch';
}

function enverReponse(bool $ok, string $message, int $codeHttp): void
{
    http_response_code($codeHttp);

    if (estAppelAjax()) {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
        return;
    }

    header('Content-Type: text/html; charset=UTF-8');
    $titre = $ok ? 'Message envoyé' : 'Erreur';
    echo '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">'
        . '<title>' . htmlspecialchars($titre) . ' — À Dos d\'Arts</title>'
        . '<meta name="robots" content="noindex">'
        . '<style>body{font-family:sans-serif;max-width:40rem;margin:4rem auto;padding:0 1.5rem;line-height:1.5}</style>'
        . '</head><body><h1>' . htmlspecialchars($titre) . '</h1><p>' . htmlspecialchars($message) . '</p>'
        . '<p><a href="../../contact.html">Retour au formulaire de contact</a></p></body></html>';
}

function nettoyerChampMonoLigne(string $valeur): string
{
    $valeur = trim($valeur);
    return trim(preg_replace('/[\r\n]+/', ' ', $valeur) ?? '');
}

function origineAutorisee(): bool
{
    // Serveur de développement local (`php -S`) : pas de vérification d'origine.
    // strpos plutôt que str_starts_with : compatible PHP 7.x comme 8.x, la
    // version exacte de l'hébergement mutualisé n'étant pas garantie.
    if (strpos((string) ($_SERVER['SERVER_SOFTWARE'] ?? ''), 'PHP') === 0) {
        return true;
    }

    $enTete = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
    if ($enTete === '') {
        return false;
    }

    $hote = parse_url($enTete, PHP_URL_HOST);
    return $hote !== null && in_array($hote, HOTES_AUTORISES, true);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    enverReponse(false, 'Méthode non autorisée.', 405);
    exit;
}

if (!origineAutorisee()) {
    enverReponse(false, 'Requête refusée.', 403);
    exit;
}

// Honeypot : un bot qui remplit ce champ reçoit un succès silencieux, sans envoi de mail.
if (trim((string) ($_POST['site'] ?? '')) !== '') {
    enverReponse(true, 'Merci, votre message a bien été pris en compte.', 200);
    exit;
}

$typeFormulaire = $_POST['formulaire'] ?? '';
if (!in_array($typeFormulaire, ['benevole', 'artiste'], true)) {
    enverReponse(false, 'Formulaire inconnu.', 400);
    exit;
}

$email = filter_var(trim((string) ($_POST['email'] ?? '')), FILTER_VALIDATE_EMAIL);
if ($email === false) {
    enverReponse(false, 'Adresse e-mail invalide.', 422);
    exit;
}

if ($typeFormulaire === 'benevole') {
    $nom = nettoyerChampMonoLigne((string) ($_POST['nom'] ?? ''));
    if ($nom === '') {
        enverReponse(false, 'Le nom est obligatoire.', 422);
        exit;
    }

    $aide = nettoyerChampMonoLigne((string) ($_POST['aide'] ?? ''));
    $message = trim((string) ($_POST['message'] ?? ''));

    $sujet = "[Bénévole] Proposition de coup de main — {$nom}";
    $corps = "Nouvelle proposition depuis le formulaire bénévole du site.\n\n"
        . "Nom : {$nom}\n"
        . "E-mail : {$email}\n"
        . "Aide proposée : " . ($aide !== '' ? $aide : 'non précisé') . "\n\n"
        . "Message :\n" . ($message !== '' ? $message : '(aucun)') . "\n";
} else {
    $groupe = nettoyerChampMonoLigne((string) ($_POST['groupe'] ?? ''));
    if ($groupe === '') {
        enverReponse(false, 'Le nom du groupe est obligatoire.', 422);
        exit;
    }

    $style = nettoyerChampMonoLigne((string) ($_POST['style'] ?? ''));
    $lien = nettoyerChampMonoLigne((string) ($_POST['lien'] ?? ''));
    if ($lien !== '' && !preg_match('#^https?://#i', $lien)) {
        enverReponse(false, 'Le lien doit commencer par http:// ou https://.', 422);
        exit;
    }
    $message = trim((string) ($_POST['message'] ?? ''));

    $sujet = "[Groupe] Proposition de groupe — {$groupe}";
    $corps = "Nouvelle proposition de groupe depuis le site.\n\n"
        . "Groupe : {$groupe}\n"
        . "E-mail : {$email}\n"
        . "Style : " . ($style !== '' ? $style : 'non précisé') . "\n"
        . "Lien d'écoute : " . ($lien !== '' ? $lien : 'non précisé') . "\n\n"
        . "Présentation :\n" . ($message !== '' ? $message : '(aucune)') . "\n";
}

/* Un en-tête de mail ne peut PAS contenir d'UTF-8 brut (RFC 2047) : le sujet
   « [Bénévole] … » et le nom d'expéditeur « À Dos d'Arts » doivent être encodés,
   sinon certains serveurs les tronquent, les affichent en charabia, ou rejettent
   le message. mb_encode_mimeheader n'est pas garanti sur un mutualisé : on encode
   à la main en base64, ce qui ne dépend d'aucune extension. */
function encoderEnTete(string $texte): string
{
    if (preg_match('/^[\x20-\x7E]*$/', $texte)) {
        return $texte;   // ASCII pur : encodage inutile
    }
    return '=?UTF-8?B?' . base64_encode($texte) . '?=';
}

$enTetes = "From: " . encoderEnTete("À Dos d'Arts") . " <" . EXPEDITEUR . ">\r\n"
    . "Reply-To: " . $email . "\r\n"
    . "MIME-Version: 1.0\r\n"
    . "Content-Type: text/plain; charset=UTF-8\r\n"
    . "Content-Transfer-Encoding: 8bit\r\n";

/* 5e paramètre « -f » : définit l'expéditeur d'enveloppe (MAIL FROM du SMTP).
   Ionos rejette les messages dont l'enveloppe est l'utilisateur système Apache
   au lieu d'une adresse du domaine — c'est la cause n°1 d'un mail() qui renvoie
   false sur cet hébergeur. */
$envoye = mail(DESTINATAIRE, encoderEnTete($sujet), $corps, $enTetes, '-f' . EXPEDITEUR);

/* Repli : si l'hébergeur interdit le 5e paramètre (certaines configurations le
   bloquent), on retente sans lui plutôt que d'échouer sèchement. */
if (!$envoye) {
    $envoye = mail(DESTINATAIRE, encoderEnTete($sujet), $corps, $enTetes);
}

if (!$envoye) {
    enverReponse(false, "L'envoi a échoué, réessayez ou écrivez directement à " . DESTINATAIRE . '.', 500);
    exit;
}

enverReponse(true, 'Merci, votre message a bien été pris en compte.', 200);
