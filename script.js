'use strict';

const STORAGE_KEY = 'CT_APP_STATE_V3';
const STORAGE_VERSION = 3;
const TRAINING_SECONDS = 60;
const BLOCK_DURATION_SECONDS = 120;
const ALLOWED_SKILL_DURATIONS = [6, 10, 16, 20];
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><rect width='320' height='200' rx='24' fill='%23e2e8f0'/><text x='50%' y='50%' font-family='Inter,Arial' font-size='18' fill='%2394a3b8' text-anchor='middle' dominant-baseline='middle'>Visuel manquant</text></svg>";

const FAMILIES = [
  { id: 'cardio', label: 'Cardio' },
  { id: 'haut', label: 'Haut du corps' },
  { id: 'bas', label: 'Bas du corps' },
  { id: 'gainage', label: 'Gainage' },
];

const EXERCISES = [
  {
    id: 'burpees',
    name: 'Burpees',
    family: 'cardio',
    image: 'assets/burpees.jpg',
    levels: [
      { n: 1, label: 'Burpees décomposés', expected: 12 },
      { n: 2, label: 'Burpees complets', expected: 16 },
    ],
  },
  {
    id: 'jumping-jack',
    name: 'Jumping jack',
    family: 'cardio',
    image: 'assets/jumping-jack.jpg',
    levels: [
      { n: 1, label: 'Jack décomposé', expected: 20 },
      { n: 2, label: 'Version complète', expected: 30 },
    ],
  },
  {
    id: 'mountain',
    name: 'Mountain climbers',
    family: 'cardio',
    image: 'assets/mountain.jpg',
    levels: [
      { n: 1, label: 'Décomposé', expected: 18 },
      { n: 2, label: 'Continu', expected: 26 },
    ],
  },
  {
    id: 'pompes',
    name: 'Pompes',
    family: 'haut',
    image: 'assets/pompes.jpg',
    levels: [
      { n: 1, label: 'Plan incliné', expected: 12 },
      { n: 2, label: 'Classiques', expected: 15 },
    ],
  },
  {
    id: 'dips',
    name: 'Triceps dips',
    family: 'haut',
    image: 'assets/dips.jpg',
    levels: [
      { n: 1, label: 'Jambes pliées', expected: 10 },
      { n: 2, label: 'Jambes tendues', expected: 14 },
    ],
  },
  {
    id: 'squat',
    name: 'Squat',
    family: 'bas',
    image: 'assets/squat.jpg',
    levels: [
      { n: 1, label: 'Sit squat', expected: 15 },
      { n: 2, label: 'Jump squat', expected: 18 },
    ],
  },
  {
    id: 'fentes',
    name: 'Fentes',
    family: 'bas',
    image: 'assets/fentes.jpg',
    levels: [
      { n: 1, label: 'Lunge alterné', expected: 14 },
      { n: 2, label: 'Jump lunge', expected: 18 },
    ],
  },
  {
    id: 'rameur',
    name: 'Rameur au sol',
    family: 'gainage',
    image: 'assets/rameur.jpg',
    levels: [
      { n: 1, label: 'Statique', expected: 20 },
      { n: 2, label: 'Dynamique', expected: 26 },
    ],
  },
  {
    id: 'crunch',
    name: 'Crunch',
    family: 'gainage',
    image: 'assets/crunch.jpg',
    levels: [
      { n: 1, label: 'Crunch classique', expected: 18 },
      { n: 2, label: 'Sit up & twist', expected: 22 },
    ],
  },
];

const COURSE = {
  id: 'course',
  name: 'Course',
  image: 'assets/saut.jpg',
};

const defaultState = () => ({
  v: STORAGE_VERSION,
  updatedAt: null,
  student: { prenom: '', nom: '', classe: '', observer: '' },
  training: {
    activeId: '',
    history: {},
    filter: 'all',
  },
  skill: {
    selection: { cardio: '', haut: '', bas: '', gainage: '' },
    levels: { cardio: 1, haut: 1, bas: 1, gainage: 1 },
    duration: 10,
    inputs: {
      cardio: { expected: '', done: '' },
      haut: { expected: '', done: '' },
      bas: { expected: '', done: '' },
      gainage: { expected: '', done: '' },
    },
    courseOk: false,
    session: null,
    lastSession: null,
  },
});

let state = loadState();
const ui = {};
const trainingTimer = { running: false, remaining: TRAINING_SECONDS, interval: null };
const skillPracticeTimer = { running: false, seconds: 0, interval: null };

init();

function init() {
  cacheElements();
  bindIdentity();
  bindNavigation();
  renderTrainingFilters();
  renderTrainingGrid();
  renderTrainingHistory();
  renderSkillBuilder();
  renderSkillInputs();
  bindActions();
  updateStatus();
  openTab('training');
}

