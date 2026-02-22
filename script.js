'use strict';

const STORAGE_KEY = 'CT_APP_STATE_V3';
const STORAGE_VERSION = 3;
const TRAINING_SECONDS = 60;
const BLOCK_DURATION_SECONDS = 120;
const ALLOWED_SKILL_DURATIONS = [6, 10, 16, 20];
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='320' height='200'><rect width='320' height='200' rx='24' fill='%23e2e8f0'/><text x='50%' y='50%' font-family='Inter,Arial' font-size='18' fill='%2394a3b8' text-anchor='middle' dominant-baseline='middle'>Visuel manquant</text></svg>";
const PAGE_HOME = 'home';
const SKILL_LOCK_PAGES = new Set(['skill_run', 'skill_qr']);
const MINUTES_TOLERANCE = 0.2;
const PREFERS_REDUCED_MOTION = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;

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
    id: 'saut',
    name: 'Saut',
    family: 'cardio',
    image: 'assets/saut.jpg',
    levels: [
      { n: 1, label: 'Décomposé', expected: 20 },
      { n: 2, label: 'Continu', expected: 30 },
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

const EXO_CODES = {
  burpees: 'bu',
  crunch: 'cr',
  dips: 'di',
  fentes: 'fe',
  'jumping-jack': 'jk',
  mountain: 'mt',
  saut: 'sa',
  pompes: 'po',
  rameur: 'ra',
  squat: 'sq',
};

const EXO_ORDER = ['burpees', 'crunch', 'dips', 'fentes', 'jumping-jack', 'mountain', 'saut', 'pompes', 'rameur', 'squat'];

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
    session: null,
    lastSession: null,
    locked: false,
  },
});

let state = loadState();
let currentPage = PAGE_HOME;
let skillHistoryLocked = false;
const ui = {};
const trainingTimer = { running: false, remaining: TRAINING_SECONDS, interval: null };
const skillPracticeTimer = { running: false, seconds: 0, interval: null };
let toastTimer = null;

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
  setupFaqInteractions();
  updateIdentityAccess();
  updateNavigationState();
  if (state.skill.locked) {
    if (state.skill.lastSession && !state.skill.session) {
      lockSkillMode(true);
      goToPage('skill_qr', { force: true });
    } else {
      goToPage('skill_run', { force: true });
    }
  } else {
    goToPage(PAGE_HOME, { force: true });
  }
}

function cacheElements() {
  ui.first = document.getElementById('student-first');
  ui.last = document.getElementById('student-last');
  ui.classe = document.getElementById('student-class');
  ui.observer = document.getElementById('observer');
  ui.pages = Array.from(document.querySelectorAll('.page'));
  ui.navButtons = Array.from(document.querySelectorAll('[data-go]'));
  ui.lockBadge = document.getElementById('lock-badge');
  ui.identityHint = document.getElementById('identity-hint');
  ui.goTraining = document.getElementById('go-training');
  ui.goSkill = document.getElementById('go-skill');
  ui.trainingFinish = document.getElementById('training-finish');
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
  ui.skillResultsGrid = document.getElementById('skill-results-grid');
  ui.skillValidate = document.getElementById('skill-validate-block');
  ui.skillResetBlock = document.getElementById('skill-reset-block');
  ui.skillSaveStatus = document.getElementById('skill-save-status');
  ui.skillSessionLog = document.getElementById('skill-session-log');
  ui.skillQrBtn = document.getElementById('skill-qr-btn');
  ui.skillQrOutput = document.getElementById('skill-qr-output');
  ui.skillQrSize = document.getElementById('skill-qr-size');
  ui.skillConfigNext = document.getElementById('skill-config-next');
  ui.skillResetSession = document.getElementById('skill-reset-session');
  ui.skillNewSession = document.getElementById('skill-new-session');
  ui.skillFinishHome = document.getElementById('skill-finish-home');
  ui.exportBtn = document.getElementById('export-btn');
  ui.importInput = document.getElementById('import-input');
  ui.resetBtn = document.getElementById('reset-btn');
  ui.scanprofHelp = document.getElementById('scanprof-help');
  ui.howtoBtn = document.getElementById('howto-btn');
  ui.modal = document.getElementById('modal');
  ui.modalBody = document.getElementById('modal-body');
  ui.modalClose = document.getElementById('modal-close');
  ui.toast = document.getElementById('toast');
}

