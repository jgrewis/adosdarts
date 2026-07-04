# Licences des bibliothèques et ressources vendorisées

Ce dossier contient les bibliothèques tierces utilisées par le jeu « Compose
ta mélodie » (`jeu-melodie.html`). Conformément à la CSP du site
(`script-src 'self'`), aucune n'est chargée depuis un CDN : chaque fichier
est copié ici en version figée.

## Tone.js

- **Version** : 14.7.77
- **Origine** : https://cdn.jsdelivr.net/npm/tone@14.7.77/build/Tone.min.js
- **Licence** : MIT
- **Usage** : moteur audio (Sampler, horloge, Tone.Part pour le rejeu)

## lz-string

- **Version** : 1.5.0
- **Origine** : https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js
- **Licence** : MIT
- **Usage** : compression des enregistrements pour le partage par URL

## Samples audio (piano, guitare, trompette)

- **Origine** : dépôt `nbrosowsky/tonejs-instruments` (GitHub)
- **Licence** : Creative Commons (voir le dépôt d'origine)
- **Usage** : samples des instruments joués dans `assets/audio/melodie/`