function cacheElements() {
  ui.status = document.getElementById('status-pill');
  ui.first = document.getElementById('student-first');
  ui.last = document.getElementById('student-last');
  ui.classe = document.getElementById('student-class');
  ui.observer = document.getElementById('observer');
  ui.tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  ui.panels = Array.from(document.querySelectorAll('.tab-panel'));
  ui.trainingGrid = document.getElementById('training-grid');
  ui.trainingHistory = document.getElementById('training-history');
  ui.trainingActiveName = document.getElementById('training-active-name');
  ui.trainingActiveHint = document.getElementById('training-active-hint');
  ui.trainingActiveMeta = document.getElementById('training-active-meta');
  ui.trainingTimer = document.getElementById('training-timer');
  ui.trainingTimerHint = document.getElementById('training-timer-hint');
  ui.trainingStart = document.getElementById('training-start');
  ui.trainingPause = document.getElementById('training-pause');
  ui.trainingReset = document.getElementById('training-reset');
  ui.trainingInputN1 = document.getElementById('training-input-n1');
  ui.trainingInputN2 = document.getElementById('training-input-n2');
  ui.trainingSave = document.getElementById('training-save');
  ui.trainingSaveStatus = document.getElementById('training-save-status');
  ui.trainingQrBtn = document.getElementById('training-qr-btn');
  ui.trainingQrOutput = document.getElementById('training-qr-output');
  ui.trainingQrSize = document.getElementById('training-qr-size');
  ui.skillBuilder = document.getElementById('skill-builder');
  ui.skillDuration = document.getElementById('skill-duration');
  ui.skillPracticeTimer = document.getElementById('skill-practice-timer');
  ui.skillBlockCounter = document.getElementById('skill-block-counter');
  ui.skillTimerStatus = document.getElementById('skill-timer-status');
  ui.skillStart = document.getElementById('skill-start');
  ui.skillPause = document.getElementById('skill-pause');
  ui.skillEndBlock = document.getElementById('skill-end-block');
  ui.skillReset = document.getElementById('skill-reset');
  ui.skillResultsGrid = document.getElementById('skill-results-grid');
  ui.skillCourseOk = document.getElementById('skill-course-ok');
  ui.skillValidate = document.getElementById('skill-validate-block');
  ui.skillResetBlock = document.getElementById('skill-reset-block');
  ui.skillSaveStatus = document.getElementById('skill-save-status');
  ui.skillSessionLog = document.getElementById('skill-session-log');
  ui.skillQrBtn = document.getElementById('skill-qr-btn');
  ui.skillQrOutput = document.getElementById('skill-qr-output');
  ui.skillQrSize = document.getElementById('skill-qr-size');
  ui.exportBtn = document.getElementById('export-btn');
  ui.importInput = document.getElementById('import-input');
  ui.resetBtn = document.getElementById('reset-btn');
  ui.skillNewSession = document.getElementById('skill-new-session');
  ui.modal = document.getElementById('modal');
  ui.modalBody = document.getElementById('modal-body');
  ui.modalClose = document.getElementById('modal-close');
}

function bindIdentity() {
  [
    { el: ui.first, key: 'prenom' },
    { el: ui.last, key: 'nom' },
    { el: ui.classe, key: 'classe' },
    { el: ui.observer, key: 'observer' },
  ].forEach(({ el, key }) => {
    if (!el) return;
    el.value = state.student[key] || '';
    el.addEventListener('input', () => {
      state.student[key] = el.value.trim();
      persistState();
    });
  });
}

function bindNavigation() {
  ui.tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => openTab(btn.dataset.tab));
  });
}

function bindActions() {
  ui.trainingStart.addEventListener('click', startTrainingTimer);
  ui.trainingPause.addEventListener('click', () => pauseTrainingTimer(true));
  ui.trainingReset.addEventListener('click', resetTrainingTimer);
  ui.trainingSave.addEventListener('click', saveTrainingScore);
  ui.trainingQrBtn.addEventListener('click', handleTrainingQr);

  ui.skillStart?.addEventListener('click', startSkillPractice);
  ui.skillPause?.addEventListener('click', () => pauseSkillPractice(true));
  ui.skillEndBlock?.addEventListener('click', () => completeSkillPractice(false));
  ui.skillReset?.addEventListener('click', () => resetSkillPractice(true));
  ui.skillDuration?.addEventListener('change', handleSkillDurationChange);
  ui.skillCourseOk.addEventListener('change', () => {
    state.skill.courseOk = ui.skillCourseOk.checked;
    persistState(false);
  });
  ui.skillValidate?.addEventListener('click', validateSkillBlock);
  ui.skillResetBlock?.addEventListener('click', () => resetSkillInputs(true));
  ui.skillQrBtn?.addEventListener('click', handleSkillQr);
  ui.skillNewSession?.addEventListener('click', () => {
    resetSkillSession('Nouvelle séance Skill prête.');
    persistState();
  });

  ui.exportBtn.addEventListener('click', exportState);
  ui.importInput.addEventListener('change', importStateFromFile);
  ui.resetBtn.addEventListener('click', resetAll);

  ui.modalClose.addEventListener('click', closeModal);
  ui.modal.addEventListener('click', (event) => {
    if (event.target === ui.modal) closeModal();
  });
}

function openTab(tab) {
  ui.tabButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tab));
  ui.panels.forEach((panel) => panel.classList.toggle('hidden', panel.dataset.panel !== tab));
}

// ------------------ Training ------------------
function renderTrainingFilters() {
  const container = document.createElement('div');
  container.className = 'filter-bar';
  const filters = [{ id: 'all', label: 'Tous' }, ...FAMILIES];
  filters.forEach((filter) => {
    const btn = document.createElement('button');
    btn.className = 'pill-filter';
    btn.textContent = filter.label;
    btn.dataset.filter = filter.id;
    if (state.training.filter === filter.id) btn.classList.add('active');
    btn.addEventListener('click', () => {
      state.training.filter = filter.id;
      refreshTrainingFilterButtons();
      renderTrainingGrid();
      persistState(false);
    });
    container.appendChild(btn);
  });
  const trainingPanel = document.getElementById('training-panel');
  if (trainingPanel && !trainingPanel.querySelector('.filter-bar')) {
    trainingPanel.insertBefore(container, trainingPanel.children[1]);
  }
  ui.trainingFilterButtons = container.querySelectorAll('.pill-filter');
  refreshTrainingFilterButtons();
}