function bindIdentity() {
  [
    { el: ui.first, key: 'prenom' },
    { el: ui.last, key: 'nom' },
    { el: ui.classe, key: 'classe' },
    { el: ui.observer, key: 'observer' },
  ].forEach(({ el, key }) => {
    if (!el) return;
    el.value = key === 'nom' ? normalizeInitial(state.student[key]) : state.student[key] || '';
    if (key === 'nom') {
      el.addEventListener('focus', () => el.select());
    }
    el.addEventListener('input', () => {
      if (key === 'nom') {
        const initial = normalizeInitial(el.value);
        el.value = initial;
        state.student[key] = initial;
      } else {
        state.student[key] = el.value.trim();
      }
      persistState();
      updateIdentityAccess();
      updateNavigationState();
    });
  });
}

function bindNavigation() {
  ui.navButtons?.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.go;
      if (!target) return;
      const needsIdentity = btn.dataset.requiresIdentity === 'true';
      if (needsIdentity && !isIdentityComplete()) {
        alert('Complète d’abord prénom, initiale et classe.');
        goToPage('identity');
        return;
      }
      goToPage(target);
    });
  });
}

function setupFaqInteractions() {
  ui.howtoBtn?.addEventListener('click', openHowtoModal);
}

function updateIdentityAccess() {
  const ready = isIdentityComplete();
  if (ui.goTraining) ui.goTraining.disabled = !ready;
  if (ui.goSkill) ui.goSkill.disabled = !ready;
  if (ui.identityHint) {
    ui.identityHint.textContent = ready
      ? 'Identité validée — choisis ton mode.'
      : 'Saisis prénom, initiale et classe pour activer les modes.';
  }
}

function updateNavigationState() {
  const ready = isIdentityComplete();
  const lockActive = state.skill.locked && SKILL_LOCK_PAGES.has(currentPage);
  ui.navButtons?.forEach((btn) => {
    const needsIdentity = btn.dataset.requiresIdentity === 'true';
    const target = btn.dataset.go;
    const blockedByLock = lockActive && target && !SKILL_LOCK_PAGES.has(target);
    const disabled = Boolean((needsIdentity && !ready) || blockedByLock);
    btn.disabled = disabled;
    btn.classList.toggle('is-disabled', disabled);
  });
}

function updateSkillConfigState() {
  if (ui.skillConfigNext) {
    ui.skillConfigNext.disabled = !isSkillReady();
  }
}

function goToPage(name, options = {}) {
  if (!name) return;
  const leavingLocked =
    state.skill.locked && SKILL_LOCK_PAGES.has(currentPage) && !SKILL_LOCK_PAGES.has(name) && !options.force;
  if (leavingLocked) {
    if (ui.skillTimerStatus) {
      ui.skillTimerStatus.textContent = 'Séance verrouillée : utilise le badge pour quitter.';
    }
    alert('Séance Skill verrouillée : utilise le badge pour quitter ou termine la séance.');
    return;
  }
  if (name === 'skill_run' && !isSkillReady() && !options.force) {
    alert('Choisis d’abord un exercice dans chaque famille.');
    return;
  }
  const target = ui.pages?.find((section) => section.dataset.page === name);
  if (!target) return;
  ui.pages.forEach((section) => section.classList.toggle('active', section === target));
  if (!PREFERS_REDUCED_MOTION?.matches) {
    target.classList.add('page-enter');
    setTimeout(() => target.classList.remove('page-enter'), 220);
  }
  currentPage = name;
  if (name === 'skill_run') {
    ensureSkillSession();
    lockSkillMode();
  }
  updateNavigationState();
  updateIdentityAccess();
  updateLockBadge();
}

function lockSkillMode(fromLoad = false) {
  if (!state.skill.locked) {
    state.skill.locked = true;
    if (!fromLoad) persistState(false);
  }
  window.addEventListener('beforeunload', handleSkillBeforeUnload);
  window.addEventListener('popstate', handleSkillPopState);
  if (!skillHistoryLocked) {
    try {
      history.pushState({ skillLock: true }, document.title, window.location.href);
      skillHistoryLocked = true;
    } catch (error) {
      console.warn('Impossible d’actualiser l’historique', error);
    }
  }
  updateLockBadge();
  updateNavigationState();
}

