# Cross Training — EPS Lycée Vauban

Application web (iPad) : une tablette = un élève + son observateur.

- `index.html`, `app.js`, `app.css`, `data.js` : l'application (hors-ligne grâce à `sw.js`).
- Entraînement (tests d'1 minute → catalogue de l'élève), Skill (blocs de 2 min), Fiches, Historique, Fin de séance (QR ScanProf + carnet).
- Profils : propriétaire de la tablette + invités ; transfert des résultats entre tablettes (QR ou fichier).
- `img/` : 28 fiches exercices. `lib/qrcode.js` (MIT), `lib/jsQR.js` (Apache-2.0).
- `v1/` : ancienne version, gardée en secours. `v2/` : redirige vers la racine.

À chaque mise en ligne : augmenter `VERSION` dans `sw.js`.