function refreshTrainingFilterButtons() {
  ui.trainingFilterButtons?.forEach((btn) => btn.classList.toggle('active', btn.dataset.filter === state.training.filter));
}

function renderTrainingGrid() {
  if (!ui.trainingGrid) return;
  refreshTrainingFilterButtons();
  ui.trainingGrid.innerHTML = '';
  const list = EXERCISES.filter((ex) => state.training.filter === 'all' || ex.family === state.training.filter);
  list.forEach((exercise) => {
    const card = document.createElement('article');
    card.className = 'exercise-card';
    if (state.training.activeId === exercise.id) card.classList.add('is-active');
    const img = document.createElement('img');
    img.src = exercise.image;
    img.alt = exercise.name;
    img.onerror = () => {
      img.onerror = null;
      img.src = PLACEHOLDER_IMG;
    };
    card.appendChild(img);
    const title = document.createElement('h3');
    title.textContent = exercise.name;
    card.appendChild(title);
    const fam = document.createElement('p');
    fam.className = 'family';
    fam.textContent = FAMILIES.find((f) => f.id === exercise.family)?.label || exercise.family;
    card.appendChild(fam);
    const levels = document.createElement('p');
    levels.className = 'hint';
    levels.textContent = exercise.levels.map((lvl) => `N${lvl.n} · ${lvl.label}`).join(' • ');
    card.appendChild(levels);
    const best = document.createElement('p');
    best.className = 'best-line';
    const entry = state.training.history[exercise.id];
    if (entry?.bestN1 != null || entry?.bestN2 != null) {
      best.textContent = `Records N1 ${entry.bestN1 ?? '—'} / N2 ${entry.bestN2 ?? '—'}`;
    } else {
      best.textContent = 'Aucun score enregistré';
    }
    card.appendChild(best);
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const selectBtn = document.createElement('button');
    selectBtn.className = 'btn primary';
    selectBtn.textContent = 'Sélectionner';
    selectBtn.addEventListener('click', () => {
      state.training.activeId = exercise.id;
      renderTrainingActive();
      persistState(false);
    });
    const ficheBtn = document.createElement('button');
    ficheBtn.className = 'btn ghost';
    ficheBtn.textContent = 'Voir la fiche';
    ficheBtn.addEventListener('click', () => openExerciseModal(exercise));
    actions.appendChild(selectBtn);
    actions.appendChild(ficheBtn);
    card.appendChild(actions);
    ui.trainingGrid.appendChild(card);
  });
  renderTrainingActive();
}

function renderTrainingActive() {
  const exercise = EXERCISES.find((ex) => ex.id === state.training.activeId);
  if (!exercise) {
    ui.trainingActiveName.textContent = 'Aucun exercice';
    ui.trainingActiveHint.textContent = 'Sélectionne un exercice dans la liste.';
    ui.trainingActiveMeta.textContent = '';
    ui.trainingInputN1.value = '';
    ui.trainingInputN2.value = '';
    return;
  }
  ui.trainingActiveName.textContent = exercise.name;
  ui.trainingActiveHint.textContent = exercise.levels
    .map((lvl) => `N${lvl.n} · ${lvl.label} (${lvl.expected} reps)`)
    .join(' • ');
  const info = state.training.history[exercise.id];
  if (info?.lastAt) {
    ui.trainingActiveMeta.textContent = `Dernier relevé : N1 ${info.lastN1 ?? '—'} / N2 ${info.lastN2 ?? '—'} (${formatDate(info.lastAt)})`;
    ui.trainingInputN1.value = info.lastN1 ?? '';
    ui.trainingInputN2.value = info.lastN2 ?? '';
  } else {
    ui.trainingActiveMeta.textContent = 'Aucun relevé enregistré.';
    ui.trainingInputN1.value = '';
    ui.trainingInputN2.value = '';
  }
}

function startTrainingTimer() {
  if (!state.training.activeId) {
    ui.trainingTimerHint.textContent = 'Choisis un exercice avant de lancer le timer.';
    return;
  }
  if (trainingTimer.running) return;
  if (trainingTimer.remaining <= 0) resetTrainingTimer();
  trainingTimer.running = true;
  ui.trainingTimerHint.textContent = 'Travail en cours…';
  trainingTimer.interval = setInterval(() => {
    if (trainingTimer.remaining <= 1) {
      pauseTrainingTimer(false);
      trainingTimer.remaining = 0;
      updateTrainingTimer();
      ui.trainingTimerHint.textContent = 'Terminé ! Renseigne les répétitions.';
      return;
    }
    trainingTimer.remaining -= 1;
    updateTrainingTimer();
  }, 1000);
}

function pauseTrainingTimer(showPause) {
  if (trainingTimer.interval) {
    clearInterval(trainingTimer.interval);
    trainingTimer.interval = null;
  }
  trainingTimer.running = false;
  if (showPause) ui.trainingTimerHint.textContent = 'Timer en pause.';
}

function resetTrainingTimer() {
  pauseTrainingTimer(false);
  trainingTimer.remaining = TRAINING_SECONDS;
  updateTrainingTimer();
  ui.trainingTimerHint.textContent = '';
}

function updateTrainingTimer() {
  ui.trainingTimer.textContent = formatTime(trainingTimer.remaining);
}