function unlockSkillMode(options = {}) {
  const { silent } = options;
  if (state.skill.locked) {
    state.skill.locked = false;
    if (!silent) persistState(false);
  }
  window.removeEventListener('beforeunload', handleSkillBeforeUnload);
  window.removeEventListener('popstate', handleSkillPopState);
  skillHistoryLocked = false;
  updateLockBadge();
  updateNavigationState();
}

function handleSkillBeforeUnload(event) {
  if (!state.skill.locked) return;
  event.preventDefault();
  event.returnValue = 'Séance Skill en cours.';
}

function handleSkillPopState() {
  if (!state.skill.locked) return;
  alert('Séance Skill verrouillée : utilise le badge pour quitter.');
  try {
    history.pushState({ skillLock: true }, document.title, window.location.href);
  } catch (error) {
    console.warn('Navigation verrouillée', error);
  }
}

function updateLockBadge() {
  if (!ui.lockBadge) return;
  ui.lockBadge.classList.toggle('hidden', !state.skill.locked);
}

function bindActions() {
  ui.goTraining?.addEventListener('click', () => {
    if (!isIdentityComplete()) return;
    goToPage('training');
  });
  ui.goSkill?.addEventListener('click', () => {
    if (!isIdentityComplete()) return;
    goToPage('skill_config');
  });
  ui.trainingFinish?.addEventListener('click', () => goToPage('training_end'));
  ui.trainingStart.addEventListener('click', startTrainingTimer);
  ui.trainingPause.addEventListener('click', () => pauseTrainingTimer(true));
  ui.trainingReset.addEventListener('click', resetTrainingTimer);
  ui.trainingSave.addEventListener('click', saveTrainingScore);
  ui.trainingQrBtn.addEventListener('click', handleTrainingQr);

  ui.skillStart?.addEventListener('click', startSkillPractice);
  ui.skillEndBlock?.addEventListener('click', () => completeSkillPractice(false));
  ui.skillDuration?.addEventListener('change', handleSkillDurationChange);
  ui.skillValidate?.addEventListener('click', validateSkillBlock);
  ui.skillResetBlock?.addEventListener('click', () => resetSkillInputs(true));
  ui.skillQrBtn?.addEventListener('click', handleSkillQr);
  ui.skillConfigNext?.addEventListener('click', () => {
    if (!isIdentityComplete()) {
      alert('Complète d’abord l’identité.');
      goToPage('identity');
      return;
    }
    if (!isSkillReady()) {
      alert('Choisis un exercice dans chaque famille.');
      return;
    }
    ensureSkillSession();
    goToPage('skill_run');
  });
  ui.skillResetSession?.addEventListener('click', () => {
    openSkillResetConfirm();
  });
  ui.skillNewSession?.addEventListener('click', () => {
    resetSkillSession('Nouvelle séance prête.', { unlock: true });
  });
  ui.skillFinishHome?.addEventListener('click', () => {
    unlockSkillMode();
    goToPage(PAGE_HOME, { force: true });
  });
  ui.scanprofHelp?.addEventListener('click', openScanprofHelp);
  ui.lockBadge?.addEventListener('click', openLockExitConfirm);

  ui.exportBtn.addEventListener('click', exportState);
  ui.importInput.addEventListener('change', importStateFromFile);
  ui.resetBtn.addEventListener('click', resetAll);

  ui.modalClose.addEventListener('click', closeModal);
  ui.modal.addEventListener('click', (event) => {
    if (event.target === ui.modal) closeModal();
  });
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
    if (state.training.activeId === exercise.id) card.classList.add('is-selected');
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
      updateTrainingSelection(card);
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

function updateTrainingSelection(selectedCard) {
  document.querySelectorAll('.exercise-card.is-selected').forEach((card) => {
    if (card !== selectedCard) card.classList.remove('is-selected');
  });
  selectedCard?.classList.add('is-selected');
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
  showToast('Score entraînement enregistré', 'ok');
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
  const hasScores = EXO_ORDER.some((id) => {
    const info = state.training.history[id];
    return info && (info.bestN1 != null || info.bestN2 != null);
  });
  if (!hasScores) {
    ui.trainingQrSize.textContent = 'Enregistre au moins un test.';
    return null;
  }
  payload.ct_t = TRAINING_SECONDS;
  EXO_ORDER.forEach((id) => {
    const info = state.training.history[id];
    if (!info) return;
    const code = getExoCode(id);
    if (!code) return;
    if (info.bestN1 != null) payload[`${code}_1`] = info.bestN1;
    if (info.bestN2 != null) payload[`${code}_2`] = info.bestN2;
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
    card.dataset.family = family.id;
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
      resetSkillSession('Sélection modifiée, séance réinitialisée.', { unlock: true });
      renderSkillInputs();
      persistState(false);
    });
    card.appendChild(select);
    const levelSelect = document.createElement('select');
    levelSelect.innerHTML = '<option value="1">Niveau 1</option><option value="2">Niveau 2</option>';
    levelSelect.value = String(state.skill.levels[family.id] || 1);
    levelSelect.addEventListener('change', () => {
      state.skill.levels[family.id] = Number(levelSelect.value) || 1;
      resetSkillSession('Niveau modifié, séance réinitialisée.', { unlock: true });
      renderSkillInputs();
      persistState(false);
    });
    card.appendChild(levelSelect);
    ui.skillBuilder.appendChild(card);
  });
  updateSkillConfigState();
}

