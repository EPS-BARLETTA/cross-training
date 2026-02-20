# Carnet Cross Training – Version iPad (offline)

Tout tient à la racine : `index.html`, `styles.css`, `script.js`, les images (`*.jpg` / `*.png`) et `qrcode.min.js`. Aucun dossier `assets/`, aucun fetch réseau.

## Fonctionnalités
1. **Identité** : prénom (obligatoire), nom (facultatif), classe (obligatoire). Saisie sauvegardée automatiquement dans `localStorage` (`CT_APP_STATE_V1`).
2. **Bibliothèque** : catalogue JS (`EXERCISES`) Stocké dans `script.js`. Chaque carte affiche l’image locale (ex. `burpees.jpg`) + les niveaux disponibles.
3. **Sélection** : un clic sur « Choisir » pré-remplit le panneau « Sélection actuelle » avec le niveau 1. On peut changer de niveau, visualiser les points et retirer l’exercice.
4. **QR ScanProf** : bouton « Générer QR ScanProf » → JSON plat UTF‑8 (< 3 KB) contenant identité + infos challenge (`ct_exo`, `ct_exo_id`, `ct_lvl`, `ct_pts`, `ct_date`).
5. **Sauvegarde** : `state = { v:1, updatedAt, student, selected }`. Réinitialisation via le bouton « Réinitialiser » (vide le localStorage).

## Structure
```
index.html   # UI (identité, bibli, sélection, QR)
styles.css   # Style light façon fiche EPS
script.js    # Catalogue, state, QR
qrcode.min.js# Librairie QR locale
*.jpg *.png  # Visuels exercices (racine)
```

## Astuces
- Les images manquantes sont remplacées par un placeholder SVG (pas de crash).
- Pour ajouter un nouvel exercice : compléter `EXERCISES` dans `script.js` + déposer l’image au même niveau.
- Le QR affiché se lit avec l’app ScanProf (format JSON plat). Exemple :
```
{
  "nom": "-",
  "prenom": "Lola",
  "classe": "4C",
  "ct_exo": "Burpees",
  "ct_exo_id": "burpees",
  "ct_lvl": 2,
  "ct_pts": 20,
  "ct_date": "2026-02-20"
}
```