function saveTrainingScore() {
  const exerciseId = state.training.activeId;
  if (!exerciseId) {
    ui.trainingSaveStatus.textContent = 'Choisis un exercice.';
    return;
  }
  const n1 = parseNumber(ui.trainingInputN1.value);
  const n2 = parseNumber(ui.trainingInputN2.value);
  if (n1 === null && n2 === null) {
    ui.trainingSaveStatus.textContent = 'Renseigne au moins N1 ou N2.';
    return;
  }
  const history = state.training.history[exerciseId] || {
    bestN1: null,
    bestN2: null,
    lastN1: null,
    lastN2: null,
    lastAt: null,
  };
  if (n1 !== null) {
    history.lastN1 = n1;
    history.bestN1 = history.bestN1 == null ? n1 : Math.max(history.bestN1, n1);
  }
  if (n2 !== null) {
    history.lastN2 = n2;
    history.bestN2 = history.bestN2 == null ? n2 : Math.max(history.bestN2, n2);
  }
  history.lastAt = new Date().toISOString();
  state.training.history[exerciseId] = history;
  ui.trainingSaveStatus.textContent = 'Score enregistré ✔️';
  persistState();
  renderTrainingHistory();
  renderTrainingGrid();
}

function renderTrainingHistory() {
  ui.trainingHistory.innerHTML = '';
  const entries = Object.entries(state.training.history)
    .filter(([, info]) => info.lastAt)
    .sort((a, b) => new Date(b[1].lastAt) - new Date(a[1].lastAt));
  if (!entries.length) {
    ui.trainingHistory.innerHTML = '<p class="hint">Aucun score pour le moment.</p>';
    return;
  }
  entries.forEach(([id, info]) => {
    const exercise = EXERCISES.find((ex) => ex.id === id);
    const block = document.createElement('div');
    block.className = 'history-item';
    const title = document.createElement('h4');
    title.textContent = exercise?.name || id;
    block.appendChild(title);
    const best = document.createElement('p');
    best.className = 'hint';
    best.textContent = `Records · N1 ${info.bestN1 ?? '—'} / N2 ${info.bestN2 ?? '—'}`;
    block.appendChild(best);
    const last = document.createElement('p');
    last.className = 'hint';
    last.textContent = `Dernier · N1 ${info.lastN1 ?? '—'} / N2 ${info.lastN2 ?? '—'} (${formatDate(info.lastAt)})`;
    block.appendChild(last);
    ui.trainingHistory.appendChild(block);
  });
}

function handleTrainingQr() {
  const payload = buildTrainingPayload();
  if (!payload) return;
  renderQr(payload, ui.trainingQrOutput, ui.trainingQrSize);
}

function buildTrainingPayload() {
  const payload = buildBasePayload('training', 'T');
  if (!payload) {
    ui.trainingQrSize.textContent = 'Complète prénom, nom, classe.';
    return null;
  }
  const entries = Object.entries(state.training.history).filter(([, info]) => info.bestN1 != null || info.bestN2 != null);
  if (!entries.length) {
    ui.trainingQrSize.textContent = 'Enregistre au moins un test.';
    return null;
  }
  payload.ct_tr_timer = TRAINING_SECONDS;
  entries.forEach(([id, info]) => {
    const slug = slugify(id);
    if (info.bestN1 != null) payload[`ct_tr_${slug}_n1`] = info.bestN1;
    if (info.bestN2 != null) payload[`ct_tr_${slug}_n2`] = info.bestN2;
    if (info.lastAt) payload[`ct_tr_${slug}_last`] = info.lastAt;
  });
  return payload;
}

// ------------------ Skill ------------------
function renderSkillBuilder() {
  if (!ui.skillBuilder) return;
  ui.skillBuilder.innerHTML = '';
  FAMILIES.forEach((family) => {
    const card = document.createElement('div');
    card.className = 'skill-card';
    const title = document.createElement('h3');
    title.textContent = family.label;
    card.appendChild(title);
    const select = document.createElement('select');
    select.innerHTML = '<option value="">Choisir un exercice</option>';
    EXERCISES.filter((ex) => ex.family === family.id).forEach((exercise) => {
      const option = document.createElement('option');
      option.value = exercise.id;
      option.textContent = exercise.name;
      select.appendChild(option);
    });
    select.value = state.skill.selection[family.id] || '';
    select.addEventListener('change', () => {
      state.skill.selection[family.id] = select.value;
      state.skill.inputs[family.id] = { expected: '', done: '' };
      resetSkillSession('Sélection modifiée, séance réinitialisée.');
      renderSkillInputs();
      persistState(false);
    });
    card.appendChild(select);
    const levelSelect = document.createElement('select');
    levelSelect.innerHTML = '<option value="1">Niveau 1</option><option value="2">Niveau 2</option>';
    levelSelect.value = String(state.skill.levels[family.id] || 1);
    levelSelect.addEventListener('change', () => {
      state.skill.levels[family.id] = Number(levelSelect.value) || 1;
      resetSkillSession('Niveau modifié, séance réinitialisée.');
      renderSkillInputs();
      persistState(false);
    });
    card.appendChild(levelSelect);
    ui.skillBuilder.appendChild(card);
  });
}