function renderSkillInputs() {
  if (!ui.skillResultsGrid) return;
  if (ui.skillDuration) ui.skillDuration.value = String(state.skill.duration);
  ui.skillResultsGrid.innerHTML = '';
  const lockExpected = Boolean(state.skill.session?.expectedLocked);
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
    expectedInput.disabled = lockExpected;
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
  renderSkillStatus();
  updateSkillControlState();
  updateSkillConfigState();
}

function handleSkillDurationChange() {
  state.skill.duration = sanitizeSkillDuration(Number(ui.skillDuration.value) || 10);
  resetSkillSession('Durée modifiée, séance réinitialisée.', { unlock: true });
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
  if (!session.expectedLocked) {
    session.expectedLocked = true;
    persistState(false);
    renderSkillInputs();
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
  if (ui.skillEndBlock) {
    ui.skillEndBlock.disabled = pending || sessionComplete || (!skillPracticeTimer.running && !hasTime);
  }
  if (ui.skillValidate) {
    ui.skillValidate.disabled = !pending;
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
    pendingBlock: null,
    durationMinutes: duration,
    expectedLocked: false,
  };
  ui.skillTimerStatus.textContent = 'Séance démarrée : lance le bloc 1.';
  updateSkillBlockCounter();
  updateSkillControlState();
  persistState(false);
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
            <p>Pratique ${formatTime(bloc.practiceSeconds)} · Récup ${formatTime(bloc.recoverSeconds)}</p>
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
        )}.</p>
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
    setSkillSaveStatus('Sélectionne un exercice dans chaque famille.');
    return;
  }
  ensureSkillSession();
  const session = state.skill.session;
  if (!session) return;
  if (!session.pendingBlock) {
    setSkillSaveStatus('Termine le bloc (chrono) avant de valider.');
    return;
  }
  const block = {
    practiceSeconds: session.pendingBlock.practiceSeconds,
    recoverSeconds: session.pendingBlock.recoverSeconds,
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
    setSkillSaveStatus('Renseigne au moins un exercice avant de valider.');
    return;
  }
  session.blocks.push(block);
  session.practiceSecondsTotal += block.practiceSeconds;
  session.recoverSecondsTotal += block.recoverSeconds;
  session.pendingBlock = null;
  const totalBlocks = session.totalBlocks;
  const completedBlocks = session.blocks.length;
  showToast(`Bloc ${completedBlocks}/${totalBlocks} enregistré`, 'ok');
  if (completedBlocks >= totalBlocks) {
    finalizeSkillSession();
  } else {
    session.currentBlock = completedBlocks + 1;
    setSkillSaveStatus(`Bloc ${completedBlocks} enregistré. Bloc ${session.currentBlock}/${session.totalBlocks} prêt.`);
    skillPracticeTimer.seconds = 0;
    updateSkillPracticeDisplay();
    updateSkillBlockCounter();
    persistState();
    renderSkillInputs();
    startSkillPractice();
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
    blocks: session.blocks,
    selection: { ...state.skill.selection },
  };
  setSkillSaveStatus('Séance terminée ✔️');
  state.skill.session = null;
  pauseSkillPractice(false);
  skillPracticeTimer.seconds = 0;
  updateSkillPracticeDisplay();
  updateSkillBlockCounter();
  persistState();
  renderSkillInputs();
  ui.skillTimerStatus.textContent = 'Séance terminée. Génère le QR ou lance une nouvelle séance.';
  updateSkillControlState();
  showSkillCompletionModal();
  showToast('Séance Skill terminée', 'ok');
}

