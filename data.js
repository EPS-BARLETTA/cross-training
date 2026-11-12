/* Données Cross Training — catalogue des exercices et fiches.
 * Codes ScanProf (EXO_CODES) : ne jamais changer un code existant.
 * Chaque niveau : n, label, expected (repère en 1 min), tips (consignes).
 * image : fiche illustrée (img/…) ; null = fiche texte uniquement.
 */
(function () {
  var FAMILIES = [
    { id: "cardio", label: "Cardio" },
    { id: "haut", label: "Haut du corps" },
    { id: "bas", label: "Bas du corps" },
    { id: "gainage", label: "Gainage" },
  ];

  var STRETCH = {
    cobra: "Grand droit : allongé sur le ventre, pousser sur les mains pour redresser le buste (cobra).",
    enfant: "Dos et épaules : à genoux, fesses sur les talons, bras tendus loin devant (posture de l'enfant).",
    psoas: "Psoas : fente avant, genou arrière au sol, avancer doucement le bassin.",
    quadri: "Quadriceps : debout, attraper la cheville et amener le talon vers la fesse.",
    ischio: "Ischio-jambiers : une jambe tendue devant, pencher le buste dos droit.",
    mollet: "Mollets : mains contre un mur, jambe arrière tendue, talon au sol.",
    fessier: "Fessiers : assis, croiser une jambe et ramener le genou vers la poitrine.",
    adduct: "Adducteurs : assis, plantes de pieds jointes, pousser doucement les genoux vers le sol.",
    triceps: "Triceps : main dans le dos derrière la tête, l'autre main pousse doucement le coude.",
    pecto: "Pectoraux : main contre un mur, bras tendu, tourner le buste du côté opposé.",
    epaule: "Épaules : bras tendu devant la poitrine, l'autre bras le rapproche du corps.",
    oblique: "Obliques : assis, une jambe croisée, tourner le buste vers le genou plié.",
    poignet: "Poignets : à genoux, mains au sol doigts tournés vers soi, reculer doucement les fesses.",
  };

  var EXERCISES = [
    /* ===================== CARDIO ===================== */
    {
      id: "burpees", name: "Burpees", family: "cardio", image: "img/burpees.jpg",
      levels: [
        { n: 1, label: "Burpees décomposés", expected: 12, tips: ["Reculer les jambes une par une en planche.", "Revenir une jambe après l'autre.", "Se relever sans saut."] },
        { n: 2, label: "Burpees complets", expected: 16, tips: ["Reculer les jambes en sautant en planche.", "Ramener les pieds en sautant vers les mains.", "Finir par un saut, bras au-dessus de la tête."] },
        { n: 3, label: "Burpees saut avant", expected: 10, tips: ["Burpee complet.", "Finir par un saut vers l'avant, pieds joints.", "Réception amortie, puis enchaîner."] },
      ],
    },
    {
      id: "jumping-jack", name: "Jumping jack", family: "cardio", image: "img/jumping-jack.jpg",
      levels: [
        { n: 1, label: "Step jack (sans saut)", expected: 20, tips: ["Pas sur le côté en levant les bras.", "Revenir au centre.", "Alterner droite / gauche."] },
        { n: 2, label: "Jumping jack", expected: 30, tips: ["Sauter pieds écartés en levant les bras.", "Mains qui se touchent au-dessus de la tête.", "Revenir en sautant."] },
        { n: 3, label: "Sauts en étoile", expected: 15, tips: ["Partir accroupi, mains vers le sol.", "Sauter le plus haut possible, bras et jambes écartés en étoile.", "Réception amortie en position accroupie."] },
      ],
    },
    {
      id: "mountain", name: "Mountain climbers", family: "cardio", image: "img/mountain.jpg",
      levels: [
        { n: 1, label: "Mains surélevées", expected: 18, tips: ["Mains sur un banc ou un plinth.", "Ramener une jambe après l'autre vers la poitrine.", "Corps droit."] },
        { n: 2, label: "Classique", expected: 26, tips: ["Mains au sol.", "Ramener les genoux en alternance, rythme rapide.", "Rester aligné et gainé."] },
        { n: 3, label: "Croisés", expected: 22, tips: ["Mains au sol.", "Ramener le genou vers le coude opposé.", "Bassin stable malgré la rotation."] },
      ],
    },
    {
      id: "saut", name: "Saut", family: "cardio", image: "img/saut.jpg",
      levels: [
        { n: 1, label: "Décomposé (basse intensité)", expected: 20, tips: ["Lever les genoux en marchant sur place.", "Alterner droite / gauche.", "Sans saut ni impact."] },
        { n: 2, label: "Continu (explosif)", expected: 30, tips: ["Sauter d'un pied sur l'autre en montant les genoux vite et haut.", "Alterner droite / gauche.", "Intensité cardio."] },
        { n: 3, label: "Sauts groupés", expected: 12, tips: ["Pieds joints, sauter vers le haut.", "Ramener les deux genoux vers la poitrine en l'air.", "Réception amortie, puis enchaîner."] },
      ],
    },
    {
      id: "talons-fesses", name: "Talons-fesses", family: "cardio", image: "img/talons-fesses.jpg",
      levels: [
        { n: 1, label: "Marchés", expected: 30, tips: ["Sur place, sans saut.", "Alterner droite / gauche.", "Rythme modéré."] },
        { n: 2, label: "Courus", expected: 40, tips: ["Petits sauts d'un pied sur l'autre.", "Le talon touche les fesses.", "Rythme rapide."] },
      ],
    },
    {
      id: "patineurs", name: "Patineurs", family: "cardio", image: "img/patineurs-illustration.png",
      levels: [
        { n: 1, label: "Pas chassés", expected: 24, tips: ["Grand pas sur le côté, sans saut.", "Toucher le sol derrière avec la pointe du pied libre."] },
        { n: 2, label: "Sautés", expected: 30, tips: ["Sauter d'un pied sur l'autre.", "Le pied libre ne touche pas le sol."] },
        { n: 3, label: "Sautés + toucher au sol", expected: 22, tips: ["Grand saut latéral.", "Toucher le sol avec la main opposée à chaque réception."] },
      ],
    },
    {
      id: "marche-ours", name: "Marche de l'ours", family: "cardio", image: "img/marche-ours.jpg",
      levels: [
        { n: 1, label: "Sur place", expected: 30, tips: ["Genoux décollés de quelques centimètres.", "Lever une main et le pied opposé, puis l'inverse.", "1 pas = 1 répétition."] },
        { n: 2, label: "Avant-arrière", expected: 24, tips: ["4 pas en avant, 4 pas en arrière.", "Genoux toujours décollés.", "1 pas = 1 répétition."] },
      ],
    },

    /* ===================== HAUT DU CORPS ===================== */
    {
      id: "pompes", name: "Pompes", family: "haut", image: "img/pompes.jpg",
      levels: [
        { n: 1, label: "Plan incliné", expected: 12, tips: ["Mains surélevées (banc, mur).", "Corps droit, amplitude réduite.", "Idéal pour débuter."] },
        { n: 2, label: "Classiques", expected: 15, tips: ["Mains au sol, largeur des épaules.", "Corps droit, descente contrôlée.", "Poitrine près du sol."] },
        { n: 3, label: "Mains décollées", expected: 10, tips: ["Descendre jusqu'à poser la poitrine au sol.", "Décoller les mains du sol une seconde.", "Reposer les mains et remonter corps gainé."] },
      ],
    },
    {
      id: "dips", name: "Triceps dips", family: "haut", image: "img/dips.jpg",
      levels: [
        { n: 1, label: "Jambes fléchies", expected: 10, tips: ["Pieds proches, genoux fléchis.", "Idéal pour débuter."] },
        { n: 2, label: "Jambes tendues", expected: 14, tips: ["Jambes tendues, talons au sol.", "Charge plus importante sur les bras."] },
        { n: 3, label: "Pieds surélevés", expected: 10, tips: ["Talons posés sur un second banc.", "Descente lente et contrôlée."] },
      ],
    },
    {
      id: "pompe-diamant", name: "Pompe diamant", family: "haut", image: "img/pompe-diamant.jpg",
      levels: [
        { n: 1, label: "Sur genoux", expected: 10, tips: ["Genoux au sol, corps droit des genoux à la tête.", "Mains en losange sous la poitrine."] },
        { n: 2, label: "Classique", expected: 14, tips: ["Sur les pieds, corps gainé.", "Poitrine jusqu'aux mains."] },
        { n: 3, label: "Pieds surélevés", expected: 8, tips: ["Pieds posés sur un banc.", "Charge plus importante sur les bras."] },
      ],
    },
    {
      id: "pompes-spiderman", name: "Pompes spiderman", family: "haut", image: "img/pompes-spiderman-illustration.png",
      levels: [
        { n: 1, label: "Sur genoux", expected: 10, tips: ["Pompe sur les genoux.", "Après chaque pompe, ramener un genou vers le coude du même côté."] },
        { n: 2, label: "Complètes", expected: 10, tips: ["Pompe sur les pieds.", "Pendant la descente, genou vers le coude du même côté.", "Alterner droite / gauche."] },
      ],
    },
    {
      id: "pompes-piquees", name: "Pompes piquées", family: "haut", image: "img/pompes-piquees-illustration.png",
      levels: [
        { n: 1, label: "Pieds au sol", expected: 10, tips: ["Position en « V » inversé.", "Tête vers le sol entre les mains."] },
        { n: 2, label: "Pieds surélevés", expected: 8, tips: ["Pieds sur un banc, corps plus vertical.", "Descente lente."] },
      ],
    },
    {
      id: "inchworms", name: "Inchworms", family: "haut", image: "img/inchworms-illustration.png",
      levels: [
        { n: 1, label: "Sans pompe", expected: 8, tips: ["Marcher avec les mains jusqu'à la planche, puis revenir.", "1 aller-retour = 1 répétition."] },
        { n: 2, label: "Avec 1 pompe", expected: 6, tips: ["Une pompe complète en position de planche.", "1 aller-retour = 1 répétition."] },
      ],
    },
    {
      id: "planche-dynamique", name: "Planche dynamique", family: "haut", image: "img/planche-dynamique-illustration.png",
      levels: [
        { n: 1, label: "Sur genoux", expected: 12, tips: ["Genoux au sol.", "Passer des avant-bras aux mains, puis revenir."] },
        { n: 2, label: "Complète", expected: 10, tips: ["Sur les pieds, corps gainé.", "Changer de bras de départ à chaque répétition."] },
      ],
    },

    /* ===================== BAS DU CORPS ===================== */
    {
      id: "squat", name: "Squat", family: "bas", image: "img/squat.jpg",
      levels: [
        { n: 1, label: "Squat avec chaise", expected: 15, tips: ["Toucher la chaise avec les fesses, puis remonter.", "Amplitude réduite.", "Idéal pour apprendre le mouvement."] },
        { n: 2, label: "Squat classique", expected: 18, tips: ["Sans appui.", "Amplitude complète.", "Mouvement contrôlé."] },
        { n: 3, label: "Squats sautés", expected: 14, tips: ["Squat complet.", "Pousser fort pour sauter vers le haut.", "Réception amortie, enchaîner directement."] },
      ],
    },
    {
      id: "fentes", name: "Fentes", family: "bas", image: "img/fentes.jpg",
      levels: [
        { n: 1, label: "Fente avant (même jambe)", expected: 14, tips: ["Pas avant fixe.", "Descente contrôlée.", "Changer de jambe à mi-temps."] },
        { n: 2, label: "Fentes alternées", expected: 18, tips: ["Alterner jambe droite / gauche.", "Amplitude complète."] },
        { n: 3, label: "Fentes sautées", expected: 14, tips: ["Depuis la fente, sauter et changer de jambe en l'air.", "Réception amortie en fente."] },
      ],
    },
    {
      id: "pont-fessier", name: "Pont fessier", family: "bas", image: "img/pont-fessier.jpg",
      levels: [
        { n: 1, label: "Classique", expected: 18, tips: ["Montée et descente contrôlées."] },
        { n: 2, label: "Pause 1 seconde", expected: 24, tips: ["Tenir 1 seconde en haut, fessiers serrés."] },
        { n: 3, label: "Sur 1 jambe", expected: 12, tips: ["Une jambe tendue en l'air.", "Pousser sur le talon de la jambe d'appui.", "Changer de jambe à mi-temps."] },
      ],
    },
    {
      id: "fentes-laterales", name: "Fentes latérales", family: "bas", image: "img/fentes-laterales.jpg",
      levels: [
        { n: 1, label: "Amplitude réduite", expected: 16, tips: ["Petit pas sur le côté.", "Descente partielle."] },
        { n: 2, label: "Complètes", expected: 20, tips: ["Grand pas sur le côté.", "Cuisse fléchie proche de l'horizontale."] },
      ],
    },
    {
      id: "squats-sumo", name: "Squats sumo", family: "bas", image: "img/squats-sumo-illustration.png",
      levels: [
        { n: 1, label: "Classique", expected: 18, tips: ["Pieds très écartés, pointes vers l'extérieur.", "Descente contrôlée."] },
        { n: 2, label: "Sautés", expected: 14, tips: ["Squat sumo, puis saut vers le haut.", "Réception amortie pieds écartés."] },
      ],
    },
    {
      id: "fire-hydrants", name: "Fire hydrants", family: "bas", image: "img/fire-hydrants.jpg",
      levels: [
        { n: 1, label: "Classique", expected: 24, tips: ["Lever le genou sur le côté jusqu'à la hauteur de la hanche.", "Changer de côté à mi-temps."] },
        { n: 2, label: "Pause 1 seconde en haut", expected: 18, tips: ["Tenir 1 seconde genou levé.", "Changer de côté à mi-temps."] },
      ],
    },
    {
      id: "mollets", name: "Extensions des mollets", family: "bas", image: "img/mollets-illustration.png",
      levels: [
        { n: 1, label: "2 pieds", expected: 30, tips: ["Monter sur la pointe des pieds, redescendre lentement."] },
        { n: 2, label: "1 pied", expected: 20, tips: ["Sur un seul pied, la main contre le mur.", "Changer de pied à mi-temps."] },
        { n: 3, label: "Sur une marche", expected: 24, tips: ["Avant des pieds sur une marche, talons dans le vide.", "Grande amplitude."] },
      ],
    },

    /* ===================== GAINAGE ===================== */
    {
      id: "rameur", name: "Rameur au sol", family: "gainage", image: "img/rameur.jpg",
      levels: [
        { n: 1, label: "Statique", expected: 20, tips: ["Position tenue, jambes fléchies, pieds décollés.", "Petits mouvements de jambes contrôlés."] },
        { n: 2, label: "Dynamique", expected: 26, tips: ["Tendre et ramener les jambes en continu.", "Buste contrôlé."] },
        { n: 3, label: "Avec torsion", expected: 18, tips: ["En ramenant les genoux, tourner le buste d'un côté.", "Alterner les côtés."] },
      ],
    },
    {
      id: "crunch", name: "Crunch", family: "gainage", image: "img/crunch.jpg",
      levels: [
        { n: 1, label: "Crunch classique", expected: 18, tips: ["Monter les épaules seulement.", "Mouvement court et contrôlé."] },
        { n: 2, label: "Sit-up & twist", expected: 22, tips: ["Montée complète du dos.", "Rotation du buste en haut du mouvement."] },
        { n: 3, label: "Crunch jambes en l'air", expected: 18, tips: ["Jambes tendues à la verticale.", "Monter les mains vers les pieds."] },
      ],
    },
    {
      id: "planche-touches-epaule", name: "Planche touches épaules", family: "gainage", image: "img/planche-touches-epaule.jpg",
      levels: [
        { n: 1, label: "Sur genoux", expected: 20, tips: ["Genoux au sol, corps aligné.", "Toucher l'épaule opposée."] },
        { n: 2, label: "Classique", expected: 30, tips: ["Sur les pieds, bassin stable.", "Toucher l'épaule opposée."] },
        { n: 3, label: "Planche jacks", expected: 20, tips: ["En planche, ouvrir et fermer les pieds en sautant.", "Bassin stable, fesses pas trop hautes."] },
      ],
    },
    {
      id: "v-ups", name: "V-ups", family: "gainage", image: "img/v-ups-illustration.png",
      levels: [
        { n: 1, label: "Alternés", expected: 16, tips: ["Monter le buste et une seule jambe tendue.", "Alterner les jambes."] },
        { n: 2, label: "Complets", expected: 12, tips: ["Monter le buste et les deux jambes en même temps.", "Toucher les pieds en haut."] },
      ],
    },
    {
      id: "superman", name: "Superman", family: "gainage", image: "img/superman.jpg",
      levels: [
        { n: 1, label: "Bras ou jambes", expected: 20, tips: ["Alterner : décoller les bras, puis les jambes."] },
        { n: 2, label: "Bras et jambes", expected: 16, tips: ["Décoller bras et jambes en même temps.", "Tenir 1 seconde en haut."] },
      ],
    },
    {
      id: "bicyclette", name: "Abdos bicyclette", family: "gainage", image: "img/bicyclette-illustration.png",
      levels: [
        { n: 1, label: "Lents", expected: 20, tips: ["Pause d'une seconde à chaque rotation."] },
        { n: 2, label: "Rapides", expected: 30, tips: ["Rythme rapide, sans perdre le contrôle."] },
      ],
    },
    {
      id: "planche-twist", name: "Planche twist", family: "gainage", image: "img/planche-twist-illustration.png",
      levels: [
        { n: 1, label: "Sur genoux", expected: 20, tips: ["Planche sur les avant-bras, genoux au sol.", "Pivoter le bassin d'un côté puis de l'autre."] },
        { n: 2, label: "Complète", expected: 24, tips: ["Planche sur les avant-bras et les pieds.", "Hanche vers le sol sans le toucher."] },
      ],
    },
  ];

  /* Fiches (texte corrigé, affiché sous l'image ou seul) */
  var FICHES = {
    "burpees": {
      subtitle: "Cardio et renforcement de tout le corps",
      criteria: ["Debout, pieds à la largeur des épaules.", "Descendre en squat et poser les paumes des mains au sol devant les pieds.", "Lancer les jambes vers l'arrière pour arriver en position de planche.", "Ramener les pieds vers les mains en sautant, talons au sol.", "Sauter vers le haut, corps droit, jambes tendues, mains au-dessus de la tête."],
      safety: ["Corps gainé en planche, en squat et pendant le saut.", "Mains à la largeur des épaules (ni trop loin devant, ni trop écartées).", "Genoux légèrement orientés vers l'extérieur pendant le squat."],
      muscles: ["Deltoïdes", "Pectoraux et triceps", "Grand droit (abdominaux)", "Quadriceps et fessiers"],
      stretches: [STRETCH.cobra, "Pectoraux et épaules : à genoux, mains jointes dans le dos, ouvrir la poitrine."],
    },
    "jumping-jack": {
      subtitle: "Cardio et coordination",
      criteria: ["Debout, bras le long du corps, pieds joints.", "Sauter en écartant les pieds et en levant les bras sur les côtés jusqu'au-dessus de la tête.", "Toucher les mains au-dessus de la tête, corps droit et gainé.", "Sauter de nouveau pour revenir pieds joints, bras le long du corps."],
      safety: ["Corps droit et gainé pendant tout le mouvement.", "Réception souple sur l'avant des pieds.", "Genoux légèrement fléchis à la réception."],
      muscles: ["Abducteurs et adducteurs", "Deltoïdes", "Mollets", "Tenseur du fascia lata"],
      stretches: [STRETCH.adduct, STRETCH.mollet],
    },
    "mountain": {
      subtitle: "Cardio et gainage",
      criteria: ["Départ en position de pompe, bras tendus, mains sous les épaules.", "Ramener un genou vers la poitrine, puis l'autre, en alternant.", "Garder le bassin bas, aligné avec les épaules.", "Garder un rythme régulier sans perdre l'alignement."],
      safety: ["Corps gainé et droit : ne pas cambrer le dos.", "Cou dans l'alignement de la colonne, regard vers le sol.", "Rester dans l'axe : ne pas basculer les épaules ni les hanches sur les côtés."],
      muscles: ["Abdominaux", "Quadriceps et fléchisseurs de hanche", "Fessiers", "Épaules (deltoïdes)"],
      stretches: [STRETCH.psoas, STRETCH.mollet],
    },
    "saut": {
      subtitle: "Cardio : montées de genoux",
      criteria: ["Debout, lever un genou vers la poitrine en alternant droite et gauche.", "Monter les genoux au moins à hauteur de la ceinture.", "Garder un rythme rapide, dos droit et abdominaux gainés."],
      safety: ["Lever le genou avec la cuisse, sans tirer sur le bas du dos.", "Dos droit et abdominaux gainés, sans se cambrer.", "Amorti sur l'avant du pied, jamais sur le talon."],
      muscles: ["Quadriceps", "Fléchisseurs de hanche", "Abdominaux", "Mollets"],
      stretches: [STRETCH.quadri, STRETCH.mollet],
    },
    "talons-fesses": {
      subtitle: "Cardio",
      criteria: ["Debout, buste droit, regard devant, pieds sous les hanches.", "Ramener le talon vers les fesses en alternant droite et gauche.", "Rester sur l'avant du pied, les bras accompagnent le mouvement.", "Garder un rythme régulier : 1 talon = 1 répétition."],
      safety: ["Ventre gainé : ne pas cambrer le bas du dos.", "Genou qui pointe vers le sol (ne pas lancer la jambe sur le côté).", "Amorti sur l'avant du pied, jamais sur le talon."],
      muscles: ["Ischio-jambiers", "Fessiers", "Mollets", "Cœur (cardio)"],
      stretches: [STRETCH.quadri, "Ischio-jambiers : assis, jambes tendues, aller chercher les pieds dos droit."],
    },
    "patineurs": {
      subtitle: "Cardio et équilibre",
      criteria: ["Debout sur une jambe, l'autre jambe en arrière.", "Sauter latéralement pour atterrir sur l'autre jambe.", "Réception sur un pied, genou fléchi, la jambe libre passe derrière.", "Les bras accompagnent le mouvement, comme un patineur.", "1 saut = 1 répétition."],
      safety: ["Réception amortie, genou dans l'axe du pied.", "Buste légèrement penché, dos droit.", "Espace dégagé sur les côtés."],
      muscles: ["Moyen fessier", "Quadriceps", "Mollets", "Cœur (cardio)"],
      stretches: [STRETCH.fessier, "Adducteurs : jambes écartées, fléchir une jambe sur le côté."],
    },
    "marche-ours": {
      subtitle: "Cardio, gainage et coordination",
      criteria: ["À quatre pattes, mains sous les épaules, genoux sous les hanches.", "Décoller les genoux de quelques centimètres.", "Bouger en même temps une main et le pied opposé, puis l'inverse.", "Garder le dos plat et les genoux près du sol."],
      safety: ["Dos plat : ne pas lever les fesses.", "Regard vers le sol, nuque dans l'alignement.", "Petits pas contrôlés."],
      muscles: ["Épaules", "Abdominaux", "Quadriceps"],
      stretches: [STRETCH.poignet, STRETCH.enfant],
    },
    "pompes": {
      subtitle: "Renforcement des pectoraux, des triceps et des épaules",
      criteria: ["Mains au sol, un peu plus écartées que la largeur des épaules.", "Bras et jambes tendus, pieds joints.", "Corps droit : alignement tête – bassin – talons.", "Fléchir les coudes pour descendre la poitrine vers le sol.", "Remonter en tendant les bras jusqu'à la position de départ."],
      safety: ["Corps gainé : ne pas cambrer le dos ni lever les fesses (pas de « V » inversé).", "Coudes à environ 45° du corps.", "Descente contrôlée."],
      muscles: ["Pectoraux", "Triceps", "Épaules (deltoïdes)", "Gainage (abdominaux, lombaires)"],
      stretches: [STRETCH.pecto, STRETCH.enfant],
    },
    "dips": {
      subtitle: "Renforcement des triceps",
      criteria: ["S'asseoir sur le rebord d'une chaise ou d'un banc stable.", "Mains de chaque côté des hanches, doigts vers l'avant.", "Avancer les pieds et décoller les fesses du support.", "Fléchir les coudes vers l'arrière pour descendre jusqu'à environ 90°.", "Pousser sur les mains pour revenir bras tendus."],
      safety: ["Dos proche du support pendant tout le mouvement.", "Épaules basses et stables : ne pas hausser les épaules.", "Coudes vers l'arrière, pas vers l'extérieur.", "Ne pas descendre sous 90° de flexion des coudes."],
      muscles: ["Triceps", "Deltoïdes antérieurs", "Pectoraux", "Stabilisateurs des épaules"],
      stretches: [STRETCH.triceps, STRETCH.pecto],
    },
    "pompe-diamant": {
      subtitle: "Renforcement des triceps et des pectoraux",
      criteria: ["Position de planche, bras tendus.", "Former un losange avec les mains sous la poitrine (index et pouces qui se touchent).", "Corps aligné : tête – épaules – bassin – chevilles.", "Fléchir les coudes vers l'arrière pour descendre la poitrine vers les mains, de manière contrôlée.", "Pousser sur les mains pour revenir bras tendus."],
      safety: ["Corps gainé pendant tout le mouvement.", "Ne pas creuser le bas du dos.", "Coudes dirigés vers l'arrière, pas vers l'extérieur.", "Mouvement contrôlé, sans à-coups."],
      muscles: ["Triceps (principal)", "Pectoraux", "Deltoïdes antérieurs", "Gainage (abdominaux)"],
      stretches: [STRETCH.triceps, STRETCH.poignet],
    },
    "pompes-spiderman": {
      subtitle: "Pectoraux, triceps et obliques",
      criteria: ["Position de pompe classique.", "En descendant, ramener un genou vers le coude du même côté.", "Remonter en replaçant la jambe.", "Alterner droite / gauche à chaque pompe."],
      safety: ["Corps gainé : le bassin ne s'affaisse pas.", "Coudes à environ 45° du corps.", "Mouvement contrôlé."],
      muscles: ["Pectoraux", "Triceps", "Obliques", "Fléchisseurs de hanche"],
      stretches: [STRETCH.pecto, STRETCH.oblique],
    },
    "pompes-piquees": {
      subtitle: "Épaules et triceps",
      criteria: ["Position en « V » inversé : mains et pieds au sol, fesses en l'air.", "Fléchir les coudes pour amener le sommet de la tête vers le sol, entre les mains.", "Pousser pour revenir bras tendus.", "Garder les jambes tendues et les fesses hautes."],
      safety: ["Descente lente : la tête ne doit pas toucher brutalement le sol.", "Coudes vers l'arrière, pas vers l'extérieur.", "Arrêter en cas de douleur aux épaules."],
      muscles: ["Épaules (deltoïdes)", "Triceps", "Trapèzes", "Gainage"],
      stretches: [STRETCH.epaule, STRETCH.triceps],
    },
    "inchworms": {
      subtitle: "Gainage, épaules et souplesse",
      criteria: ["Debout, jambes tendues, poser les mains au sol devant les pieds.", "Avancer les mains une par une jusqu'à la position de planche.", "Revenir en marchant avec les mains vers les pieds.", "Se redresser : 1 aller-retour = 1 répétition."],
      safety: ["Plier légèrement les genoux si besoin.", "Corps gainé en position de planche.", "Mouvement contrôlé, sans se laisser tomber."],
      muscles: ["Épaules", "Abdominaux", "Ischio-jambiers (étirement actif)"],
      stretches: [STRETCH.ischio, STRETCH.enfant],
    },
    "planche-dynamique": {
      subtitle: "Gainage, triceps et épaules",
      criteria: ["Position de planche sur les avant-bras.", "Poser une main puis l'autre pour monter en planche bras tendus.", "Redescendre sur un avant-bras puis l'autre.", "1 montée + 1 descente = 1 répétition."],
      safety: ["Bassin stable : ne pas balancer les hanches.", "Pieds un peu écartés pour plus de stabilité.", "Ne pas cambrer le dos."],
      muscles: ["Triceps", "Épaules", "Abdominaux", "Obliques"],
      stretches: [STRETCH.triceps, STRETCH.cobra],
    },
    "squat": {
      subtitle: "Renforcement des quadriceps, des fessiers et des ischio-jambiers",
      criteria: ["Debout, pieds un peu plus écartés que la largeur du bassin.", "Poids du corps sur les talons.", "Pousser les fesses vers l'arrière, comme pour s'asseoir sur une chaise.", "Descendre dos droit jusqu'aux cuisses parallèles au sol si possible.", "Remonter en poussant dans les talons."],
      safety: ["Buste droit, regard vers l'avant.", "Genoux dans l'axe des pieds.", "Talons toujours au sol.", "Descente contrôlée, bras devant pour l'équilibre."],
      muscles: ["Quadriceps", "Fessiers", "Ischio-jambiers", "Gainage (abdominaux, lombaires)"],
      stretches: [STRETCH.quadri, STRETCH.fessier],
    },
    "fentes": {
      subtitle: "Renforcement des quadriceps, des ischio-jambiers et des fessiers",
      criteria: ["Debout, pieds largeur bassin.", "Faire un grand pas vers l'avant.", "Fléchir les jambes jusqu'à environ 90° au genou avant.", "Le genou avant reste au-dessus du pied, le genou arrière descend vers le sol.", "Pousser dans le talon avant pour revenir."],
      safety: ["Dos droit, regard vers l'avant.", "Genou avant dans l'axe du pied.", "Talon avant toujours au sol.", "Mouvement contrôlé."],
      muscles: ["Quadriceps", "Ischio-jambiers", "Fessiers", "Gainage"],
      stretches: [STRETCH.psoas, STRETCH.ischio],
    },
    "pont-fessier": {
      subtitle: "Renforcement des fessiers et du bas du dos",
      criteria: ["Allongé sur le dos, genoux fléchis, pieds à plat, bras le long du corps.", "Pousser sur les talons et élever les hanches jusqu'à aligner genoux, hanches et épaules.", "Garder la contraction en haut environ 1 seconde.", "Redescendre lentement jusqu'à la position de départ."],
      safety: ["Dos neutre : éviter une cambrure excessive en haut.", "Genoux parallèles, alignés avec les hanches.", "Ne pas bloquer la respiration.", "Mouvement contrôlé."],
      muscles: ["Grand fessier", "Ischio-jambiers", "Lombaires"],
      stretches: [STRETCH.psoas, "Ischio-jambiers : assis, jambes tendues, aller chercher les pieds dos droit."],
    },
    "fentes-laterales": {
      subtitle: "Quadriceps, fessiers et adducteurs",
      criteria: ["Debout, pieds largeur bassin.", "Faire un grand pas sur le côté.", "Fléchir la jambe d'appui, l'autre jambe reste tendue, fesses vers l'arrière.", "Pousser sur la jambe fléchie pour revenir au centre.", "Alterner droite / gauche : 1 fente = 1 répétition."],
      safety: ["Genou fléchi dans l'axe du pied.", "Dos droit, buste légèrement penché en avant.", "Talons au sol."],
      muscles: ["Quadriceps", "Fessiers", "Adducteurs"],
      stretches: ["Adducteurs : jambes écartées, fléchir une jambe sur le côté.", STRETCH.quadri],
    },
    "squats-sumo": {
      subtitle: "Quadriceps, fessiers et adducteurs",
      criteria: ["Pieds très écartés, pointes de pieds vers l'extérieur.", "Descendre en poussant les genoux vers l'extérieur.", "Buste droit, cuisses jusqu'à l'horizontale si possible.", "Remonter en poussant dans les talons."],
      safety: ["Genoux dans l'axe des pieds (vers l'extérieur).", "Dos droit, regard devant.", "Talons au sol."],
      muscles: ["Adducteurs", "Fessiers", "Quadriceps"],
      stretches: [STRETCH.adduct, STRETCH.fessier],
    },
    "fire-hydrants": {
      subtitle: "Fessiers (moyen fessier)",
      criteria: ["À quatre pattes, mains sous les épaules, genoux sous les hanches.", "Lever un genou sur le côté, jambe fléchie à 90°, jusqu'à la hauteur de la hanche.", "Redescendre sans poser le genou.", "Moitié du temps à gauche, moitié à droite."],
      safety: ["Dos plat : ne pas tourner le buste.", "Mouvement lent et contrôlé.", "Regard vers le sol."],
      muscles: ["Moyen fessier", "Grand fessier", "Gainage"],
      stretches: [STRETCH.fessier, STRETCH.enfant],
    },
    "mollets": {
      subtitle: "Mollets et chevilles",
      criteria: ["Debout, pieds largeur bassin, près d'un mur pour l'équilibre.", "Monter sur la pointe des pieds le plus haut possible.", "Redescendre lentement les talons.", "Garder les jambes tendues."],
      safety: ["Mouvement lent, sans rebond.", "Corps droit et gainé.", "S'aider du mur si besoin."],
      muscles: ["Mollets (gastrocnémiens, soléaire)", "Stabilisateurs de la cheville"],
      stretches: [STRETCH.mollet, "Chevilles : cercles lents avec la pointe du pied, dans les deux sens."],
    },
    "rameur": {
      subtitle: "Renforcement des abdominaux et des fléchisseurs de hanche",
      criteria: ["Assis au sol, buste légèrement incliné vers l'arrière, dos droit.", "Genoux fléchis, pieds décollés du sol, bras tendus vers l'avant.", "Tendre les jambes, puis revenir en ramenant les genoux vers la poitrine.", "Garder les abdominaux contractés, sans poser les pieds au sol."],
      safety: ["Ne pas arrondir le dos : buste gainé.", "Pieds décollés pendant toute la série.", "Mouvement contrôlé, sans à-coups.", "Respiration régulière, ne pas bloquer."],
      muscles: ["Grand droit", "Obliques", "Fléchisseurs de hanche"],
      stretches: [STRETCH.cobra, STRETCH.psoas],
    },
    "crunch": {
      subtitle: "Renforcement des abdominaux (grand droit, transverse, obliques)",
      criteria: ["Allongé sur le dos, pieds à plat, genoux fléchis.", "Contracter les abdominaux pour monter le buste vers les genoux.", "Menton éloigné de la poitrine, sans tirer sur la nuque.", "Redescendre en déroulant le dos.", "Garder les abdominaux engagés à la montée comme à la descente."],
      safety: ["Ne pas tirer sur la nuque avec les mains.", "Menton dégagé (un poing entre le menton et la poitrine).", "Bas du dos en contact avec le sol."],
      muscles: ["Grand droit", "Transverse", "Obliques"],
      stretches: [STRETCH.cobra, STRETCH.oblique],
    },
    "planche-touches-epaule": {
      subtitle: "Gainage et coordination",
      criteria: ["Position de planche, bras tendus, mains sous les épaules.", "Corps aligné de la tête aux talons.", "Toucher l'épaule opposée avec la main libre, en alternant.", "Bassin stable : éviter toute rotation.", "Rythme régulier et maîtrisé."],
      safety: ["Corps gainé : éviter la cambrure.", "Ne pas verrouiller brutalement les coudes.", "Pieds un peu écartés pour plus de stabilité.", "Genoux au sol si besoin."],
      muscles: ["Abdominaux profonds", "Obliques", "Épaules (deltoïdes)", "Stabilisateurs des omoplates"],
      stretches: [STRETCH.epaule, STRETCH.enfant],
    },
    "v-ups": {
      subtitle: "Abdominaux (grand droit)",
      criteria: ["Allongé sur le dos, bras tendus derrière la tête, jambes tendues.", "Monter en même temps le buste et les jambes tendues.", "Toucher les pieds avec les mains en haut (forme de « V »).", "Redescendre de manière contrôlée."],
      safety: ["Le bas du dos ne se creuse pas en redescendant.", "Monter avec les abdominaux, sans lancer les bras.", "Plier les genoux si besoin."],
      muscles: ["Grand droit", "Fléchisseurs de hanche", "Transverse"],
      stretches: [STRETCH.cobra, STRETCH.psoas],
    },
    "superman": {
      subtitle: "Lombaires et dos",
      criteria: ["Allongé sur le ventre, bras tendus devant.", "Décoller en même temps les bras et les jambes du sol.", "Tenir 1 seconde en haut, regard vers le sol.", "Redescendre de manière contrôlée."],
      safety: ["Ne pas lever la tête : nuque dans l'alignement.", "Petite amplitude, sans forcer sur le bas du dos.", "Respirer normalement."],
      muscles: ["Lombaires", "Fessiers", "Dorsaux", "Épaules"],
      stretches: [STRETCH.enfant, "Dos : allongé sur le dos, ramener les genoux sur la poitrine."],
    },
    "bicyclette": {
      subtitle: "Abdominaux et obliques",
      criteria: ["Allongé sur le dos, mains aux tempes, épaules décollées.", "Ramener un genou vers la poitrine en tendant l'autre jambe.", "Tourner le buste pour amener le coude vers le genou opposé.", "Alterner : 1 coude-genou = 1 répétition."],
      safety: ["Ne pas tirer sur la nuque avec les mains.", "Bas du dos plaqué au sol.", "Mouvement contrôlé plutôt que rapide."],
      muscles: ["Obliques", "Grand droit", "Fléchisseurs de hanche"],
      stretches: [STRETCH.oblique, STRETCH.cobra],
    },
    "planche-twist": {
      subtitle: "Obliques et gainage",
      criteria: ["Position de planche sur les avant-bras, corps aligné.", "Faire pivoter le bassin pour rapprocher une hanche du sol.", "Revenir au centre, puis pivoter de l'autre côté.", "1 côté = 1 répétition."],
      safety: ["Coudes sous les épaules.", "Ne pas lever les fesses.", "Rotation contrôlée, sans toucher le sol."],
      muscles: ["Obliques", "Transverse", "Épaules"],
      stretches: [STRETCH.oblique, STRETCH.enfant],
    },
  };

  // Codes ScanProf : les 13 premiers sont ceux de la v1 (ne pas modifier).
  var EXO_CODES = {
    "burpees": "bu", "crunch": "cr", "dips": "di", "fentes": "fe", "jumping-jack": "jk", "mountain": "mt", "saut": "sa",
    "pompes": "po", "pompe-diamant": "pdi", "pont-fessier": "pf", "rameur": "ra", "squat": "sq", "planche-touches-epaule": "pt",
    "talons-fesses": "tf", "patineurs": "pa", "marche-ours": "mo",
    "pompes-spiderman": "psp", "pompes-piquees": "ppq", "inchworms": "iw", "planche-dynamique": "pdy",
    "fentes-laterales": "fl", "squats-sumo": "ssu", "fire-hydrants": "fh", "mollets": "em",
    "v-ups": "vu", "superman": "su", "bicyclette": "bi", "planche-twist": "ptw",
  };
  var EXO_ORDER = Object.keys(EXO_CODES);

  window.CT_DATA = { FAMILIES: FAMILIES, EXERCISES: EXERCISES, FICHES: FICHES, EXO_CODES: EXO_CODES, EXO_ORDER: EXO_ORDER };
})();