function renderSkillInputs() {
  if (!ui.skillResultsGrid) return;
  if (ui.skillDuration) ui.skillDuration.value = String(state.skill.duration);
  ui.skillResultsGrid.innerHTML = '';
  FAMILIES.forEach((family) => {
    const row = document.createElement('div');
    row.className = 'result-card';
    row.dataset.family = family.id;
    const exercise = EXERCISES.find((ex) => ex.id === state.skill.selection[family.id]);
    const inputState = state.skill.inputs[family.id] || { expected: '', done: '' };
    state.skill.inputs[family.id] = inputState;
    if (exercise && inputState.expected === '') {
      inputState.expected = String(getExpected(exercise.id, state.skill.levels[family.id]));
    }
    const title = document.createElement('h4');
    title.textContent = exercise ? `${exercise.name} — N${state.skill.levels[family.id]}` : `${family.label} (à choisir)`;
    row.appendChild(title);
    const fields = document.createElement('div');
    fields.className = 'result-fields';
    const expectedLabel = document.createElement('label');
    expectedLabel.textContent = 'Prévu';
    const expectedInput = document.createElement('input');
    expectedInput.type = 'number';
    expectedInput.min = '0';
    expectedInput.value = inputState.expected ?? '';
    expectedInput.addEventListener('input', () => {
      inputState.expected = expectedInput.value;
      persistState(false);
    });
    expectedLabel.appendChild(expectedInput);
    const doneLabel = document.createElement('label');
    doneLabel.textContent = 'Réalisé';
    const doneInput = document.createElement('input');
    doneInput.type = 'number';
    doneInput.min = '0';
    doneInput.value = inputState.done ?? '';
    doneInput.addEventListener('input', () => {
      inputState.done = doneInput.value;
      persistState(false);
    });
    doneLabel.appendChild(doneInput);
    fields.appendChild(expectedLabel);
    fields.appendChild(doneLabel);
    row.appendChild(fields);
    ui.skillResultsGrid.appendChild(row);
  });
  ui.skillCourseOk.checked = state.skill.courseOk;
  renderSkillStatus();
  updateSkillControlState();
}

function handleSkillDurationChange() {
  state.skill.duration = sanitizeSkillDuration(Number(ui.skillDuration.value) || 10);
  resetSkillSession('Durée modifiée, séance réinitialisée.');
  persistState(false);
}

function startSkillPractice() {
  if (!isSkillReady()) {
    ui.skillTimerStatus.textContent = 'Sélectionne les 4 exercices et la durée.';
    return;
  }
  ensureSkillSession();
  const session = state.skill.session;
  if (!session) return;
  if (session.currentBlock > session.totalBlocks) {
    ui.skillTimerStatus.textContent = 'Séance terminée. Lance une nouvelle séance.';
    return;
  }
  if (session.pendingBlock) {
    ui.skillTimerStatus.textContent = 'Valide ou réinitialise le bloc avant de relancer.';
    return;
  }
  if (skillPracticeTimer.running) return;
  skillPracticeTimer.running = true;
  if (skillPracticeTimer.seconds === 0) {
    ui.skillTimerStatus.textContent = `Bloc ${session.currentBlock}/${session.totalBlocks} en cours…`;
  }
  updateSkillPracticeDisplay();
  skillPracticeTimer.interval = setInterval(() => {
    skillPracticeTimer.seconds += 1;
    if (skillPracticeTimer.seconds >= BLOCK_DURATION_SECONDS) {
      completeSkillPractice(true);
      return;
    }
    updateSkillPracticeDisplay();
  }, 1000);
  updateSkillControlState();
}

function pauseSkillPractice(showPause) {
  if (skillPracticeTimer.interval) {
    clearInterval(skillPracticeTimer.interval);
    skillPracticeTimer.interval = null;
  }
  if (skillPracticeTimer.running && showPause) {
    ui.skillTimerStatus.textContent = 'Chrono en pause.';
  }
  skillPracticeTimer.running = false;
  updateSkillControlState();
}

function resetSkillPractice(keepStatus) {
  if (state.skill.session?.pendingBlock) {
    ui.skillTimerStatus.textContent = 'Valide ou réinitialise le bloc pour relancer le chrono.';
    return;
  }
  pauseSkillPractice(false);
  skillPracticeTimer.seconds = 0;
  updateSkillPracticeDisplay();
  if (!keepStatus) ui.skillTimerStatus.textContent = '';
  updateSkillControlState();
}

function completeSkillPractice(autoComplete) {
  const session = state.skill.session;
  if (!session) return;
  if (session.pendingBlock) {
    ui.skillTimerStatus.textContent = 'Bloc déjà terminé, valide les données.';
    return;
  }
  if (!skillPracticeTimer.running && skillPracticeTimer.seconds === 0) {
    ui.skillTimerStatus.textContent = 'Lance le chrono avant de terminer le bloc.';
    return;
  }
  const recordedSeconds = autoComplete ? BLOCK_DURATION_SECONDS : skillPracticeTimer.seconds;
  pauseSkillPractice(false);
  const practiceSeconds = Math.min(recordedSeconds, BLOCK_DURATION_SECONDS);
  if (practiceSeconds <= 0) {
    ui.skillTimerStatus.textContent = 'Le chrono doit tourner avant de terminer.';
    return;
  }
  const recoverSeconds = Math.max(0, BLOCK_DURATION_SECONDS - practiceSeconds);
  session.pendingBlock = { practiceSeconds, recoverSeconds };
  skillPracticeTimer.seconds = practiceSeconds;
  updateSkillPracticeDisplay();
  ui.skillTimerStatus.textContent = 'Bloc terminé : renseigne les observables puis valide.';
  persistState(false);
  updateSkillControlState();
  renderSkillStatus();
}

function updateSkillPracticeDisplay() {
  ui.skillPracticeTimer.textContent = formatTime(skillPracticeTimer.seconds);
}

function updateSkillControlState() {
  const session = state.skill.session;
  const pending = Boolean(session?.pendingBlock);
  const sessionComplete = Boolean(session && session.currentBlock > session.totalBlocks);
  const hasTime = skillPracticeTimer.seconds > 0;
  const ready = isSkillReady();
  if (ui.skillStart) {
    ui.skillStart.disabled = !ready || pending || skillPracticeTimer.running || sessionComplete;
  }
  if (ui.skillPause) {
    ui.skillPause.disabled = !skillPracticeTimer.running;
  }
  if (ui.skillEndBlock) {
    ui.skillEndBlock.disabled = pending || sessionComplete || (!skillPracticeTimer.running && !hasTime);
  }
  if (ui.skillValidate) {
    ui.skillValidate.disabled = !pending;
  }
  if (ui.skillReset) {
    ui.skillReset.disabled = pending;
  }
}