function resetSkillInputs(clearValues) {
  if (clearValues) {
    FAMILIES.forEach((family) => {
      state.skill.inputs[family.id] = { expected: '', done: '' };
    });
  }
  if (state.skill.session) state.skill.session.pendingBlock = null;
  skillPracticeTimer.seconds = 0;
  resetSkillPractice(true);
  ui.skillTimerStatus.textContent = 'Bloc réinitialisé.';
  updateSkillControlState();
  persistState(false);
  renderSkillInputs();
}

function resetSkillSession(message, options = {}) {
  const { unlock = false, clearLast = true } = options;
  if (message) {
    setSkillSaveStatus(message);
  }
  state.skill.session = null;
  if (clearLast) state.skill.lastSession = null;
  pauseSkillPractice(false);
  skillPracticeTimer.seconds = 0;
  updateSkillPracticeDisplay();
  if (ui.skillTimerStatus) ui.skillTimerStatus.textContent = '';
  if (unlock) unlockSkillMode({ silent: true });
  FAMILIES.forEach((family) => {
    state.skill.inputs[family.id] = { expected: '', done: '' };
  });
  persistState(false);
  renderSkillInputs();
  renderSkillStatus();
  updateSkillBlockCounter();
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
  payload.ct_b = session.blocks.length;
  payload.ct_m = session.durationMinutes;
  const psMinutes = session.practiceSecondsTotal / 60;
  const rsMinutes = session.recoverSecondsTotal / 60;
  let psRounded = roundToOne(psMinutes);
  let rsRounded = roundToOne(rsMinutes);
  if (Math.abs(psRounded + rsRounded - payload.ct_m) > MINUTES_TOLERANCE) {
    rsRounded = roundToOne(Math.max(0, payload.ct_m - psRounded));
  }
  payload.ct_ps = psRounded;
  payload.ct_rs = rsRounded;
  EXO_ORDER.forEach((id) => {
    const entry = session.totals[id];
    if (!entry) return;
    const code = getExoCode(id);
    if (!code) return;
    payload[`${code}_l`] = entry.level;
    payload[`${code}_p`] = entry.expected;
    payload[`${code}_r`] = entry.done;
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
  };
  if (state.student.observer) payload.observer = state.student.observer;
  return payload;
}

function toUtf8(value) {
  return unescape(encodeURIComponent(value));
}

// ------------------ QR + Export ------------------
function renderQr(payload, container, sizeLabel) {
  const json = JSON.stringify(payload);
  sizeLabel.textContent = `${json.length} caractères`;
  container.innerHTML = '';
  if (json.length > 2800) {
    const warn = document.createElement('p');
    warn.className = 'hint';
    warn.textContent = 'QR trop volumineux (> 2800). Réduis la séance ou les données.';
    container.appendChild(warn);
    return;
  }
  const wrapper = document.createElement('div');
  wrapper.className = 'qr-box';
  wrapper.style.padding = '16px';
  wrapper.style.background = '#fff';
  container.appendChild(wrapper);
  new QRCode(wrapper, {
    text: toUtf8(json),
    width: 420,
    height: 420,
    colorDark: '#111111',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel?.L ?? 1,
    margin: 2,
  });
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
  showToast('Export enregistré', 'ok');
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
      unlockSkillMode({ silent: true });
      persistState();
      resetSkillPractice(true);
      renderTrainingGrid();
      renderTrainingHistory();
      renderSkillBuilder();
      renderSkillInputs();
      ui.skillSessionLog.innerHTML = '<p class="hint">Sélectionne la durée pour commencer.</p>';
      goToPage('training', { force: true });
      showToast('Sauvegarde importée', 'ok');
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
  unlockSkillMode({ silent: true });
  renderTrainingGrid();
  renderTrainingHistory();
  renderSkillBuilder();
  renderSkillInputs();
  ui.skillSessionLog.innerHTML = '<p class="hint">Sélectionne la durée pour commencer.</p>';
  goToPage(PAGE_HOME, { force: true });
  showToast('Données réinitialisées', 'warn');
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

function openScanprofHelp() {
  if (!ui.modalBody || !ui.modal) return;
  ui.modalBody.innerHTML = `
    <div class="scanprof-help">
      <h3>ScanProf – légende</h3>
      <div style="background:#f1f5f9;border-radius:18px;padding:1rem;margin-bottom:0.75rem;">
        <h4>Exercices (codes)</h4>
        <ul>
          <li>bu = Burpees</li>
          <li>cr = Crunch</li>
          <li>di = Dips</li>
          <li>fe = Fentes</li>
          <li>jk = Jumping jack</li>
          <li>mt = Mountain climbers</li>
          <li>sa = Saut</li>
          <li>po = Pompes</li>
          <li>ra = Rameur</li>
          <li>sq = Squat</li>
        </ul>
      </div>
      <div style="background:#ecfeff;border-radius:18px;padding:1rem;margin-bottom:0.75rem;">
        <h4>Mode Entraînement</h4>
        <ul>
          <li>ct_t = timer (60 s)</li>
          <li>bu_1 = score N1, bu_2 = score N2 (idem pour chaque code)</li>
          <li>observer = nom de l’observateur (si renseigné)</li>
        </ul>
      </div>
      <div style="background:#fef9c3;border-radius:18px;padding:1rem;">
        <h4>Mode Skill</h4>
        <ul>
          <li>ct_b = nombre de blocs, ct_m = minutes choisies</li>
          <li>ct_ps = temps de pratique (minutes), ct_rs = temps de récup (minutes)</li>
          <li>bu_l = niveau, bu_p = total prévu, bu_r = total réalisé (idem pour chaque code)</li>
        </ul>
      </div>
    </div>
  `;
  ui.modal.classList.remove('hidden');
}

function openHowtoModal() {
  if (!ui.modalBody || !ui.modal) return;
  ui.modalBody.innerHTML = `
    <div class="howto-faq">
      <h3>Mode d’emploi</h3>
      ${renderFaqCard(
        'Comment travailler en Entraînement ?',
        'Choisis un exercice, lance 1 minute, note les répétitions N1/N2 puis génère le QR depuis “Fin d’entraînement”.'
      )}
      ${renderFaqCard(
        'Comment travailler en Skill ?',
        'Sélectionne 1 exercice par famille, fixe la durée (6/10/16/20 min) puis utilise les blocs de 2 minutes pour noter prévu/réalisé.'
      )}
      ${renderFaqCard(
        'Sauvegarder / Importer ?',
        'Dans “Fin d’entraînement”, exporte un fichier .json (Fichiers, AirDrop…). Pour restaurer, clique “Importer” et choisis ce fichier.'
      )}
      ${renderFaqCard(
        'Que faire si ScanProf ne détecte pas le QR ?',
        'Vérifie que la taille affichée est < 2800 caractères, place le QR bien dans le cadre, augmente la luminosité puis retente.'
      )}
      ${renderFaqCard(
        'Que signifient les abréviations ?',
        'bu = Burpees, cr = Crunch, di = Dips, fe = Fentes, jk = Jumping jack, mt = Mountain, sa = Saut, po = Pompes, ra = Rameur, sq = Squat. Suffixes : _1/_2 = N1/N2 (training), _l = niveau, _p = prévu, _r = réalisé (skill).'
      )}
    </div>
  `;
  ui.modal.classList.remove('hidden');
  ui.modalBody.querySelectorAll('.faq-card button').forEach((btn) => {
    btn.addEventListener('click', () => btn.closest('.faq-card')?.classList.toggle('open'));
  });
}

function renderFaqCard(question, answer) {
  return `
    <article class="faq-card">
      <button type="button">
        <span>${question}</span>
        <span class="chevron">›</span>
      </button>
      <div class="faq-card-body">
        <p>${answer}</p>
      </div>
    </article>
  `;
}

function openLockExitConfirm() {
  if (!state.skill.locked || !ui.modal || !ui.modalBody) return;
  ui.modalBody.innerHTML = `
    <div class="lock-confirm">
      <h3>Quitter la séance Skill ?</h3>
      <p>Tout l’historique non exporté sera supprimé.</p>
      <div class="confirm-actions">
        <button class="btn primary" id="lock-exit-yes">Oui, quitter</button>
        <button class="btn ghost" id="lock-exit-no">Annuler</button>
      </div>
    </div>`;
  ui.modal.classList.remove('hidden');
  document.getElementById('lock-exit-yes')?.addEventListener('click', () => {
    closeModal();
    resetSkillSession('Séance interrompue.', { unlock: true });
    goToPage(PAGE_HOME, { force: true });
  });
  document.getElementById('lock-exit-no')?.addEventListener('click', closeModal);
}

function openSkillResetConfirm() {
  if (!ui.modal || !ui.modalBody) {
    if (confirm('Réinitialiser complètement la séance Skill ?')) {
      resetSkillSession('Séance réinitialisée.', { unlock: true });
      goToPage('skill_config', { force: true });
    }
    return;
  }
  ui.modalBody.innerHTML = `
    <div class="lock-confirm">
      <h3>Reset séance Skill</h3>
      <p>Attention, blocs et résultats seront effacés.</p>
      <div class="confirm-actions">
        <button class="btn primary" id="skill-reset-confirm">Oui, effacer</button>
        <button class="btn ghost" id="skill-reset-cancel">Annuler</button>
      </div>
    </div>`;
  ui.modal.classList.remove('hidden');
  document.getElementById('skill-reset-confirm')?.addEventListener('click', () => {
    closeModal();
    resetSkillSession('Séance réinitialisée.', { unlock: true });
    goToPage('skill_config', { force: true });
  });
  document.getElementById('skill-reset-cancel')?.addEventListener('click', closeModal);
}

function showSkillCompletionModal() {
  if (!ui.modal || !ui.modalBody) {
    goToPage('skill_qr');
    return;
  }
  ui.modalBody.innerHTML = `
    <div class="lock-confirm">
      <h3>Séance terminée</h3>
      <p>Vérifie le QR Skill avant de quitter le gymnase.</p>
      <div class="confirm-actions">
        <button class="btn primary" id="skill-view-qr">Voir le QR</button>
        <button class="btn ghost" id="skill-close-modal">Fermer</button>
      </div>
    </div>`;
  ui.modal.classList.remove('hidden');
  document.getElementById('skill-view-qr')?.addEventListener('click', () => {
    closeModal();
    goToPage('skill_qr');
  });
  document.getElementById('skill-close-modal')?.addEventListener('click', closeModal);
}

function setSkillSaveStatus(value) {
  if (ui.skillSaveStatus) {
    ui.skillSaveStatus.textContent = value || '';
  }
}

// ------------------ Helpers ------------------
function isIdentityComplete() {
  const prenom = (state.student.prenom || '').trim();
  const classe = (state.student.classe || '').trim();
  const nomInitial = normalizeInitial(state.student.nom);
  return Boolean(prenom && classe && nomInitial);
}

function normalizeInitial(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  const normalized =
    typeof trimmed.normalize === 'function' ? trimmed.normalize('NFD').replace(/[\u0300-\u036f]/g, '') : trimmed;
  const char = normalized.charAt(0);
  return char ? char.toUpperCase() : '';
}

function ensureNom(value) {
  const initial = normalizeInitial(value);
  return initial || 'X';
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

function getExoCode(id) {
  if (!id) return '';
  if (EXO_CODES[id]) return EXO_CODES[id];
  const slug = slugify(id);
  return slug ? slug.slice(0, 2) : id.slice(0, 2).toLowerCase();
}

function getExpected(exerciseId, level) {
  const exercise = EXERCISES.find((ex) => ex.id === exerciseId);
  const lvl = exercise?.levels.find((item) => item.n === level);
  return lvl?.expected ?? 0;
}

function roundToOne(value) {
  return Math.round(value * 10) / 10;
}

function showToast(message, type = 'ok') {
  if (!ui.toast || !message) return;
  ui.toast.textContent = message;
  ui.toast.classList.remove('toast-ok', 'toast-warn');
  ui.toast.classList.add(type === 'warn' ? 'toast-warn' : 'toast-ok');
  ui.toast.classList.add('visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    ui.toast?.classList.remove('visible');
  }, 3600);
}

function persistState(updateTime = true) {
  if (updateTime) state.updatedAt = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Sauvegarde impossible', error);
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
  merged.student.nom = normalizeInitial(merged.student.nom);
  merged.skill.locked = Boolean(partial.skill?.locked);
  if (merged.skill.session) {
    const session = merged.skill.session;
    if (typeof session.pendingBlock === 'undefined') session.pendingBlock = null;
    if (!session.totalBlocks) {
      session.totalBlocks = Math.max(1, Math.floor((session.durationMinutes || merged.skill.duration) / 2));
    }
    if (!session.durationMinutes) {
      session.durationMinutes = sanitizeSkillDuration(merged.skill.duration);
    }
    if (typeof session.expectedLocked !== 'boolean') {
      session.expectedLocked = false;
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
