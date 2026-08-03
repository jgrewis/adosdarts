# Plan — Audit design du site Adod'art (vs référentiel 1.Regles.md)

> Statut : **Phase 2 terminée — corrections F1 à F5 appliquées et vérifiées au navigateur.**
> Périmètre validé : tout le site public (accueil, principe, programmation, infos, contact, mentions légales). Jeu « Compose ta mélodie » **hors scope**.
> Méthode : lecture du référentiel (`1.Regles.md`), lecture des CSS/HTML, vérification réelle au navigateur aux 3 breakpoints (375 / 768 / 1280 px), console + réseau.

## 1. Résumé de la demande
JP a le sentiment que les règles de design (charte des espacements `1.Regles.md`) ne sont **pas respectées partout**. Objectif : auditer le rendu réel du site public contre ce référentiel, produire un diagnostic priorisé, puis corriger après validation.

## 2. Hors périmètre
- Le jeu « Compose ta mélodie » (`jeu-melodie.html` / `jeu-melodie.css`) — thème nocturne, cahier des charges propre.
- Audit de contenu / orthographe / SEO — non demandé.
- Audit d'accessibilité complet automatisé (axe/Lighthouse) — non lancé ici ; seuls les points de la charte (§10) ont été vérifiés à la main.

## 3. Constat général
Le socle design est **solide et discipliné**, contrairement au ressenti d'un dérapage généralisé :
- Espacement inter-blocs : grille 8pt respectée, tout passe par les tokens (`tokens.css`), aucune valeur d'espacement « au jugé » entre sections.
- Contrastes documentés et corrigés (variantes `-deep` pour atteindre ≥ 4.5:1), commentés dans le CSS.
- Focus clavier visible partout, y compris bascule en jaune sur fonds sombres (§10).
- `prefers-reduced-motion` géré, gouttières responsive en `clamp()`, aucun scroll horizontal, aucune erreur console, aucun 404.
- Formulaire de contact : champs et boutons ≥ 44 px.

**Le ressenti « pas partout » a une cause précise et réelle :** la contrainte de largeur de lecture (§8, ≤ 65–75 caractères) est appliquée à *certains* blocs de texte (`.section__lead`, `.page-head__lead`, `.legal`, `.card__desc`) mais **pas aux paragraphes génériques ni à certains bandeaux**. Sur desktop, ces textes filent jusqu'à **116 caractères par ligne**. C'est l'écart principal.

## 4. Écarts constatés (priorisés)

### F1 — Largeur de lecture non contrainte (§8) — **Priorité : MOYENNE**
Impact : confort de lecture dégradé sur desktop/tablette. Correction à faible risque.
Mesures réelles à 1280 px :
| Bloc | Page(s) | Caractères/ligne | Règle |
|---|---|---|---|
| `.cta-band` (texte) | accueil, programmation | ~91 à 108 | ≤ 75 |
| `.eco-game__status` | accueil, infos | ~108 | ≤ 75 |
| `<p>` sans classe (`infos.html:130`, hébergements) | infos | ~116 | ≤ 75 |
Cause racine : `--measure` / `max-width` posé au cas par cas au lieu d'une règle générale sur le texte courant.
Exemple visible à l'œil nu : bandeau « LA PLAYLIST DU FESTIVAL » (page programmation), phrase sur une seule ligne pleine largeur.

### F2 — Cibles tactiles sous 44 px (§10) — **Priorité : FAIBLE**
| Élément | Hauteur mesurée (mobile) | Cible |
|---|---|---|
| Liens du footer (`.footer-col a`) | 42 px | 44 px |
| Lien de marque (`.brand`, < 480 px) | 34 px | 44 px |
Near-miss (2 à 10 px). Peu gênant en pratique (liens footer bien espacés verticalement), mais la règle pose 44 px comme minimum non négociable.

### F3 — Valeurs de dimensionnement hors grille 8/4 pt (§3-§4) — **Priorité : FAIBLE (cosmétique)**
Ce ne sont **pas** des espacements inter-blocs (ceux-ci sont conformes), mais des tailles d'éléments hors grille :
- `.textarea { min-height: 130px }` → 128 ou 144.
- `.tick-list li::before` (puce coche) : `22px` → 24.
- `.partners-row img { height: 46px }` → 48.
- `loader.css` : `14px / 10px / 6px` (écran transitoire, priorité basse).

### F4 — Divergence de nommage des tokens d'espacement (doc vs code) — **Priorité : INFO / documentation**
Le référentiel §13 documente `--space-sm / md / lg / xl…` ; le code utilise `--space-1 … --space-24`. Les **valeurs** sont conformes à la grille — c'est une incohérence documentaire, pas visuelle. Un développeur qui suit le doc ne trouvera pas les tokens attendus.

