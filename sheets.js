const FAMILY_LABELS = {
  cardio: 'Cardio',
  lower: 'Membres inférieurs',
  upper: 'Membres supérieurs',
  core: 'Gainage',
};

const SHEET_DATA = [
  {
    id: 'fentes',
    title: 'FENTE',
    family: 'lower',
    theme: { from: '#f97316', to: '#fb923c' },
    schema: { src: 'assets/exercises/fentes.jpg', alt: 'Illustration fente avant' },
    criteria: [
      'Debout, jambes écartées à largeur de bassin, buste droit.',
      'Faire un grand pas vers l’avant ou l’arrière puis fléchir sur un axe vertical (≈90°).',
      'Talon avant aligné avec le genou, jambe arrière parallèle au sol sur la pointe.',
      'Pousser sur la jambe avant pour revenir en position initiale.',
    ],
    safety: [
      'Flexion uniquement sur axe vertical (ne pas pencher le buste).',
      'Appui fort sur le talon avant, regard loin devant.',
      'Abdos engagés pour garder le bassin stable.',
    ],
    muscles: ['Quadriceps', 'Fessiers', 'Ischios-jambiers'],
    stretches: ['Assis, jambe croisée pour libérer la hanche.', 'Quadriceps debout sur appui.'],
    levels: [
      { title: 'Niv 1 : Lunge', description: 'Fente alternée contrôlée.', image: 'assets/exercises/fentes.jpg' },
      { title: 'Niv 2 : Little jump lunge', description: 'Petits rebonds dynamiques.', image: 'assets/exercises/fentes.jpg' },
      { title: 'Niv 3 : Jump lunge', description: 'Sauter en changeant de jambe.', image: 'assets/exercises/fentes.jpg' },
    ],
  },
  {
    id: 'saut',
    title: 'SAUT GROUPÉ',
    family: 'cardio',
    theme: { from: '#fbbf24', to: '#fde047' },
    schema: { src: 'assets/exercises/saut.jpg', alt: 'Saut vertical' },
    criteria: [
      'Debout, réaliser un saut vertical contrôlé.',
      'Se regrouper en ramenant les genoux vers la poitrine.',
      'Redescendre en reprenant appui par la pointe du pied.',
    ],
    safety: ['Dos droit, regard loin.', 'Utiliser les bras comme balancier.', 'Amortir sur la pointe des pieds.'],
    muscles: ['Quadriceps', 'Fessiers', 'Abdominaux'],
    stretches: ['Mollets contre un mur.', 'Fessiers assis jambe croisée.'],
    levels: [
      { title: 'Niv 1 : sans corde', description: 'Saut décomposé, bras actifs.', image: 'assets/exercises/saut.jpg' },
      { title: 'Niv 2 : montées de genoux', description: 'Relever rapidement les genoux.', image: 'assets/exercises/shadow.jpg' },
      { title: 'Niv 3 : saut groupé', description: 'Groupé complet, genoux poitrine.', image: 'assets/exercises/saut.jpg' },
    ],
  },
  {
    id: 'rameur',
    title: 'RAMEUR SOL',
    family: 'core',
    theme: { from: '#9ca3af', to: '#cbd5f5' },
    schema: { src: 'assets/exercises/rameur.jpg', alt: 'Rameur sur tapis' },
    criteria: [
      'Allongé sur le dos, ramener les pieds près des fessiers.',
      'Contracter les abdos pour monter le buste vers les genoux.',
      'Redescendre en déroulant progressivement le dos.',
      'Toujours garder les abdominaux engagés.',
    ],
    safety: ['Dos droit, éviter de tirer sur la nuque.', 'Regard vers l’avant.', 'Respiration régulière.'],
    muscles: ['Grand droit', 'Quadriceps', 'Transverse'],
    stretches: ['Cobra (dos cambré).', 'Étirement dos assis jambes tendues.'],
    levels: [
      { title: 'Niv 1 : Statique', description: 'Maintien cabine rameur.', image: 'assets/exercises/rameur.jpg' },
      { title: 'Niv 2 : Dynamique', description: 'Montée / descente fluide.', image: 'assets/exercises/rameur.jpg' },
      { title: 'Niv 3 : Jambes tendues', description: 'Balancier jambes allongées.', image: 'assets/exercises/rameur.jpg' },
    ],
  },
  {
    id: 'squat',
    title: 'SQUAT',
    family: 'lower',
    theme: { from: '#f97316', to: '#fa5f1a' },
    schema: { src: 'assets/exercises/squat.jpg', alt: 'Squat' },
    criteria: [
      'Pieds un peu plus larges que le bassin.',
      'Poids sur les talons, dos droit.',
      'Pousser les fesses vers l’arrière comme sur une chaise.',
      'Genoux alignés, ne dépassent pas les orteils.',
    ],
    safety: [
      'Regard loin, buste droit.',
      'Bras devant pour équilibrer.',
      'Ne pas descendre sous la parallèle si perte de posture.',
    ],
    muscles: ['Quadriceps', 'Ischios', 'Fessiers'],
    stretches: ['Étirement fessiers assis.', 'Quadriceps sur appui.'],
    levels: [
      { title: 'Niv 1 : Sit squat', description: 'Assis / debout avec support.', image: 'assets/exercises/squat.jpg' },
      { title: 'Niv 2 : Squat', description: 'Amplitude complète contrôlée.', image: 'assets/exercises/squat.jpg' },
      { title: 'Niv 3 : Jump squat', description: 'Ajout d’un saut explosif.', image: 'assets/exercises/squat.jpg' },
    ],
  },
  {
    id: 'dips',
    title: 'TRICEPS DIPS',
    family: 'upper',
    theme: { from: '#2dd4bf', to: '#5eead4' },
    schema: { src: 'assets/exercises/dips.jpg', alt: 'Triceps dips sur banc' },
    criteria: [
      'Assis sur un banc, mains de part et d’autre du bassin.',
      'Avancer les pieds et décoller les fesses.',
      'Plier les coudes pour descendre le buste verticalement.',
      'Pousser sur les mains pour remonter bras tendus.',
    ],
    safety: ['Buste droit, regarder loin.', 'Épaules basses, coudes proches du corps.', 'Ne pas aller sous la parallèle.'],
    muscles: ['Triceps', 'Biceps', 'Deltoïdes', 'Pectoraux'],
    stretches: ['Triceps au-dessus de la tête.', 'Épaules bras croisé.'],
    levels: [
      { title: 'Niv 1 : Relevé bouteille arrière', description: 'Charge légère bras arrière.', image: 'assets/exercises/dips.jpg' },
      { title: 'Niv 2 : Levé bouteille plafond', description: 'Extension bras au-dessus de la tête.', image: 'assets/exercises/dips.jpg' },
      { title: 'Niv 3 : Triceps dips', description: 'Version complète sur support.', image: 'assets/exercises/dips.jpg' },
    ],
  },
  {
    id: 'crunch',
    title: 'CRUNCH',
    family: 'core',
    theme: { from: '#9ca3af', to: '#d1d5db' },
    schema: { src: 'assets/exercises/crunch.jpg', alt: 'Crunch au sol' },
    criteria: [
      'Allongé sur le dos, genoux fléchis.',
      'Décoller les omoplates en contractant les abdos.',
      'Monter le buste en direction des genoux sans tirer sur la nuque.',
      'Redescendre en contrôlant pour revenir au sol.',
    ],
    safety: ['Menton éloigné de la poitrine (distance d’un poing).', 'Ne pas tirer sur la nuque.', 'Dos plaqué au sol.'],
    muscles: ['Grand droit', 'Transverse', 'Obliques'],
    stretches: ['Cobra (extension dos).', 'Inclinaison latérale assis.'],
    levels: [
      { title: 'Niv 1 : Crunch', description: 'Montée classique.', image: 'assets/exercises/crunch.jpg' },
      { title: 'Niv 2 : Ab bikes', description: 'Alternance coude / genou.', image: 'assets/exercises/crunch.jpg' },
      { title: 'Niv 3 : Sit-up & twist', description: 'Rotation en haut du mouvement.', image: 'assets/exercises/crunch.jpg' },
    ],
  },
  {
    id: 'mountain',
    title: 'MOUNTAIN CLIMBERS',
    family: 'cardio',
    theme: { from: '#fbbf24', to: '#fde047' },
    schema: { src: 'assets/exercises/mountain.jpg', alt: 'Mountain climbers' },
    criteria: [
      'Départ en position de planche, mains sous les épaules.',
      'Ramener le genou droit vers le coude droit.',
      'Alterner rapidement avec le genou gauche.',
      'Garder le bassin bas et le dos gainé.',
    ],
    safety: ['Corps aligné tête-bassin-chevilles.', 'Épaules au-dessus des poignets.', 'Respiration régulière.'],
    muscles: ['Quadriceps', 'Fessiers', 'Abdominaux', 'Épaules'],
    stretches: ['Fente statique pour fléchisseurs.', 'Épaules contre un mur.'],
    levels: [
      { title: 'Niv 1 : Décomposé', description: 'Ramener un genou après l’autre.', image: 'assets/exercises/mountain.jpg' },
      { title: 'Niv 2 : Standard', description: 'Cadence modérée continue.', image: 'assets/exercises/mountain.jpg' },
      { title: 'Niv 3 : Groupé', description: 'Explosif avec léger saut.', image: 'assets/exercises/mountain.jpg' },
    ],
  },
  {
    id: 'jumping',
    title: 'JUMPING JACK',
    family: 'cardio',
    theme: { from: '#fbbf24', to: '#ffd95b' },
    schema: { src: 'assets/exercises/jumping.jpg', alt: 'Jumping jack' },
    criteria: [
      'Debout bras le long du corps.',
      'Sauter en écartant pieds et bras au-dessus de la tête.',
      'Revenir pieds joints, bras le long du corps.',
      'Répéter en gardant le buste droit.',
    ],
    safety: ['Corps droit et gainé.', 'Amortir sur l’avant-pied.', 'Respiration rythmée.'],
    muscles: ['Adducteurs', 'Abducteurs', 'Deltoïdes', 'Tronc'],
    stretches: ['Papillon assis.', 'Mollets contre mur.'],
    levels: [
      { title: 'Niv 1 : Jack décomposé', description: 'Pas latéral + bras séparés.', image: 'assets/exercises/jumping.jpg' },
      { title: 'Niv 2 : Sans bras', description: 'Accent sur les jambes.', image: 'assets/exercises/jumping.jpg' },
      { title: 'Niv 3 : Jumping jack', description: 'Version complète avec bras.', image: 'assets/exercises/jumping.jpg' },
    ],
  },
  {
    id: 'burpees',
    title: 'BURPEES',
    family: 'cardio',
    theme: { from: '#fbbf24', to: '#facc15' },
    schema: { src: 'assets/exercises/burpees.jpg', alt: 'Burpee' },
    criteria: [
      'Départ debout, pieds largeur d’épaules.',
      'Descendre en squat, poser les mains au sol.',
      'Lancer les jambes en arrière pour être en planche.',
      'Revenir pieds sous les hanches puis sauter bras en l’air.',
    ],
    safety: [
      'Garder le dos gainé lors de la planche.',
      'Mains sous les épaules, genoux légèrement ouverts.',
      'Amortir le saut sur la pointe des pieds.',
    ],
    muscles: ['Épaules', 'Pectoraux', 'Quadriceps', 'Grand droit'],
    stretches: ['Cobra / extension dos.', 'Position de l’enfant.'],
    levels: [
      { title: 'Niv 1 : Climber', description: 'Burpee sans saut.', image: 'assets/exercises/burpees.jpg' },
      { title: 'Niv 2 : Rebond', description: 'Ajout d’un saut modéré.', image: 'assets/exercises/burpees.jpg' },
      { title: 'Niv 3 : Burpee complet', description: 'Avec flexion et saut explosif.', image: 'assets/exercises/burpees.jpg' },
    ],
  },
  {
    id: 'pompes',
    title: 'POMPE',
    family: 'upper',
    theme: { from: '#2dd4bf', to: '#5eead4' },
    schema: { src: 'assets/exercises/pompes.jpg', alt: 'Pompes' },
    criteria: [
      'Placer les mains un peu plus larges que les épaules.',
      'Corps gainé, épaules au-dessus des mains.',
      'Descendre menton/poitrine/hanches ensemble vers le sol.',
      'Pousser sur les mains pour revenir bras tendus.',
    ],
    safety: [
      'Alignement tête-bassin-chevilles.',
      'Ne pas baisser ni monter les hanches.',
      'Coudes proches du corps, épaules basses.',
    ],
    muscles: ['Pectoraux', 'Triceps', 'Deltoïdes', 'Grand droit'],
    stretches: ['Épaules mains croisées.', 'Triceps assis.'],
    levels: [
      { title: 'Niv 1 : Plan incliné', description: 'Pompe contre support haut.', image: 'assets/exercises/pompes.jpg' },
      { title: 'Niv 2 : Genoux', description: 'Pompe au sol sur les genoux.', image: 'assets/exercises/pompes.jpg' },
      { title: 'Niv 3 : Standard', description: 'Pompe complète jambes tendues.', image: 'assets/exercises/pompes.jpg' },
    ],
  },
];