function ensureSkillSession() {
  if (state.skill.session) return;
  const duration = sanitizeSkillDuration(state.skill.duration);
  const totalBlocks = Math.max(1, Math.floor(duration / 2));
  state.skill.session = {
    totalBlocks,
    currentBlock: 1,
    blocks: [],
    totals: {},
    practiceSecondsTotal: 0,
    recoverSecondsTotal: 0,
    courseOkCount: 0,
    pendingBlock: null,
    durationMinutes: duration,
  };
  ui.skillTimerStatus.textContent = 'Séance démarrée : lance le bloc 1.';
  updateSkillBlockCounter();
  updateSkillControlState();
}

function updateSkillBlockCounter() {
  const active = state.skill.session;
  const total = active ? active.totalBlocks : Math.max(1, Math.floor(sanitizeSkillDuration(state.skill.duration) / 2));
  const current = active ? Math.min(active.currentBlock, total) : 0;
  ui.skillBlockCounter.textContent = total ? `Bloc ${current}/${total}` : 'Bloc 0/0';
}

function renderSkillStatus() {
  updateSkillPracticeDisplay();
  updateSkillBlockCounter();
  const session = state.skill.session;
  if (session) {
    if (session.pendingBlock && !skillPracticeTimer.running && skillPracticeTimer.seconds === 0) {
      skillPracticeTimer.seconds = session.pendingBlock.practiceSeconds;
      updateSkillPracticeDisplay();
    }
    let entries = session.blocks
      .map((bloc, index) => {
        const detail = Object.values(bloc.exercises)
          .map((entry) => {
            const exercise = EXERCISES.find((ex) => ex.id === entry.id);
            return `${exercise?.name || entry.id}: ${entry.done}/${entry.expected}`;
          })
          .join(' • ');
        return `
          <div class="log-entry">
            <strong>Bloc ${index + 1}</strong>
            <p>Pratique ${formatTime(bloc.practiceSeconds)} · Récup ${formatTime(bloc.recoverSeconds)} · Course ${bloc.courseOk ? '✅' : '❌'}</p>
            ${detail ? `<p>${detail}</p>` : ''}
          </div>`;
      })
      .join('');
    const pendingMsg = session.pendingBlock
      ? `<p class="hint">Bloc ${session.currentBlock}/${session.totalBlocks} terminé : renseigne puis valide.</p>`
      : '<p class="hint">Lance le bloc en cours dès que prêt.</p>';
    if (!entries) entries = pendingMsg;
    else if (session.pendingBlock) entries += pendingMsg;
    ui.skillSessionLog.innerHTML = entries;
    updateSkillControlState();
    return;
  }
  if (state.skill.lastSession) {
    const last = state.skill.lastSession;
    const selection = last.selection || state.skill.selection;
    const list = FAMILIES.map((family) => {
      const exId = selection[family.id];
      if (!exId) return '';
      const data = last.totals[exId];
      if (!data) return '';
      const exercise = EXERCISES.find((ex) => ex.id === exId);
      return `<li>${exercise?.name || exId} — ${data.done}/${data.expected} reps (N${data.level})</li>`;
    })
      .filter(Boolean)
      .join('');
    ui.skillSessionLog.innerHTML = `
      <div class="log-summary">
        <p><strong>Dernière séance :</strong> ${last.blocks.length} blocs · pratique ${formatTime(last.practiceSecondsTotal)} · récup ${formatTime(
          last.recoverSecondsTotal
        )} · course ${last.courseOkCount}/${last.blocks.length}.</p>
        <ul>${list}</ul>
      </div>`;
    updateSkillControlState();
    return;
  }
  ui.skillSessionLog.innerHTML = '<p class="hint">Commence la séance pour voir le suivi des blocs.</p>';
  updateSkillControlState();
}

function validateSkillBlock() {
  if (!isSkillReady()) {
    ui.skillSaveStatus.textContent = 'Sélectionne un exercice dans chaque famille.';
    return;
  }
  ensureSkillSession();
  const session = state.skill.session;
  if (!session) return;
  if (!session.pendingBlock) {
    ui.skillSaveStatus.textContent = 'Termine le bloc (chrono) avant de valider.';
    return;
  }
  const block = {
    practiceSeconds: session.pendingBlock.practiceSeconds,
    recoverSeconds: session.pendingBlock.recoverSeconds,
    courseOk: ui.skillCourseOk.checked,
    exercises: {},
  };
  let hasData = false;
  FAMILIES.forEach((family) => {
    const exerciseId = state.skill.selection[family.id];
    if (!exerciseId) return;
    const expected = parseNumber(state.skill.inputs[family.id]?.expected) ?? getExpected(exerciseId, state.skill.levels[family.id]);
    const done = parseNumber(state.skill.inputs[family.id]?.done) ?? 0;
    block.exercises[family.id] = {
      id: exerciseId,
      level: state.skill.levels[family.id],
      expected,
      done,
    };
    accumulateSkillTotals(block.exercises[family.id]);
    hasData = true;
    state.skill.inputs[family.id].done = '';
  });
  if (!hasData) {
    ui.skillSaveStatus.textContent = 'Renseigne au moins un exercice avant de valider.';
    return;
  }
  session.blocks.push(block);
  session.practiceSecondsTotal += block.practiceSeconds;
  session.recoverSecondsTotal += block.recoverSeconds;
  if (block.courseOk) session.courseOkCount += 1;
  session.pendingBlock = null;
  const totalBlocks = session.totalBlocks;
  const completedBlocks = session.blocks.length;
  if (completedBlocks >= totalBlocks) {
    finalizeSkillSession();
  } else {
    session.currentBlock = completedBlocks + 1;
    ui.skillSaveStatus.textContent = `Bloc ${completedBlocks} enregistré. Lance le suivant.`;
    skillPracticeTimer.seconds = 0;
    updateSkillPracticeDisplay();
    updateSkillBlockCounter();
    state.skill.courseOk = false;
    ui.skillCourseOk.checked = false;
    persistState();
    renderSkillInputs();
  }
  updateSkillControlState();
}