### F5 — Marge négative corrective sur `.section__lead` (§6/§11) — **Priorité : MINEUR**
`margin-top: calc(var(--space-8) * -0.5)` (= −16 px) pour rapprocher le lead du titre. Volontaire, mais §11 déconseille les marges négatives « de rattrapage » ; passe mieux par un `margin-bottom` réduit sur le titre concerné.

## 5. Points conformes (à créditer, ne rien toucher)
- Grille 8pt sur tout l'espacement inter-blocs.
- Tokens centralisés, zéro couleur/typo/espacement en dur significatif hors `tokens.css`.
- Contrastes ≥ 4.5:1 documentés et corrigés.
- Focus visible géré (fonds clairs et sombres).
- Rythme titres (`margin-top` > `margin-bottom`) respecté sur `.legal`, `.section__subtitle`.
- `.legal`, `.section__lead`, `.page-head__lead` correctement contraints en mesure.
- Responsive : `clamp()`, pas de scroll horizontal, gouttière ≥ 16 px mobile.
- Formulaire ≥ 44 px, `prefers-reduced-motion`, aucune erreur console / 404.

## 6. Approche technique de correction (à valider avant Phase 2)
Fichiers touchés : `assets/css/components.css`, `assets/css/pages.css`, `assets/css/layout.css`, éventuellement `assets/css/tokens.css` (alias) ; 1 retouche HTML (`infos.html`).
Ordre proposé :
1. **F1** — introduire une contrainte de mesure sur le texte courant : `max-width: var(--measure)` sur le bloc texte de `.cta-band`, sur `.eco-game__status`, et classer le `<p>` d'`infos.html:130` (ou règle générale sur les `<p>` de contenu hors composant). Vérif visuelle aux 3 breakpoints.
2. **F2** — porter les liens footer et la marque à 44 px (padding-block / min-height).
3. **F3** — aligner les tailles hors grille.
4. **F4** — décider : aligner le doc `1.Regles.md` sur les noms réels, **ou** ajouter des alias sémantiques dans `tokens.css`. (Arbitrage JP.)
5. **F5** — remplacer la marge négative par un ajustement positif.

## 7. Checklist de recette (§12 de 1.Regles.md) — après corrections
- [x] Valeurs d'espacement inter-blocs dans l'échelle (grille 8pt) — conforme
- [x] Espace inter-groupe > intra-groupe (ratio ≥ 2:1) — conforme
- [x] Espace au-dessus des titres > en dessous — conforme (F5 : marge négative supprimée, gap titre→lead = 16px mesuré)
- [x] **Corps de texte ≤ 75 car. / 65ch — CORRIGÉ (F1)** : bandeaux cta, eco-status, `<p>` infos bornés à `--measure` ; mesuré 62ch (était 91–116ch)
- [x] Interligne corps ≥ 1.5 (`--leading-normal: 1.6`) — conforme
- [x] Gouttières présentes sur tous les breakpoints — conforme
- [x] Grands espacements réduits sur mobile (`clamp`) — conforme
- [x] **Zones tactiles ≥ 44×44 px — CORRIGÉ (F2)** : liens footer 44px, marque 44px (via token `--touch-target` ajouté)
- [x] `gap` privilégié sur `margin` — conforme
- [x] Rendu vérifié mobile (375) / tablette (768) / desktop (1280) — fait, aucun scroll horizontal
- [ ] Zoom 200 % — non testé explicitement (reste ouvert)
- [x] Valeurs hors-grille de dimensionnement (F3) — corrigées (textarea 128, puce 24, logos 48) ; loader = transforms d'animation, hors grille légitimement

## 9. Corrections appliquées (Phase 2)
- **F4** : `tokens.css` — échelle d'espacement renommée `--space-3xs..4xl` (référentiel §13), palier `--space-4xl` ajouté, alias `--space-1..24` conservés pour le jeu (hors scope), tokens `--measure` (65ch) et `--touch-target` (44px) ajoutés. 136 usages migrés dans base/layout/components/pages/loader.css.
- **F1** : `.cta-band p`, `.eco-game__status`, utilitaire `.prose` (base.css) → `max-width: var(--measure)` ; `infos.html` p classé `.prose`.
- **F2** : `.footer-col a` et `.brand` → `min-height: var(--touch-target)`.
- **F3** : textarea 130→128px, puce tick 22→24px, logos partenaires 46→48px.
- **F5** : `.section__lead` marge négative supprimée ; `.section__title:has(+ .section__lead)` resserre l'espace proprement.
- Reste sur alias : `jeu-melodie.css` (hors périmètre) tourne sur les alias `--space-N` ; à migrer lors de sa propre passe.

## 8. Preuves de vérification
- Mesures JS de largeur de ligne et de cibles tactiles par page (accueil, infos, programmation, principe, contact, mentions), aux breakpoints 375/1280.
- Captures : hero accueil (desktop + mobile), bandeau playlist (programmation), page-head infos/principe/contact/mentions, footer mobile.
- Console : aucune erreur. Réseau : 100 % 200 OK.