const container = document.querySelector('.sheets-grid');
const template = document.getElementById('sheet-template');

if (container && template) {
  SHEET_DATA.forEach((sheet) => {
    const fragment = template.content.cloneNode(true);
    const head = fragment.querySelector('.sheet-head');
    const titleEl = fragment.querySelector('h2');
    const familyEl = fragment.querySelector('.family-label');
    const schemaImg = fragment.querySelector('.schema-img');
    const criteriaList = fragment.querySelector('.criteria-block .bullet-list');
    const safetyList = fragment.querySelector('.safety-block .bullet-list');
    const muscleList = fragment.querySelector('.muscles-block .split-list');
    const stretchesList = fragment.querySelector('.stretches-block .bullet-list');
    const levelsGrid = fragment.querySelector('.levels-grid');

    if (head && sheet.theme) {
      head.style.background = `linear-gradient(120deg, ${sheet.theme.from}, ${sheet.theme.to})`;
    }
    if (titleEl) titleEl.textContent = sheet.title;
    if (familyEl) familyEl.textContent = FAMILY_LABELS[sheet.family] || '';
    if (schemaImg) {
      schemaImg.src = sheet.schema.src;
      schemaImg.alt = sheet.schema.alt || sheet.title;
    }
    fillList(criteriaList, sheet.criteria, true);
    fillList(safetyList, sheet.safety);
    fillList(muscleList, sheet.muscles, false, true);
    fillList(stretchesList, sheet.stretches);

    if (levelsGrid) {
      sheet.levels.forEach((level) => {
        const card = document.createElement('div');
        card.className = 'level-card';
        const img = document.createElement('img');
        img.src = level.image;
        img.alt = level.title;
        const heading = document.createElement('h4');
        heading.textContent = level.title;
        const desc = document.createElement('p');
        desc.textContent = level.description;
        card.appendChild(img);
        card.appendChild(heading);
        card.appendChild(desc);
        levelsGrid.appendChild(card);
      });
    }
    container.appendChild(fragment);
  });
}

function fillList(target, items = [], numbered = false, columns = false) {
  if (!target || !items.length) return;
  target.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    target.appendChild(li);
  });
  if (columns) {
    target.classList.add('split-list');
  }
  if (numbered) {
    target.classList.add('numbered');
  }
}