function accumulateSkillTotals(entry) {
  state.skill.session.totals[entry.id] = state.skill.session.totals[entry.id] || {
    id: entry.id,
    family: EXERCISES.find((ex) => ex.id === entry.id)?.family,
    level: entry.level,
    expected: 0,
    done: 0,
  };
  state.skill.session.totals[entry.id].expected += entry.expected;
  state.skill.session.totals[entry.id].done += entry.done;
}

function finalizeSkillSession() {
  const session = state.skill.session;
  if (!session) return;
  state.skill.lastSession = {
    recordedAt: new Date().toISOString(),
    durationMinutes: session.durationMinutes || sanitizeSkillDuration(state.skill.duration),
    totals: session.totals,
    practiceSecondsTotal: session.practiceSecondsTotal,
    recoverSecondsTotal: session.recoverSecondsTotal,
    courseOkCount: session.courseOkCount,
    blocks: session.blocks,
    selection: { ...state.skill.selection },
  };
  ui.skillSaveStatus.textContent = 'Séance terminée ✔️';
  state.skill.session = null;
  state.skill.courseOk = false;
  ui.skillCourseOk.checked = false;
  pauseSkillPractice(false);
  skillPracticeTimer.seconds = 0;
  updateSkillPracticeDisplay();
  updateSkillBlockCounter();
  persistState();
  renderSkillInputs();
  ui.skillTimerStatus.textContent = 'Séance terminée. Génère le QR ou lance une nouvelle séance.';
  updateSkillControlState();
}

function resetSkillInputs(clearValues) {
  if (clearValues) {
    FAMILIES.forEach((family) => {
      state.skill.inputs[family.id] = { expected: '', done: '' };
    });
    ui.skillCourseOk.checked = false;
    state.skill.courseOk = false;
  }
  if (state.skill.session) state.skill.session.pendingBlock = null;
  skillPracticeTimer.seconds = 0;
  resetSkillPractice(true);
  ui.skillTimerStatus.textContent = 'Bloc réinitialisé.';
  updateSkillControlState();
  persistState(false);
  renderSkillInputs();
}

function resetSkillSession(message) {
  if (state.skill.session) {
    state.skill.session = null;
    ui.skillSaveStatus.textContent = message || 'Séance réinitialisée.';
  } else if (message) {
    ui.skillSaveStatus.textContent = message;
  }
  state.skill.lastSession = null;
  state.skill.courseOk = false;
  ui.skillCourseOk.checked = false;
  skillPracticeTimer.seconds = 0;
  resetSkillPractice(true);
  persistState(false);
  renderSkillInputs();
}

function handleSkillQr() {
  if (!state.skill.lastSession) {
    ui.skillQrSize.textContent = 'Aucune séance enregistrée.';
    return;
  }
  const payload = buildSkillPayload();
  if (!payload) return;
  renderQr(payload, ui.skillQrOutput, ui.skillQrSize);
}

function buildSkillPayload() {
  const session = state.skill.lastSession;
  const payload = buildBasePayload('skill', 'S');
  if (!payload) {
    ui.skillQrSize.textContent = 'Complète prénom, nom, classe.';
    return null;
  }
  payload.ct_minutes = session.durationMinutes;
  payload.ct_blocks = session.blocks.length;
  payload.ct_practice_total_s = session.practiceSecondsTotal;
  payload.ct_recovery_total_s = session.recoverSecondsTotal;
  payload.ct_course_ok = session.courseOkCount;
  payload.ct_course_ko = Math.max(0, session.blocks.length - session.courseOkCount);
  Object.values(session.totals || {}).forEach((entry) => {
    const slug = slugify(entry.id);
    payload[`ct_sk_${slug}_lvl`] = entry.level;
    payload[`ct_sk_${slug}_prev`] = entry.expected;
    payload[`ct_sk_${slug}_real`] = entry.done;
  });
  return payload;
}

function buildBasePayload(mode, suffix) {
  const prenom = (state.student.prenom || '').trim();
  const classe = (state.student.classe || '').trim();
  if (!prenom || !classe) return null;
  const payload = {
    nom: ensureNom(state.student.nom),
    prenom: `${prenom}${suffix}`,
    classe,
    ct_mode: mode,
    ct_date: new Date().toISOString(),
  };
  if (state.student.observer) payload.ct_observer = state.student.observer;
  return payload;
}

// ------------------ QR + Export ------------------
function renderQr(payload, container, sizeLabel) {
  const json = JSON.stringify(payload);
  sizeLabel.textContent = `${json.length} caractères`;
  container.innerHTML = '';
  if (json.length > 2800) {
    const warn = document.createElement('p');
    warn.className = 'hint';
    warn.textContent = 'QR trop volumineux (> 2800). Réduis la séance.';
    container.appendChild(warn);
    return;
  }
  const box = document.createElement('div');
  box.className = 'qr-box';
  container.appendChild(box);
  new QRCode(box, { text: json, width: 210, height: 210 });
  const pre = document.createElement('pre');
  pre.className = 'qr-json';
  pre.textContent = json;
  container.appendChild(pre);
}

