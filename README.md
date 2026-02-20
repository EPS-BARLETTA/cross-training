# Carnet Cross Training (GitHub Pages / Offline)

Application statique (aucun build) pensée pour être servie depuis GitHub Pages ou ouverte en local sur iPad/Safari.

## Fichiers
```
index.html        # Structure et onglets (Entraînement / Skill)
styles.css        # Styles light iPad friendly
script.js         # Catalogue exercices, state localStorage, QR ScanProf
qrcode.min.js     # Librairie QR locale (aucun CDN)
assets/*.jpg      # Fiches visuelles (burpees.jpg, jumping-jack.jpg, ...)
```

## Images / fiches exercices
- Placer chaque visuel dans `assets/` et utiliser un nom en minuscules + tirets (`mountain.jpg`, `jumping-jack.jpg`, ...).
- Ajouter l’entrée correspondante dans `EXERCISES` (script.js) avec `image: 'assets/<nom>.jpg'`.
- Si une image manque, l’app affiche automatiquement un placeholder.

## Publier sur GitHub Pages
1. Pousser la branche sur GitHub (`main` par défaut).
2. Activer GitHub Pages > Source = `main / root`.
3. L’app est accessible via `https://<user>.github.io/cross-training/` (tous les chemins sont relatifs).

## Export / Import
- Bouton **Exporter mes données** → télécharge un JSON (`cross-training_<prenom>_<classe>_YYYY-MM-DD.json`).
- Bouton **Importer** → recharge une sauvegarde précédemment exportée (versions compatibles uniquement).
- LocalStorage (`CT_APP_STATE_V3`) assure la persistance tant que le cache n’est pas vidé.

## QR ScanProf
- Les QR sont générés côté client via `qrcode.min.js`.
- Format imposé : `{appName, mode, date, participants:[{nom, prenom, classe, ...}]}`.
- Deux modes :
  * **training** → champs `ct_tr_*` (timer 60 s + records par exercice).
  * **skill** → champs `ct_skill_*` (durée, blocs, totaux par famille, course ✅/❌).
- Un compteur affiche la taille du JSON et alerte si > 2800 caractères.
- Pour vérifier : ouvrir l’app ScanProf → scanner le QR → l’import doit être proposé.

## Tests rapides
1. **Entraînement** : choisir un exercice, lancer 1:00, saisir N1/N2 → vérifier l’historique + QR.
2. **Skill** : sélectionner 4 familles, durée 6/10/16/20, chronométrer un bloc de 2', valider tous les blocs → QR skill disponible.
3. **Images** : cliquer sur « Voir la fiche » pour vérifier que les visuels proviennent bien de `assets/`.
4. **Sauvegarde** : exporter, reset, importer → l’état doit être restauré.
