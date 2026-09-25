// Marlo — patient-facing app logic.
// Talks to Supabase for the real clinic list and to record each search.
(function () {
  "use strict";

  var STR = {
    en: {
      bannerNote: "",
      heroPre: "Find a clinic that will ", heroEm: "actually", heroPost: " see you.",
      startBtn: "Get Started",
      step1Title: "Tell us about the person who needs care", step1Sub: "This can be you, or someone you're helping.",
      nameLabel: "Name", namePh: "Full name",
      phoneLabel: "Phone number", phonePh: "(415) 555-0100",
      phoneHint: "So we can follow up and see how it went — never shared with clinics without your OK.",
      ageLabel: "Patient's age", agePh: "Insert here", zipLabel: "Patient's zip code", zipPh: "Insert here",
      insLabel: "Patient's insurance status", insPh: "Select one",
      ins: ["Uninsured / no coverage", "Medicaid (called Medi-Cal in California)", "Medicare", "Private insurance or marketplace plan", "Not sure / other"],
      backBtn: "← Back", getClinicsBtn: "Continue",
      step2Title: "One quick step", step2Sub: "We just need to confirm you're a real person — this keeps Marlo working well for everyone searching.",
      tsIdle: "I'm not a robot", tsChecking: "Checking", tsVerified: "Verified — you're all set", tsFailed: "Couldn't verify — please try again",
      tsNote: "Nothing from this check is stored.",
      tsSetupNote: "Bot check isn't fully set up on this site yet — continuing without it for now.",
      seeMatchesBtn: "See My Matches",
      resultsTitle: "Your Best Matches", resultsSub: "Near ZIP {zip} — ranked by how well they fit what you told us.",
      filtersTitle: "Other filters",
      fInterpreter: "Need interpreter", fTransport: "Need transportation", fWalkIn: "No appointment needed",
      fHiv: "Need HIV related care", fVeteran: "Veteran status", fUndoc: "Immigration status won't be asked", fLgbtq: "LGBTQ+ affirming",
      whichLanguage: "Which language?",
      callBtn: "Call clinic", websiteBtn: "Visit website", startOverBtn: "Start a new search",
      noMatches: "No clinics fit those specifics yet. As Marlo adds more clinics, check back — or call 211 for immediate help finding care.",
      footer: "Answer a few quick questions and get matched to clinics that fit your situation.",
      footerLink: "Clinic staff login",
      langNames: { English: "English", Spanish: "Spanish", Cantonese: "Cantonese", Mandarin: "Mandarin", Vietnamese: "Vietnamese", Tagalog: "Tagalog", Russian: "Russian" },
      filtersSub: "Turn on what matters to you — your matches update instantly.",
      activeCount: "{n} on",
      groupAccess: "Getting there", groupCare: "Type of care",
      detailsMore: "See documents & services", detailsLess: "Hide details",
      docsLabel: "What to bring", servicesLabel: "Care provided",
      teaserBody: "We recommend adding this info too, for better matches.",
      teaserBtn: "Add details",
      teaserSummary: "{n} added — tap to fine-tune your matches",
      filtersDone: "Done",
      loadErrorTitle: "Can't reach the clinic list right now.",
      loadErrorBody: "Check your internet connection and reload the page.",
      strong: "Strong match", good: "Good match", possible: "Possible option"
    },
    es: {
      bannerNote: "",
      heroPre: "Encuentra una clínica que ", heroEm: "de verdad", heroPost: " te atienda.",
      startBtn: "Comenzar",
      step1Title: "Cuéntenos sobre la persona que necesita atención", step1Sub: "Puede ser usted, o alguien a quien está ayudando.",
      nameLabel: "Nombre", namePh: "Nombre completo",
      phoneLabel: "Número de teléfono", phonePh: "(415) 555-0100",
      phoneHint: "Para poder darle seguimiento y saber cómo le fue — nunca se comparte con las clínicas sin su permiso.",
      ageLabel: "Edad del paciente", agePh: "Escriba aquí", zipLabel: "Código postal del paciente", zipPh: "Escriba aquí",
      insLabel: "Estado del seguro médico", insPh: "Seleccione uno",
      ins: ["Sin seguro médico", "Medicaid (llamado Medi-Cal en California)", "Medicare", "Seguro privado o plan del mercado", "No estoy seguro/a / otro"],
      backBtn: "← Atrás", getClinicsBtn: "Continuar",
      step2Title: "Un paso rápido", step2Sub: "Solo necesitamos confirmar que es una persona real — esto ayuda a que Marlo funcione bien para todos.",
      tsIdle: "No soy un robot", tsChecking: "Verificando", tsVerified: "Verificado — todo listo", tsFailed: "No se pudo verificar — intente de nuevo",
      tsNote: "No se guarda nada de esta verificación.",
      tsSetupNote: "La verificación aún no está completamente configurada — continuando sin ella por ahora.",
      seeMatchesBtn: "Ver Mis Resultados",
      resultsTitle: "Sus Mejores Opciones", resultsSub: "Cerca del código postal {zip} — clasificadas según qué tan bien coinciden.",
      filtersTitle: "Otros filtros",
      fInterpreter: "Necesito intérprete", fTransport: "Necesito transporte", fWalkIn: "Sin necesidad de cita",
      fHiv: "Necesito atención relacionada con el VIH", fVeteran: "Estatus de veterano", fUndoc: "No preguntarán estatus migratorio", fLgbtq: "Afirmativo LGBTQ+",
      whichLanguage: "¿Qué idioma?",
      callBtn: "Llamar a la clínica", websiteBtn: "Visitar sitio web", startOverBtn: "Comenzar una nueva búsqueda",
      noMatches: "Ninguna clínica coincide con esos detalles todavía. Llame al 211 para ayuda inmediata.",
      footer: "Responda algunas preguntas rápidas y le mostraremos clínicas que se ajusten a su situación.",
      footerLink: "Acceso para personal de clínicas",
      langNames: { English: "inglés", Spanish: "español", Cantonese: "cantonés", Mandarin: "mandarín", Vietnamese: "vietnamita", Tagalog: "tagalo", Russian: "ruso" },
      filtersSub: "Active lo que le importa — sus resultados se actualizan al instante.",
      activeCount: "{n} activos",
      groupAccess: "Cómo llegar", groupCare: "Tipo de atención",
      detailsMore: "Ver documentos y servicios", detailsLess: "Ocultar detalles",
      docsLabel: "Qué llevar", servicesLabel: "Atención brindada",
      teaserBody: "Recomendamos agregar esta información también, para mejores resultados.",
      teaserBtn: "Agregar detalles",
      teaserSummary: "{n} agregados — toque para ajustar sus resultados",
      filtersDone: "Listo",
      loadErrorTitle: "No podemos acceder a la lista de clínicas en este momento.",
      loadErrorBody: "Revise su conexión a internet y recargue la página.",
      strong: "Coincidencia alta", good: "Buena opción", possible: "Opción posible"
    }
  };

  var LANGUAGES = ["English", "Spanish", "Cantonese", "Mandarin", "Vietnamese", "Tagalog", "Russian"];

  var supabase = null;
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Supabase client failed to initialize — check config.js", e);
  }

  var state = {
    lang: "en",
    step: "loading", // loading | landing | step1 | step2 | results
    clinics: [],
    patient: { name: "", phone: "", age: "", insuranceIdx: -1, zip: "" },
    ts: "idle", // idle | checking | verified | failed
    tsToken: null,
    filters: { interpreter: false, language: "Spanish", transport: false, walkIn: false, hiv: false, veteran: false, undoc: false, lgbtq: false },
    filtersOpen: false,
    matches: []
  };

  function t(key) { return STR[state.lang][key]; }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function toggleRow(name, value, label, checked) {
    return '' +
      '<div class="toggle-row">' +
        '<span class="toggle-label">' + label + '</span>' +
        '<label class="switch">' +
          '<input type="checkbox" name="' + name + '" value="' + value + '" ' + (checked ? "checked" : "") + '>' +
          '<span class="track"></span><span class="thumb"></span>' +
        '</label>' +
      '</div>';
  }

  function progressDots(activeIdx) {
    var out = "";
    for (var i = 0; i < 3; i++) out += '<div class="dot' + (i <= activeIdx ? " done" : "") + '"></div>';
    return '<div class="progress">' + out + '</div>';
  }

  // ---------- Matching ----------

  function scoreClinic(c, p, f) {
    if (c.population === "pediatric" && p.age !== "" && Number(p.age) >= 18) return null;
    if (c.population === "adult" && p.age !== "" && Number(p.age) < 18) return null;

    var score = 0, reasons = [];
    var insurance = c.insurance || [];
    var languages = c.languages || [];
    var insLabel = p.insuranceIdx >= 0 ? STR.en.ins[p.insuranceIdx] : ""; // canonical English label stored in DB

    if (insLabel && insurance.indexOf(insLabel) !== -1) {
      score += 3;
      reasons.push(state.lang === "en" ? "Accepts " + insLabel.toLowerCase() : "Acepta " + STR.es.ins[p.insuranceIdx].toLowerCase());
    } else if (c.sliding_scale) {
      score += 1;
      reasons.push(state.lang === "en" ? "Offers sliding-scale fees based on income" : "Ofrece tarifas según sus ingresos");
    }

    if (f.interpreter) {
      if (languages.indexOf(f.language) !== -1) { score += 2; reasons.push((state.lang === "en" ? "Interpreter available: " : "Intérprete disponible: ") + STR[state.lang].langNames[f.language]); }
    } else if (languages.indexOf("English") === -1 && languages.length) {
      score -= 1;
    }

    if (f.transport && c.near_transit) { score += 2; reasons.push(state.lang === "en" ? "Near public transit" : "Cerca del transporte público"); }
    if (f.walkIn && c.walk_in) { score += 2; reasons.push(state.lang === "en" ? "Accepts walk-ins — no appointment needed" : "Acepta pacientes sin cita previa"); }
    if (f.hiv && c.hiv_care) { score += 3; reasons.push(state.lang === "en" ? "Offers HIV-related care" : "Ofrece atención relacionada con el VIH"); }
    if (f.veteran && c.veteran_friendly) { score += 2; reasons.push(state.lang === "en" ? "Experience coordinating veteran care" : "Experiencia con atención para veteranos"); }
    if (f.undoc && c.serves_undocumented) { score += 3; reasons.push(state.lang === "en" ? "Serves patients regardless of immigration status" : "Atiende a pacientes sin importar su estatus migratorio"); }
    if (f.lgbtq && c.lgbtq_affirming) { score += 2; reasons.push(state.lang === "en" ? "LGBTQ+ affirming care" : "Atención afirmativa LGBTQ+"); }

    if (reasons.length === 0) reasons.push(state.lang === "en" ? "General primary care available in San Francisco" : "Atención primaria general disponible en San Francisco");
    return { clinic: c, score: score, reasons: reasons };
  }

  function matchClinics() {
    var scored = [];
    state.clinics.forEach(function (c) { var r = scoreClinic(c, state.patient, state.filters); if (r) scored.push(r); });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored;
  }

  function tierFor(score) {
    if (score >= 6) return { cls: "strong", label: t("strong") };
    if (score >= 3) return { cls: "good", label: t("good") };
    return { cls: "possible", label: t("possible") };
  }

  // ---------- Screens ----------

  function renderLanding() {
    return '' +
      '<div class="hero-flat screen">' +
        '<div class="mark-big">Marlo</div>' +
        '<h1>' + t("heroPre") + '<em>' + t("heroEm") + '</em>' + t("heroPost") + '</h1>' +
        '<button class="btn btn-primary" id="startBtn">' + t("startBtn") + '</button>' +
      '</div>';
  }

  function renderStep1() {
    var p = state.patient;
    var insOptions = '<option value="-1" disabled' + (p.insuranceIdx === -1 ? " selected" : "") + '>' + t("insPh") + '</option>' +
      STR[state.lang].ins.map(function (label, i) { return '<option value="' + i + '"' + (p.insuranceIdx === i ? " selected" : "") + '>' + label + '</option>'; }).join("");
    return '' +
      '<div class="card screen">' +
        progressDots(0) +
        '<div class="step-head"><h2>' + t("step1Title") + '</h2><p>' + t("step1Sub") + '</p></div>' +
        '<form id="step1Form">' +
          '<div class="two-col">' +
            '<div class="field"><label for="pName">' + t("nameLabel") + '</label><input type="text" id="pName" value="' + esc(p.name) + '" placeholder="' + t("namePh") + '" required></div>' +
            '<div class="field"><label for="pPhone">' + t("phoneLabel") + '</label><input type="tel" id="pPhone" value="' + esc(p.phone) + '" placeholder="' + t("phonePh") + '" required></div>' +
          '</div>' +
          '<p class="hint" style="margin-top:-12px;margin-bottom:20px;">' + t("phoneHint") + '</p>' +
          '<div class="field"><label for="pAge">' + t("ageLabel") + '</label><input type="number" id="pAge" min="0" max="120" value="' + p.age + '" placeholder="' + t("agePh") + '" required></div>' +
          '<div class="field"><label for="insSelect">' + t("insLabel") + '</label><select id="insSelect" required>' + insOptions + '</select></div>' +
          '<div class="field"><label for="pZip">' + t("zipLabel") + '</label><input type="text" id="pZip" maxlength="5" pattern="[0-9]{5}" value="' + esc(p.zip) + '" placeholder="' + t("zipPh") + '" required></div>' +
          '<div class="form-actions"><button type="button" class="btn-text" id="backLanding">' + t("backBtn") + '</button><button type="submit" class="btn btn-primary">' + t("getClinicsBtn") + '</button></div>' +
        '</form>' +
      '</div>';
  }

  function renderStep2() {
    var verified = state.ts === "verified", checking = state.ts === "checking", failed = state.ts === "failed";
    var hasRealTurnstile = typeof TURNSTILE_SITE_KEY === "string" && TURNSTILE_SITE_KEY.indexOf("REPLACE_WITH") !== 0;
    var statusText = failed ? t("tsFailed") : (checking ? t("tsChecking") : (verified ? t("tsVerified") : t("tsIdle")));

    var checkArea;
    if (hasRealTurnstile) {
      checkArea = '<div class="cf-turnstile-wrap" id="turnstileWidget"></div>' +
        (failed ? '<p class="error-note">' + t("tsFailed") + '</p>' : '');
    } else {
      checkArea = '' +
        '<div class="check-box" id="tsBox" role="button" tabindex="0">' +
          '<input type="checkbox" id="tsCheckbox" ' + (verified ? "checked" : "") + ' readonly tabindex="-1">' +
          '<div><div class="status">' + statusText + (checking ? '<span class="spinner"></span>' : "") + '</div><div class="sub">Marlo · automated check</div></div>' +
        '</div>' +
        '<div class="verify-note"><span>' + t("tsSetupNote") + '</span></div>';
    }

    return '' +
      '<div class="card screen">' +
        progressDots(1) +
        '<div class="step-head"><h2>' + t("step2Title") + '</h2><p>' + t("step2Sub") + '</p></div>' +
        checkArea +
        (hasRealTurnstile ? '<div class="verify-note"><span>' + t("tsNote") + '</span></div>' : '') +
        '<div class="form-actions"><button type="button" class="btn-text" id="backStep1">' + t("backBtn") + '</button><button type="button" class="btn btn-primary" id="toResultsBtn" ' + (!verified ? "disabled" : "") + '>' + t("seeMatchesBtn") + '</button></div>' +
      '</div>';
  }

  function renderFilters() {
    var f = state.filters;
    var activeN = ["interpreter", "transport", "walkIn", "hiv", "veteran", "undoc", "lgbtq"].filter(function (k) { return f[k]; }).length;

    if (!state.filtersOpen) {
      return '' +
        '<button type="button" class="filter-teaser" id="filterTeaser">' +
          '<span class="teaser-text">' + (activeN > 0 ? t("teaserSummary").replace("{n}", activeN) : t("teaserBody")) + '</span>' +
          '<span class="teaser-btn">' + t("teaserBtn") + ' <span class="chevron">›</span></span>' +
        '</button>';
    }

    var langOptions = LANGUAGES.filter(function (l) { return l !== "English"; }).map(function (l) {
      return '<option value="' + l + '"' + (l === f.language ? " selected" : "") + '>' + STR[state.lang].langNames[l] + '</option>';
    }).join("");
    return '' +
      '<div class="filter-panel screen">' +
        '<div class="filter-head">' +
          '<div><h3>' + t("filtersTitle") + '</h3><p class="filter-sub">' + t("filtersSub") + '</p></div>' +
          (activeN > 0 ? '<span class="active-pill">' + t("activeCount").replace("{n}", activeN) + '</span>' : "") +
        '</div>' +
        '<div class="toggle-group">' +
          '<div class="group-label">' + t("groupAccess") + '</div>' +
          toggleRow("f", "interpreter", t("fInterpreter"), f.interpreter) +
          (f.interpreter ? '<div class="field lang-row"><label for="fLang">' + t("whichLanguage") + '</label><select id="fLang">' + langOptions + '</select></div>' : "") +
          toggleRow("f", "transport", t("fTransport"), f.transport) +
          toggleRow("f", "walkIn", t("fWalkIn"), f.walkIn) +
          toggleRow("f", "undoc", t("fUndoc"), f.undoc) +
        '</div>' +
        '<div class="toggle-group">' +
          '<div class="group-label">' + t("groupCare") + '</div>' +
          toggleRow("f", "hiv", t("fHiv"), f.hiv) +
          toggleRow("f", "veteran", t("fVeteran"), f.veteran) +
          toggleRow("f", "lgbtq", t("fLgbtq"), f.lgbtq) +
        '</div>' +
        '<button type="button" class="btn-text" id="filterCollapse" style="align-self:flex-end;">' + t("filtersDone") + '</button>' +
      '</div>';
  }

  function renderResults() {
    var lang = state.lang;
    var cards = state.matches.map(function (m) {
      var tier = tierFor(m.score), c = m.clinic;
      var docs = (lang === "es" ? c.docs_es : c.docs_en) || [];
      var services = (lang === "es" ? c.services_es : c.services_en) || [];
      var hasDetails = docs.length > 0 || services.length > 0;
      return '' +
        '<div class="result-card tier-' + tier.cls + '">' +
          '<div class="result-top">' +
            '<div><h3>' + esc(c.name) + '</h3><div class="meta">' + esc(c.neighborhood) + (c.phone ? ' · ' + esc(c.phone) : '') + '</div></div>' +
            '<span class="badge ' + tier.cls + '">' + tier.label + '</span>' +
          '</div>' +
          '<ul class="reasons">' + m.reasons.slice(0, 3).map(function (r) { return "<li>" + esc(r) + "</li>"; }).join("") + '</ul>' +
          (hasDetails ? '' +
            '<button type="button" class="details-toggle" data-details="' + c.id + '">' + t("detailsMore") + ' <span class="chevron">▾</span></button>' +
            '<div class="details-panel" id="details-' + c.id + '" hidden>' +
              (docs.length ? '<div class="detail-block"><div class="detail-label">' + t("docsLabel") + '</div><ul class="tag-list">' + docs.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join("") + '</ul></div>' : '') +
              (services.length ? '<div class="detail-block"><div class="detail-label">' + t("servicesLabel") + '</div><div class="tag-chips">' + services.map(function (s) { return '<span class="tag-chip">' + esc(s) + '</span>'; }).join("") + '</div></div>' : '') +
            '</div>'
          : '') +
          '<div class="result-actions">' +
            (c.phone ? '<a class="btn btn-ghost" href="tel:' + esc(c.phone.replace(/[^0-9+]/g, '')) + '">' + t("callBtn") + '</a>' : '') +
            (c.website ? '<a class="btn btn-ghost" href="' + esc(c.website) + '" target="_blank" rel="noopener">' + t("websiteBtn") + '</a>' : '') +
          '</div>' +
        '</div>';
    }).join("") || '<p class="empty-note full-span">' + t("noMatches") + '</p>';

    return '' +
      '<div class="results-wrap screen">' +
        '<div class="results-head"><h2 style="font-size:1.7rem;">' + t("resultsTitle") + '</h2><p style="font-size:1.05rem;">' + t("resultsSub").replace("{zip}", esc(state.patient.zip)) + '</p></div>' +
        renderFilters() +
        '<div class="list-block">' + cards + '</div>' +
        '<div><button class="btn-text" id="startOverBtn">' + t("startOverBtn") + '</button></div>' +
      '</div>';
  }

  // ---------- Render / bind ----------

  function render() {
    document.getElementById("footerText").innerHTML = t("footer") + '<br><a href="admin.html">' + t("footerLink") + '</a>';
    document.getElementById("langToggle").querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.lang === state.lang);
    });
    document.querySelector(".topbar .brand").classList.toggle("is-hidden", state.step === "landing");
    document.getElementById("wrap").classList.toggle("wide", state.step === "results");

    var app = document.getElementById("app");
    if (state.step === "loading") app.innerHTML = '<p class="loading-note">' + (state.lang === "en" ? "Loading nearby clinics…" : "Cargando clínicas cercanas…") + '</p>';
    else if (state.step === "landing") app.innerHTML = renderLanding();
    else if (state.step === "step1") app.innerHTML = renderStep1();
    else if (state.step === "step2") { app.innerHTML = renderStep2(); mountTurnstile(); }
    else if (state.step === "results") { state.matches = matchClinics(); app.innerHTML = renderResults(); }
    bind();
  }

  function mountTurnstile() {
    var hasRealTurnstile = typeof TURNSTILE_SITE_KEY === "string" && TURNSTILE_SITE_KEY.indexOf("REPLACE_WITH") !== 0;
    if (!hasRealTurnstile) return;
    var el = document.getElementById("turnstileWidget");
    if (!el) return;

    var attempts = 0;
    (function tryRender() {
      if (window.turnstile) {
        window.turnstile.render(el, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "auto",
          callback: function (token) { verifyTurnstileToken(token); },
          "error-callback": function () { state.ts = "failed"; render(); },
          "expired-callback": function () { state.ts = "idle"; state.tsToken = null; render(); }
        });
      } else if (attempts < 50) {
        attempts++;
        setTimeout(tryRender, 100);
      }
    })();
  }

  async function verifyTurnstileToken(token) {
    state.ts = "checking";
    render();
    try {
      var res = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token })
      });
      var data = await res.json();
      if (data && data.success) {
        state.ts = "verified";
        state.tsToken = token;
      } else {
        state.ts = "failed";
        state.tsToken = null;
        if (window.turnstile) window.turnstile.reset();
      }
    } catch (e) {
      console.error("Turnstile verification request failed:", e);
      state.ts = "failed";
      state.tsToken = null;
    }
    render();
  }

  function bind() {
    document.getElementById("langToggle").querySelectorAll("button").forEach(function (b) {
      b.onclick = function () { state.lang = b.dataset.lang; render(); };
    });

    if (state.step === "landing") {
      document.getElementById("startBtn").onclick = function () { state.step = "step1"; render(); };
    }

    if (state.step === "step1") {
      document.getElementById("backLanding").onclick = function () { state.step = "landing"; render(); };
      document.getElementById("step1Form").onsubmit = function (e) {
        e.preventDefault();
        state.patient.name = document.getElementById("pName").value.trim();
        state.patient.phone = document.getElementById("pPhone").value.trim();
        state.patient.age = document.getElementById("pAge").value;
        state.patient.zip = document.getElementById("pZip").value.trim();
        state.patient.insuranceIdx = Number(document.getElementById("insSelect").value);
        state.ts = "idle";
        state.tsToken = null;
        state.step = "step2";
        render();
      };
    }

    if (state.step === "step2") {
      document.getElementById("backStep1").onclick = function () { state.step = "step1"; render(); };
      var hasRealTurnstile = typeof TURNSTILE_SITE_KEY === "string" && TURNSTILE_SITE_KEY.indexOf("REPLACE_WITH") !== 0;
      if (!hasRealTurnstile) {
        var tsBox = document.getElementById("tsBox");
        var trigger = function () {
          if (state.ts !== "idle") return;
          state.ts = "checking"; render();
          setTimeout(function () { state.ts = "verified"; render(); }, 900);
        };
        tsBox.onclick = trigger;
        tsBox.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trigger(); } };
      }
      var toResults = document.getElementById("toResultsBtn");
      toResults.onclick = function () {
        if (state.ts === "verified") {
          state.step = "results";
          render();
          recordSubmission();
        }
      };
    }

    if (state.step === "results") {
      var teaser = document.getElementById("filterTeaser");
      if (teaser) teaser.onclick = function () { state.filtersOpen = true; render(); };
      var collapse = document.getElementById("filterCollapse");
      if (collapse) collapse.onclick = function () { state.filtersOpen = false; render(); };
      document.querySelectorAll('input[name="f"]').forEach(function (inp) {
        inp.onchange = function () { state.filters[inp.value] = inp.checked; render(); };
      });
      var langSel = document.getElementById("fLang");
      if (langSel) langSel.onchange = function () { state.filters.language = langSel.value; render(); };
      document.querySelectorAll(".details-toggle").forEach(function (btn) {
        btn.onclick = function () {
          var panel = document.getElementById("details-" + btn.dataset.details);
          var willOpen = panel.hidden;
          panel.hidden = !willOpen;
          btn.classList.toggle("open", willOpen);
          btn.childNodes[0].nodeValue = (willOpen ? t("detailsLess") : t("detailsMore")) + " ";
        };
      });
      var startOver = document.getElementById("startOverBtn");
      if (startOver) {
        startOver.onclick = function () {
          state.patient = { name: "", phone: "", age: "", insuranceIdx: -1, zip: "" };
          state.ts = "idle"; state.tsToken = null;
          state.step = "landing";
          render();
        };
      }
    }
  }

  // ---------- Data ----------

  function recordSubmission() {
    if (!supabase) return;
    var p = state.patient, f = state.filters;
    supabase.from("patient_submissions").insert({
      name: p.name, phone: p.phone, age: p.age ? Number(p.age) : null, zip_code: p.zip || null,
      language: state.lang === "es" ? "Spanish" : "English",
      insurance: p.insuranceIdx >= 0 ? STR.en.ins[p.insuranceIdx] : null,
      has_car: f.transport ? false : null,
      needs_walk_in: f.walkIn || null,
      needs_interpreter: f.interpreter || false,
      interpreter_language: f.interpreter ? f.language : null,
      undocumented_pref: f.undoc || false,
      lgbtq_pref: f.lgbtq || false,
      hiv_pref: f.hiv || false,
      veteran_pref: f.veteran || false,
      followup_status: "new",
      matched_clinic_ids: state.matches.slice(0, 8).map(function (m) { return m.clinic.id; })
    }).then(function (res) {
      if (res.error) console.error("Could not record submission:", res.error.message, res.error);
    });
  }

  function showLoadError(title, body) {
    var box = document.getElementById("loadError");
    document.getElementById("loadErrorTitle").textContent = title;
    document.getElementById("loadErrorBody").textContent = body;
    box.style.display = "flex";
  }

  async function loadClinics() {
    if (!supabase) {
      showLoadError(t("loadErrorTitle"), t("loadErrorBody"));
      state.step = "landing";
      render();
      return;
    }
    try {
      var res = await supabase.from("clinics").select("*").eq("active", true).order("name");
      if (res.error) {
        console.error("Could not load clinics:", res.error.message, res.error);
        showLoadError(t("loadErrorTitle"), t("loadErrorBody"));
        state.step = "landing";
        render();
        return;
      }
      state.clinics = res.data || [];
      state.step = "landing";
      render();
    } catch (e) {
      console.error("Unexpected error loading clinics:", e);
      showLoadError(t("loadErrorTitle"), t("loadErrorBody"));
      state.step = "landing";
      render();
    }
  }

  loadClinics();
})();