function exportState() {
  const snapshot = { ...state, exportedAt: new Date().toISOString() };
  const name = ensureNom(state.student.nom).replace(/[^a-z0-9-]+/gi, '_');
  const prenom = (state.student.prenom || 'eleve').replace(/[^a-z0-9-]+/gi, '_');
  const classe = (state.student.classe || 'classe').replace(/[^a-z0-9-]+/gi, '_');
  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `cross-training_${prenom}_${classe}_${stamp}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function importStateFromFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (!parsed.v) parsed.v = 1;
      state = mergeState(parsed);
      persistState();
      resetSkillPractice(true);
      renderTrainingGrid();
      renderTrainingHistory();
      renderSkillBuilder();
      renderSkillInputs();
      ui.skillSessionLog.innerHTML = '<p class="hint">Sélectionne la durée pour commencer.</p>';
      openTab('training');
      alert('Sauvegarde importée.');
    } catch (error) {
      alert('Import impossible : ' + error.message);
    } finally {
      event.target.value = '';
    }
  };
  reader.readAsText(file);
}

function resetAll() {
  if (!confirm('Effacer toutes les données locales ?')) return;
  state = defaultState();
  persistState();
  renderTrainingGrid();
  renderTrainingHistory();
  renderSkillBuilder();
  renderSkillInputs();
  ui.skillSessionLog.innerHTML = '<p class="hint">Sélectionne la durée pour commencer.</p>';
  openTab('training');
}

// ------------------ Modal ------------------
function openExerciseModal(exercise) {
  if (!exercise || !ui.modal || !ui.modalBody) return;
  ui.modalBody.innerHTML = '';
  const img = document.createElement('img');
  img.src = exercise.image;
  img.alt = exercise.name;
  img.onerror = () => {
    img.onerror = null;
    img.src = PLACEHOLDER_IMG;
  };
  ui.modalBody.appendChild(img);
  const title = document.createElement('h3');
  title.textContent = exercise.name;
  ui.modalBody.appendChild(title);
  const list = document.createElement('ul');
  exercise.levels.forEach((lvl) => {
    const li = document.createElement('li');
    li.textContent = `N${lvl.n} · ${lvl.label} (${lvl.expected} reps)`;
    list.appendChild(li);
  });
  ui.modalBody.appendChild(list);
  ui.modal.classList.remove('hidden');
}

function closeModal() {
  ui.modal.classList.add('hidden');
}

// ------------------ Helpers ------------------
function isIdentityComplete() {
  const prenom = (state.student.prenom || '').trim();
  const classe = (state.student.classe || '').trim();
  return Boolean(prenom && classe && ensureNom(state.student.nom));
}

function ensureNom(value) {
  return value?.trim() ? value.trim() : '-';
}

function parseNumber(value) {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('fr-FR');
}

function formatTime(seconds) {
  const s = Math.max(0, seconds);
  const minutes = String(Math.floor(s / 60)).padStart(2, '0');
  const secs = String(Math.floor(s % 60)).padStart(2, '0');
  return `${minutes}:${secs}`;
}

function slugify(value) {
  return value.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
}

function getExpected(exerciseId, level) {
  const exercise = EXERCISES.find((ex) => ex.id === exerciseId);
  const lvl = exercise?.levels.find((item) => item.n === level);
  return lvl?.expected ?? 0;
}

function persistState(updateTime = true) {
  if (updateTime) state.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Sauvegarde impossible', error);
  }
  updateStatus();
}

function updateStatus() {
  if (!ui.status) return;
  if (state.updatedAt) {
    ui.status.textContent = `Sauvegardé · ${new Date(state.updatedAt).toLocaleString('fr-FR')}`;
    ui.status.classList.add('ready');
  } else {
    ui.status.textContent = 'Modifications locales';
    ui.status.classList.remove('ready');
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return mergeState(parsed);
  } catch (error) {
    console.warn('Lecture impossible', error);
    return defaultState();
  }
}

function mergeState(partial) {
  const base = defaultState();
  const merged = {
    ...base,
    ...partial,
    student: { ...base.student, ...(partial.student || {}) },
    training: {
      ...base.training,
      ...(partial.training || {}),
      history: partial.training?.history || {},
      filter: partial.training?.filter || 'all',
    },
    skill: {
      ...base.skill,
      ...(partial.skill || {}),
      selection: { ...base.skill.selection, ...(partial.skill?.selection || {}) },
      levels: { ...base.skill.levels, ...(partial.skill?.levels || {}) },
      inputs: { ...base.skill.inputs, ...(partial.skill?.inputs || {}) },
    },
  };
  merged.skill.duration = sanitizeSkillDuration(Number(merged.skill.duration) || 10);
  if (merged.skill.session) {
    const session = merged.skill.session;
    if (typeof session.pendingBlock === 'undefined') session.pendingBlock = null;
    if (!session.totalBlocks) {
      session.totalBlocks = Math.max(1, Math.floor((session.durationMinutes || merged.skill.duration) / 2));
    }
    if (!session.durationMinutes) {
      session.durationMinutes = sanitizeSkillDuration(merged.skill.duration);
    }
  }
  return merged;
}

function isSkillReady() {
  return FAMILIES.every((family) => Boolean(state.skill.selection[family.id]));
}

function sanitizeSkillDuration(value) {
  return ALLOWED_SKILL_DURATIONS.includes(value) ? value : 10;
}
