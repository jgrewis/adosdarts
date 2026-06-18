# Handoff #2 — Refonte « soirée concerts » (édition #8)

> Passation de la session de refonte. Le site a été **recentré** sur la soirée
> concerts du **samedi 22 août 2026** d'après le document de cadrage fourni par le
> client et l'**affiche officielle 2026** + les assets séparés (SVG, polices,
> anciennes affiches, logos).

| | |
|---|---|
| **Branche** | `mise-a-jour-jungle-client` (locale, **non poussée** — décision client) |
| **Stack** | HTML/CSS/JS vanilla, multi-fichiers, sans build (inchangé) |
| **Édition** | #8 — **soirée concerts**, samedi **22 août 2026**, **L'Escapade de Rouffach** |

---

## 1. Bascule de concept (le cœur de la demande)

L'ébauche précédente (handoff #1) vendait une **résidence jeunesse de 3 jours** avec
10 disciplines et inscriptions ateliers. Le client a clarifié : la communication porte
**uniquement sur la soirée concert du samedi**, grand public (40-60 ans + 18-30 ans),
**gratuite, sans billetterie**. Tout a été réaligné sur ce périmètre.

### Corrections de fond appliquées
- **Date** : 28–30 août → **samedi 22 août 2026** (portes 15h, concerts 19h).
- **Lieu** : **L'Escapade de Rouffach** + lien Google Maps.
- **Programmation** : 4 groupes (SYMBIOZ, AORAKI, KIF & LUNIK, SOBEIKH), 2 scènes.
- **Formulaires** : suppression de l'inscription atelier / logique mineur → **bénévole**
  + **artistes** (futures éditions).
- **Réseaux** : Facebook + Instagram (liens corrects) + mail. **TikTok retiré.**
- **Identité** : suppression de la fausse « jungle verte » inventée → **vraie palette
  de l'affiche** (orange/corail, toucan bleu nuit, turquoise, jaune) + **vraies
  polices** (Core Circus 2D Double, Maven Pro, Frutiger) + **vrais SVG** (toucan,
  feuilles, fond) pour le hero et l'animation de chargement.
- **Mode sombre / theme toggle** : **retiré** (identité unique lumineuse de l'affiche).

---

## 2. Arborescence livrée

5 pages multi-pages : `index.html`, `programmation.html`, `infos.html`,
`contact.html`, `principe.html` (cf. README §2 pour le détail CSS/JS/data).

Points notables :
- **Données pilotées par JSON** : `assets/data/edition.json` + `programmation.json`
  (le « CMS » de l'ébauche). Éditer ces fichiers met à jour le rendu sans toucher au code.
- **Compte à rebours** : `countdown.js`, cible `edition.json > ouverture_iso`
  (`2026-08-22T15:00:00+02:00`, décalage explicite → indépendant du fuseau du visiteur).
- **Animation de chargement** : `loader.js` + `loader.css`, SVG toucan/feuilles fournis,
  1×/session (`sessionStorage`), Échap/« Entrer » pour passer, off sous reduced-motion.
- **CSP stricte** : `script-src 'self'` (aucun script inline) → chaque page a un module
  d'entrée `boot-*.js`. Ne pas réintroduire de `<script>` inline.

---

## 3. Assets intégrés (depuis le .zip client)

- **Polices** → `assets/fonts/` : `CoreCircus2DDouble.otf` (logo), `MavenPro.ttf`
  (variable, titres), `Frutiger-LightCn.otf` (corps).
- **SVG** → `assets/img/elements/` : `toucan.svg`, `feuille-1-0.svg`, `feuille-2-0.svg`
  (les autres feuilles / fond / bec fournis n'ont pas été retenus, dispo dans `_client_assets/`).
- **Affiches (memories)** → `assets/img/affiches/` : `affiche-2026.png`, `affiche-2022.png`.
- **Logos** → `assets/img/partenaires/` : 2 organisateurs + 6 partenaires.
- Les **sources brutes** restent dans `_client_assets/` (gitignoré, non committé) et le
  `.zip` d'origine. Le logo CC PAROVIC vectorisé (.ai), affiches .indd/.ai, etc. y sont
  conservés pour réutilisation.

---

## 4. Revues (3 passes sous-agents)

| Passe | Corrections clés |
|---|---|
| **Sécurité** | CSP durcie (`script-src 'self'`, scripts externalisés en `boot-*.js`) ; garde `safeImgSrc()` (chemins relatifs same-origin uniquement) sur les images injectées ; échappement XSS déjà en place confirmé. |
| **Design** | **Bug corrigé** : `.btn--on-dark` héritait d'un fond blanc → texte blanc sur blanc (bouton « Infos pratiques » invisible). Halos de contraste sur texte blanc du hero (dégradé orange). En-tête mobile désencombré (marque sur 1 ligne, CTA masqué < 380px). |
| **Fullstack** | `rouffach.jpg` 2,0 Mo → 59 Ko (−97 %). Suppression d'un `@font-face` mort (Core Circus regular) + fichiers orphelins. 0 erreur console, 0 404, 0 chemin absolu, 0 TikTok confirmés en runtime. |

Arbitrage : **sécurité > fonctionnalité > esthétique**.

---

## 5. Reste à faire / production

- **Pousser la branche** (laissé en attente à la demande du client) puis PR/merge,
  rebuild GitHub Pages.
- **Contenu groupes** : descriptions, photos, liens YouTube + écoute (Deezer/Spotify/
  SoundCloud) à renseigner dans `programmation.json`.
- **Backend formulaires** (serverless + e-mail + CSRF), pages légales réelles,
  en-têtes de sécurité en HTTP réel.
- **Licence des polices commerciales** (Core Circus, Frutiger) à valider avant mise en
  ligne publique.
- **Idées non implémentées cette passe** (au choix) : « jeux cachés » (env/musique/local),
  carrousel memories enrichi avec photos d'éditions, vidéo d'accueil quand un fichier
  sera fourni.

---

## 6. Référence rapide

```bash
python3 -m http.server 8765      # → http://localhost:8765
sessionStorage.removeItem('adodart-loader-seen')   # revoir l'animation de chargement
```

*Fin du handoff #2.*
