/* Données Cross Training (reprises de la version 1 : mêmes exercices, niveaux, valeurs de base et codes ScanProf) */
window.CT_DATA = {
 "FAMILIES": [
  {
   "id": "cardio",
   "label": "Cardio"
  },
  {
   "id": "haut",
   "label": "Haut du corps"
  },
  {
   "id": "bas",
   "label": "Bas du corps"
  },
  {
   "id": "gainage",
   "label": "Gainage"
  }
 ],
 "EXERCISES": [
  {
   "id": "burpees",
   "name": "Burpees",
   "family": "cardio",
   "image": "img/burpees.jpg",
   "levels": [
    {
     "n": 1,
     "label": "Burpees décomposés",
     "expected": 12
    },
    {
     "n": 2,
     "label": "Burpees complets",
     "expected": 16
    }
   ]
  },
  {
   "id": "jumping-jack",
   "name": "Jumping jack",
   "family": "cardio",
   "image": "img/jumping-jack.jpg",
   "levels": [
    {
     "n": 1,
     "label": "Jack décomposé",
     "expected": 20
    },
    {
     "n": 2,
     "label": "Version complète",
     "expected": 30
    }
   ]
  },
  {
   "id": "mountain",
   "name": "Mountain climbers",
   "family": "cardio",
   "image": "img/mountain.jpg",
   "levels": [
    {
     "n": 1,
     "label": "Décomposé",
     "expected": 18
    },
    {
     "n": 2,
     "label": "Continu",
     "expected": 26
    }
   ]
  },
  {
   "id": "saut",
   "name": "Saut",
   "family": "cardio",
   "image": "img/saut.jpg",
   "levels": [
    {
     "n": 1,
     "label": "Décomposé",
     "expected": 20
    },
    {
     "n": 2,
     "label": "Continu",
     "expected": 30
    }
   ]
  },
  {
   "id": "pompes",
   "name": "Pompes",
   "family": "haut",
   "image": "img/pompes.jpg",
   "levels": [
    {
     "n": 1,
     "label": "Plan incliné",
     "expected": 12
    },
    {
     "n": 2,
     "label": "Classiques",
     "expected": 15
    }
   ]
  },
  {
   "id": "dips",
   "name": "Triceps dips",
   "family": "haut",
   "image": "img/dips.jpg",
   "levels": [
    {
     "n": 1,
     "label": "Jambes pliées",
     "expected": 10
    },
    {
     "n": 2,
     "label": "Jambes tendues",
     "expected": 14
    }
   ]
  },
  {
   "id": "pompe-diamant",
   "name": "Pompe diamant",
   "family": "haut",
   "image": "img/pompe-diamant.jpg",
   "levels": [
    {
     "n": 1,
     "label": "Sur genoux",
     "expected": 10
    },
    {
     "n": 2,
     "label": "Classique",
     "expected": 14
    }
   ]
  },
  {
   "id": "squat",
   "name": "Squat",
   "family": "bas",
   "image": "img/squat.jpg",
   "levels": [
    {
     "n": 1,
     "label": "Sit squat",
     "expected": 15
    },
    {
     "n": 2,
     "label": "Jump squat",
     "expected": 18
    }
   ]
  },
  {
   "id": "fentes",
   "name": "Fentes",
   "family": "bas",
   "image": "img/fentes.jpg",
   "levels": [
    {
     "n": 1,
     "label": "Lunge alterné",
     "expected": 14
    },
    {
     "n": 2,
     "label": "Jump lunge",
     "expected": 18
    }
   ]
  },
  {
   "id": "pont-fessier",
   "name": "Pont fessier",
   "family": "bas",
   "image": "img/pont-fessier.jpg",
   "levels": [
    {
     "n": 1,
     "label": "Classique",
     "expected": 18
    },
    {
     "n": 2,
     "label": "Pause 1 sec",
     "expected": 24
    }
   ]
  },
  {
   "id": "rameur",
   "name": "Rameur au sol",
   "family": "gainage",
   "image": "img/rameur.jpg",
   "levels": [
    {
     "n": 1,
     "label": "Statique",
     "expected": 20
    },
    {
     "n": 2,
     "label": "Dynamique",
     "expected": 26
    }
   ]
  },
  {
   "id": "crunch",
   "name": "Crunch",
   "family": "gainage",
   "image": "img/crunch.jpg",
   "levels": [
    {
     "n": 1,
     "label": "Crunch classique",
     "expected": 18
    },
    {
     "n": 2,
     "label": "Sit up & twist",
     "expected": 22
    }
   ]
  },
  {
   "id": "planche-touches-epaule",
   "name": "Planche touches épaules",
   "family": "gainage",
   "image": "img/planche-touches-epaule.jpg",
   "levels": [
    {
     "n": 1,
     "label": "Sur genoux",
     "expected": 20
    },
    {
     "n": 2,
     "label": "Classique",
     "expected": 30
    }
   ]
  }
 ],
 "EXO_CODES": {
  "burpees": "bu",
  "crunch": "cr",
  "dips": "di",
  "fentes": "fe",
  "jumping-jack": "jk",
  "mountain": "mt",
  "saut": "sa",
  "pompes": "po",
  "pompe-diamant": "pdi",
  "pont-fessier": "pf",
  "rameur": "ra",
  "squat": "sq",
  "planche-touches-epaule": "pt"
 },
 "EXO_ORDER": [
  "burpees",
  "crunch",
  "dips",
  "fentes",
  "jumping-jack",
  "mountain",
  "saut",
  "pompes",
  "pompe-diamant",
  "rameur",
  "squat",
  "pont-fessier",
  "planche-touches-epaule"
 ],
 "FICHES": {
  "fentes": {
   "criteria": [
    "Debout, jambes écartées à largeur de bassin, buste droit.",
    "Faire un grand pas vers l’avant ou l’arrière puis fléchir sur un axe vertical (≈90°).",
    "Talon avant aligné avec le genou, jambe arrière parallèle au sol sur la pointe.",
    "Pousser sur la jambe avant pour revenir en position initiale."
   ],
   "safety": [
    "Flexion uniquement sur axe vertical (ne pas pencher le buste).",
    "Appui fort sur le talon avant, regard loin devant.",
    "Abdos engagés pour garder le bassin stable."
   ],
   "muscles": [
    "Quadriceps",
    "Fessiers",
    "Ischios-jambiers"
   ],
   "stretches": [
    "Assis, jambe croisée pour libérer la hanche.",
    "Quadriceps debout sur appui."
   ],
   "levels": [
    {
     "title": "Niv 1 : Lunge",
     "description": "Fente alternée contrôlée."
    },
    {
     "title": "Niv 2 : Little jump lunge",
     "description": "Petits rebonds dynamiques."
    },
    {
     "title": "Niv 3 : Jump lunge",
     "description": "Sauter en changeant de jambe."
    }
   ]
  },
  "saut": {
   "criteria": [
    "Debout, réaliser un saut vertical contrôlé.",
    "Se regrouper en ramenant les genoux vers la poitrine.",
    "Redescendre en reprenant appui par la pointe du pied."
   ],
   "safety": [
    "Dos droit, regard loin.",
    "Utiliser les bras comme balancier.",
    "Amortir sur la pointe des pieds."
   ],
   "muscles": [
    "Quadriceps",
    "Fessiers",
    "Abdominaux"
   ],
   "stretches": [
    "Mollets contre un mur.",
    "Fessiers assis jambe croisée."
   ],
   "levels": [
    {
     "title": "Niv 1 : sans corde",
     "description": "Saut décomposé, bras actifs."
    },
    {
     "title": "Niv 2 : montées de genoux",
     "description": "Relever rapidement les genoux."
    },
    {
     "title": "Niv 3 : saut groupé",
     "description": "Groupé complet, genoux poitrine."
    }
   ]
  },
  "rameur": {
   "criteria": [
    "Allongé sur le dos, ramener les pieds près des fessiers.",
    "Contracter les abdos pour monter le buste vers les genoux.",
    "Redescendre en déroulant progressivement le dos.",
    "Toujours garder les abdominaux engagés."
   ],
   "safety": [
    "Dos droit, éviter de tirer sur la nuque.",
    "Regard vers l’avant.",
    "Respiration régulière."
   ],
   "muscles": [
    "Grand droit",
    "Quadriceps",
    "Transverse"
   ],
   "stretches": [
    "Cobra (dos cambré).",
    "Étirement dos assis jambes tendues."
   ],
   "levels": [
    {
     "title": "Niv 1 : Statique",
     "description": "Maintien cabine rameur."
    },
    {
     "title": "Niv 2 : Dynamique",
     "description": "Montée / descente fluide."
    },
    {
     "title": "Niv 3 : Jambes tendues",
     "description": "Balancier jambes allongées."
    }
   ]
  },
  "squat": {
   "criteria": [
    "Pieds un peu plus larges que le bassin.",
    "Poids sur les talons, dos droit.",
    "Pousser les fesses vers l’arrière comme sur une chaise.",
    "Genoux alignés, ne dépassent pas les orteils."
   ],
   "safety": [
    "Regard loin, buste droit.",
    "Bras devant pour équilibrer.",
    "Ne pas descendre sous la parallèle si perte de posture."
   ],
   "muscles": [
    "Quadriceps",
    "Ischios",
    "Fessiers"
   ],
   "stretches": [
    "Étirement fessiers assis.",
    "Quadriceps sur appui."
   ],
   "levels": [
    {
     "title": "Niv 1 : Sit squat",
     "description": "Assis / debout avec support."
    },
    {
     "title": "Niv 2 : Squat",
     "description": "Amplitude complète contrôlée."
    },
    {
     "title": "Niv 3 : Jump squat",
     "description": "Ajout d’un saut explosif."
    }
   ]
  },
  "dips": {
   "criteria": [
    "Assis sur un banc, mains de part et d’autre du bassin.",
    "Avancer les pieds et décoller les fesses.",
    "Plier les coudes pour descendre le buste verticalement.",
    "Pousser sur les mains pour remonter bras tendus."
   ],
   "safety": [
    "Buste droit, regarder loin.",
    "Épaules basses, coudes proches du corps.",
    "Ne pas aller sous la parallèle."
   ],
   "muscles": [
    "Triceps",
    "Biceps",
    "Deltoïdes",
    "Pectoraux"
   ],
   "stretches": [
    "Triceps au-dessus de la tête.",
    "Épaules bras croisé."
   ],
   "levels": [
    {
     "title": "Niv 1 : Relevé bouteille arrière",
     "description": "Charge légère bras arrière."
    },
    {
     "title": "Niv 2 : Levé bouteille plafond",
     "description": "Extension bras au-dessus de la tête."
    },
    {
     "title": "Niv 3 : Triceps dips",
     "description": "Version complète sur support."
    }
   ]
  },
  "crunch": {
   "criteria": [
    "Allongé sur le dos, genoux fléchis.",
    "Décoller les omoplates en contractant les abdos.",
    "Monter le buste en direction des genoux sans tirer sur la nuque.",
    "Redescendre en contrôlant pour revenir au sol."
   ],
   "safety": [
    "Menton éloigné de la poitrine (distance d’un poing).",
    "Ne pas tirer sur la nuque.",
    "Dos plaqué au sol."
   ],
   "muscles": [
    "Grand droit",
    "Transverse",
    "Obliques"
   ],
   "stretches": [
    "Cobra (extension dos).",
    "Inclinaison latérale assis."
   ],
   "levels": [
    {
     "title": "Niv 1 : Crunch",
     "description": "Montée classique."
    },
    {
     "title": "Niv 2 : Ab bikes",
     "description": "Alternance coude / genou."
    },
    {
     "title": "Niv 3 : Sit-up & twist",
     "description": "Rotation en haut du mouvement."
    }
   ]
  },
  "mountain": {
   "criteria": [
    "Départ en position de planche, mains sous les épaules.",
    "Ramener le genou droit vers le coude droit.",
    "Alterner rapidement avec le genou gauche.",
    "Garder le bassin bas et le dos gainé."
   ],
   "safety": [
    "Corps aligné tête-bassin-chevilles.",
    "Épaules au-dessus des poignets.",
    "Respiration régulière."
   ],
   "muscles": [
    "Quadriceps",
    "Fessiers",
    "Abdominaux",
    "Épaules"
   ],
   "stretches": [
    "Fente statique pour fléchisseurs.",
    "Épaules contre un mur."
   ],
   "levels": [
    {
     "title": "Niv 1 : Décomposé",
     "description": "Ramener un genou après l’autre."
    },
    {
     "title": "Niv 2 : Standard",
     "description": "Cadence modérée continue."
    },
    {
     "title": "Niv 3 : Groupé",
     "description": "Explosif avec léger saut."
    }
   ]
  },
  "jumping-jack": {
   "criteria": [
    "Debout bras le long du corps.",
    "Sauter en écartant pieds et bras au-dessus de la tête.",
    "Revenir pieds joints, bras le long du corps.",
    "Répéter en gardant le buste droit."
   ],
   "safety": [
    "Corps droit et gainé.",
    "Amortir sur l’avant-pied.",
    "Respiration rythmée."
   ],
   "muscles": [
    "Adducteurs",
    "Abducteurs",
    "Deltoïdes",
    "Tronc"
   ],
   "stretches": [
    "Papillon assis.",
    "Mollets contre mur."
   ],
   "levels": [
    {
     "title": "Niv 1 : Jack décomposé",
     "description": "Pas latéral + bras séparés."
    },
    {
     "title": "Niv 2 : Sans bras",
     "description": "Accent sur les jambes."
    },
    {
     "title": "Niv 3 : Jumping jack",
     "description": "Version complète avec bras."
    }
   ]
  },
  "burpees": {
   "criteria": [
    "Départ debout, pieds largeur d’épaules.",
    "Descendre en squat, poser les mains au sol.",
    "Lancer les jambes en arrière pour être en planche.",
    "Revenir pieds sous les hanches puis sauter bras en l’air."
   ],
   "safety": [
    "Garder le dos gainé lors de la planche.",
    "Mains sous les épaules, genoux légèrement ouverts.",
    "Amortir le saut sur la pointe des pieds."
   ],
   "muscles": [
    "Épaules",
    "Pectoraux",
    "Quadriceps",
    "Grand droit"
   ],
   "stretches": [
    "Cobra / extension dos.",
    "Position de l’enfant."
   ],
   "levels": [
    {
     "title": "Niv 1 : Climber",
     "description": "Burpee sans saut."
    },
    {
     "title": "Niv 2 : Rebond",
     "description": "Ajout d’un saut modéré."
    },
    {
     "title": "Niv 3 : Burpee complet",
     "description": "Avec flexion et saut explosif."
    }
   ]
  },
  "pompes": {
   "criteria": [
    "Placer les mains un peu plus larges que les épaules.",
    "Corps gainé, épaules au-dessus des mains.",
    "Descendre menton/poitrine/hanches ensemble vers le sol.",
    "Pousser sur les mains pour revenir bras tendus."
   ],
   "safety": [
    "Alignement tête-bassin-chevilles.",
    "Ne pas baisser ni monter les hanches.",
    "Coudes proches du corps, épaules basses."
   ],
   "muscles": [
    "Pectoraux",
    "Triceps",
    "Deltoïdes",
    "Grand droit"
   ],
   "stretches": [
    "Épaules mains croisées.",
    "Triceps assis."
   ],
   "levels": [
    {
     "title": "Niv 1 : Plan incliné",
     "description": "Pompe contre support haut."
    },
    {
     "title": "Niv 2 : Genoux",
     "description": "Pompe au sol sur les genoux."
    },
    {
     "title": "Niv 3 : Standard",
     "description": "Pompe complète jambes tendues."
    }
   ]
  }
 }
};
