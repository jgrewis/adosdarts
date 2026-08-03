# Plan — Audit design du jeu « Compose ta mélodie » (partie cachée)

> Statut : **Corrections appliquées et vérifiées au navigateur** (desktop + mobile). Non commité.
>
> Décisions client : go sur les corrections ; bug lettres guitare = à corriger ; J2 touches de piano = statu quo (exception documentée).
>
> ## Corrections appliquées
> - **J1** — `ui-piano.js` : boutons OCTAVE −/+ passés de `.btn--ghost` à `.btn--on-dark`. Contraste vérifié **10.96:1** (était ~1.6:1).
> - **Bug guitare** — `ui-guitare.js` : nom de note visible sur chaque corde (`.melodie-key__letter` → Mi/La/Ré/Sol/Si/Mi), masqué par le même toggle « Afficher les lettres » que le piano (vérifié).
> - **J2 labels** — `jeu-melodie.css` : `.melodie-mode__option` et `.melodie-toggle` à `min-height: var(--touch-target)` (44px vérifié). Touches de piano : statu quo, exception commentée dans le CSS.
> - **J3** — `jeu-melodie.css` migré vers `--space-3xs..4xl` ; alias `--space-N` retirés de `tokens.css` (plus aucun fichier ne les utilise).
> - **J4** — points de progression 14→16px.
> - **J5** — `.melodie__intro-text` borné à `var(--measure)`.
> Vérifs : console vierge, aucun scroll horizontal (375/1280), guitare + piano + accords OK.

> Statut initial : **Diagnostic terminé — en attente de validation avant corrections.**
> Périmètre : `jeu-melodie.html` + `assets/css/jeu-melodie.css` (page accessible via le toucan de l'accueil). Référentiel design : `1.Regles.md`. CDC du jeu consulté pour les contraintes propres (couleurs de marque, halos).
> Vérifié au navigateur : desktop 1280 / mobile 375, piano + guitare + trompette + modes Notes/Accords, section Défi. Console + scroll contrôlés.

## 1. Constat général
Le jeu est globalement soigné : panneau nocturne cohérent, contraste crème/bleu fort sur les textes, focus adapté au fond sombre, `prefers-reduced-motion` géré, aria-labels sur chaque touche, aucun scroll horizontal, aucune erreur console. La **section Défi** est exemplaire (cibles ≥ 44px via `--touch-target`, intro bornée à 42ch, retours d'état ✓/✗ non basés sur la seule couleur).

Deux vrais écarts au référentiel, plus la dette de tokens.

## 2. Écarts (priorisés)

### J1 — Contraste : boutons OCTAVE illisibles (§10 / WCAG 1.4.3) — **HAUTE**
Les boutons **OCTAVE − / OCTAVE +** sont générés (par le JS du piano) avec le style clair `.btn.btn--ghost` : texte + bordure encre `#1a1430` sur le panneau bleu nuit `#27367e` → **~1.6:1** (minimum 4.5:1 texte / 3:1 UI). Ils sont quasi illisibles.
Cause : style de bouton pensé pour fond clair, posé sur le fond sombre.
Fix : basculer ces boutons sur la variante `.btn--on-dark` (déjà existante, crème sur transparent), ou override CSS scopé `.melodie__scene .btn--ghost`.

### J2 — Cibles tactiles < 44px (§10) — **MOYENNE**
- **Touches de piano en mobile** : blanches **25px** de large, noires **18px** (12 touches Do4→Sol5 entassées dans 295px). Hauteur généreuse (200px) mais largeur très sous 44px → difficile à jouer au doigt. Décision de design nécessaire (voir §4).
- `.melodie-mode__option` (radios Notes/Accords/Les deux) : **39–42px** de haut. Fix simple : `min-height: 44px`.
- `.melodie-toggle` (case « Afficher les lettres ») : **26px**. Fix simple : padding/min-height.
- Champs radio/checkbox natifs (13px) : couverts dès que le label parent atteint 44px.

### J3 — Tokens d'espacement non migrés (règle « aligner le code sur le doc ») — **MOYENNE**
`jeu-melodie.css` tourne encore sur les alias `--space-N` (46 usages) laissés lors de l'audit du site public. À migrer vers les noms sémantiques `--space-3xs..4xl` (§13). Une fois fait, les alias de compat pourront être retirés de `tokens.css`.

### J4 — Valeurs hors-grille (§3-4) — **FAIBLE**
`.melodie-defi__dot` et `.melodie-defi__progress` : **14px** → 16px (ou 12px). Cosmétique.

### J5 — Largeur de lecture non bornée sur `.melodie__intro-text` (§8) — **FAIBLE**
Texte d'intro sans `max-width` (≈ 60ch aujourd'hui, donc OK, mais non protégé). Ajouter `max-width: var(--measure)` par cohérence avec l'audit du site.

### Observation (hors règles d'espacement, à confirmer)
Les pastilles de **guitare** apparaissent sans lettre visible malgré « Afficher les lettres » — peut-être volontaire (cordes identifiées au son/position). À vérifier contre le CDC du jeu ; ce n'est pas un écart de la charte de design.

## 3. Points conformes (à créditer)
- Section Défi : cibles ≥ 44px (`--touch-target`), intro 42ch, statut ✓/✗ non chromatique.
- Accords 96×64, pistons 72px, cordes 64px, boutons instrument 48–52px ≥ 44px.
- Contraste crème/bleu nuit fort sur les textes ; focus crème sur fond sombre.
- `prefers-reduced-motion`, aria-labels, fieldset/legend, role=group.
- Aucun scroll horizontal (375/1280), aucune erreur console.

## 4. Arbitrage à trancher (J2 — touches de piano mobile)
Trois options pour rendre les touches jouables au doigt :
1. **Afficher une octave à la fois sur mobile** (≈ 7 blanches → ~44px), navigation par OCTAVE −/+. *Recommandé* : respecte 44px, garde le clavier simple. (Modif JS.)
2. **Défilement horizontal du clavier** en mobile (touches larges, on fait glisser). Plus proche d'un vrai piano mais moins évident.
3. **Statu quo assumé** : touches étroites mais hautes, tap possible. Documente l'exception à la règle 44px.

## 5. Approche technique (après validation)
Fichiers : `assets/css/jeu-melodie.css` (J1 override, J2 labels, J3 migration, J4 dots, J5 intro), `tokens.css` (retrait des alias une fois J3 fait), éventuellement le JS du piano (J1 si on préfère `btn--on-dark`, J2 option 1).
Ordre : J1 (contraste, impact fort) → J2 labels → J3 tokens → J4/J5 → J2 piano selon arbitrage.

## 6. Preuves
Mesures JS (cibles, largeurs de touches, contraste sur vrai fond), captures desktop + mobile (intro, piano, guitare), console vierge, docW = viewport à tous les breakpoints.
