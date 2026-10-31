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

  var KEY = "CT2_STATE", PKEY = "CT2_PROFILES";
  var OLD_KEY = "CT_APP_STATE_V3";
  var CARNET_URL = "https://carnetentrainementv2.vercel.app/";
  var BLOCK = 120, SAS = 20, TEST = 60, TOL = 0.2;
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
  var askCb = null, askNoCb = null;
  function ask(opts, onYes) {
    askNoCb = opts.onNo || null;
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
  $("ask-no").addEventListener("click", function () { var cb = askNoCb; askCb = null; askNoCb = null; closeDialog("ask"); if (cb) cb(); });
  $("ask-yes").addEventListener("click", function () { var cb = askCb; askCb = null; askNoCb = null; closeDialog("ask"); if (cb) cb(); });
  // enchaîner une 2e question juste après la 1re
  function askNext(opts, onYes) { setTimeout(function () { ask(opts, onYes); }, 40); }

  /* ---------- Couches (test, fiche, QR…) : le bouton « retour » de Safari ferme la couche au lieu de quitter l'appli ---------- */
  var layers = [], ignorePops = 0;
  function openLayer(name, closeFn, guard) {
    layers.push({ name: name, close: closeFn, guard: guard });
    try { history.pushState({ ctl: layers.length }, ""); } catch (e) {}
  }
  function closeLayer(name) {
    for (var i = layers.length - 1; i >= 0; i--) {
      if (layers[i].name !== name) continue;
      var l = layers.splice(i, 1)[0];
      l.close();
      ignorePops++;
      try { history.back(); } catch (e) { ignorePops--; }
      return true;
    }
    return false;
  }
  window.addEventListener("popstate", function () {
    if (ignorePops > 0) { ignorePops--; return; }
    var top = layers[layers.length - 1];
    if (!top) return;
    if (top.guard && top.guard()) { try { history.pushState({ ctl: layers.length }, ""); } catch (e) {} return; }
    layers.pop();
    top.close();
  });

  /* ---------- Nombres entiers seulement (pas de virgule, 3 chiffres max) ---------- */
  document.addEventListener("input", function (e) {
    var t = e.target;
    if (!t || !t.hasAttribute || !t.hasAttribute("data-int")) return;
    var v = t.value.replace(/[^0-9]/g, "").slice(0, 3).replace(/^0+(?=\d)/, "");
    if (v !== t.value) t.value = v;
  }, true);
  function intVal(v) {
    v = String(v == null ? "" : v).trim();
    return /^\d{1,3}$/.test(v) ? parseInt(v, 10) : null;
  }

  /* ---------- Flash plein écran (iPad en silencieux = pas de bip) ---------- */
  function flash(kind) {
    var f = $("flash");
    if (!f) return;
    f.className = "flash";
    void f.offsetWidth;
    f.className = "flash on " + kind;
  }

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
  function blankState() { return { v: 1, student: null, seance: newSeance(), records: {}, cfg: emptyCfg(), run: null, history: [], imported: [] }; }
  // Mise à niveau d'un profil : chaque meilleur score correspond à un test (pour pouvoir corriger / supprimer)
  function fixState(s) {
    s.records = s.records || {}; s.cfg = s.cfg || emptyCfg(); s.seance = s.seance || newSeance();
    s.seance.tests = s.seance.tests || {}; s.history = s.history || []; s.imported = s.imported || [];
    Object.keys(s.records).forEach(function (id) {
      var r = s.records[id];
      if (!EX[id] || !r) { delete s.records[id]; return; }
      r.tests = r.tests || [];
      r.tests.forEach(function (t) { if (!t.sid && !t.old && t.at && t.at >= s.seance.startedAt) t.sid = s.seance.id; });
      var e = { at: r.lastAt || s.seance.startedAt, old: true }, need = false;
      [1, 2, 3].forEach(function (n) {
        var k = "n" + n;
        if (r[k] != null && !r.tests.some(function (t) { return t[k] != null && t[k] >= r[k]; })) { e[k] = r[k]; need = true; }
      });
      if (need) r.tests.unshift(e);
    });
    return s;
  }
  function legacyState() {
    var state = load(KEY);
    if (state && typeof state === "object" && state.seance) return state;
    state = blankState();
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
    return state;
  }

  /* ---------- Profils : le propriétaire de la tablette + des invités (jamais d'effacement) ---------- */
  var store = load(PKEY);
  if (!store || typeof store !== "object" || !store.profiles) {
    store = { v: 1, active: null, profiles: {} };
    var leg = legacyState();
    if (leg.student && leg.student.prenom) {
      var pid0 = uid();
      store.profiles[pid0] = { guest: false, createdAt: new Date().toISOString(), state: fixState(leg) };
      store.active = pid0;
    }
  }
  Object.keys(store.profiles).forEach(function (pid) { fixState(store.profiles[pid].state); });
  if (!store.profiles[store.active]) store.active = null;
  var state = store.active ? store.profiles[store.active].state : blankState();

  function persist() {
    if (!store.active) return true;
    store.profiles[store.active].state = state;
    try { localStorage.setItem(PKEY, JSON.stringify(store)); return true; }
    catch (e) { toast("⚠️ Mémoire pleine : impossible d'enregistrer.", true); return false; }
  }
  function save() {
    state.seance.updatedAt = new Date().toISOString();
    return persist();
  }
  function profileList() {
    return Object.keys(store.profiles).map(function (pid) { var p = store.profiles[pid]; return { pid: pid, guest: p.guest, s: p.state.student || {}, st: p.state }; })
      .sort(function (a, b) { return (a.guest - b.guest) || String(a.s.prenom).localeCompare(String(b.s.prenom)); });
  }
  function isGuest() { return !!(store.active && store.profiles[store.active].guest); }
  function idKey(prenom, nom) { return String(prenom || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]/g, "") + "|" + initial(nom); }
  function findProfile(prenom, nom) {
    var k = idKey(prenom, nom);
    return profileList().filter(function (p) { return idKey(p.s.prenom, p.s.nom) === k; })[0] || null;
  }
  function switchProfile(pid) {
    stopTestSilently();
    store.active = pid;
    state = store.profiles[pid].state;
    persist();
    renderAll();
    showApp();
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

  // « lea » → « Lea », « jean-marc » → « Jean-Marc »
  function cleanPrenom(v) {
    return String(v || "").trim().replace(/\s+/g, " ").toLowerCase().replace(/(^|[\s\-'])(\S)/g, function (m, a, b) { return a + b.toUpperCase(); });
  }
  var idMode = "create", idGuest = false, idSpaceOk = "";
  function renderIdMode() {
    document.querySelectorAll("#id-mode [data-guest]").forEach(function (b) { b.setAttribute("aria-pressed", String((b.dataset.guest === "1") === idGuest)); });
  }
  $("id-mode").addEventListener("click", function (e) {
    var b = e.target.closest("[data-guest]");
    if (!b) return;
    idGuest = b.dataset.guest === "1";
    renderIdMode();
  });
  function showIdentity(mode) {
    $("screen-cover").hidden = true;
    idMode = mode;
    idSpaceOk = "";
    var has = profileList().length > 0;
    $("screen-app").hidden = true;
    $("screen-id").hidden = false;
    $("id-cancel").hidden = !store.active;
    $("id-title").textContent = mode === "edit" ? "✏️ Corriger mes infos" : has ? "➕ Un autre élève" : "Qui s'entraîne ?";
    $("id-mode").hidden = mode === "edit";
    $("id-edit-note").hidden = mode !== "edit";
    $("id-import").hidden = mode === "edit";
    $("id-submit").textContent = mode === "edit" ? "✅ Enregistrer" : "C'est parti →";
    idGuest = has;
    renderIdMode();
    var s = mode === "edit" ? state.student || {} : {};
    $("id-prenom").value = s.prenom || "";
    $("id-nom").value = s.nom || "";
    $("id-classe").value = s.classeSaisie || s.classe || "";
    $("id-observer").value = s.observer || "";
    updateClassePreview();
    window.scrollTo(0, 0);
  }
  $("id-cancel").addEventListener("click", function () { if (store.active) showApp(); });

  $("id-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var prenom = cleanPrenom($("id-prenom").value), nom = initial($("id-nom").value);
    var classeSaisie = $("id-classe").value.trim(), classe = normalizeClasse(classeSaisie);
    var observer = $("id-observer").value.trim();
    if (!prenom || !nom || !classe) { toast("Prénom, initiale du nom et classe sont obligatoires.", true); return; }
    $("id-prenom").value = prenom;
    // « lea dupont » tapé dans Prénom : on vérifie
    if (/\s/.test(prenom) && idSpaceOk !== prenom) {
      ask({ title: "✋ Vérifie ton prénom", text: "« " + prenom + " » : c'est seulement ton prénom ?", foot: "Ton nom de famille ne va pas ici : on garde juste son initiale (case « Initiale du nom »).",
        no: "Non, je corrige", yes: "Oui, c'est mon prénom", onNo: function () { $("id-prenom").focus(); } }, function () { idSpaceOk = prenom; $("id-form").requestSubmit ? $("id-form").requestSubmit() : $("id-submit").click(); });
      return;
    }
    var student = { prenom: prenom, nom: nom, classe: classe, classeSaisie: classeSaisie, observer: observer };
    var other = findProfile(prenom, nom);
    if (idMode === "edit") {
      if (other && other.pid !== store.active) {
        ask({ title: "👤 Ce profil existe déjà", text: prenom + " " + nom + ". a déjà un profil sur cette tablette. Aller sur ce profil ?", foot: "Si tu es un autre élève, utilise plutôt « ➕ Un autre élève ».", yes: "Oui, y aller" },
          function () { switchProfile(other.pid); });
        return;
      }
      state.student = student;
      save();
      renderAll();
      showApp();
      toast("✏️ Infos corrigées (rien n'a été effacé)");
      return;
    }
    if (other) {
      other.st.student.classe = classe; other.st.student.classeSaisie = classeSaisie; other.st.student.observer = observer;
      switchProfile(other.pid);
      toast("👋 Re-bonjour " + prenom + " : tes résultats sont là !");
      return;
    }
    var pid = uid();
    var ns = blankState();
    ns.student = student;
    store.profiles[pid] = { guest: idGuest, createdAt: new Date().toISOString(), state: ns };
    switchProfile(pid);
    if (idGuest) toast("🤝 Profil invité créé pour " + prenom);
  });

  /* ---------- Fenêtre Profil ---------- */
  function renderProfileDlg() {
    var list = profileList();
    $("profile-list").innerHTML = list.length < 2 ? "" : '<p class="lbl">Élèves sur cette tablette</p>' + list.map(function (p) {
      var act = p.pid === store.active;
      return '<div class="pr-row' + (act ? " active" : "") + '"><button type="button" class="pr-go" data-prgo="' + p.pid + '"' + (act ? " disabled" : "") + ">" +
        "<b>" + esc(p.s.prenom + " " + p.s.nom + ".") + "</b> <span class=\"badge\">" + esc(p.s.classe) + "</span> " +
        (p.guest ? '<span class="tag-guest">🤝 invité</span>' : '<span class="tag-owner">📱 tablette</span>') + (act ? ' <span class="muted small">← c\'est moi</span>' : "") + "</button>" +
        (!act && p.guest ? '<button type="button" class="pr-del" data-prdel="' + p.pid + '" aria-label="Supprimer">🗑</button>' : "") + "</div>";
    }).join("");
    var s = state.student;
    $("profile-who").textContent = s.prenom + " " + s.nom + ". · " + s.classe + (isGuest() ? " · 🤝 invité sur cette tablette" : "");
  }
  $("btn-change-id").addEventListener("click", function () {
    if (state.run) { toast("Une séance Skill est en cours : arrête-la d'abord (⏹ en bas de l'onglet Skill).", true); return; }
    renderProfileDlg();
    openDialog("profile");
  });
  $("profile-list").addEventListener("click", function (e) {
    var go = e.target.closest("[data-prgo]"), del = e.target.closest("[data-prdel]");
    if (go) { closeDialog("profile"); switchProfile(go.dataset.prgo); toast("👤 Profil de " + state.student.prenom); return; }
    if (del) {
      var p = store.profiles[del.dataset.prdel], s = p.state.student;
      closeDialog("profile");
      ask({ title: "🗑 Supprimer " + s.prenom + " " + s.nom + ". ?", text: "Ses résultats seront effacés de cette tablette.", foot: "Vérifie d'abord qu'il les a envoyés vers sa tablette (📤 Envoyer mes résultats).",
        no: "Non", yes: "Oui, supprimer", danger: true }, function () {
        delete store.profiles[del.dataset.prdel];
        persist();
        toast("🗑 Profil supprimé");
      });
    }
  });
  $("pr-edit").addEventListener("click", function () { closeDialog("profile"); showIdentity("edit"); });
  $("pr-add").addEventListener("click", function () { closeDialog("profile"); showIdentity("create"); });
  $("pr-send").addEventListener("click", function () { closeDialog("profile"); openXfer(); });
  $("pr-get").addEventListener("click", function () { closeDialog("profile"); openDialog("imp"); });
  $("id-import").addEventListener("click", function () { openDialog("imp"); });

  function showApp() {
    var s = state.student;
    $("screen-cover").hidden = true;
    $("screen-id").hidden = true;
    $("screen-app").hidden = false;
    $("who-name").textContent = (isGuest() ? "🤝 " : "") + s.prenom + " " + s.nom + ".";
    $("who-classe").textContent = s.classe;
    $("who-obs").textContent = s.observer ? "👁 Observateur : " + s.observer : "";
    $("guest-banner").hidden = !isGuest();
    $("fin-xfer-card").classList.toggle("hl", isGuest());
    var hashTab = (location.hash || "").replace("#", "");
    selectTab(PANELS[hashTab] ? hashTab : (state.run ? "skill" : state.tab || "train"));
    checkOldSeance();
    // Guide : la première fois pour chaque élève (ou lien …#guide)
    if (!state.run && (!state.guideSeen || hashTab === "guide")) setTimeout(openGuide, 0);
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
    persist();
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
      return '<div class="tl-row"><div class="tl-lbl">N' + l.n + " · " + esc(l.label) + ' <span class="muted small">(repère : ' + l.expected + ")</span></div>" +
        '<div class="counter"><button type="button" data-tcnt="-1" data-for="' + l.n + '" aria-label="moins 1">−</button>' +
        '<input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" placeholder="—" data-int data-testn="' + l.n + '">' +
        '<button type="button" data-tcnt="1" data-for="' + l.n + '" aria-label="plus 1">+1</button></div></div>';
    }).join("");
    renderTestBest();
    $("test").hidden = false;
    document.body.style.overflow = "hidden";
    openLayer("test", hideTest, function () {
      if (!test.raf) return false;
      ask({ title: "⏱️ Chrono en cours", text: "Quitter le test ? Le chrono sera arrêté.", no: "Non, je reste", yes: "Oui, quitter" }, function () { closeLayer("test"); });
      return true;
    });
  }
  function renderTestBest() {
    var id = test.id, t = state.seance.tests[id], r = state.records[id];
    $("test-best").textContent = [t ? "Aujourd'hui : " + bestTxt(t) : "", r && bestTxt(r) ? "Record : " + bestTxt(r) : ""].filter(Boolean).join(" · ");
    $("test-fix").hidden = !(r && r.tests && r.tests.length);
  }
  function hideTest() {
    cancelAnimationFrame(test.raf); test.raf = null; test.endAt = 0;
    $("test").hidden = true;
    if ($("fiche").hidden) document.body.style.overflow = "";
  }
  function closeTest() { if (!closeLayer("test")) hideTest(); }
  function stopTestSilently() {
    layers.slice().reverse().forEach(function (l) { closeLayer(l.name); });
  }
  function resetTestTimer() {
    cancelAnimationFrame(test.raf); test.raf = null; test.endAt = 0; test.finished = false;
    $("test-timer").textContent = "01:00";
    $("test-timer").className = "test-timer";
    $("test-start").textContent = "▶️ Départ";
    $("test-start").disabled = false;
    $("test-timer-hint").textContent = "Un bip et un flash à la fin de la minute.";
  }
  function tickTest() {
    var left = (test.endAt - Date.now()) / 1000;
    var el = $("test-timer");
    if (left <= 0) {
      el.textContent = "00:00"; el.className = "test-timer over";
      test.raf = null; test.endAt = 0; test.finished = true;
      $("test-start").textContent = "▶️ Départ";
      $("test-start").disabled = false;
      $("test-timer-hint").textContent = "⏰ STOP ! Note le nombre de répétitions en dessous.";
      beep(880, 0.6, 1);
      flash("stop");
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
    $("test-start").disabled = true;
    $("test-timer-hint").textContent = "C'est parti : le plus de répétitions possible !";
    beep(660, 0.15, 2);
    flash("go");
    test.raf = requestAnimationFrame(tickTest);
  });
  $("test-reset").addEventListener("click", function () {
    if (!test.raf && !test.finished) { resetTestTimer(); return; }
    ask({ title: "↺ Recommencer le chrono ?", text: test.raf ? "Le chrono tourne : il sera remis à 1:00." : "Le chrono sera remis à 1:00.", no: "Non", yes: "Oui, recommencer" }, resetTestTimer);
  });
  $("test-close").addEventListener("click", function () {
    if (test.raf) {
      ask({ title: "⏱️ Chrono en cours", text: "Quitter le test ? Le chrono sera arrêté.", no: "Non, je reste", yes: "Oui, quitter" }, closeTest);
      return;
    }
    closeTest();
  });
  $("test-fiche").addEventListener("click", function () { openFiche(test.id); });
  $("test-fix").addEventListener("click", function () { openTestsDlg(test.id); });
  $("test-levels").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tcnt]");
    if (!b) return;
    var inp = document.querySelector('[data-testn="' + b.dataset.for + '"]');
    var v = Math.max(0, Math.min(999, (intVal(inp.value) || 0) + (+b.dataset.tcnt)));
    inp.value = String(v);
  });

  // Seuil au-delà duquel on demande « tu es sûr ? » (faute de frappe 150 au lieu de 15)
  function highLimit(id, n) {
    var l = EX[id].levels[n - 1], r = state.records[id];
    return Math.max(10, Math.round(l.expected * 2.5), r && r["n" + n] != null ? Math.round(r["n" + n] * 1.5) : 0);
  }
  $("test-save").addEventListener("click", function () {
    if ($("test").hidden) return; // double appui
    var vals = {}, any = false, bad = false;
    document.querySelectorAll("[data-testn]").forEach(function (inp) {
      if (inp.value.trim() === "") return;
      var v = intVal(inp.value);
      if (v == null) bad = true; else { any = true; vals[inp.dataset.testn] = v; }
    });
    if (bad) { toast("Écris seulement un nombre entier (ex. 15).", true); return; }
    if (!any) { toast("Note le nombre de répétitions d'au moins un niveau.", true); return; }
    var id = test.id;
    var doSave = function () { if (!$("test").hidden && test.id === id) commitTest(id, vals); };
    var checkHigh = function () {
      var high = Object.keys(vals).filter(function (n) { return vals[n] > highLimit(id, +n); });
      if (!high.length) { doSave(); return; }
      var n = high[0], l = EX[id].levels[n - 1];
      askNext({ title: "🤔 Vérifie le nombre", text: vals[n] + " répétitions en 1 minute (niveau " + n + ") ? C'est beaucoup !", foot: "Repère : " + l.expected + " en 1 minute. Une faute de frappe ?",
        no: "Non, je corrige", yes: "Oui, c'est juste", onNo: function () { try { document.querySelector('[data-testn="' + n + '"]').select(); } catch (e) {} } }, doSave);
    };
    if (test.raf) {
      ask({ title: "⏱️ Le chrono tourne encore", text: "Il reste " + mmss((test.endAt - Date.now()) / 1000) + ". Enregistrer quand même ?", no: "Non, j'attends", yes: "Oui, enregistrer" }, function () {
        cancelAnimationFrame(test.raf); test.raf = null;
        var high = Object.keys(vals).some(function (n) { return vals[n] > highLimit(id, +n); });
        if (high) checkHigh(); else doSave();
      });
      return;
    }
    checkHigh();
  });
  function commitTest(id, vals) {
    var entry = { at: new Date().toISOString(), sid: state.seance.id };
    Object.keys(vals).forEach(function (n) { entry["n" + n] = vals[n]; });
    var r = state.records[id] || { tests: [] };
    r.tests = r.tests || [];
    r.tests.push(entry);
    if (r.tests.length > 100) r.tests = r.tests.slice(-100);
    state.records[id] = r;
    recompute(state, id);
    save();
    closeTest();
    renderGrid("train");
    updateCounts();
    var shown = {};
    Object.keys(vals).forEach(function (n) { shown["n" + n] = vals[n]; });
    toast("✅ " + EX[id].name + " : " + bestTxt(shown) + " enregistré");
  }

  // Meilleurs scores recalculés à partir de la liste des tests (après correction, suppression ou import)
  function recompute(s, id) {
    var r = s.records[id];
    if (!r) return;
    var cur = {}, curAt = null;
    r.n1 = r.n2 = r.n3 = null; r.lastAt = null;
    (r.tests || []).forEach(function (t) {
      ["n1", "n2", "n3"].forEach(function (k) {
        if (t[k] == null) return;
        r[k] = r[k] == null ? t[k] : Math.max(r[k], t[k]);
        if (t.sid === s.seance.id) cur[k] = cur[k] == null ? t[k] : Math.max(cur[k], t[k]);
      });
      if (!r.lastAt || t.at > r.lastAt) r.lastAt = t.at;
      if (t.sid === s.seance.id && (!curAt || t.at > curAt)) curAt = t.at;
    });
    if (r.n1 == null && r.n2 == null && r.n3 == null) delete s.records[id];
    if (curAt) { cur.at = curAt; s.seance.tests[id] = cur; } else delete s.seance.tests[id];
  }

  /* ---------- Corriger : liste des tests d'un exercice, avec suppression ---------- */
  var testsDlgId = null;
  function openTestsDlg(id) {
    testsDlgId = id;
    renderTestsDlg();
    openDialog("tests-dlg");
  }
  function renderTestsDlg() {
    var id = testsDlgId, r = state.records[id];
    $("tests-title").textContent = "✏️ " + EX[id].name + " : mes tests";
    if (!r || !r.tests || !r.tests.length) { $("tests-list").innerHTML = '<p class="muted">Aucun test.</p>'; return; }
    $("tests-list").innerHTML = r.tests.map(function (t, i) {
      var tag = t.sid === state.seance.id ? "aujourd'hui" : t.old ? "ancienne version" : t.imp ? "autre tablette" : shortDate(t.at);
      return '<div class="tt-row"><span><b>' + esc(bestTxt(t)) + '</b> <span class="muted small">' + esc(tag) + (t.sid === state.seance.id ? " " + timeFr(t.at) : "") + "</span></span>" +
        '<button type="button" class="btn small danger" data-tdel="' + i + '">🗑 Supprimer</button></div>';
    }).reverse().join("");
  }
  $("tests-list").addEventListener("click", function (e) {
    var b = e.target.closest("[data-tdel]");
    if (!b) return;
    var id = testsDlgId, r = state.records[id], i = +b.dataset.tdel, t = r && r.tests[i];
    if (!t) return;
    closeDialog("tests-dlg");
    ask({ title: "🗑 Supprimer ce test ?", text: EX[id].name + " : " + bestTxt(t), no: "Non", yes: "Oui, supprimer", danger: true,
      onNo: function () { openDialog("tests-dlg"); } }, function () {
      r.tests.splice(i, 1);
      recompute(state, id);
      save();
      renderGrid("train");
      updateCounts();
      if (!$("test").hidden && test.id === id) renderTestBest();
      if (state.tab === "hist") renderHistory();
      toast("🗑 Test supprimé : record recalculé");
      if (state.records[id]) { renderTestsDlg(); openDialog("tests-dlg"); }
    });
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
    openLayer("fiche", hideFiche);
  }
  function hideFiche() {
    $("fiche").hidden = true;
    if ($("test").hidden) document.body.style.overflow = "";
  }
  $("fiche-close").addEventListener("click", function () { if (!closeLayer("fiche")) hideFiche(); });
  $("fiche-test").addEventListener("click", function () {
    if (!closeLayer("fiche")) hideFiche();
    if (test.id === ficheId && !$("test").hidden) return;
    if (!$("test").hidden) closeTest();
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
  // Invité (tablette empruntée) : son catalogue est sur sa tablette, il peut donc choisir tous les exercices
  function usableLevels(exId) {
    var lv = testedLevels(exId);
    if (!lv.length && isGuest()) return EX[exId].levels.map(function (l) { return l.n; });
    return lv;
  }
  function catalogue(famId) {
    return EXERCISES.filter(function (e) { return e.family === famId && usableLevels(e.id).length; });
  }
  function sanitizeCfg() {
    FAMILIES.forEach(function (f) {
      var sel = state.cfg.selection[f.id];
      var lv = sel && EX[sel] ? usableLevels(sel) : [];
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
        var e = EX[sel], r = state.records[sel] || {}, lv = usableLevels(sel);
        h += '<div class="lvl">' + e.levels.map(function (l) {
          var ok = lv.indexOf(l.n) !== -1, sc = r["n" + l.n];
          return '<button type="button" data-fam="' + f.id + '" data-lvl="' + l.n + '" aria-pressed="' + (lvl === l.n) + '"' + (ok ? "" : " disabled") + ">Niveau " + l.n +
            "<small>" + esc(l.label) + (sc != null ? " · test : " + sc + "/min" : ok ? "" : " · pas testé") + "</small></button>";
        }).join("") + "</div>";
        h += '<div class="obj"><label>Objectif par bloc<br><span class="muted small">repère ' + expectedBase(sel, lvl) + (r["n" + lvl] != null ? " · ton test : " + r["n" + lvl] + "/min" : "") + "</span></label>" +
          '<button type="button" data-fam="' + f.id + '" data-obj="-1">−</button>' +
          '<input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" data-int data-objin="' + f.id + '" value="' + esc(state.cfg.objectives[f.id]) + '">' +
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
      var lvs = usableLevels(b.dataset.pick);
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
      if (state.run) return;
      var cfg = JSON.parse(JSON.stringify(state.cfg));
      FAMILIES.forEach(function (f) { cfg.objectives[f.id] = num(cfg.objectives[f.id]); });
      var done = {};
      FAMILIES.forEach(function (f) { done[f.id] = ""; });
      state.run = { cfg: cfg, totalBlocks: cfg.duration / 2, blocks: [], phase: "work", workStart: Date.now(), phaseEnd: 0, pending: null, done: done };
      state.seance.skill = null;
      save();
      beep(660, 0.15, 2);
      flash("go");
      keepAwake(true);
      renderSkill();
      updateCounts();
    };
    var checkExisting = function () {
      if (state.seance.skill) {
        askNext({ title: "🔥 Nouvelle séance Skill", text: "Une séance Skill est déjà terminée aujourd'hui. La remplacer par une nouvelle ?", yes: "Oui, recommencer", danger: true }, go);
      } else go();
    };
    // Objectif plus grand que le test d'1 minute entière : sûrement une erreur (total de séance au lieu de par bloc)
    var high = FAMILIES.filter(function (f) {
      var sel = state.cfg.selection[f.id], lvl = state.cfg.levels[f.id], r = state.records[sel] || {};
      var ref = r["n" + lvl] != null ? r["n" + lvl] : expectedBase(sel, lvl);
      return num(state.cfg.objectives[f.id]) > ref;
    });
    if (high.length) {
      var f0 = high[0], sel0 = state.cfg.selection[f0.id], lvl0 = state.cfg.levels[f0.id], r0 = state.records[sel0] || {};
      ask({ title: "🤔 Objectif très élevé", text: EX[sel0].name + " : " + state.cfg.objectives[f0.id] + " par bloc ? C'est plus que " + (r0["n" + lvl0] != null ? "ton test d'1 minute (" + r0["n" + lvl0] + ")" : "le repère d'1 minute (" + expectedBase(sel0, lvl0) + ")") + ".",
        foot: "L'objectif = le nombre de répétitions dans UN bloc de 2 minutes, où tu fais les 4 exercices.", no: "Non, je corrige", yes: "Oui, je garde" }, checkExisting);
      return;
    }
    checkExisting();
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
  // Case vide = « à compléter » (et non 0) : on peut la corriger plus tard
  function commitBlock() {
    var r = state.run;
    var done = {}, missing = false;
    FAMILIES.forEach(function (f) {
      var n = intVal(r.done[f.id]);
      done[f.id] = n;
      if (n == null) missing = true;
      r.done[f.id] = "";
    });
    var b = { practice: r.pending.practice, recover: r.pending.recover, done: done };
    if (missing) b.missing = true;
    r.blocks.push(b);
    r.pending = null;
    r.undo = 0;
  }
  function blocksMissing(blocks) { return (blocks || []).filter(function (b) { return FAMILIES.some(function (f) { return b.done[f.id] == null; }); }).length; }
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
      flash("end");
      var miss = blocksMissing(state.seance.skill.blocks);
      toast(miss ? "🎉 Séance terminée ! ⚠️ " + miss + " bloc(s) à compléter (en rouge)" : "🎉 Séance Skill terminée !", !!miss);
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
          if (now - r.workStart < (BLOCK + 2) * 1000) { beep(440, 0.7, 1); flash("stop"); }
          continue;
        }
      } else if (now >= r.phaseEnd) {
        var boundary = r.phaseEnd;
        commitBlock();
        changed = true;
        if (r.blocks.length >= r.totalBlocks) { finishRun(false); return true; }
        r.phase = "work";
        r.workStart = boundary;
        if (now - boundary < 2000) { beep(660, 0.15, 2); flash("go"); }
        continue;
      }
      break;
    }
    // bips des 3 dernières secondes de repos / saisie
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
    $("run-undo").hidden = !(r.undo && now < r.undo && r.phase !== "work");
    if (r.phase === "work") {
      var el = (now - r.workStart) / 1000;
      head.className = "card run-head ph-work";
      $("run-phase").textContent = "TRAVAIL";
      $("run-timer").textContent = mmss(Math.floor(el));
      $("run-sub").textContent = "fin du bloc dans " + mmss(BLOCK - el);
      $("run-bar").style.width = Math.min(100, el / BLOCK * 100) + "%";
      main.textContent = "✋ J'ai fini le circuit";
      main.className = "btn big full stop";
      main.disabled = false;
      $("run-help").textContent = "Fais les 4 exercices. Touche le bouton quand c'est fini. L'observateur compte avec « +1 ».";
      $("run-inputs-title").textContent = "Observateur : compte les répétitions";
    } else if (r.phase === "recovery") {
      var left = (r.phaseEnd - now) / 1000;
      head.className = "card run-head ph-recov";
      $("run-phase").textContent = "REPOS";
      $("run-timer").textContent = mmss(left);
      $("run-sub").textContent = "circuit fait en " + mmss(r.pending.practice) + " · le bloc suivant part tout seul";
      $("run-bar").style.width = Math.max(0, 100 - left / r.pending.recover * 100) + "%";
      main.textContent = "📝 Observateur : vérifie les nombres";
      main.className = "btn big full wait";
      main.disabled = true;
      $("run-help").textContent = "Repose-toi. Le bloc est enregistré tout seul à la fin du repos.";
      $("run-inputs-title").textContent = "📝 Répétitions de ce bloc";
    } else {
      var left2 = (r.phaseEnd - now) / 1000;
      head.className = "card run-head ph-sas";
      $("run-phase").textContent = "STOP ! NOTE VITE";
      $("run-timer").textContent = mmss(left2);
      $("run-sub").textContent = "enregistré tout seul dans " + Math.ceil(Math.max(0, left2)) + " s";
      $("run-bar").style.width = Math.max(0, 100 - left2 / SAS * 100) + "%";
      main.textContent = "✅ C'est noté : bloc suivant";
      main.className = "btn big full go";
      main.disabled = false;
      $("run-help").textContent = "Les 2 minutes sont finies : écris vite les répétitions. Une case vide pourra être complétée après.";
      $("run-inputs-title").textContent = "📝 Répétitions de ce bloc";
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
        '<div class="counter"><button type="button" data-rcnt="-1" data-fam="' + f.id + '" aria-label="moins 1">−</button>' +
        '<input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" placeholder="—" data-int data-done="' + f.id + '" value="' + esc(r.done[f.id]) + '">' +
        '<button type="button" data-rcnt="1" data-fam="' + f.id + '" aria-label="plus 1">+1</button></div></div>';
    }).join("");
  }
  $("run-ex").addEventListener("input", function (e) {
    var fam = e.target.dataset.done;
    if (!fam || !state.run) return;
    state.run.done[fam] = e.target.value;
    save();
  });
  $("run-ex").addEventListener("click", function (e) {
    var b = e.target.closest("[data-rcnt]");
    if (!b || !state.run) return;
    var fam = b.dataset.fam, inp = document.querySelector('[data-done="' + fam + '"]');
    var v = Math.max(0, Math.min(999, (intVal(state.run.done[fam]) || 0) + (+b.dataset.rcnt)));
    state.run.done[fam] = String(v);
    if (inp) inp.value = String(v);
    save();
  });

  function logHtml(blocks, cfg, editable) {
    if (!blocks.length) return '<p class="muted">Aucun bloc pour l\'instant.</p>';
    return blocks.map(function (b, i) {
      var miss = FAMILIES.some(function (f) { return b.done[f.id] == null; });
      return '<div class="log-row' + (miss ? " missing" : "") + '"><div class="top"><span>Bloc ' + (i + 1) + (miss ? " · ⚠️ à compléter" : "") + '</span><span class="muted">travail ' + mmss(b.practice) + " · repos " + mmss(b.recover) + "</span></div>" +
        '<div class="vals">' + FAMILIES.map(function (f) {
          var name = EX[cfg.selection[f.id]].name, v = b.done[f.id];
          return editable
            ? "<label>" + esc(name) + '<input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="3" placeholder="?" data-int data-edit-block="' + i + '" data-edit-fam="' + f.id + '" value="' + esc(v == null ? "" : v) + '"' + (v == null ? ' class="miss"' : "") + "></label>"
            : "<label>" + esc(name) + "<b>" + (v == null ? "?" : esc(v)) + "</b></label>";
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
    var b = blocks && blocks[+t.dataset.editBlock];
    if (!b) return;
    b.done[t.dataset.editFam] = intVal(t.value);
    if (FAMILIES.every(function (f) { return b.done[f.id] != null; })) delete b.missing;
    t.classList.toggle("miss", b.done[t.dataset.editFam] == null);
    save();
  });
  document.addEventListener("change", function (e) {
    if (e.target.dataset && e.target.dataset.editBlock != null) {
      toast("✏️ Correction enregistrée");
      if (!state.run) renderFinRecap(); else renderRunLog();
    }
  });

  $("run-main").addEventListener("click", function () {
    var r = state.run;
    if (!r) return;
    unlockAudio();
    if (r.phase === "work") {
      // Pas de question : on peut annuler pendant 6 s si on a touché par erreur
      var p = Math.max(1, Math.min(BLOCK, Math.round((Date.now() - r.workStart) / 1000)));
      r.pending = { practice: p, recover: BLOCK - p };
      if (r.pending.recover > 0) { r.phase = "recovery"; r.phaseEnd = r.workStart + BLOCK * 1000; }
      else { r.phase = "sas"; r.phaseEnd = Date.now() + SAS * 1000; }
      r.undo = Date.now() + 6000;
      save();
      beep(440, 0.3, 1);
      flash("stop");
      renderSkill();
    } else if (r.phase === "sas") {
      commitBlock();
      if (r.blocks.length >= r.totalBlocks) { finishRun(false); return; }
      r.phase = "work"; r.workStart = Date.now();
      save();
      beep(660, 0.15, 2);
      flash("go");
      renderSkill();
    }
  });
  $("run-undo").addEventListener("click", function () {
    var r = state.run;
    if (!r || r.phase === "work" || !r.undo || Date.now() > r.undo + 1000) return;
    r.phase = "work"; r.pending = null; r.phaseEnd = 0; r.undo = 0;
    save();
    toast("↩️ Annulé : le circuit continue");
    renderSkill();
  });

  $("run-stop").addEventListener("click", function () {
    var r = state.run;
    if (!r) return;
    var n = r.blocks.length + (r.pending ? 1 : 0);
    ask({ title: "⏹ Arrêter la séance ?", text: n ? "La séance s'arrête maintenant. Les " + n + " bloc(s) terminé(s) sont gardés." : "Aucun bloc n'est terminé : la séance sera annulée.",
      no: "Non, continuer", yes: "Oui, arrêter", danger: true }, function () {
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
      $("hist-catalogue").innerHTML = '<table class="cat-table"><tr><th></th><th>Exercice</th><th>N1</th><th>N2</th><th>N3</th><th>Dernier test</th><th></th></tr>' +
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
            "<td class=\"muted\">" + (r.lastAt ? esc(shortDate(r.lastAt)) : "—") + "</td>" +
            '<td><button type="button" class="btn small ghost" data-fixex="' + id + '" aria-label="Corriger">✏️</button></td></tr>';
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
  function qrImg(text, cell, ecl) {
    var q = qrcode(0, ecl || "M");
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
    if (state.run) h += "<p>🔒 Séance Skill en cours : termine-la (ou arrête-la) avant de faire scanner.</p>";
    else if (sk) {
      var tot = skillTotals(sk);
      h += FAMILIES.map(function (f) { var t = tot[f.id]; return "<p>" + esc(EX[t.id].name) + " (N" + t.level + ") : <b>" + t.done + "</b> / " + t.expected + "</p>"; }).join("");
      var miss = blocksMissing(sk.blocks);
      if (miss) h += '<p class="warn">⚠️ ' + miss + " bloc(s) à compléter : écris les nombres dans les cases rouges ci-dessous.</p>";
      h += '<details' + (miss ? " open" : "") + '><summary class="muted">✏️ Corriger un bloc</summary><div class="log">' + logHtml(sk.blocks, sk.cfg, true) + "</div></details>";
    } else h += "<p>—</p>";
    h += "</section>";
    $("fin-recap").innerHTML = h;
  }
  function renderFin() {
    renderFinRecap();
    var box = $("fin-qr");
    box.innerHTML = "";
    $("fin-fullscreen").disabled = !!state.run;
    if (state.run) {
      box.innerHTML = '<p class="lock">🔒 Le QR apparaîtra quand la séance Skill sera finie.</p>';
      $("fin-qr-info").textContent = "Termine la séance (ou ⏹ Arrêter) dans l'onglet 🔥 Skill.";
      return;
    }
    var t = qrText();
    try {
      box.appendChild(qrImg(t, 5));
      var miss = state.seance.skill ? blocksMissing(state.seance.skill.blocks) : 0;
      var note = seanceEmpty() ? "Séance vide : le QR ne contient que l'identité. " : miss ? "⚠️ " + miss + " bloc(s) à compléter (comptés 0). " : "";
      $("fin-qr-info").textContent = note + t.length + " caractères";
    } catch (e) {
      box.textContent = "QR impossible.";
    }
  }
  $("fin-fullscreen").addEventListener("click", function () {
    if (state.run) { toast("Termine d'abord la séance Skill.", true); return; }
    var holder = $("qr-full-code");
    holder.innerHTML = "";
    try { holder.appendChild(qrImg(qrText(), 9)); } catch (e) { holder.textContent = "QR impossible."; }
    var s = state.student;
    $("qr-full-name").textContent = s.prenom + " " + s.nom + ". · " + s.classe;
    $("qr-full").hidden = false;
    openLayer("qr", function () { $("qr-full").hidden = true; });
    if (!seanceEmpty()) { state.seance.qrShownAt = new Date().toISOString(); save(); }
  });
  $("qr-full-close").addEventListener("click", function () { if (!closeLayer("qr")) $("qr-full").hidden = true; });
  $("hist-catalogue").addEventListener("click", function (e) { var b = e.target.closest("[data-fixex]"); if (b) openTestsDlg(b.dataset.fixex); });

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
        L.push("  Bloc " + (i + 1) + " (" + mmss(b.practice) + ") : " + FAMILIES.map(function (f) { return EX[sk.cfg.selection[f.id]].name + " " + (b.done[f.id] == null ? "?" : b.done[f.id]); }).join(", "));
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
    if (state.run) { toast("Une séance Skill est en cours : arrête-la d'abord (⏹ en bas de l'onglet Skill).", true); selectTab("skill"); return; }
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
   * TRANSFERT entre tablettes (élève qui a utilisé la tablette d'un camarade)
   * QR (ou fichier) : {t:"CTX", v:1, id, at, s:{p,n,c}, r:{code:[jour,n1,n2,n3]}, h:[séances]}
   * Fichier : r:{code:[[date,n1,n2,n3],…]} (tous les tests), f:1
   * ======================================================= */
  var CODE2ID = {};
  Object.keys(EXO_CODES).forEach(function (id) { CODE2ID[EXO_CODES[id]] = id; });
  var XFER_MAX = 2600;
  function nz(v) { return v == null ? null : v; }
  function trimNulls(a) { while (a.length && a[a.length - 1] == null) a.pop(); return a; }
  function packSeance(se) {
    var o = { i: se.id, d: se.date, t: {} };
    Object.keys(se.tests || {}).forEach(function (id) {
      var t = se.tests[id], c = EXO_CODES[id];
      if (c) o.t[c] = trimNulls([nz(t.n1), nz(t.n2), nz(t.n3)]);
    });
    var k = se.skill;
    if (k) {
      o.k = {
        s: FAMILIES.map(function (f) { return EXO_CODES[k.cfg.selection[f.id]] || ""; }),
        l: FAMILIES.map(function (f) { return k.cfg.levels[f.id]; }),
        o: FAMILIES.map(function (f) { return k.cfg.objectives[f.id]; }),
        u: k.cfg.duration, m: k.durationMinutes, x: k.stoppedEarly ? 1 : 0, f: k.finishedAt,
        b: k.blocks.map(function (b) { return [b.practice, b.recover].concat(FAMILIES.map(function (f) { return nz(b.done[f.id]); })); })
      };
    }
    return o;
  }
  function okNum(v) { return typeof v === "number" && isFinite(v) && v >= 0 && v < 1000 ? Math.round(v) : null; }
  function unpackSeance(o) {
    var se = { id: String(o.i || ""), date: String(o.d || ""), tests: {}, skill: null };
    Object.keys(o.t || {}).forEach(function (c) {
      var id = CODE2ID[c], a = o.t[c], t = {}, any = false;
      if (!id || !Array.isArray(a)) return;
      [0, 1, 2].forEach(function (i) { var v = okNum(a[i]); if (v != null) { t["n" + (i + 1)] = v; any = true; } });
      if (any) se.tests[id] = t;
    });
    var k = o.k;
    if (k && Array.isArray(k.s) && Array.isArray(k.b)) {
      var cfg = { selection: {}, levels: {}, objectives: {}, duration: k.u || k.m }, ok = true;
      FAMILIES.forEach(function (f, i) {
        var id = CODE2ID[k.s[i]];
        if (!id) ok = false;
        cfg.selection[f.id] = id;
        cfg.levels[f.id] = k.l && k.l[i] || 1;
        cfg.objectives[f.id] = k.o && okNum(k.o[i]) || 0;
      });
      if (ok) {
        se.skill = {
          cfg: cfg, durationMinutes: k.m, stoppedEarly: !!k.x, finishedAt: k.f,
          blocks: k.b.map(function (a) { var d = {}; FAMILIES.forEach(function (f, i) { d[f.id] = okNum(a[2 + i]); }); return { practice: okNum(a[0]) || 0, recover: okNum(a[1]) || 0, done: d }; })
        };
      }
    }
    return se;
  }
  function xferPayload(full) {
    var s = state.student;
    var p = { t: "CTX", v: 1, id: uid(), at: new Date().toISOString(), s: { p: s.prenom, n: s.nom, c: s.classe }, r: {} };
    if (full) p.f = 1;
    Object.keys(state.records).forEach(function (id) {
      var r = state.records[id], c = EXO_CODES[id];
      if (!c) return;
      p.r[c] = full
        ? (r.tests || []).map(function (t) { return trimNulls([t.at, nz(t.n1), nz(t.n2), nz(t.n3)]); })
        : trimNulls([(r.lastAt || p.at).slice(0, 10), nz(r.n1), nz(r.n2), nz(r.n3)]);
    });
    var ses = [];
    var se = state.seance;
    if (Object.keys(se.tests).length || se.skill) ses.push({ id: se.id, date: se.updatedAt || se.startedAt, tests: se.tests, skill: se.skill });
    p.h = ses.concat(state.history || []).map(packSeance);
    return p;
  }
  function xferQrPayload() {
    var p = xferPayload(false), total = p.h.length;
    while (asciiJson(p).length > XFER_MAX && p.h.length) p.h.pop();
    return { p: p, total: total };
  }

  function mergeImport(ts, p) {
    var nEx = 0, nSes = 0;
    var mk = function (at, vals) {
      var t = { at: String(at), imp: 1 };
      vals.forEach(function (v, i) { v = okNum(v); if (v != null && i < 3) t["n" + (i + 1)] = v; });
      return t;
    };
    Object.keys(p.r || {}).forEach(function (c) {
      var id = CODE2ID[c], a = p.r[c];
      if (!id || !Array.isArray(a)) return;
      var entries = p.f
        ? a.filter(Array.isArray).map(function (x) { return mk(x[0] || p.at, x.slice(1)); })
        : [mk(a[0] ? String(a[0]).slice(0, 10) + "T12:00:00.000Z" : p.at, a.slice(1))];
      var r = ts.records[id] || { tests: [] }, added = false;
      r.tests = r.tests || [];
      entries.forEach(function (t) {
        if (t.n1 == null && t.n2 == null && t.n3 == null) return;
        var dup = r.tests.some(function (x) { return String(x.at).slice(0, 16) === t.at.slice(0, 16) && x.n1 == t.n1 && x.n2 == t.n2 && x.n3 == t.n3; });
        if (!dup) { r.tests.push(t); added = true; }
      });
      if (added) {
        r.tests.sort(function (x, y) { return String(x.at) < String(y.at) ? -1 : 1; });
        ts.records[id] = r;
        recompute(ts, id);
        nEx++;
      }
    });
    (p.h || []).forEach(function (o) {
      if (!o || typeof o !== "object") return;
      var se = unpackSeance(o);
      if (!se.id || se.id === ts.seance.id || ts.history.some(function (h) { return h.id === se.id; })) return;
      if (!Object.keys(se.tests).length && !se.skill) return;
      ts.history.push(se);
      nSes++;
    });
    ts.history.sort(function (x, y) { return String(y.date).localeCompare(String(x.date)); });
    if (ts.history.length > 40) ts.history = ts.history.slice(0, 40);
    ts.imported.push(p.id);
    return { ex: nEx, ses: nSes };
  }

  function handleImport(text) {
    var p = null;
    try { p = JSON.parse(String(text).replace(/^﻿/, "")); } catch (e) {}
    if (p && p.html != null && p.text != null) { toast("Ce fichier est pour le carnet, pas pour récupérer tes résultats.", true); return false; }
    if (!p || p.t !== "CTX" || !p.s || !p.s.p || !p.id) { toast("Ce n'est pas un transfert Cross Training.", true); return false; }
    if (state.run) { toast("Une séance Skill est en cours : arrête-la d'abord.", true); return false; }
    var who = p.s.p + " " + p.s.n + ". (" + p.s.c + ")";
    var isSave = p.k === "save";
    var desc = Object.keys(p.r || {}).length + " exercice(s) testé(s), " + (p.h || []).length + " séance(s)";
    var doIt = function (pid) {
      if (!pid) {
        pid = uid();
        var ns = blankState();
        ns.student = { prenom: cleanPrenom(p.s.p), nom: initial(p.s.n) || "X", classe: normalizeClasse(p.s.c), classeSaisie: String(p.s.c || ""), observer: "" };
        store.profiles[pid] = { guest: !!store.active, createdAt: new Date().toISOString(), state: ns };
      }
      var ts = store.profiles[pid].state;
      if (ts.imported.indexOf(p.id) !== -1) { switchProfile(pid); toast("✅ Ces résultats sont déjà récupérés."); return; }
      var res = mergeImport(ts, p);
      switchProfile(pid);
      selectTab("hist");
      toast("📥 Récupéré : " + res.ex + " exercice(s), " + res.ses + " séance(s) ✅");
    };
    var target = findProfile(p.s.p, p.s.n);
    if (!store.active) {
      ask({ title: isSave ? "📂 Restaurer la sauvegarde" : "📥 Récupérer des résultats", text: who + " : " + desc + ". Créer ce profil sur cette tablette ?", yes: "Oui", go: true }, function () { doIt(target ? target.pid : null); });
    } else if (target) {
      ask({ title: isSave ? "📂 Restaurer la sauvegarde" : "📥 Récupérer mes résultats", text: who + " : " + desc + ". Les ajouter " + (target.pid === store.active ? "à ton profil ?" : "au profil de " + target.s.prenom + " ?"),
        foot: "Rien n'est effacé : les résultats sont ajoutés.", yes: "Oui, ajouter", go: true }, function () { doIt(target.pid); });
    } else {
      ask({ title: "⚠️ Ce ne sont pas tes résultats", text: "Ce sont les résultats de " + who + ", pas ceux de " + state.student.prenom + " " + state.student.nom + ". Créer un profil pour " + p.s.p + " sur cette tablette ?",
        foot: "Si c'est bien toi (prénom écrit autrement), corrige d'abord ton prénom : 👤 Profil → ✏️ Corriger.", no: "Non", yes: "Oui, créer " + p.s.p }, function () { doIt(null); });
    }
    return true;
  }

  /* ---------- Envoyer ---------- */
  function openXfer() {
    if (state.run) { toast("Une séance Skill est en cours : arrête-la d'abord.", true); return; }
    var q = xferQrPayload(), txt = asciiJson(q.p), box = $("xfer-qr");
    box.innerHTML = "";
    try { box.appendChild(qrImg(txt, 4, "L")); } catch (e) { box.textContent = "QR trop grand : utilise le fichier."; }
    var n = q.p.h.length;
    $("xfer-info").textContent = Object.keys(q.p.r).length + " exercice(s) testé(s) · " + n + " séance(s)" + (n < q.total ? " (les " + n + " plus récentes sur " + q.total + " ; le fichier contient tout)" : "");
    $("xfer-delete").hidden = !isGuest();
    openDialog("xfer");
  }
  function xferFile() {
    var s = state.student;
    var name = "CrossTraining_Transfert_" + fileSafe(s.prenom) + "_" + fileSafe(s.nom) + "_" + new Date().toISOString().slice(0, 10) + ".json";
    var content = asciiJson(xferPayload(true));
    try { return new File([content], name, { type: "application/json" }); }
    catch (e) { var b = new Blob([content], { type: "application/json" }); b.name = name; return b; }
  }
  $("xfer-file").addEventListener("click", function () { download(xferFile()); toast("💾 Fichier enregistré dans Téléchargements."); });
  $("xfer-share").addEventListener("click", function () {
    var f = xferFile();
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [f] })) {
      navigator.share({ files: [f], title: "Mes résultats Cross Training" }).catch(function (err) {
        if (err && err.name !== "AbortError") toast("Partage impossible : utilise « Fichier ».", true);
      });
    } else { download(f); toast("Partage indisponible : fichier enregistré dans Téléchargements."); }
  });
  $("xfer-delete").addEventListener("click", function () {
    closeDialog("xfer");
    ask({ title: "🗑 Supprimer ton profil de cette tablette ?", text: "Vérifie d'abord que TA tablette affiche bien tes résultats (onglet Historique).", no: "Non", yes: "Oui, supprimer", danger: true }, function () {
      var gone = store.active;
      var next = profileList().filter(function (p) { return p.pid !== gone && !p.guest; })[0] || profileList().filter(function (p) { return p.pid !== gone; })[0];
      delete store.profiles[gone];
      if (next) { switchProfile(next.pid); toast("🗑 Profil supprimé. Retour à " + next.s.prenom); }
      else { store.active = null; state = blankState(); try { localStorage.setItem(PKEY, JSON.stringify(store)); } catch (e) {} renderAll(); showIdentity("create"); toast("🗑 Profil supprimé"); }
    });
  });
  $("guest-send").addEventListener("click", openXfer);
  $("fin-xfer").addEventListener("click", openXfer);

  /* ---------- Récupérer : scanner le QR ou ouvrir le fichier ---------- */
  $("imp-file").addEventListener("click", function () { $("imp-input").value = ""; $("imp-input").click(); });
  $("imp-input").addEventListener("change", function () {
    var f = this.files && this.files[0];
    if (!f) return;
    var rd = new FileReader();
    rd.onload = function () { closeDialog("imp"); handleImport(rd.result); };
    rd.onerror = function () { toast("Lecture du fichier impossible.", true); };
    rd.readAsText(f);
  });
  var scan = { stream: null, timer: null }, scanCanvas = document.createElement("canvas");
  function loadJsQR(cb) {
    if (window.jsQR) { cb(); return; }
    var s = document.createElement("script");
    s.src = "lib/jsQR.js";
    s.onload = cb;
    s.onerror = function () { toast("Scanner indisponible : utilise « Ouvrir le fichier ».", true); };
    document.head.appendChild(s);
  }
  $("imp-scan").addEventListener("click", function () { closeDialog("imp"); loadJsQR(startScan); });
  function startScan() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast("Caméra indisponible : utilise « Ouvrir le fichier ».", true); return; }
    $("scan").hidden = false;
    document.body.style.overflow = "hidden";
    $("scan-msg").textContent = "Autorise la caméra, puis vise le QR code de transfert.";
    openLayer("scan", stopScan);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }).then(function (st) {
      if ($("scan").hidden) { st.getTracks().forEach(function (t) { t.stop(); }); return; }
      scan.stream = st;
      var v = $("scan-video");
      v.srcObject = st;
      var pl = v.play();
      if (pl && pl.catch) pl.catch(function () {});
      $("scan-msg").textContent = "Vise le QR code de transfert…";
      scanLoop();
    }).catch(function () {
      $("scan-msg").textContent = "Caméra refusée : autorise-la (Réglages › Safari › Caméra) ou utilise « Ouvrir le fichier ».";
    });
  }
  function scanLoop() {
    if (!scan.stream) return;
    var v = $("scan-video");
    if (v.readyState >= 2 && v.videoWidth) {
      var k = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
      scanCanvas.width = Math.round(v.videoWidth * k);
      scanCanvas.height = Math.round(v.videoHeight * k);
      var ctx = scanCanvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(v, 0, 0, scanCanvas.width, scanCanvas.height);
      var img = ctx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
      var code = null;
      try { code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" }); } catch (e) {}
      if (code && code.data) {
        if (code.data.indexOf('"CTX"') !== -1) {
          var d = code.data;
          if (!closeLayer("scan")) stopScan();
          beep(880, 0.15, 1);
          handleImport(d);
          return;
        }
        $("scan-msg").textContent = "❌ Ce n'est pas le QR de transfert (celui-ci est peut-être pour le prof).";
      }
    }
    scan.timer = setTimeout(scanLoop, 150);
  }
  function stopScan() {
    clearTimeout(scan.timer);
    if (scan.stream) scan.stream.getTracks().forEach(function (t) { t.stop(); });
    scan.stream = null;
    try { $("scan-video").srcObject = null; } catch (e) {}
    $("scan").hidden = true;
    document.body.style.overflow = "";
  }
  $("scan-close").addEventListener("click", function () { if (!closeLayer("scan")) stopScan(); });

  /* =========================================================
   * GUIDE ÉLÈVE (après la saisie de l'identité + bouton ❓ Aide)
   * ======================================================= */
  function mk(cls, txt) { return '<span class="g-btn ' + cls + '">' + txt + "</span>"; }
  function stepList(items) {
    return '<ol class="g-steps">' + items.map(function (it, i) { return '<li><span class="g-num">' + (i + 1) + "</span><span>" + it + "</span></li>"; }).join("") + "</ol>";
  }
  var GUIDE = [
    { ico: "👋", col: "#34d399", title: function () { return "Bienvenue " + (state.student ? esc(state.student.prenom) : "") + " !"; },
      body: function () {
        return '<p class="g-lead">Ici, on travaille <b>à deux</b> :</p>' +
          '<div class="g-duo"><div class="g-person"><span>🏋️</span><b>Toi</b><small>tu fais les exercices</small></div>' +
          '<div class="g-person"><span>👁</span><b>L\'observateur</b><small>il compte et écrit les nombres</small></div></div>' +
          '<p class="g-note">Tout est enregistré tout seul sur la tablette. Les 5 onglets en haut :</p>' +
          '<div class="g-tabs"><span>⏱️<br>Entraînement</span><span>🔥<br>Skill</span><span>📄<br>Fiches</span><span>📈<br>Historique</span><span>✅<br>Fin de séance</span></div>';
      } },
    { ico: "⏱️", col: "#fbbf24", title: function () { return "Entraînement : le test d'1 minute"; },
      body: function () {
        return stepList([
          "Touche un exercice",
          "Appuie sur " + mk("go", "▶️ Départ"),
          "1 minute : le plus de répétitions possible !",
          "L'observateur écrit le nombre " + '<span class="g-counter"><i>−</i><b>15</b><i class="p">+1</i></span>',
          "Appuie sur " + mk("go", "💾 Enregistrer"),
        ]) + '<p class="g-tip">📚 Chaque exercice testé entre dans <b>ton catalogue</b>. C\'est avec lui que tu construis ton Skill.</p>';
      } },
    { ico: "🔥", col: "#f43f5e", title: function () { return "Skill : ton circuit"; },
      body: function () {
        return '<p class="g-lead">Choisis <b>1 exercice par couleur</b> dans ton catalogue :</p>' +
          '<div class="g-fams"><span class="c">❤️ Cardio</span><span class="h">💪 Haut du corps</span><span class="b">🦵 Bas du corps</span><span class="g">🧱 Gainage</span></div>' +
          '<p class="g-lead">Puis son <b>niveau</b>, ton <b>objectif par bloc</b> et la <b>durée</b> → ' + mk("go", "▶️ Démarrer") + "</p>" +
          '<div class="g-flow"><div class="w">🏃 TRAVAIL<small>fais les 4 exercices</small></div><b>→</b><div class="s">✋ J\'ai fini<small>touche le bouton</small></div><b>→</b><div class="r">😮‍💨 REPOS<small>jusqu\'à la fin des 2 min</small></div></div>' +
          '<p class="g-tip">⏰ Chaque bloc dure <b>2 minutes</b>. Le bloc suivant démarre <b>tout seul</b>.</p>';
      } },
    { ico: "🚦", col: "#38bdf8", title: function () { return "Les signaux"; },
      body: function () {
        return '<div class="g-sig"><div class="go"><span></span><p><b>Écran VERT</b> + 2 bips<small>C\'est parti !</small></p></div>' +
          '<div class="stop"><span></span><p><b>Écran ROUGE</b> + 1 bip<small>STOP ! On note les répétitions</small></p></div>' +
          '<div class="end"><span></span><p><b>Écran VIOLET</b> + 3 bips<small>Séance terminée 🎉</small></p></div></div>' +
          '<p class="g-tip">🔊 Monte le son. Si la tablette est en silencieux, regarde les couleurs.</p>';
      } },
    { ico: "✅", col: "#10b981", title: function () { return "Fin de séance : dans l'ordre"; },
      body: function () {
        return stepList([
          "Montre ton QR code au prof : " + mk("go", "🔍 Afficher en grand"),
          "Enregistre dans ton carnet : " + mk("carnet", "📒 Mon carnet"),
          "Seulement après : " + mk("new", "🆕 Nouvelle séance"),
        ]) + '<p class="g-warn">⚠️ « Nouvelle séance » vide la séance du jour. Fais d\'abord le 1 et le 2 !</p>' +
          '<p class="g-tip">📈 Rien n\'est perdu : tes anciennes séances restent dans l\'Historique.</p>';
      } },
    { ico: "✏️", col: "#a78bfa", title: function () { return "Tu t'es trompé ? Pas de panique"; },
      body: function () {
        return '<div class="g-fix"><div><b>Un mauvais nombre dans un test</b>' + mk("", "✏️ Corriger mes tests") + "<small>puis 🗑 sur le test faux</small></div>" +
          "<div><b>« J'ai fini » touché trop tôt</b>" + mk("undo", "↩️ Oups, pas fini ! Annuler") + "<small>tu as 6 secondes</small></div>" +
          '<div><b>Une case <span class="g-red">rouge</span></b>' + mk("", "Fin de séance → écris le nombre") + "<small>le bloc n'a pas été noté à temps</small></div>" +
          "<div><b>Ton prénom ou ta classe</b>" + mk("", "👤 Profil → ✏️ Corriger") + "<small>rien n'est effacé</small></div></div>";
      } },
    { ico: "🤝", col: "#38bdf8", title: function () { return "Tu n'as pas ta tablette ?"; },
      body: function () {
        return '<div class="g-two"><div class="g-tab"><p class="g-cap">Tablette d\'un camarade</p>' + stepList(["Choisis « 🤝 J'emprunte une tablette »", "Travaille normalement", "À la fin : " + mk("", "👤 Profil") + " → " + mk("", "📤 Envoyer mes résultats")]) + "</div>" +
          '<div class="g-arrow"><i>➜</i><small>QR code<br>ou AirDrop</small></div>' +
          '<div class="g-tab mine"><p class="g-cap">Ta tablette</p>' + stepList([mk("", "👤 Profil"), mk("", "📥 Récupérer mes résultats"), mk("", "📷 Scanner") + " le QR"]) + "</div></div>" +
          '<p class="g-tip">Tes résultats s\'ajoutent à ton catalogue. Rien n\'est effacé.</p>';
      } },
    { ico: "💾", col: "#fbbf24", title: function () { return "Protège tes résultats"; },
      body: function () {
        return '<p class="g-lead">La tablette peut effacer tes résultats si tu n\'ouvres pas l\'appli pendant quelques jours (vacances…).</p>' +
          '<div class="g-tab mine" style="max-width:520px;margin:0 auto"><p class="g-cap">💾 Sauvegarde</p>' + stepList([mk("", "👤 Profil"), mk("", "💾 Sauvegarder"), "« Enregistrer dans Fichiers »"]) + "</div>" +
          '<p class="g-tip">Un rappel jaune s\'affiche sur la page d\'accueil quand il faut sauvegarder.<br>Si tout a disparu : à l\'inscription, touche <b>📂 J\'ai une sauvegarde</b>.</p>';
      } },
    { ico: "🚀", col: "#34d399", title: function () { return "À toi de jouer !"; },
      body: function () {
        return '<div class="g-recap"><p>⏱️ <b>Teste</b> des exercices</p><p>🔥 <b>Construis</b> ton Skill</p><p>✅ <b>QR</b> au prof + <b>carnet</b></p></div>' +
          '<p class="g-tip">📄 Les <b>Fiches</b> montrent comment bien faire chaque exercice, en sécurité.<br>❓ Tu peux revoir ce guide avec le bouton <b>Aide</b> en haut.</p>';
      } },
  ];
  var guideIdx = 0;
  function renderGuide() {
    var g = GUIDE[guideIdx], last = guideIdx === GUIDE.length - 1;
    $("guide-card").style.setProperty("--gcol", g.col);
    $("guide-card").innerHTML = '<div class="g-wrap"><div class="g-ico">' + g.ico + '</div><h2 class="g-title">' + g.title() + '</h2><div class="g-body">' + g.body() + "</div></div>";
    $("guide-dots").innerHTML = GUIDE.map(function (x, i) { return '<button type="button" data-gi="' + i + '" aria-label="Étape ' + (i + 1) + '"' + (i === guideIdx ? ' class="on"' : "") + "></button>"; }).join("");
    $("guide-prev").style.visibility = guideIdx ? "visible" : "hidden";
    $("guide-next").textContent = last ? "✅ J'ai compris !" : "Suivant →";
    $("guide-next").className = "btn big " + (last ? "btn-go" : "g-nextbtn");
    $("guide-count").textContent = (guideIdx + 1) + " / " + GUIDE.length;
    $("guide-card").scrollTop = 0;
  }
  function openGuide() {
    if ($("guide").hidden === false) return;
    guideIdx = 0;
    renderGuide();
    $("guide").hidden = false;
    document.body.style.overflow = "hidden";
    openLayer("guide", hideGuide);
  }
  function hideGuide() {
    $("guide").hidden = true;
    document.body.style.overflow = "";
    if (store.active && !state.guideSeen) { state.guideSeen = true; persist(); }
  }
  function closeGuide() { if (!closeLayer("guide")) hideGuide(); }
  function guideGo(i) { guideIdx = Math.max(0, Math.min(GUIDE.length - 1, i)); renderGuide(); }
  $("guide-next").addEventListener("click", function () { if (guideIdx === GUIDE.length - 1) closeGuide(); else guideGo(guideIdx + 1); });
  $("guide-prev").addEventListener("click", function () { guideGo(guideIdx - 1); });
  $("guide-close").addEventListener("click", closeGuide);
  $("guide-dots").addEventListener("click", function (e) { var b = e.target.closest("[data-gi]"); if (b) guideGo(+b.dataset.gi); });
  (function () { // glisser à gauche / à droite
    var x0 = null, y0 = null;
    $("guide-card").addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    $("guide-card").addEventListener("touchend", function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) guideGo(guideIdx + (dx < 0 ? 1 : -1));
    }, { passive: true });
  })();
  $("btn-help").addEventListener("click", openGuide);

  /* =========================================================
   * PROTÉGER LES DONNÉES : appli installée, stockage protégé, sauvegarde
   * ======================================================= */
  function isInstalled() {
    // iPhone / iPad : seul navigator.standalone dit vrai (une appli ouverte depuis une autre appli de l'écran d'accueil
    // s'affiche dans un mini-navigateur où l'installation est impossible : il faut d'abord l'ouvrir dans Safari)
    try {
      if (typeof window.navigator.standalone === "boolean") return window.navigator.standalone;
      return window.matchMedia("(display-mode: standalone)").matches;
    } catch (e) { return false; }
  }
  try {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then(function (ok) { if (!ok) return navigator.storage.persist(); }).catch(function () {});
    }
  } catch (e) {}
  var BACKUP_DAYS = 7;
  function backupAge() {
    if (!state.backupAt) return null;
    return Math.floor((Date.now() - new Date(state.backupAt).getTime()) / 86400000);
  }
  function needsBackup() {
    if (!store.active || !Object.keys(state.records).length) return false;
    var a = backupAge();
    return a == null || a >= BACKUP_DAYS;
  }
  function backupFile() {
    var s = state.student, p = xferPayload(true);
    p.k = "save";
    var name = "CrossTraining_Sauvegarde_" + fileSafe(s.prenom) + "_" + fileSafe(s.nom) + "_" + new Date().toISOString().slice(0, 10) + ".json";
    var content = asciiJson(p);
    try { return new File([content], name, { type: "application/json" }); }
    catch (e) { var b = new Blob([content], { type: "application/json" }); b.name = name; return b; }
  }
  function markBackup() { state.backupAt = new Date().toISOString(); persist(); renderCoverExtras(); }
  function backupNow() {
    if (!store.active) return;
    var f = backupFile();
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [f] })) {
      toast("Choisis « Enregistrer dans Fichiers » 📁");
      navigator.share({ files: [f], title: "Sauvegarde Cross Training" }).then(function () {
        markBackup(); toast("💾 Sauvegarde faite !");
      }).catch(function (err) {
        if (err && err.name !== "AbortError") { download(f); markBackup(); toast("💾 Sauvegarde enregistrée dans Téléchargements."); }
      });
    } else { download(f); markBackup(); toast("💾 Sauvegarde enregistrée dans Téléchargements (app Fichiers)."); }
  }
  function renderCoverExtras() {
    // toujours proposé (replié) : depuis « Mes outils », l'iPhone se dit « installé » alors que l'appli ne l'est pas
    var known = !!(store.active && state.student && state.student.prenom);
    var nb = known && needsBackup();
    $("cover-backup").hidden = !nb;
    if (nb) {
      var a = backupAge();
      $("cover-backup-text").textContent = a == null ? "💾 Tu n'as jamais sauvegardé tes résultats." : "💾 Dernière sauvegarde il y a " + a + " jours.";
    }
  }
  $("cover-backup-btn").addEventListener("click", backupNow);
  $("pr-save").addEventListener("click", function () { closeDialog("profile"); backupNow(); });
  $("pr-restore").addEventListener("click", function () { closeDialog("profile"); $("imp-input").value = ""; $("imp-input").click(); });

  /* =========================================================
   * PAGE DE GARDE : affichée à chaque ouverture de l'appli
   * ======================================================= */
  var firstOpen = true;
  function showCover() {
    stopTestSilently();
    ["profile", "xfer", "imp", "tests-dlg", "carnet", "ask"].forEach(function (id) { try { closeDialog(id); } catch (e) {} });
    $("screen-app").hidden = true;
    $("screen-id").hidden = true;
    $("screen-cover").hidden = false;
    var known = !!(store.active && state.student && state.student.prenom), s = state.student || {};
    $("cover-hello").textContent = known ? "👋 Bonjour " + s.prenom + " " + s.nom + ". !" : "👋 Bienvenue !";
    var info = "";
    if (known) {
      info = "Classe " + s.classe + (isGuest() ? " · 🤝 tablette empruntée" : "");
      if (state.run) info = "🔥 Ta séance Skill est en cours.";
    } else info = "Inscris-toi pour commencer : prénom, initiale du nom, classe.";
    $("cover-info").textContent = info;
    $("cover-go").textContent = !known ? "▶️ Commencer" : state.run ? "🔥 Reprendre ma séance Skill" : "▶️ Continuer";
    $("cover-switch").hidden = !known;
    renderCoverExtras();
    window.scrollTo(0, 0);
  }
  $("cover-go").addEventListener("click", function () {
    unlockAudio();
    if (!(store.active && state.student && state.student.prenom)) { showIdentity("create"); return; }
    if (firstOpen) {
      firstOpen = false;
      // à l'ouverture : 1er onglet (sauf séance Skill en cours ou lien direct …#fiches)
      var h = (location.hash || "").replace("#", "");
      if (!state.run && h !== "guide" && h !== "fiches") state.tab = "train";
      if (h !== "guide" && h !== "fiches" && history.replaceState) history.replaceState(null, "", "#" + (state.run ? "skill" : state.tab));
    }
    showApp();
  });
  $("cover-switch").addEventListener("click", function () {
    if (state.run) { toast("Une séance Skill est en cours : reprends-la et arrête-la d'abord.", true); return; }
    renderProfileDlg();
    openDialog("profile");
  });
  $("cover-help").addEventListener("click", openGuide);
  // Tablette restée en veille longtemps (Safari ne recharge pas la page) : retour à la page de garde
  var hiddenAt = 0;
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") { hiddenAt = Date.now(); return; }
    if (hiddenAt && Date.now() - hiddenAt > 20 * 60 * 1000 && $("screen-cover").hidden) { firstOpen = true; showCover(); }
    hiddenAt = 0;
  });
  window.addEventListener("pageshow", function (e) { if (e.persisted && $("screen-cover").hidden) { firstOpen = true; showCover(); } });

  /* =========================================================
   * Démarrage
   * ======================================================= */
  function renderAll() {
    renderFilter("train"); renderFilter("fiches");
    renderGrid("train"); renderGrid("fiches");
    renderSkill();
    updateCounts();
  }
  // Profil invité oublié d'un autre jour : la tablette revient à son propriétaire
  (function () {
    if (!store.active || !isGuest() || state.run) return;
    var last = state.seance.updatedAt || state.seance.startedAt;
    if (last && new Date(last).toDateString() === new Date().toDateString()) return;
    var owner = profileList().filter(function (p) { return !p.guest; })[0];
    if (owner) { store.active = owner.pid; state = owner.st; persist(); }
  })();
  if (state.run) { advance(); if (state.run) keepAwake(true); }
  renderAll();
  showCover();

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

  window.CrossTraining = { state: function () { return state; }, buildPayload: buildPayload, qrText: qrText, carnetText: carnetText, normalizeClasse: normalizeClasse, advance: advance,
    store: function () { return store; }, xferText: function () { return asciiJson(xferQrPayload().p); }, xferFileText: function () { return asciiJson(xferPayload(true)); }, handleImport: handleImport };
})();
