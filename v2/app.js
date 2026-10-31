/* Cross Training v2 — Entraînement (tests 1 min), Skill (blocs de 2 min), Fiches, Fin de séance.
 * QR compatible ScanProf (mêmes champs que la v1) :
 *   identité : nom (initiale), prenom, classe, observer
 *   entraînement : ct_t, <code>_1, <code>_2           (ex. bu_1, bu_2)
 *   skill : ct_b, ct_m, ct_ps, ct_rs, <code>_l, <code>_p, <code>_r
 */
(function () {
  "use strict";

  var D = window.CT_DATA;
  var FAMILIES = D.FAMILIES, EXERCISES = D.EXERCISES, EXO_CODES = D.EXO_CODES, EXO_ORDER = D.EXO_ORDER, FICHES = D.FICHES || {};
  var EX = {};
  EXERCISES.forEach(function (e) { EX[e.id] = e; });
  var FAM = {};
  FAMILIES.forEach(function (f) { FAM[f.id] = f; });

  var KEY = "CT2_STATE";
  var OLD_KEY = "CT_APP_STATE_V3";
  var CARNET_URL = "https://carnetentrainementv2.vercel.app/";
  var BLOCK = 120, SAS = 10, TEST = 60, TOL = 0.2;
  var DURATIONS = [6, 10, 16, 20];

  /* =========================================================
   * Utilitaires
   * ======================================================= */
  function $(id) { return document.getElementById(id); }
  function esc(v) {
    return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function num(v) {
    if (v === "" || v == null) return null;
    var n = Number(v);
    return isFinite(n) ? n : null;
  }
  function pad2(n) { n = Math.max(0, Math.floor(n)); return (n < 10 ? "0" : "") + n; }
  function mmss(sec) { sec = Math.max(0, Math.ceil(sec)); return pad2(sec / 60) + ":" + pad2(sec % 60); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function fileSafe(s) { return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "_"); }
  function round1(x) { return Math.round(x * 10) / 10; }
  function timeFr(iso) { try { return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); } catch (e) { return ""; } }
  function dateFr(iso) { try { return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); } catch (e) { return ""; } }
  function load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; } }

  var toastTimer = null;
  function toast(msg, err) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.toggle("err", !!err);
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, err ? 4000 : 1800);
  }

  /* ---------- Son (bips) ---------- */
  var audioCtx = null;
  function unlockAudio() {
    try {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return;
      audioCtx = audioCtx || new C();
      if (audioCtx.state === "suspended") audioCtx.resume();
    } catch (e) {}
  }
  function beep(freq, dur, count) {
    if (!audioCtx) return;
    count = count || 1;
    for (var i = 0; i < count; i++) {
      try {
        var t0 = audioCtx.currentTime + i * (dur + 0.08);
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.frequency.value = freq; o.type = "sine";
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.3, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(audioCtx.destination);
        o.start(t0); o.stop(t0 + dur + 0.05);
      } catch (e) {}
    }
    try { if (navigator.vibrate) navigator.vibrate(count > 1 ? [120, 80, 120] : 150); } catch (e) {}
  }
  document.addEventListener("pointerdown", unlockAudio, { passive: true });

  /* ---------- Écran allumé pendant le Skill ---------- */
  var wakeLock = null;
  function keepAwake(on) {
    try {
      if (on && !wakeLock && navigator.wakeLock && document.visibilityState === "visible") {
        navigator.wakeLock.request("screen").then(function (w) {
          wakeLock = w;
          w.addEventListener("release", function () { wakeLock = null; });
        }).catch(function () {});
      } else if (!on && wakeLock) { wakeLock.release(); wakeLock = null; }
    } catch (e) {}
  }

  /* ---------- Fenêtres (avec secours pour les anciens iPad) ---------- */
  function openDialog(id) {
    var d = $(id);
    if (typeof d.showModal === "function") { try { if (!d.open) d.showModal(); return; } catch (e) {} }
    d.setAttribute("open", ""); d.classList.add("dlg-fallback"); document.body.classList.add("dlg-fallback-open");
  }
  function closeDialog(id) {
    var d = $(id);
    if (typeof d.close === "function" && d.open && !d.classList.contains("dlg-fallback")) { d.close(); return; }
    d.removeAttribute("open"); d.classList.remove("dlg-fallback"); document.body.classList.remove("dlg-fallback-open");
  }
  document.querySelectorAll("dialog form").forEach(function (f) {
    f.addEventListener("submit", function (e) { e.preventDefault(); closeDialog(f.closest("dialog").id); });
  });

  // Question Oui / Non (option : 2e confirmation)
  var askCb = null;
  function ask(opts, onYes) {
    $("ask-title").textContent = opts.title || "";
    $("ask-text").textContent = opts.text || "";
    $("ask-foot").textContent = opts.foot || "";
    $("ask-no").textContent = opts.no || "Non";
    $("ask-yes").textContent = opts.yes || "Oui";
    $("ask-yes").className = "btn big" + (opts.danger ? " danger-yes" : opts.go ? " go-yes" : "");
    var rem = $("ask-remind");
    rem.hidden = !opts.remind;
    rem.innerHTML = (opts.remind || []).map(function (r) { return '<li class="' + (r.ok ? "done" : "todo") + '">' + esc(r.text) + "</li>"; }).join("");
    askCb = onYes;
    openDialog("ask");
  }
  $("ask-no").addEventListener("click", function () { askCb = null; closeDialog("ask"); });
  $("ask-yes").addEventListener("click", function () { var cb = askCb; askCb = null; closeDialog("ask"); if (cb) cb(); });

  /* =========================================================
   * Classe : « 4ème C » → 4C, « Terminale B » → TB, « 2nde A » → 2A
   * ======================================================= */
  function normalizeClasse(raw) {
    var s = String(raw || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[\s_\-.°/]+/g, " ").trim();
    if (!s) return "";
    var tail = "\\s*([a-z0-9]{0,3})$", m;
    var words = { sixieme: "6", cinquieme: "5", quatrieme: "4", troisieme: "3" };
    if ((m = s.match(new RegExp("^(terminale|term|tale|tle|tl|t)" + tail)))) return "T" + m[2].toUpperCase();
    if ((m = s.match(new RegExp("^(premiere|1ere|1re|1er|1e)" + tail)))) return "1" + m[2].toUpperCase();
    if ((m = s.match(new RegExp("^(seconde|2nde|2nd|2de|2eme|2e)" + tail)))) return "2" + m[2].toUpperCase();
    if ((m = s.match(new RegExp("^(sixieme|cinquieme|quatrieme|troisieme)" + tail)))) return words[m[1]] + m[2].toUpperCase();
    if ((m = s.match(new RegExp("^([3-6])\\s*(?:eme|ieme|em|e)?" + tail)))) return m[1] + m[2].toUpperCase();
    if ((m = s.match(/^([12])\s*([a-z][a-z0-9]{0,2})?$/))) return m[1] + (m[2] || "").toUpperCase();
    return String(raw).trim().toUpperCase().replace(/\s+/g, "");
  }
  function initial(v) {
    var c = String(v || "").trim().normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0);
    return c ? c.toUpperCase() : "";
  }

  /* =========================================================
   * État (sauvegardé à chaque action)
   * ======================================================= */
  function newSeance() {
    return { id: uid(), startedAt: new Date().toISOString(), updatedAt: null, tests: {}, skill: null, qrShownAt: null, carnetAt: null };
  }
  function emptyCfg() {
    var c = { selection: {}, levels: {}, objectives: {}, duration: 10 };
    FAMILIES.forEach(function (f) { c.selection[f.id] = ""; c.levels[f.id] = 1; c.objectives[f.id] = ""; });
    return c;
  }
  var state = load(KEY);
  if (!state || typeof state !== "object" || !state.seance) {
    state = { v: 1, student: null, seance: newSeance(), records: {}, cfg: emptyCfg(), run: null };
    // Reprise de l'ancienne version (identité, configuration Skill, records)
    var old = load(OLD_KEY);
    if (old && typeof old === "object") {
      var st = old.student || {};
      if (st.prenom && st.classe) {
        state.student = { prenom: st.prenom, nom: initial(st.nom) || "X", classe: normalizeClasse(st.classe), classeSaisie: st.classe, observer: st.observer || "" };
      }
      if (old.skill) {
        FAMILIES.forEach(function (f) {
          if (old.skill.selection && EX[old.skill.selection[f.id]]) state.cfg.selection[f.id] = old.skill.selection[f.id];
          if (old.skill.levels && old.skill.levels[f.id]) state.cfg.levels[f.id] = old.skill.levels[f.id] === 2 ? 2 : 1;
          var exp = old.skill.inputs && old.skill.inputs[f.id] && num(old.skill.inputs[f.id].expected);
          if (exp) state.cfg.objectives[f.id] = String(exp);
        });
        if (DURATIONS.indexOf(old.skill.duration) !== -1) state.cfg.duration = old.skill.duration;
      }
      if (old.training && old.training.history) {
        Object.keys(old.training.history).forEach(function (id) {
          var h = old.training.history[id];
          if (EX[id] && h) state.records[id] = { n1: num(h.bestN1), n2: num(h.bestN2) };
        });
      }
    }
  }
  state.records = state.records || {};
  state.cfg = state.cfg || emptyCfg();
  state.seance.tests = state.seance.tests || {};

  function save() {
    state.seance.updatedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; }
    catch (e) { toast("⚠️ Mémoire pleine : impossible d'enregistrer.", true); return false; }
  }
  function seanceEmpty() { return !Object.keys(state.seance.tests).length && !state.seance.skill && !state.run; }

  /* =========================================================
   * Identité
   * ======================================================= */
  function updateClassePreview() {
    var c = normalizeClasse($("id-classe").value);
    $("id-classe-preview").textContent = c ? "→ Classe enregistrée : " + c : "";
  }
  $("id-classe").addEventListener("input", updateClassePreview);
  $("id-nom").addEventListener("input", function () { this.value = initial(this.value); });

  function showIdentity(canCancel) {
    $("screen-app").hidden = true;
    $("screen-id").hidden = false;
    $("id-cancel").hidden = !canCancel;
    var s = state.student;
    if (s) {
      $("id-prenom").value = s.prenom || "";
      $("id-nom").value = s.nom || "";
      $("id-classe").value = s.classeSaisie || s.classe || "";
      $("id-observer").value = s.observer || "";
    }
    updateClassePreview();
  }
  $("id-cancel").addEventListener("click", function () { if (state.student) showApp(); });
  $("btn-change-id").addEventListener("click", function () { showIdentity(true); });

  $("id-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var prenom = $("id-prenom").value.trim(), nom = initial($("id-nom").value);
    var classeSaisie = $("id-classe").value.trim(), classe = normalizeClasse(classeSaisie);
    var observer = $("id-observer").value.trim();
    if (!prenom || !nom || !classe) { toast("Prénom, initiale et classe sont obligatoires.", true); return; }
    var s = state.student;
    var changed = s && (s.prenom.toLowerCase() !== prenom.toLowerCase() || s.nom !== nom);
    var apply = function (reset) {
      if (reset) { stopRunSilently(); state.seance = newSeance(); state.records = {}; state.cfg = emptyCfg(); state.history = []; }
      state.student = { prenom: prenom, nom: nom, classe: classe, classeSaisie: classeSaisie, observer: observer };
      save();
      renderAll();
      showApp();
    };
    var hasData = !seanceEmpty() || Object.keys(state.records).length;
    if (changed && hasData) {
      ask({ title: "👤 Autre élève", text: "Cette tablette contient la séance, le catalogue et l'historique de " + s.prenom + " " + s.nom + ". Passer à " + prenom + " " + nom + ". ?",
        foot: "La séance, le catalogue et l'historique de " + s.prenom + " seront effacés de cette tablette (fais scanner son QR avant).", yes: "Oui, changer d'élève", danger: true }, function () { apply(true); });
      return;
    }
    if (changed) { apply(true); return; }
    apply(false);
  });

  function showApp() {
    var s = state.student;
    $("screen-id").hidden = true;
    $("screen-app").hidden = false;
    $("who-name").textContent = s.prenom + " " + s.nom + ".";
    $("who-classe").textContent = s.classe;
    $("who-obs").textContent = s.observer ? "👁 Observateur : " + s.observer : "";
    var hashTab = (location.hash || "").replace("#", "");
    selectTab(PANELS[hashTab] ? hashTab : (state.run ? "skill" : state.tab || "train"));
    checkOldSeance();
  }

  /* =========================================================
   * Onglets
   * ======================================================= */
  var PANELS = { train: 1, skill: 1, fiches: 1, hist: 1, fin: 1 };
  function selectTab(tab) {
    if (!PANELS[tab]) tab = "train";
    state.tab = tab;
    document.querySelectorAll(".tab").forEach(function (b) { b.setAttribute("aria-selected", b.dataset.tab === tab ? "true" : "false"); });
    document.querySelectorAll(".panel").forEach(function (p) { p.hidden = p.dataset.panel !== tab; });
    if (history.replaceState) history.replaceState(null, "", "#" + tab);
    if (tab === "fin") renderFin();
    if (tab === "hist") renderHistory();
    if (tab === "skill") renderSkill();
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    window.scrollTo(0, 0);
  }
  document.querySelectorAll(".tab").forEach(function (b) { b.addEventListener("click", function () { selectTab(b.dataset.tab); }); });

  function updateCounts() {
    var n = Object.keys(state.seance.tests).length;
    $("count-train").textContent = n || "";
    $("count-skill").textContent = state.run ? "▶" : state.seance.skill ? "✓" : "";
  }

  /* =========================================================
   * Filtres + cartes exercices
   * ======================================================= */
  var filters = { train: "all", fiches: "all" };
  function renderFilter(which) {
    var opts = [{ id: "all", label: "Tous" }].concat(FAMILIES);
    $(which + "-filter").innerHTML = opts.map(function (f) {
      return '<button type="button" data-f="' + f.id + '" aria-pressed="' + (filters[which] === f.id) + '">' + esc(f.label) + "</button>";
    }).join("");
  }
  ["train", "fiches"].forEach(function (which) {
    $(which + "-filter").addEventListener("click", function (e) {
      var b = e.target.closest("[data-f]");
      if (!b) return;
      filters[which] = b.dataset.f;
      renderFilter(which);
      renderGrid(which);
    });
  });
  function bestTxt(t) {
    if (!t) return "";
    var p = [];
    [1, 2, 3].forEach(function (n) { if (t["n" + n] != null) p.push("N" + n + " " + t["n" + n]); });
    return p.join(" · ");
  }
  var FAM_ICON = { cardio: "❤️", haut: "💪", bas: "🦵", gainage: "🧱" };
  function cover(e) {
    if (e.image) return '<img src="' + e.image + '" alt="" loading="lazy">';
    return '<span class="cover f-' + e.family + '"><span class="cover-ico">' + FAM_ICON[e.family] + '</span><span class="cover-name">' + esc(e.name) +
      '</span><span class="cover-tag">Fiche texte</span></span>';
  }
  function renderGrid(which) {
    var list = EXERCISES.filter(function (e) { return filters[which] === "all" || e.family === filters[which]; });
    $(which + "-grid").innerHTML = list.map(function (e) {
      var t = state.seance.tests[e.id], r = state.records[e.id];
      var extra = which === "train"
        ? (t ? '<span class="score">Aujourd\'hui : ' + esc(bestTxt(t)) + "</span>" : "") +
          (r && bestTxt(r) ? '<span class="lv">📚 Dans mon catalogue · ' + esc(bestTxt(r)) + "</span>" : "")
        : "";
      return '<button type="button" class="ex-card f-' + e.family + '" data-ex="' + e.id + '">' +
        (which === "train" && t ? '<span class="done">✓ testé</span>' : "") +
        cover(e) + '<span class="body">' +
        '<span class="fam">' + esc(FAM[e.family].label) + '</span><span class="name">' + esc(e.name) + "</span>" +
        '<span class="lv">' + e.levels.map(function (l) { return "N" + l.n + " " + esc(l.label); }).join(" · ") + "</span>" + extra + "</span></button>";
    }).join("");
  }
  $("train-grid").addEventListener("click", function (e) { var b = e.target.closest("[data-ex]"); if (b) openTest(b.dataset.ex); });
  $("fiches-grid").addEventListener("click", function (e) { var b = e.target.closest("[data-ex]"); if (b) openFiche(b.dataset.ex); });

  /* =========================================================
   * TEST 1 MINUTE
   * ======================================================= */
  var test = { id: null, endAt: 0, raf: null, finished: false };
  function openTest(id) {
    var e = EX[id];
    test.id = id;
    resetTestTimer();
    $("test-title").textContent = e.name;
    if (e.image) { $("test-img").src = e.image; $("test-img").hidden = false; $("test-left-text").hidden = true; }
    else {
      $("test-img").hidden = true; $("test-left-text").hidden = false;
      $("test-left-text").innerHTML = ficheHtml(e, true);
    }
    $("test-levels").innerHTML = e.levels.map(function (l) {
      return '<label class="field">N' + l.n + " · " + esc(l.label) + ' <span class="muted small">(repère : ' + l.expected + ")</span>" +
        '<input type="number" inputmode="numeric" min="0" max="999" data-testn="' + l.n + '"></label>';
    }).join("");
    var t = state.seance.tests[id], r = state.records[id];
    $("test-best").textContent = [t ? "Aujourd'hui : " + bestTxt(t) : "", r && bestTxt(r) ? "Record : " + bestTxt(r) : ""].filter(Boolean).join(" · ");
    $("test").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeTest() {
    cancelAnimationFrame(test.raf); test.raf = null;
    $("test").hidden = true;
    document.body.style.overflow = "";
  }
  function resetTestTimer() {
    cancelAnimationFrame(test.raf); test.raf = null; test.endAt = 0; test.finished = false;
    $("test-timer").textContent = "01:00";
    $("test-timer").className = "test-timer";
    $("test-start").textContent = "▶️ Départ";
    $("test-timer-hint").textContent = "Un bip retentit à la fin de la minute.";
  }
  function tickTest() {
    var left = (test.endAt - Date.now()) / 1000;
    var el = $("test-timer");
    if (left <= 0) {
      el.textContent = "00:00"; el.className = "test-timer over";
      test.raf = null; test.endAt = 0; test.finished = true;
      $("test-start").textContent = "▶️ Départ";
      $("test-timer-hint").textContent = "⏰ Temps écoulé ! Note les répétitions ci-dessous.";
      beep(880, 0.6, 1);
      try { document.querySelector("[data-testn]").focus(); } catch (e) {}
      return;
    }
    el.textContent = mmss(left);
    el.className = "test-timer running" + (left <= 10 ? " last" : "");
    test.raf = requestAnimationFrame(tickTest);
  }
  $("test-start").addEventListener("click", function () {
    unlockAudio();
    if (test.raf) return;
    test.endAt = Date.now() + TEST * 1000;
    test.finished = false;
    $("test-start").textContent = "⏱️ En cours…";
    $("test-timer-hint").textContent = "C'est parti : maximum de répétitions !";
    beep(660, 0.15, 2);
    test.raf = requestAnimationFrame(tickTest);
  });
  $("test-reset").addEventListener("click", resetTestTimer);
  $("test-close").addEventListener("click", function () {
    if (test.raf) {
      ask({ title: "⏱️ Chrono en cours", text: "Quitter le test ? Le chrono sera arrêté.", yes: "Oui, quitter" }, closeTest);
      return;
    }
    closeTest();
  });
  $("test-fiche").addEventListener("click", function () { openFiche(test.id); });
  $("test-save").addEventListener("click", function () {
    var vals = {}, any = false, bad = false;
    document.querySelectorAll("[data-testn]").forEach(function (inp) {
      var v = num(inp.value);
      if (v != null) { any = true; if (v < 0 || v > 999) bad = true; vals[inp.dataset.testn] = v; }
    });
    if (!any) { toast("Note les répétitions d'au moins un niveau.", true); return; }
    if (bad) { toast("Nombre de répétitions invalide.", true); return; }
    var id = test.id;
    var t = state.seance.tests[id] || {};
    var r = state.records[id] || {};
    Object.keys(vals).forEach(function (n) {
      var k = "n" + n, v = vals[n];
      t[k] = t[k] == null ? v : Math.max(t[k], v);
      r[k] = r[k] == null ? v : Math.max(r[k], v);
    });
    t.at = new Date().toISOString();
    r.lastAt = t.at;
    r.tests = r.tests || [];
    var entry = { at: t.at };
    Object.keys(vals).forEach(function (n) { entry["n" + n] = vals[n]; });
    r.tests.push(entry);
    if (r.tests.length > 30) r.tests = r.tests.slice(-30);
    state.seance.tests[id] = t;
    state.records[id] = r;
    save();
    closeTest();
    renderGrid("train");
    updateCounts();
    var shown = {};
    Object.keys(vals).forEach(function (n) { shown["n" + n] = vals[n]; });
    toast("✅ " + EX[id].name + " : " + bestTxt(shown) + " enregistré");
  });

  /* =========================================================
   * FICHES
   * ======================================================= */
  var ficheId = null;
  function ficheHtml(e, compact) {
    var f = FICHES[e.id] || {};
    var sec = function (title, items, ordered) {
      if (!items || !items.length) return "";
      var tag = ordered ? "ol" : "ul";
      return '<div class="card fiche-sec"><h3>' + title + "</h3><" + tag + ">" + items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</" + tag + "></div>";
    };
    var h = "";
    if (!e.image) {
      h += '<div class="fiche-banner f-' + e.family + '"><span>' + FAM_ICON[e.family] + " " + esc(FAM[e.family].label) + "</span><b>" + esc(e.name) + "</b>" +
        (f.subtitle ? "<small>" + esc(f.subtitle) + "</small>" : "") + "</div>";
    }
    h += sec("✅ Critères de réalisation", f.criteria, true);
    h += sec("⚠️ Règles de sécurité", f.safety);
    if (compact) return h;
    h += sec("💪 Muscles sollicités", f.muscles);
    h += sec("🧘 Étirements", f.stretches);
    h += '<div class="card fiche-sec"><h3>📈 Niveaux et repères (1 minute)</h3><div class="lv-grid">' + e.levels.map(function (l) {
      return '<div class="lv-card"><b>Niveau ' + l.n + " : " + esc(l.label) + '</b><span class="rep">Repère : ' + l.expected + " en 1 min</span>" +
        (l.tips && l.tips.length ? "<ul>" + l.tips.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + "</div>";
    }).join("") + "</div></div>";
    return h;
  }
  function openFiche(id) {
    var e = EX[id];
    ficheId = id;
    $("fiche-title").textContent = e.name;
    $("fiche-img").hidden = !e.image;
    if (e.image) $("fiche-img").src = e.image;
    $("fiche-text").innerHTML = ficheHtml(e, false);
    $("fiche").hidden = false;
    $("fiche").querySelector(".overlay-body").scrollTop = 0;
    document.body.style.overflow = "hidden";
  }
  $("fiche-close").addEventListener("click", function () {
    $("fiche").hidden = true;
    if ($("test").hidden) document.body.style.overflow = "";
  });
  $("fiche-test").addEventListener("click", function () {
    $("fiche").hidden = true;
    if (test.id === ficheId && !$("test").hidden) return;
    openTest(ficheId);
  });

  /* =========================================================
   * SKILL — configuration
   * ======================================================= */
  function cfgReady() {
    return FAMILIES.every(function (f) {
      var o = num(state.cfg.objectives[f.id]);
      return state.cfg.selection[f.id] && o != null && o > 0;
    });
  }
  function expectedBase(exId, lvl) {
    var e = EX[exId];
    if (!e) return "";
    var l = e.levels.filter(function (x) { return x.n === lvl; })[0];
    return l ? l.expected : "";
  }
  /* Catalogue de l'élève : seuls les exercices (et niveaux) testés en Entraînement
     peuvent être choisis pour construire le Skill. */
  function testedLevels(exId) {
    var r = state.records[exId];
    if (!r) return [];
    return EX[exId].levels.map(function (l) { return l.n; }).filter(function (n) { return r["n" + n] != null; });
  }
  function catalogue(famId) {
    return EXERCISES.filter(function (e) { return e.family === famId && testedLevels(e.id).length; });
  }
  function sanitizeCfg() {
    FAMILIES.forEach(function (f) {
      var sel = state.cfg.selection[f.id];
      var lv = sel ? testedLevels(sel) : [];
      if (sel && !lv.length) { state.cfg.selection[f.id] = ""; state.cfg.objectives[f.id] = ""; return; }
      if (sel && lv.indexOf(state.cfg.levels[f.id]) === -1) {
        state.cfg.levels[f.id] = lv[lv.length - 1];
        state.cfg.objectives[f.id] = String(expectedBase(sel, state.cfg.levels[f.id]));
      }
    });
  }
  function renderSkillConfig() {
    sanitizeCfg();
    $("skill-families").innerHTML = FAMILIES.map(function (f) {
      var sel = state.cfg.selection[f.id], lvl = state.cfg.levels[f.id] || 1;
      var exs = catalogue(f.id);
      var h = '<div class="fam-card f-' + f.id + '"><h3>' + esc(f.label) + "</h3>";
      if (!exs.length) {
        return h + '<p class="fam-empty">Aucun exercice testé dans cette famille.</p>' +
          '<button type="button" class="btn full go-train" data-gotrain="' + f.id + '">⏱️ Tester un exercice ' + esc(f.label.toLowerCase()) + "</button></div>";
      }
      h += '<div class="pick">' + exs.map(function (e) {
        return '<button type="button" data-fam="' + f.id + '" data-pick="' + e.id + '" aria-pressed="' + (sel === e.id) + '">' + esc(e.name) + "</button>";
      }).join("") + "</div>";
      if (sel) {
        var e = EX[sel], r = state.records[sel], lv = testedLevels(sel);
        h += '<div class="lvl">' + e.levels.map(function (l) {
          var ok = lv.indexOf(l.n) !== -1;
          return '<button type="button" data-fam="' + f.id + '" data-lvl="' + l.n + '" aria-pressed="' + (lvl === l.n) + '"' + (ok ? "" : " disabled") + ">Niveau " + l.n +
            "<small>" + esc(l.label) + (ok ? " · test : " + r["n" + l.n] + "/min" : " · pas testé") + "</small></button>";
        }).join("") + "</div>";
        h += '<div class="obj"><label>Objectif par bloc<br><span class="muted small">repère ' + expectedBase(sel, lvl) + " · ton test : " + r["n" + lvl] + "/min</span></label>" +
          '<button type="button" data-fam="' + f.id + '" data-obj="-1">−</button>' +
          '<input type="number" inputmode="numeric" min="1" max="999" data-objin="' + f.id + '" value="' + esc(state.cfg.objectives[f.id]) + '">' +
          '<button type="button" data-fam="' + f.id + '" data-obj="1">+</button></div>';
      } else {
        h += '<p class="fam-empty">Choisis un exercice de ton catalogue.</p>';
      }
      return h + "</div>";
    }).join("");
    document.querySelectorAll("#skill-duration button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(+b.dataset.min === state.cfg.duration));
    });
    var nb = state.cfg.duration / 2;
    $("skill-start").textContent = "▶️ Démarrer la séance (" + nb + " blocs de 2 min)";
    $("skill-config-hint").textContent = "";
    renderSkillLast();
  }
  $("skill-families").addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b) return;
    var fam = b.dataset.fam;
    if (b.dataset.gotrain) {
      filters.train = b.dataset.gotrain;
      renderFilter("train"); renderGrid("train");
      selectTab("train");
      return;
    }
    if (b.dataset.pick) {
      var lvs = testedLevels(b.dataset.pick);
      state.cfg.selection[fam] = b.dataset.pick;
      state.cfg.levels[fam] = lvs.indexOf(state.cfg.levels[fam] || 1) !== -1 ? (state.cfg.levels[fam] || 1) : lvs[lvs.length - 1];
      state.cfg.objectives[fam] = String(expectedBase(b.dataset.pick, state.cfg.levels[fam]));
    } else if (b.dataset.lvl) {
      var old = String(expectedBase(state.cfg.selection[fam], state.cfg.levels[fam] || 1));
      state.cfg.levels[fam] = +b.dataset.lvl;
      if (!state.cfg.objectives[fam] || state.cfg.objectives[fam] === old) {
        state.cfg.objectives[fam] = String(expectedBase(state.cfg.selection[fam], +b.dataset.lvl));
      }
    } else if (b.dataset.obj) {
      var v = (num(state.cfg.objectives[fam]) || 0) + (+b.dataset.obj);
      state.cfg.objectives[fam] = String(Math.max(1, Math.min(999, v)));
    } else return;
    save();
    renderSkillConfig();
  });
  $("skill-families").addEventListener("input", function (e) {
    var fam = e.target.dataset && e.target.dataset.objin;
    if (!fam) return;
    state.cfg.objectives[fam] = e.target.value;
    save();
  });
  $("skill-duration").addEventListener("click", function (e) {
    var b = e.target.closest("[data-min]");
    if (!b) return;
    state.cfg.duration = +b.dataset.min;
    save();
    renderSkillConfig();
  });

  $("skill-start").addEventListener("click", function () {
    unlockAudio();
    var empty = FAMILIES.filter(function (f) { return !catalogue(f.id).length; });
    if (empty.length) { $("skill-config-hint").textContent = "Ton catalogue est incomplet : teste d'abord un exercice en " + empty.map(function (f) { return f.label; }).join(", ") + " (onglet Entraînement)."; return; }
    var missing = FAMILIES.filter(function (f) { return !state.cfg.selection[f.id]; });
    if (missing.length) { $("skill-config-hint").textContent = "Choisis un exercice en : " + missing.map(function (f) { return f.label; }).join(", ") + "."; return; }
    var bad = FAMILIES.filter(function (f) { var o = num(state.cfg.objectives[f.id]); return o == null || o <= 0; });
    if (bad.length) { $("skill-config-hint").textContent = "Objectif manquant (nombre supérieur à 0) en : " + bad.map(function (f) { return f.label; }).join(", ") + "."; return; }
    var go = function () {
      var cfg = JSON.parse(JSON.stringify(state.cfg));
      FAMILIES.forEach(function (f) { cfg.objectives[f.id] = num(cfg.objectives[f.id]); });
      var done = {};
      FAMILIES.forEach(function (f) { done[f.id] = ""; });
      state.run = { cfg: cfg, totalBlocks: cfg.duration / 2, blocks: [], phase: "work", workStart: Date.now(), phaseEnd: 0, pending: null, done: done };
      state.seance.skill = null;
      save();
      beep(660, 0.15, 2);
      keepAwake(true);
      renderSkill();
      updateCounts();
    };
    if (state.seance.skill) {
      ask({ title: "🔥 Nouvelle séance Skill", text: "Une séance Skill est déjà terminée aujourd'hui. La remplacer par une nouvelle ?", yes: "Oui, recommencer", danger: true }, go);
    } else go();
  });

  function skillTotals(result) {
    var tot = {};
    FAMILIES.forEach(function (f) {
      var id = result.cfg.selection[f.id];
      var done = result.blocks.reduce(function (s, b) { return s + (num(b.done[f.id]) || 0); }, 0);
      tot[f.id] = { id: id, level: result.cfg.levels[f.id], expected: (result.cfg.objectives[f.id] || 0) * result.blocks.length, done: done };
    });
    return tot;
  }
  function renderSkillLast() {
    var r = state.seance.skill, el = $("skill-last");
    if (!r) { el.hidden = true; return; }
    var tot = skillTotals(r);
    var ps = r.blocks.reduce(function (s, b) { return s + b.practice; }, 0);
    var rs = r.blocks.reduce(function (s, b) { return s + b.recover; }, 0);
    el.hidden = false;
    el.innerHTML = "<h2>✅ Séance Skill terminée" + (r.stoppedEarly ? " (arrêtée)" : "") + "</h2>" +
      '<p class="muted">' + r.blocks.length + " bloc(s) · travail " + mmss(ps) + " · récupération " + mmss(rs) + "</p>" +
      '<table class="summary-table"><tr><th>Exercice</th><th>Niveau</th><th>Réalisé / objectif</th></tr>' +
      FAMILIES.map(function (f) {
        var t = tot[f.id];
        return "<tr><td>" + esc(EX[t.id] ? EX[t.id].name : "") + "</td><td>N" + t.level + "</td><td><b>" + t.done + "</b> / " + t.expected + "</td></tr>";
      }).join("") + "</table>" +
      '<p class="muted small">Tu peux corriger une valeur dans « Fin de séance » si besoin.</p>';
  }

  /* =========================================================
   * SKILL — séance en cours (basée sur l'heure : fiable même si l'écran se met en veille)
   * ======================================================= */
  function commitBlock() {
    var r = state.run;
    var done = {};
    FAMILIES.forEach(function (f) { var n = num(r.done[f.id]); done[f.id] = n == null ? 0 : Math.max(0, n); r.done[f.id] = ""; });
    r.blocks.push({ practice: r.pending.practice, recover: r.pending.recover, done: done });
    r.pending = null;
  }
  function finishRun(stoppedEarly) {
    var r = state.run;
    if (r.blocks.length) {
      state.seance.skill = { cfg: r.cfg, blocks: r.blocks, durationMinutes: stoppedEarly ? r.blocks.length * 2 : r.cfg.duration, stoppedEarly: !!stoppedEarly, finishedAt: new Date().toISOString() };
    }
    state.run = null;
    save();
    keepAwake(false);
    updateCounts();
    renderSkill();
    if (state.seance.skill) {
      beep(990, 0.25, 3);
      toast("🎉 Séance Skill terminée !");
    }
  }
  function stopRunSilently() { state.run = null; keepAwake(false); }

  var lastBeepKey = "";
  function advance() {
    var r = state.run;
    if (!r) return false;
    var now = Date.now(), changed = false, guard = 0;
    while (guard++ < 200) {
      if (r.phase === "work") {
        if (now - r.workStart >= BLOCK * 1000) {
          r.pending = { practice: BLOCK, recover: 0 };
          r.phase = "sas";
          r.phaseEnd = r.workStart + (BLOCK + SAS) * 1000;
          changed = true;
          if (now - r.workStart < (BLOCK + 2) * 1000) beep(440, 0.7, 1);
          continue;
        }
      } else if (now >= r.phaseEnd) {
        var boundary = r.phaseEnd;
        commitBlock();
        changed = true;
        if (r.blocks.length >= r.totalBlocks) { finishRun(false); return true; }
        r.phase = "work";
        r.workStart = boundary;
        if (now - boundary < 2000) beep(660, 0.15, 2);
        continue;
      }
      break;
    }
    // bips des 3 dernières secondes de récupération / saisie
    if (r.phase !== "work") {
      var left = Math.ceil((r.phaseEnd - now) / 1000);
      var k = r.blocks.length + ":" + left;
      if (left <= 3 && left >= 1 && k !== lastBeepKey) { lastBeepKey = k; beep(520, 0.12, 1); }
    }
    if (changed) save();
    return changed;
  }

  function renderRunTick() {
    var r = state.run;
    if (!r) return;
    var now = Date.now(), head = $("run-head");
    var blockNo = Math.min(r.blocks.length + 1, r.totalBlocks);
    $("run-block").textContent = "Bloc " + blockNo + "/" + r.totalBlocks;
    var main = $("run-main");
    if (r.phase === "work") {
      var el = (now - r.workStart) / 1000;
      head.className = "card run-head ph-work";
      $("run-phase").textContent = "TRAVAIL";
      $("run-timer").textContent = mmss(Math.floor(el));
      $("run-sub").textContent = "fin du bloc dans " + mmss(BLOCK - el);
      $("run-bar").style.width = Math.min(100, el / BLOCK * 100) + "%";
      main.textContent = "✋ Circuit terminé";
      main.className = "btn big full stop";
      main.disabled = false;
      $("run-help").textContent = "Fais le circuit des 4 exercices. Touche le bouton dès que c'est fini.";
      $("run-inputs-title").textContent = "Répétitions réalisées ce bloc";
    } else if (r.phase === "recovery") {
      var left = (r.phaseEnd - now) / 1000;
      head.className = "card run-head ph-recov";
      $("run-phase").textContent = "RÉCUPÉRATION";
      $("run-timer").textContent = mmss(left);
      $("run-sub").textContent = "circuit fait en " + mmss(r.pending.practice) + " · bloc suivant automatique";
      $("run-bar").style.width = Math.max(0, 100 - left / r.pending.recover * 100) + "%";
      main.textContent = "📝 Observateur : note les répétitions";
      main.className = "btn big full wait";
      main.disabled = true;
      $("run-help").textContent = "Le bloc est enregistré tout seul à la fin de la récupération.";
      $("run-inputs-title").textContent = "📝 Saisis les répétitions de ce bloc";
    } else {
      var left2 = (r.phaseEnd - now) / 1000;
      head.className = "card run-head ph-sas";
      $("run-phase").textContent = "TEMPS ÉCOULÉ — SAISIE";
      $("run-timer").textContent = mmss(left2);
      $("run-sub").textContent = "enregistrement automatique dans " + Math.ceil(Math.max(0, left2)) + " s";
      $("run-bar").style.width = Math.max(0, 100 - left2 / SAS * 100) + "%";
      main.textContent = "✅ Saisie faite : bloc suivant";
      main.className = "btn big full go";
      main.disabled = false;
      $("run-help").textContent = "Les 2 minutes sont écoulées : note vite les répétitions.";
      $("run-inputs-title").textContent = "📝 Saisis les répétitions de ce bloc";
    }
  }

  function renderRunInputs() {
    var r = state.run;
    if (!r) return;
    var focusedFam = document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.done : null;
    if (focusedFam) return; // ne pas effacer pendant la frappe
    $("run-ex").innerHTML = FAMILIES.map(function (f) {
      var e = EX[r.cfg.selection[f.id]];
      var lv = e.levels[(r.cfg.levels[f.id] || 1) - 1];
      return '<div class="run-item f-' + f.id + '"><div><b>' + esc(e.name) + "</b><span>N" + lv.n + " · " + esc(lv.label) + " · objectif " + r.cfg.objectives[f.id] + "</span></div>" +
        '<input type="number" inputmode="numeric" min="0" max="999" placeholder="0" data-done="' + f.id + '" value="' + esc(r.done[f.id]) + '"></div>';
    }).join("");
  }
  $("run-ex").addEventListener("input", function (e) {
    var fam = e.target.dataset.done;
    if (!fam || !state.run) return;
    state.run.done[fam] = e.target.value;
    save();
  });

  function logHtml(blocks, cfg, editable) {
    if (!blocks.length) return '<p class="muted">Aucun bloc pour l\'instant.</p>';
    return blocks.map(function (b, i) {
      return '<div class="log-row"><div class="top"><span>Bloc ' + (i + 1) + '</span><span class="muted">travail ' + mmss(b.practice) + " · récup " + mmss(b.recover) + "</span></div>" +
        '<div class="vals">' + FAMILIES.map(function (f) {
          var name = EX[cfg.selection[f.id]].name;
          return editable
            ? "<label>" + esc(name) + '<input type="number" inputmode="numeric" min="0" max="999" data-edit-block="' + i + '" data-edit-fam="' + f.id + '" value="' + esc(b.done[f.id]) + '"></label>'
            : "<label>" + esc(name) + "<b>" + esc(b.done[f.id]) + "</b></label>";
        }).join("") + "</div></div>";
    }).join("");
  }
  function renderRunLog() {
    var r = state.run;
    if (!r) return;
    var a = document.activeElement;
    if (a && a.dataset && a.dataset.editBlock != null) return;
    $("run-log").innerHTML = logHtml(r.blocks, r.cfg, true);
  }
  // Correction d'un bloc déjà enregistré (si la saisie a été trop lente)
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (!t.dataset || t.dataset.editBlock == null) return;
    var blocks = state.run ? state.run.blocks : state.seance.skill ? state.seance.skill.blocks : null;
    if (!blocks || !blocks[+t.dataset.editBlock]) return;
    var n = num(t.value);
    blocks[+t.dataset.editBlock].done[t.dataset.editFam] = n == null ? 0 : Math.max(0, n);
    save();
  });
  document.addEventListener("change", function (e) {
    if (e.target.dataset && e.target.dataset.editBlock != null) { toast("✏️ Correction enregistrée"); if (!state.run) renderFinRecap(); }
  });

  $("run-main").addEventListener("click", function () {
    var r = state.run;
    if (!r) return;
    unlockAudio();
    if (r.phase === "work") {
      var practice = Math.max(1, Math.min(BLOCK, Math.round((Date.now() - r.workStart) / 1000)));
      ask({ title: "✋ Circuit terminé ?", text: "Terminer le bloc " + (r.blocks.length + 1) + " en " + mmss(practice) + " et passer en récupération ?", yes: "Oui, terminé", go: true }, function () {
        var rr = state.run;
        if (!rr || rr.phase !== "work") return;
        var p = Math.max(1, Math.min(BLOCK, Math.round((Date.now() - rr.workStart) / 1000)));
        rr.pending = { practice: p, recover: BLOCK - p };
        if (rr.pending.recover > 0) { rr.phase = "recovery"; rr.phaseEnd = rr.workStart + BLOCK * 1000; }
        else { rr.phase = "sas"; rr.phaseEnd = Date.now() + SAS * 1000; }
        save();
        beep(440, 0.3, 1);
        renderSkill();
      });
    } else if (r.phase === "sas") {
      commitBlock();
      if (r.blocks.length >= r.totalBlocks) { finishRun(false); return; }
      r.phase = "work"; r.workStart = Date.now();
      save();
      beep(660, 0.15, 2);
      renderSkill();
    }
  });

  $("run-stop").addEventListener("click", function () {
    var r = state.run;
    if (!r) return;
    var n = r.blocks.length + (r.pending ? 1 : 0);
    ask({ title: "⏹ Arrêter la séance ?", text: n ? "La séance s'arrête maintenant. Les " + n + " bloc(s) terminé(s) sont gardés." : "Aucun bloc n'est terminé : la séance sera annulée.",
      yes: "Oui, arrêter", danger: true }, function () {
      var rr = state.run;
      if (!rr) return;
      if (rr.pending) commitBlock();
      finishRun(true);
      if (!state.seance.skill) toast("Séance Skill annulée.");
    });
  });

  function renderSkill() {
    var running = !!state.run;
    $("skill-config").hidden = running;
    $("skill-run").hidden = !running;
    if (running) {
      renderRunTick();
      renderRunInputs();
      renderRunLog();
    } else {
      renderSkillConfig();
    }
  }

  // Horloge globale : fait avancer la séance même si on est sur un autre onglet
  var lastPhaseKey = "";
  setInterval(function () {
    if (!state.run) return;
    var changed = advance();
    if (!state.run) return;
    var key = state.run.phase + ":" + state.run.blocks.length;
    if (!$("skill-run").hidden) {
      renderRunTick();
      if (changed || key !== lastPhaseKey) { renderRunInputs(); renderRunLog(); }
    }
    lastPhaseKey = key;
    updateCounts();
  }, 250);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible" && state.run) { advance(); keepAwake(true); if (!$("skill-run").hidden) renderSkill(); }
  });

  /* =========================================================
   * HISTORIQUE
   * ======================================================= */
  function dayFr(iso) {
    try { var t = new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); return t.charAt(0).toUpperCase() + t.slice(1); }
    catch (e) { return ""; }
  }
  function shortDate(iso) { try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }); } catch (e) { return ""; } }
  function seanceCard(se, today) {
    var h = '<div class="hist-item' + (today ? " today" : "") + '"><h3>' + (today ? "Aujourd'hui (séance en cours)" : esc(dayFr(se.date))) + "</h3>";
    var ids = EXO_ORDER.filter(function (id) { return se.tests && se.tests[id]; });
    if (ids.length) {
      h += '<p class="lbl">⏱️ Tests 1 min</p>' + ids.map(function (id) { return "<p>" + esc(EX[id].name) + " : " + esc(bestTxt(se.tests[id])) + "</p>"; }).join("");
    }
    if (se.skill) {
      var tot = skillTotals(se.skill);
      h += '<p class="lbl">🔥 Skill — ' + se.skill.blocks.length + " bloc(s)" + (se.skill.stoppedEarly ? " (arrêtée)" : "") + "</p>" +
        FAMILIES.map(function (f) { var t = tot[f.id]; return "<p>" + esc(EX[t.id].name) + " (N" + t.level + ") : <b>" + t.done + "</b> / " + t.expected + "</p>"; }).join("");
    }
    if (!ids.length && !se.skill) h += '<p class="muted">Rien d\'enregistré pour l\'instant.</p>';
    return h + "</div>";
  }
  function renderHistory() {
    var s = state.student;
    $("hist-name").textContent = s ? s.prenom + " " + s.nom + "." : "";
    var ids = EXO_ORDER.filter(function (id) { var r = state.records[id]; return r && EX[id] && (r.n1 != null || r.n2 != null || r.n3 != null); });
    if (!ids.length) {
      $("hist-catalogue").innerHTML = '<p class="muted">Aucun exercice testé pour l\'instant : va dans Entraînement.</p>';
    } else {
      $("hist-catalogue").innerHTML = '<table class="cat-table"><tr><th></th><th>Exercice</th><th>N1</th><th>N2</th><th>N3</th><th>Dernier test</th></tr>' +
        ids.map(function (id) {
          var r = state.records[id], e = EX[id];
          var prog = function (k) {
            var seq = (r.tests || []).map(function (t) { return t[k]; }).filter(function (v) { return v != null; });
            return seq.length > 1 ? '<span class="prog">' + seq.slice(-5).join(" → ") + "</span>" : "";
          };
          return '<tr><td class="fam" style="background:var(--' + e.family + ')"></td><td>' + esc(e.name) + "</td>" +
            [1, 2, 3].map(function (n) {
              if (!e.levels[n - 1]) return '<td class="muted">·</td>';
              return "<td><b>" + (r["n" + n] != null ? r["n" + n] : "—") + "</b>" + prog("n" + n) + "</td>";
            }).join("") +
            "<td class=\"muted\">" + (r.lastAt ? esc(shortDate(r.lastAt)) : "—") + "</td></tr>";
        }).join("") + "</table>";
    }
    var list = [];
    list.push(seanceCard({ tests: state.seance.tests, skill: state.seance.skill }, true));
    (state.history || []).forEach(function (se) { list.push(seanceCard(se, false)); });
    if (!(state.history || []).length) list.push('<p class="muted small">Les séances précédentes apparaîtront ici après chaque « Nouvelle séance ».</p>');
    $("hist-seances").innerHTML = list.join("");
  }

  /* =========================================================
   * QR (format ScanProf de la v1, texte ASCII pour protéger les accents)
   * ======================================================= */
  function code(id) { return EXO_CODES[id]; }
  function buildPayload() {
    var s = state.student;
    var p = { nom: s.nom || "X", prenom: s.prenom, classe: s.classe };
    if (s.observer) p.observer = s.observer;
    var tests = state.seance.tests;
    if (Object.keys(tests).length) {
      p.ct_t = TEST;
      EXO_ORDER.forEach(function (id) {
        var t = tests[id];
        if (!t || !code(id)) return;
        [1, 2, 3].forEach(function (n) { if (t["n" + n] != null) p[code(id) + "_" + n] = t["n" + n]; });
      });
    }
    var sk = state.seance.skill;
    if (sk) {
      p.ct_b = sk.blocks.length;
      p.ct_m = sk.durationMinutes;
      var ps = round1(sk.blocks.reduce(function (a, b) { return a + b.practice; }, 0) / 60);
      var rs = round1(sk.blocks.reduce(function (a, b) { return a + b.recover; }, 0) / 60);
      if (Math.abs(ps + rs - p.ct_m) > TOL) rs = round1(Math.max(0, p.ct_m - ps));
      p.ct_ps = ps;
      p.ct_rs = rs;
      var tot = skillTotals(sk), byEx = {};
      FAMILIES.forEach(function (f) { byEx[tot[f.id].id] = tot[f.id]; });
      EXO_ORDER.forEach(function (id) {
        var t = byEx[id];
        if (!t || !code(id)) return;
        p[code(id) + "_l"] = t.level;
        p[code(id) + "_p"] = t.expected;
        p[code(id) + "_r"] = t.done;
      });
    }
    return p;
  }
  function asciiJson(v) {
    return JSON.stringify(v).replace(/[\u007f-￿]/g, function (c) { return "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4); });
  }
  function qrText() { return asciiJson(buildPayload()); }
  function qrImg(text, cell) {
    var q = qrcode(0, "M");
    q.addData(text, "Byte");
    q.make();
    var img = new Image();
    img.alt = "QR code de la séance";
    img.src = q.createDataURL(cell || 6, 4);
    return img;
  }

  /* =========================================================
   * FIN DE SÉANCE
   * ======================================================= */
  function renderFinRecap() {
    var h = "";
    var ids = EXO_ORDER.filter(function (id) { return state.seance.tests[id]; });
    h += '<section class="r-train"><h3>⏱️ Entraînement — ' + ids.length + " test(s) d'1 minute</h3>";
    h += ids.length ? ids.map(function (id) { return "<p>" + esc(EX[id].name) + " : " + esc(bestTxt(state.seance.tests[id])) + "</p>"; }).join("") : "<p>—</p>";
    h += "</section>";
    var sk = state.seance.skill;
    h += '<section class="r-skill"><h3>🔥 Skill' + (sk ? " — " + sk.blocks.length + " bloc(s)" + (sk.stoppedEarly ? " (arrêtée)" : "") : "") + "</h3>";
    if (state.run) h += "<p>Séance Skill en cours… (termine-la avant de faire scanner)</p>";
    else if (sk) {
      var tot = skillTotals(sk);
      h += FAMILIES.map(function (f) { var t = tot[f.id]; return "<p>" + esc(EX[t.id].name) + " (N" + t.level + ") : <b>" + t.done + "</b> / " + t.expected + "</p>"; }).join("");
      h += '<details><summary class="muted">✏️ Corriger un bloc</summary><div class="log">' + logHtml(sk.blocks, sk.cfg, true) + "</div></details>";
    } else h += "<p>—</p>";
    h += "</section>";
    $("fin-recap").innerHTML = h;
  }
  function renderFin() {
    renderFinRecap();
    var box = $("fin-qr");
    box.innerHTML = "";
    var t = qrText();
    try {
      box.appendChild(qrImg(t, 5));
      var note = seanceEmpty() ? "Séance vide : le QR ne contient que l'identité. " : state.run ? "⚠️ Séance Skill en cours : elle n'est pas encore dans le QR. " : "";
      $("fin-qr-info").textContent = note + t.length + " caractères";
    } catch (e) {
      box.textContent = "QR impossible.";
    }
  }
  $("fin-fullscreen").addEventListener("click", function () {
    var holder = $("qr-full-code");
    holder.innerHTML = "";
    try { holder.appendChild(qrImg(qrText(), 9)); } catch (e) { holder.textContent = "QR impossible."; }
    var s = state.student;
    $("qr-full-name").textContent = s.prenom + " " + s.nom + ". · " + s.classe;
    $("qr-full").hidden = false;
    if (!seanceEmpty()) { state.seance.qrShownAt = new Date().toISOString(); save(); }
  });
  $("qr-full-close").addEventListener("click", function () { $("qr-full").hidden = true; });

  /* ---------- Carnet ---------- */
  function carnetText() {
    var s = state.student, L = [];
    L.push("🏋️ CROSS TRAINING");
    L.push(s.prenom + " " + s.nom + ". · " + s.classe + (s.observer ? " · observateur : " + s.observer : ""));
    L.push("Séance du " + new Date().toLocaleDateString("fr-FR"));
    var ids = EXO_ORDER.filter(function (id) { return state.seance.tests[id]; });
    if (ids.length) {
      L.push("");
      L.push("⏱️ ENTRAÎNEMENT — tests d'1 minute");
      ids.forEach(function (id) {
        var t = state.seance.tests[id], e = EX[id], p = [];
        e.levels.forEach(function (l) { if (t["n" + l.n] != null) p.push("N" + l.n + " (" + l.label + ") : " + t["n" + l.n] + " rép."); });
        L.push("• " + e.name + " — " + p.join(" · "));
      });
    }
    var sk = state.seance.skill;
    if (sk) {
      var tot = skillTotals(sk);
      var ps = sk.blocks.reduce(function (a, b) { return a + b.practice; }, 0), rs = sk.blocks.reduce(function (a, b) { return a + b.recover; }, 0);
      L.push("");
      L.push("🔥 SKILL — " + sk.blocks.length + " bloc(s) de 2 min" + (sk.stoppedEarly ? " (séance arrêtée)" : ""));
      L.push("Travail " + mmss(ps) + " · récupération " + mmss(rs));
      FAMILIES.forEach(function (f) {
        var t = tot[f.id], e = EX[t.id];
        L.push("• " + e.name + " (N" + t.level + " · " + e.levels[t.level - 1].label + ") : " + t.done + " / " + t.expected + " rép.");
      });
      L.push("Détail par bloc :");
      sk.blocks.forEach(function (b, i) {
        L.push("  Bloc " + (i + 1) + " (" + mmss(b.practice) + ") : " + FAMILIES.map(function (f) { return EX[sk.cfg.selection[f.id]].name + " " + b.done[f.id]; }).join(", "));
      });
    }
    if (!ids.length && !sk) { L.push(""); L.push("(Aucun résultat enregistré pendant cette séance.)"); }
    return L.join("\n");
  }
  function carnetFile() {
    var text = carnetText();
    var html = text.split(/\r?\n/).map(function (l) { return "<div>" + (esc(l) || "<br>") + "</div>"; }).join("");
    var s = state.student;
    var name = "CrossTraining_" + fileSafe(s.prenom) + "_" + fileSafe(s.nom) + "_" + new Date().toISOString().slice(0, 10) + ".json";
    var content = JSON.stringify({ html: html, text: text }, null, 2);
    try { return new File([content], name, { type: "application/json" }); }
    catch (e) { var b = new Blob([content], { type: "application/json" }); b.name = name; return b; }
  }
  function download(file) {
    var url = URL.createObjectURL(file), a = document.createElement("a");
    a.href = url; a.download = file.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }
  function markCarnet() { state.seance.carnetAt = new Date().toISOString(); save(); }
  $("fin-carnet").addEventListener("click", function () { $("carnet-preview").textContent = carnetText(); openDialog("carnet"); });
  $("carnet-open").addEventListener("click", function () {
    markCarnet();
    var text = carnetText();
    var w = window.open(CARNET_URL, "_blank");
    var done = function (ok) { toast(ok ? "📋 Résultats copiés : colle-les dans ta séance du carnet." : "Copie impossible : utilise « Je n'ai pas ma tablette ».", !ok); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { done(true); }, function () { done(false); });
    else done(false);
    if (!w) location.href = CARNET_URL;
    closeDialog("carnet");
  });
  $("carnet-file").addEventListener("click", function () {
    markCarnet();
    download(carnetFile());
    toast("💾 Fichier enregistré dans Téléchargements : importe-le dans ton carnet.");
    closeDialog("carnet");
  });
  $("carnet-share").addEventListener("click", function () {
    markCarnet();
    var f = carnetFile();
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [f] })) {
      navigator.share({ files: [f], title: "Mes résultats Cross Training" }).catch(function (err) {
        if (err && err.name !== "AbortError") toast("Partage impossible : utilise « Je n'ai pas ma tablette ».", true);
      });
    } else { download(f); toast("Partage indisponible : fichier enregistré dans Téléchargements."); }
    closeDialog("carnet");
  });
  $("btn-help").addEventListener("click", function () { openDialog("help"); });

  /* ---------- Nouvelle séance (2 questions) ---------- */
  function summary() {
    var p = [];
    var n = Object.keys(state.seance.tests).length;
    if (n) p.push(n + " test(s) d'entraînement");
    if (state.seance.skill) p.push("1 séance Skill");
    if (state.run) p.push("1 séance Skill en cours");
    return p.join(", ");
  }
  function archiveSeance() {
    var se = state.seance;
    if (!Object.keys(se.tests).length && !se.skill) return;
    state.history = state.history || [];
    state.history.unshift({ id: se.id, date: se.updatedAt || se.startedAt, tests: se.tests, skill: se.skill });
    if (state.history.length > 40) state.history = state.history.slice(0, 40);
  }
  function startNewSeance() {
    stopRunSilently();
    archiveSeance();
    state.seance = newSeance();
    save();
    $("old-banner").hidden = true;
    renderAll();
    selectTab("train");
    toast("🆕 Nouvelle séance : tout est prêt");
  }
  function askNewSeance() {
    if (seanceEmpty()) { state.seance = newSeance(); save(); $("old-banner").hidden = true; toast("La séance est déjà vide : tu peux commencer."); return; }
    // (la séance est archivée dans l'Historique avant d'être effacée)
    ask({ title: "🆕 Nouvelle séance", text: "Effacer cette séance ?", foot: "(" + summary() + ")", yes: "Oui" }, function () {
      var s = state.seance;
      setTimeout(function () {
        ask({
          title: "⚠️ Tu es sûr ?",
          text: "As-tu bien fait scanner ton QR code par le prof et enregistré ta séance dans ton carnet ?",
          remind: [
            { ok: !!s.qrShownAt, text: s.qrShownAt ? "✅ QR affiché en grand à " + timeFr(s.qrShownAt) : "⚠️ Ton QR n'a pas encore été affiché en grand" },
            { ok: !!s.carnetAt, text: s.carnetAt ? "✅ Carnet enregistré à " + timeFr(s.carnetAt) : "⚠️ Carnet : pas encore enregistré sur cette tablette" },
          ],
          no: "Non, revenir", yes: "Oui, tout effacer", danger: true,
          foot: "Elle reste consultable dans l'onglet Historique. Le catalogue est conservé.",
        }, startNewSeance);
        // « Non, revenir » → aller sur Fin de séance
        askNoGoesToFin = true;
      }, 50);
    });
  }
  var askNoGoesToFin = false;
  $("ask-no").addEventListener("click", function () { if (askNoGoesToFin) { askNoGoesToFin = false; selectTab("fin"); } });
  $("ask-yes").addEventListener("click", function () { askNoGoesToFin = false; });
  $("btn-new-top").addEventListener("click", askNewSeance);
  $("fin-new").addEventListener("click", askNewSeance);
  $("old-banner-new").addEventListener("click", askNewSeance);
  $("old-banner-keep").addEventListener("click", function () {
    $("old-banner").hidden = true;
    try { sessionStorage.setItem("ct2_keep_" + state.seance.id, "1"); } catch (e) {}
  });
  function checkOldSeance() {
    var last = state.seance.updatedAt || state.seance.startedAt, kept = false;
    try { kept = sessionStorage.getItem("ct2_keep_" + state.seance.id) === "1"; } catch (e) {}
    var isOld = !seanceEmpty() && !state.run && last && new Date(last).toDateString() !== new Date().toDateString();
    $("old-banner").hidden = !isOld || kept;
    if (isOld) $("old-banner-text").textContent = "📅 La séance du " + dateFr(last) + " est encore en mémoire (" + summary() + "). C'est une nouvelle séance aujourd'hui ?";
  }

  /* =========================================================
   * Démarrage
   * ======================================================= */
  function renderAll() {
    renderFilter("train"); renderFilter("fiches");
    renderGrid("train"); renderGrid("fiches");
    renderSkill();
    updateCounts();
  }
  if (state.run) { advance(); if (state.run) keepAwake(true); }
  renderAll();
  if (state.student && state.student.prenom && state.student.nom && state.student.classe) showApp();
  else showIdentity(false);

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    var hadController = !!navigator.serviceWorker.controller, reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (!hadController || reloaded) { hadController = true; return; }
      if (state.run) return; // jamais de rechargement pendant une séance Skill
      reloaded = true;
      location.reload();
    });
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js", { scope: "./", updateViaCache: "none" }).then(function (reg) { try { reg.update(); } catch (e) {} }).catch(function () {});
    });
  }

  window.CrossTraining = { state: function () { return state; }, buildPayload: buildPayload, qrText: qrText, carnetText: carnetText, normalizeClasse: normalizeClasse, advance: advance };
})();
