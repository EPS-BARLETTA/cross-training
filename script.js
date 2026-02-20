/**
 * Cross Training Web App (offline)
 * - Fiches attendues dans assets/exercices/ (ex: assets/exercices/jumping-jack.jpg).
 * - Export JSON via « Exporter mes données » (cross-training-backup-YYYYMMDD.json).
 * - Import JSON via le même bouton (version compatible uniquement).
 * - QR ScanProf : JSON UTF-8 plat, taille contrôlée (< 3 KB recommandés).
 */

(() => {
  const APP_NAME = 'CrossTraining';
  const STORAGE_KEY = 'CT_APP_STATE_V2';
  const STORAGE_VERSION = 2;
  const QR_LIMIT = 2800;
  const TRAINING_SECONDS = 60;
  const WORK_SECONDS = 90;
  const REST_SECONDS = 30;
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
        { n: 1, label: 'Burpees climber', expected: 12 },
        { n: 2, label: 'Burpees complets', expected: 16 },
      ],
    },
    {
      id: 'jumping',
      name: 'Jumping jack',
      family: 'cardio',
      image: 'assets/jumping-jack.jpg',
      levels: [
        { n: 1, label: 'Jack décomposé', expected: 20 },
        { n: 2, label: 'Jumping jack complet', expected: 30 },
      ],
    },
    {
      id: 'mountain',
      name: 'Mountain climbers',
      family: 'cardio',
      image: 'assets/mountain.jpg',
      levels: [
        { n: 1, label: 'Version décomposée', expected: 18 },
        { n: 2, label: 'Version continue', expected: 26 },
      ],
    },
    {
      id: 'pompes',
      name: 'Pompes',
      family: 'haut',
      image: 'assets/pompes.jpg',
      levels: [
        { n: 1, label: 'Plan incliné', expected: 12 },
        { n: 2, label: 'Pompes classiques', expected: 15 },
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
      id: 'shadow',
      name: 'Montées de genoux',
      family: 'bas',
      image: 'assets/saut.jpg',
      levels: [
        { n: 1, label: 'Cadence contrôlée', expected: 30 },
        { n: 2, label: 'Cadence rapide', expected: 40 },
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
      id: 'hollow',
      name: 'Hollow body',
      family: 'gainage',
      image: 'assets/crunch.jpg',
      levels: [
        { n: 1, label: 'Maintien 30 s', expected: 1 },
        { n: 2, label: 'Maintien 45 s', expected: 1 },
      ],
    },
  ];

  const COURSE = {
    id: 'course',
    name: 'Course',
    family: 'course',
    image: 'assets/saut.jpg',
    levels: [
      { n: 1, label: 'Course modérée', expected: 0 },
      { n: 2, label: 'Course intense', expected: 0 },
    ],
  };

  const defaultState = () => ({
    v: STORAGE_VERSION,
    updatedAt: null,
    student: { prenom: '', nom: '', classe: '', observer: '' },
    training: {
      activeId: null,
      history: {},
    },
    skill: {
      selection: { cardio: '', haut: '', bas: '', gainage: '' },
      levels: { cardio: 1, haut: 1, bas: 1, gainage: 1 },
      duration: 10,
      results: {
        cardio: { expected: null, done: null },
        haut: { expected: null, done: null },
        bas: { expected: null, done: null },
        gainage: { expected: null, done: null },
        course: { expected: 0, done: null },
      },
      lastSession: null,
    },
  });

  const ui = {};
  let state = loadState();
  const trainingTimer = { running: false, remaining: TRAINING_SECONDS, interval: null };
  const skillTimer = { running: false, remaining: state.skill.duration * 60, blockRemaining: WORK_SECONDS, phase: 'work', interval: null };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    buildTrainingGrid();
    buildSkillBuilder();
    bindEvents();
    renderAll();
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
    ui.trainingHistory = document.getElementById('training-history');
    ui.trainingQrBtn = document.getElementById('training-qr-btn');
    ui.trainingQrOutput = document.getElementById('training-qr-output');
    ui.trainingQrSize = document.getElementById('training-qr-size');
    ui.skillPanel = document.getElementById('skill-panel');
    ui.skillBuilder = document.getElementById('skill-builder');
    ui.skillDuration = document.getElementById('skill-duration');
    ui.skillTimerTotal = document.getElementById('skill-timer-total');
    ui.skillTimerBlock = document.getElementById('skill-timer-block');
    ui.skillTimerPhase = document.getElementById('skill-timer-phase');
    ui.skillTimerRounds = document.getElementById('skill-timer-rounds');
    ui.skillStart = document.getElementById('skill-start');
    ui.skillPause = document.getElementById('skill-pause');
    ui.skillReset = document.getElementById('skill-reset');
    ui.skillResultsGrid = document.getElementById('skill-results-grid');
    ui.skillSave = document.getElementById('skill-save');
    ui.skillSaveStatus = document.getElementById('skill-save-status');
    ui.skillQrBtn = document.getElementById('skill-qr-btn');
    ui.skillQrOutput = document.getElementById('skill-qr-output');
    ui.skillQrSize = document.getElementById('skill-qr-size');
    ui.exportBtn = document.getElementById('export-btn');
    ui.importInput = document.getElementById('import-input');
    ui.resetBtn = document.getElementById('reset-btn');
    ui.modal = document.getElementById('modal');
    ui.modalBody = document.getElementById('modal-body');
    ui.modalClose = document.getElementById('modal-close');
  }

  function bindEvents() {
    [
      { el: ui.first, key: 'prenom' },
      { el: ui.last, key: 'nom' },
      { el: ui.classe, key: 'classe' },
      { el: ui.observer, key: 'observer' },
    ].forEach(({ el, key }) => {
      if (!el) return;
      el.value = state.student[key] || '';
      el.addEventListener('input', () => {
        markDirty();
        state.student[key] = el.value.trim();
        persistState();
      });
    });

    ui.tabButtons?.forEach((btn) => btn.addEventListener('click', () => openTab(btn.dataset.tab)));

    ui.trainingGrid?.addEventListener('click', (event) => {
      const btn = event.target.closest('button[data-action]');
      if (!btn) return;
      const id = btn.dataset.id;
      if (btn.dataset.action === 'select') {
        state.training.activeId = id;
        resetTrainingTimer(true);
        persistState();
        renderTrainingActive();
      } else if (btn.dataset.action === 'modal') {
        openExerciseModal(id);
      }
    });

    ui.trainingStart?.addEventListener('click', startTrainingTimer);
    ui.trainingPause?.addEventListener('click', () => stopTrainingTimer(true));
    ui.trainingReset?.addEventListener('click', () => resetTrainingTimer(false));
    ui.trainingSave?.addEventListener('click', saveTrainingScore);
    ui.trainingQrBtn?.addEventListener('click', () => {
      const payload = buildTrainingPayload();
      if (payload) renderQr(payload, ui.trainingQrOutput, ui.trainingQrSize);
    });

    ui.skillDuration?.addEventListener('change', () => {
      state.skill.duration = Number(ui.skillDuration.value) || 10;
      persistState();
      resetSkillTimer();
      renderSkillTimer();
    });
    ui.skillStart?.addEventListener('click', startSkillTimer);
    ui.skillPause?.addEventListener('click', () => stopSkillTimer(true));
    ui.skillReset?.addEventListener('click', () => resetSkillTimer());
    ui.skillResultsGrid?.addEventListener('input', handleSkillResultsInput);
    ui.skillSave?.addEventListener('click', saveSkillSession);
    ui.skillQrBtn?.addEventListener('click', () => {
      const payload = buildSkillPayload();
      if (payload) renderQr(payload, ui.skillQrOutput, ui.skillQrSize);
    });

    ui.exportBtn?.addEventListener('click', exportState);
    ui.importInput?.addEventListener('change', importState);
    ui.resetBtn?.addEventListener('click', resetAll);

    ui.modalClose?.addEventListener('click', closeModal);
    ui.modal?.addEventListener('click', (event) => {
      if (event.target === ui.modal) closeModal();
    });
  }

  function renderAll() {
    renderStatus();
    renderTrainingActive();
    renderTrainingHistory();
    renderSkillSelectors();
    renderSkillResults();
    resetTrainingTimer(true);
    resetSkillTimer();
    renderSkillTimer();
    openTab('training');
  }

  function renderStatus() {
    if (!ui.status) return;
    if (state.updatedAt) {
      const date = new Date(state.updatedAt).toLocaleString('fr-FR');
      ui.status.textContent = `Sauvegardé · ${date}`;
      ui.status.classList.add('ready');
    } else {
      ui.status.textContent = 'Modifié…';
      ui.status.classList.remove('ready');
    }
  }

  function markDirty() {
    if (ui.status) {
      ui.status.textContent = 'Modifié…';
      ui.status.classList.remove('ready');
    }
  }

  function openTab(tab) {
    ui.tabButtons?.forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tab));
    ui.panels?.forEach((panel) => panel.classList.toggle('hidden', panel.dataset.panel !== tab));
  }

  function buildTrainingGrid() {
    if (!ui.trainingGrid) return;
    ui.trainingGrid.innerHTML = '';
    EXERCISES.forEach((exercise) => {
      const card = document.createElement('article');
      card.className = 'exercise-card';
      const img = createImage(exercise.image);
      card.appendChild(img);
      const name = document.createElement('h3');
      name.textContent = exercise.name;
      card.appendChild(name);
      const fam = document.createElement('p');
      fam.className = 'family';
      fam.textContent = FAMILIES.find((f) => f.id === exercise.family)?.label || exercise.family;
      card.appendChild(fam);
      const bestLine = document.createElement('p');
      bestLine.className = 'best-line';
      const entry = state.training.history[exercise.id];
      if (entry?.bestN1 !== undefined && entry?.bestN2 !== undefined && (entry.bestN1 !== null || entry.bestN2 !== null)) {
        bestLine.textContent = `Meilleurs · N1: ${entry.bestN1 ?? '—'} / N2: ${entry.bestN2 ?? '—'}`;
      } else {
        bestLine.textContent = 'Aucun score enregistré';
      }
      card.appendChild(bestLine);
      const btnRow = document.createElement('div');
      btnRow.className = 'card-actions';
      const selectBtn = document.createElement('button');
      selectBtn.className = 'btn primary';
      selectBtn.dataset.action = 'select';
      selectBtn.dataset.id = exercise.id;
      selectBtn.textContent = 'Sélectionner';
      const ficheBtn = document.createElement('button');
      ficheBtn.className = 'btn ghost';
      ficheBtn.dataset.action = 'modal';
      ficheBtn.dataset.id = exercise.id;
      ficheBtn.textContent = 'Voir la fiche';
      btnRow.appendChild(selectBtn);
      btnRow.appendChild(ficheBtn);
      card.appendChild(btnRow);
      ui.trainingGrid.appendChild(card);
    });
  }

  function createImage(src) {
    const img = document.createElement('img');
    if (src) {
      img.src = src.startsWith('./') ? src : `./${src}`;
    } else {
      img.src = PLACEHOLDER_IMG;
    }
    img.alt = '';
    img.onerror = () => {
      img.onerror = null;
      img.src = PLACEHOLDER_IMG;
    };
    return img;
  }

  function renderTrainingActive() {
    const activeId = state.training.activeId;
    const exercise = EXERCISES.find((ex) => ex.id === activeId);
    if (!exercise) {
      ui.trainingActiveName.textContent = 'Aucun exercice';
      ui.trainingActiveHint.textContent = 'Sélectionne une carte dans la liste.';
      ui.trainingActiveMeta.textContent = '';
      ui.trainingInputN1.value = '';
      ui.trainingInputN2.value = '';
      return;
    }
    ui.trainingActiveName.textContent = exercise.name;
    ui.trainingActiveHint.textContent = exercise.levels.map((lvl) => `N${lvl.n} · ${lvl.label} (${lvl.expected} reps)`).join(' • ');
    const entry = state.training.history[exercise.id];
    if (entry?.lastAt) {
      ui.trainingActiveMeta.textContent = `Dernier relevé · N1 ${entry.lastN1 ?? '—'} / N2 ${entry.lastN2 ?? '—'} (${formatDate(entry.lastAt)})`;
      ui.trainingInputN1.value = entry.lastN1 ?? '';
      ui.trainingInputN2.value = entry.lastN2 ?? '';
    } else {
      ui.trainingActiveMeta.textContent = 'Aucun relevé';
      ui.trainingInputN1.value = '';
      ui.trainingInputN2.value = '';
    }
  }

  function saveTrainingScore() {
    const activeId = state.training.activeId;
    if (!activeId) {
      ui.trainingSaveStatus.textContent = 'Sélectionne un exercice avant de sauvegarder.';
      return;
    }
    const n1 = parseNumber(ui.trainingInputN1.value);
    const n2 = parseNumber(ui.trainingInputN2.value);
    if (n1 === null && n2 === null) {
      ui.trainingSaveStatus.textContent = 'Renseigne au moins une valeur (N1 ou N2).';
      return;
    }
    const entry = state.training.history[activeId] || { bestN1: null, bestN2: null, lastN1: null, lastN2: null, lastAt: null };
    if (n1 !== null) {
      entry.lastN1 = n1;
      entry.bestN1 = entry.bestN1 === null ? n1 : Math.max(entry.bestN1, n1);
    }
    if (n2 !== null) {
      entry.lastN2 = n2;
      entry.bestN2 = entry.bestN2 === null ? n2 : Math.max(entry.bestN2, n2);
    }
    entry.lastAt = new Date().toISOString();
    state.training.history[activeId] = entry;
    persistState();
    ui.trainingSaveStatus.textContent = 'Score enregistré !';
    renderTrainingHistory();
    renderTrainingGrid();
    renderTrainingActive();
  }

  function renderTrainingHistory() {
    if (!ui.trainingHistory) return;
    const entries = Object.entries(state.training.history)
      .filter(([, value]) => value.lastAt)
      .sort((a, b) => new Date(b[1].lastAt) - new Date(a[1].lastAt));
    if (!entries.length) {
      ui.trainingHistory.innerHTML = '<p class="hint">Aucun relevé pour le moment.</p>';
      return;
    }
    ui.trainingHistory.innerHTML = '';
    entries.forEach(([exerciseId, info]) => {
      const exercise = EXERCISES.find((ex) => ex.id === exerciseId);
      const block = document.createElement('div');
      block.className = 'history-item';
      const title = document.createElement('h4');
      title.textContent = exercise?.name || exerciseId;
      block.appendChild(title);
      const best = document.createElement('p');
      best.className = 'hint';
      best.textContent = `Meilleurs · N1 ${info.bestN1 ?? '—'} / N2 ${info.bestN2 ?? '—'}`;
      block.appendChild(best);
      const last = document.createElement('p');
      last.className = 'hint';
      last.textContent = `Dernier · N1 ${info.lastN1 ?? '—'} / N2 ${info.lastN2 ?? '—'} (${formatDate(info.lastAt)})`;
      block.appendChild(last);
      ui.trainingHistory.appendChild(block);
    });
  }

  function startTrainingTimer() {
    if (!state.training.activeId) {
      ui.trainingTimerHint.textContent = 'Choisis un exercice pour lancer le chrono.';
      return;
    }
    if (trainingTimer.running) return;
    if (trainingTimer.remaining <= 0) resetTrainingTimer(true);
    trainingTimer.running = true;
    ui.trainingTimerHint.textContent = 'Travail en cours (1:00)';
    trainingTimer.interval = setInterval(() => {
      if (trainingTimer.remaining <= 1) {
        stopTrainingTimer(false);
        trainingTimer.remaining = 0;
        updateTrainingTimer();
        ui.trainingTimerHint.textContent = 'Terminé ! Renseigne les répétitions.';
        return;
      }
      trainingTimer.remaining -= 1;
      updateTrainingTimer();
    }, 1000);
  }

  function stopTrainingTimer(paused) {
    if (trainingTimer.interval) {
      clearInterval(trainingTimer.interval);
      trainingTimer.interval = null;
    }
    trainingTimer.running = false;
    if (paused) ui.trainingTimerHint.textContent = 'Pause';
  }

  function resetTrainingTimer(keepSelection) {
    stopTrainingTimer(false);
    trainingTimer.remaining = TRAINING_SECONDS;
    updateTrainingTimer();
    if (!keepSelection) ui.trainingTimerHint.textContent = '';
  }

  function updateTrainingTimer() {
    if (ui.trainingTimer) ui.trainingTimer.textContent = formatTime(trainingTimer.remaining);
  }

  function buildSkillBuilder() {
    if (!ui.skillBuilder) return;
    ui.skillBuilder.innerHTML = '';
    ui.skillSelects = {};
    ui.skillLevelSelects = {};
    ui.skillHints = {};
    FAMILIES.forEach((family) => {
      const card = document.createElement('div');
      card.className = 'skill-card';
      const title = document.createElement('h3');
      title.textContent = family.label;
      card.appendChild(title);
      const select = document.createElement('select');
      select.dataset.family = family.id;
      select.innerHTML = '<option value="">Choisir un exercice</option>';
      EXERCISES.filter((ex) => ex.family === family.id).forEach((exercise) => {
        const option = document.createElement('option');
        option.value = exercise.id;
        option.textContent = exercise.name;
        select.appendChild(option);
      });
      card.appendChild(select);
      const levelSelect = document.createElement('select');
      levelSelect.dataset.level = family.id;
      levelSelect.innerHTML = '<option value="1">Niveau 1</option><option value="2">Niveau 2</option>';
      card.appendChild(levelSelect);
      const hint = document.createElement('p');
      hint.className = 'hint';
      card.appendChild(hint);
      ui.skillBuilder.appendChild(card);
      ui.skillSelects[family.id] = select;
      ui.skillLevelSelects[family.id] = levelSelect;
      ui.skillHints[family.id] = hint;
    });
    const courseCard = document.createElement('div');
    courseCard.className = 'skill-card course';
    const courseTitle = document.createElement('h3');
    courseTitle.textContent = 'Course';
    courseCard.appendChild(courseTitle);
    const courseHint = document.createElement('p');
    courseHint.className = 'hint';
    courseHint.textContent = 'Présente dans chaque séance.';
    courseCard.appendChild(courseHint);
    ui.skillBuilder.appendChild(courseCard);
  }

  function renderSkillSelectors() {
    FAMILIES.forEach((family) => {
      const select = ui.skillSelects?.[family.id];
      const levelSelect = ui.skillLevelSelects?.[family.id];
      if (!select || !levelSelect) return;
      select.value = state.skill.selection[family.id] || '';
      levelSelect.value = String(state.skill.levels[family.id] || 1);
      select.onchange = () => {
        markDirty();
        state.skill.selection[family.id] = select.value;
        updateSkillExpected(family.id);
        persistState();
        renderSkillResults();
      };
      levelSelect.onchange = () => {
        markDirty();
        state.skill.levels[family.id] = Number(levelSelect.value) || 1;
        updateSkillExpected(family.id);
        persistState();
        renderSkillResults();
      };
      updateSkillExpected(family.id);
    });
    ui.skillDuration.value = String(state.skill.duration);
    renderSkillHints();
  }

  function updateSkillExpected(family) {
    const exerciseId = state.skill.selection[family];
    if (!exerciseId) {
      state.skill.results[family] = { expected: null, done: null };
      return;
    }
    const level = state.skill.levels[family] || 1;
    const expected = getExpected(exerciseId, level);
    const current = state.skill.results[family] || {};
    state.skill.results[family] = { expected, done: current.done ?? null };
  }

  function renderSkillHints() {
    FAMILIES.forEach((family) => {
      const hint = ui.skillHints?.[family.id];
      if (!hint) return;
      const exerciseId = state.skill.selection[family.id];
      if (!exerciseId) {
        hint.textContent = 'Choisir un exercice.';
        return;
      }
      const level = state.skill.levels[family.id];
      const expected = state.skill.results[family.id]?.expected ?? '—';
      hint.textContent = `N${level} · Prévu ${expected}`;
    });
  }

  function renderSkillResults() {
    if (!ui.skillResultsGrid) return;
    ui.skillResultsGrid.innerHTML = '';
    [...FAMILIES.map((f) => f.id), 'course'].forEach((family) => {
      if (family !== 'course' && !state.skill.selection[family]) return;
      const card = document.createElement('div');
      card.className = 'result-card';
      const title = document.createElement('h4');
      if (family === 'course') {
        title.textContent = COURSE.name;
      } else {
        const exercise = EXERCISES.find((ex) => ex.id === state.skill.selection[family]);
        title.textContent = exercise?.name || family;
      }
      card.appendChild(title);
      const expectedInput = document.createElement('label');
      expectedInput.textContent = 'Prévu';
      const expectedField = document.createElement('input');
      expectedField.type = 'number';
      expectedField.min = '0';
      expectedField.dataset.expectedFamily = family;
      expectedField.value = state.skill.results[family]?.expected ?? 0;
      expectedInput.appendChild(expectedField);
      const doneLabel = document.createElement('label');
      doneLabel.textContent = 'Réalisé';
      const doneField = document.createElement('input');
      doneField.type = 'number';
      doneField.min = '0';
      doneField.dataset.doneFamily = family;
      doneField.value = state.skill.results[family]?.done ?? '';
      doneLabel.appendChild(doneField);
      card.appendChild(expectedInput);
      card.appendChild(doneLabel);
      ui.skillResultsGrid.appendChild(card);
    });
  }

  function handleSkillResultsInput(event) {
    const target = event.target;
    if (target.dataset.expectedFamily) {
      const family = target.dataset.expectedFamily;
      const value = parseNumber(target.value);
      state.skill.results[family] = state.skill.results[family] || { expected: null, done: null };
      state.skill.results[family].expected = value ?? 0;
      markDirty();
      persistState();
    }
    if (target.dataset.doneFamily) {
      const family = target.dataset.doneFamily;
      const value = parseNumber(target.value);
      state.skill.results[family] = state.skill.results[family] || { expected: null, done: null };
      state.skill.results[family].done = value;
      markDirty();
      persistState();
    }
  }

  function startSkillTimer() {
    if (!isSkillReady()) {
      ui.skillSaveStatus.textContent = 'Choisis les 4 exercices avant de lancer le timer.';
      return;
    }
    if (skillTimer.running) return;
    if (skillTimer.remaining <= 0) resetSkillTimer();
    skillTimer.running = true;
    ui.skillSaveStatus.textContent = 'Séance en cours.';
    skillTimer.interval = setInterval(() => {
      if (skillTimer.remaining <= 1) {
        stopSkillTimer(false);
        skillTimer.remaining = 0;
        updateSkillTimerDisplay();
        ui.skillSaveStatus.textContent = 'Séance terminée, renseigne les observations.';
        return;
      }
      skillTimer.remaining -= 1;
      skillTimer.blockRemaining -= 1;
      if (skillTimer.blockRemaining <= 0) {
        if (skillTimer.phase === 'work') {
          skillTimer.phase = 'rest';
          skillTimer.blockRemaining = REST_SECONDS;
        } else {
          skillTimer.phase = 'work';
          skillTimer.blockRemaining = WORK_SECONDS;
        }
      }
      updateSkillTimerDisplay();
    }, 1000);
  }

  function stopSkillTimer(paused) {
    if (skillTimer.interval) {
      clearInterval(skillTimer.interval);
      skillTimer.interval = null;
    }
    skillTimer.running = false;
    if (paused) ui.skillSaveStatus.textContent = 'Timer en pause.';
  }

  function resetSkillTimer() {
    stopSkillTimer(false);
    skillTimer.remaining = state.skill.duration * 60;
    skillTimer.blockRemaining = WORK_SECONDS;
    skillTimer.phase = 'work';
    updateSkillTimerDisplay();
  }

  function updateSkillTimerDisplay() {
    ui.skillTimerTotal.textContent = formatTime(skillTimer.remaining);
    ui.skillTimerBlock.textContent = formatTime(skillTimer.blockRemaining);
    ui.skillTimerPhase.textContent = skillTimer.phase === 'work' ? 'TRAVAIL' : 'RÉCUP';
    const tours = Math.max(1, Math.floor(state.skill.duration / 2));
    ui.skillTimerRounds.textContent = `${tours} tours de 2 minutes (1m30 + 30s)`;
  }

  function renderSkillTimer() {
    updateSkillTimerDisplay();
  }

  function saveSkillSession() {
    if (!isSkillReady()) {
      ui.skillSaveStatus.textContent = 'Sélectionne un exercice dans chaque famille.';
      return;
    }
    const duration = state.skill.duration;
    const tours = Math.max(1, Math.floor(duration / 2));
    const exercises = FAMILIES.map((family) => ({
      f: family.id,
      e: state.skill.selection[family.id],
      n: state.skill.levels[family.id],
      att: state.skill.results[family.id]?.expected ?? 0,
      rea: state.skill.results[family.id]?.done ?? 0,
    }));
    exercises.push({
      f: 'course',
      e: COURSE.id,
      n: 1,
      att: state.skill.results.course?.expected ?? 0,
      rea: state.skill.results.course?.done ?? 0,
    });
    state.skill.lastSession = {
      recordedAt: new Date().toISOString(),
      durationMinutes: duration,
      workSeconds: tours * WORK_SECONDS,
      restSeconds: tours * REST_SECONDS,
      tours,
      exercises,
      observer: state.student.observer || '',
    };
    persistState();
    ui.skillSaveStatus.textContent = 'Séance enregistrée !';
  }

  function isSkillReady() {
    return FAMILIES.every((family) => Boolean(state.skill.selection[family.id]));
  }

  function buildTrainingPayload() {
    if (!isIdentityComplete()) {
      ui.trainingQrSize.textContent = 'Complète prénom, nom, classe.';
      return null;
    }
    const entries = Object.entries(state.training.history)
      .map(([id, info]) => ({ id, n1: info.bestN1 ?? null, n2: info.bestN2 ?? null, last: info.lastAt }))
      .filter((item) => item.n1 !== null || item.n2 !== null);
    if (!entries.length) {
      ui.trainingQrSize.textContent = 'Enregistre un score avant de générer.';
      return null;
    }
    return {
      appName: APP_NAME,
      mode: 'training',
      date: new Date().toISOString(),
      prenom: state.student.prenom,
      nom: ensureNom(state.student.nom),
      classe: state.student.classe,
      observer: state.student.observer || undefined,
      timerSeconds: TRAINING_SECONDS,
      training: entries,
    };
  }

  function buildSkillPayload() {
    if (!isIdentityComplete()) {
      ui.skillQrSize.textContent = 'Complète prénom, nom, classe.';
      return null;
    }
    const session = state.skill.lastSession;
    if (!session) {
      ui.skillQrSize.textContent = 'Enregistre une séance skill avant de générer.';
      return null;
    }
    return {
      appName: APP_NAME,
      mode: 'skill',
      date: new Date().toISOString(),
      prenom: state.student.prenom,
      nom: ensureNom(state.student.nom),
      classe: state.student.classe,
      observer: state.student.observer || undefined,
      durationMinutes: session.durationMinutes,
      workSeconds: session.workSeconds,
      restSeconds: session.restSeconds,
      tours: session.tours,
      skill: session.exercises,
    };
  }

  function renderQr(payload, container, sizeEl) {
    const json = JSON.stringify(payload);
    sizeEl.textContent = `${json.length} caractères`;
    container.innerHTML = '';
    if (json.length > QR_LIMIT) {
      const warn = document.createElement('p');
      warn.className = 'hint';
      warn.textContent = `QR trop volumineux (> ${QR_LIMIT}). Simplifie les données.`;
      container.appendChild(warn);
      return;
    }
    const box = document.createElement('div');
    box.className = 'qr-box';
    container.appendChild(box);
    // eslint-disable-next-line no-new
    new QRCode(box, { text: json, width: 210, height: 210 });
    const pre = document.createElement('pre');
    pre.className = 'qr-json';
    pre.textContent = json;
    container.appendChild(pre);
  }

  function openExerciseModal(exerciseId) {
    const exercise = EXERCISES.find((ex) => ex.id === exerciseId);
    if (!exercise || !ui.modal || !ui.modalBody) return;
    ui.modalBody.innerHTML = '';
    const title = document.createElement('h3');
    title.textContent = exercise.name;
    const image = createImage(exercise.image);
    image.alt = exercise.name;
    ui.modalBody.appendChild(image);
    ui.modalBody.appendChild(title);
    const list = document.createElement('ul');
    exercise.levels.forEach((level) => {
      const item = document.createElement('li');
      item.textContent = `N${level.n} · ${level.label} (${level.expected} reps)`;
      list.appendChild(item);
    });
    ui.modalBody.appendChild(list);
    ui.modal.classList.remove('hidden');
  }

  function closeModal() {
    ui.modal?.classList.add('hidden');
  }

  function exportState() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cross-training-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function importState(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed.v !== STORAGE_VERSION) throw new Error('Version incompatible');
        state = mergeState(parsed);
        persistState();
        buildTrainingGrid();
        buildSkillBuilder();
        renderAll();
        alert('Sauvegarde importée.');
      } catch (error) {
        alert(`Import impossible : ${error.message}`);
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
    buildTrainingGrid();
    buildSkillBuilder();
    renderAll();
  }

  function isIdentityComplete() {
    return Boolean(state.student.prenom && state.student.classe && ensureNom(state.student.nom));
  }

  function ensureNom(value) {
    return value?.trim() ? value.trim() : '-';
  }

  function parseNumber(value) {
    if (value === '' || value === null || value === undefined) return null;
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
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(Math.floor(s % 60)).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function getExpected(exerciseId, level) {
    const exercise = EXERCISES.find((ex) => ex.id === exerciseId) || COURSE;
    const data = exercise?.levels?.find((lvl) => lvl.n === level);
    return data?.expected ?? 0;
  }

  function persistState() {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Impossible de sauvegarder', error);
    }
    renderStatus();
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
    return {
      ...base,
      ...partial,
      student: { ...base.student, ...(partial.student || {}) },
      training: {
        ...base.training,
        ...(partial.training || {}),
        history: partial.training?.history || {},
      },
      skill: {
        ...base.skill,
        ...(partial.skill || {}),
        selection: { ...base.skill.selection, ...(partial.skill?.selection || {}) },
        levels: { ...base.skill.levels, ...(partial.skill?.levels || {}) },
        results: { ...base.skill.results, ...(partial.skill?.results || {}) },
      },
    };
  }
})();
