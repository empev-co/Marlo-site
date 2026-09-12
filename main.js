// Marlo — patient-facing app logic.
// Talks to Supabase for the real clinic list and to record each search.
(function () {
  "use strict";

  var LANGUAGES = ["English", "Spanish", "Cantonese", "Mandarin", "Vietnamese", "Tagalog", "Russian"];
  var INSURANCE = ["Uninsured / no insurance", "Medi-Cal", "Medicare", "Private insurance / Covered CA", "Not sure"];

  var supabase = null;
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Supabase client failed to initialize — check config.js", e);
  }

  var state = {
    step: "loading", // loading | landing | step1 | step2 | results | loaderror
    clinics: [],
    patient: {
      name: "", phone: "", age: "", zip: "", language: "English", insurance: "Uninsured / no insurance",
      hasCar: null, needsWalkIn: null, undocumented: false, lgbtq: false
    },
    lastMatches: []
  };

  function scoreClinic(clinic, p) {
    if (clinic.population === "pediatric" && Number(p.age) >= 18) return null;
    if (clinic.population === "adult" && p.age !== "" && Number(p.age) < 18) return null;

    var score = 0;
    var reasons = [];
    var insurance = clinic.insurance || [];
    var languages = clinic.languages || [];

    if (insurance.indexOf(p.insurance) !== -1) {
      score += 3;
      reasons.push("Accepts " + p.insurance.toLowerCase());
    } else if (clinic.sliding_scale) {
      score += 1;
      reasons.push("Offers sliding-scale fees based on income");
    }

    if (languages.indexOf(p.language) !== -1) {
      score += 2;
      reasons.push("Services available in " + p.language);
    }

    if (p.hasCar === false && clinic.near_transit) {
      score += 2;
      reasons.push("Near public transit");
    }

    if (p.needsWalkIn === true && clinic.walk_in) {
      score += 2;
      reasons.push("Accepts walk-ins — no appointment needed");
    }

    if (p.undocumented && clinic.serves_undocumented) {
      score += 3;
      reasons.push("Serves patients regardless of immigration status");
    }

    if (p.lgbtq && clinic.lgbtq_affirming) {
      score += 2;
      reasons.push("LGBTQ+ affirming care");
    }

    if (reasons.length === 0) reasons.push("General primary care available in San Francisco");

    return { clinic: clinic, score: score, reasons: reasons };
  }

  function matchClinics() {
    var p = state.patient;
    var scored = [];
    state.clinics.forEach(function (c) {
      var r = scoreClinic(c, p);
      if (r) scored.push(r);
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, 4);
  }

  function tierFor(score) {
    if (score >= 6) return { cls: "strong", label: "Strong match" };
    if (score >= 3) return { cls: "good", label: "Good match" };
    return { cls: "possible", label: "Possible option" };
  }

  function chip(name, value, label, checked, type) {
    return '<label class="chip"><input type="' + (type || "checkbox") + '" name="' + name + '" value="' +
      value + '" ' + (checked ? "checked" : "") + '><span>' + label + '</span></label>';
  }

  function progressHtml(activeIndex) {
    var dots = "";
    for (var i = 0; i < 3; i++) dots += '<div class="dot' + (i <= activeIndex ? " done" : "") + '"></div>';
    return '<div class="progress">' + dots + '</div>';
  }

  function renderLanding() {
    return '' +
      '<div class="card hero">' +
        '<h1>Find a clinic that will actually see you.</h1>' +
        '<p class="lead">Answer a few quick questions about your language, insurance, and transportation. We\'ll match you with San Francisco clinics that are set up to help — you don\'t need insurance or immigration paperwork just to search.</p>' +
        '<div><button class="btn btn-primary" id="startBtn">Start my search →</button></div>' +
        '<div class="trust-line">' +
          '<span>Free, no account needed</span>' +
          '<span>Takes about 2 minutes</span>' +
          '<span>' + state.clinics.length + ' clinics in San Francisco</span>' +
        '</div>' +
      '</div>';
  }

  function renderStep1() {
    var p = state.patient;
    return '' +
      '<div class="card">' +
        progressHtml(0) +
        '<h2 style="font-size:1.3rem;margin-top:16px;margin-bottom:4px;">A little about you</h2>' +
        '<p style="margin-bottom:20px;">This is who we\'ll help find care for.</p>' +
        '<form id="step1Form">' +
          '<div class="field"><label for="pName">Name</label><input type="text" id="pName" value="' + p.name + '" placeholder="Full name" required></div>' +
          '<div class="two-col">' +
            '<div class="field"><label for="pPhone">Phone number</label><input type="tel" id="pPhone" value="' + p.phone + '" placeholder="(415) 555-0100" required></div>' +
            '<div class="field"><label for="pAge">Age</label><input type="number" id="pAge" min="0" max="120" value="' + p.age + '" placeholder="34" required></div>' +
          '</div>' +
          '<div class="field"><label for="pZip">ZIP code (optional)</label><input type="text" id="pZip" value="' + p.zip + '" placeholder="94110" maxlength="10"></div>' +
          '<div class="form-actions">' +
            '<button type="button" class="btn-text" id="backLanding">← Back</button>' +
            '<button type="submit" class="btn btn-primary">Continue →</button>' +
          '</div>' +
        '</form>' +
      '</div>';
  }

  function renderStep2() {
    var p = state.patient;
    var langOptions = LANGUAGES.map(function (l) { return '<option value="' + l + '"' + (l === p.language ? " selected" : "") + '>' + l + '</option>'; }).join("");
    var insOptions = INSURANCE.map(function (i) { return '<option value="' + i + '"' + (i === p.insurance ? " selected" : "") + '>' + i + '</option>'; }).join("");

    return '' +
      '<div class="card">' +
        progressHtml(1) +
        '<h2 style="font-size:1.3rem;margin-top:16px;margin-bottom:4px;">Your situation</h2>' +
        '<p style="margin-bottom:20px;">This is what actually determines which clinics can see you.</p>' +
        '<form id="step2Form">' +
          '<div class="two-col">' +
            '<div class="field"><label for="pLang">Preferred language</label><select id="pLang">' + langOptions + '</select></div>' +
            '<div class="field"><label for="pIns">Insurance</label><select id="pIns">' + insOptions + '</select></div>' +
          '</div>' +
          '<div class="field"><label>Do you have a car or reliable ride?</label>' +
            '<div class="radio-row">' + chip("car", "yes", "Yes", p.hasCar === true, "radio") + chip("car", "no", "No — I need transit access", p.hasCar === false, "radio") + '</div>' +
          '</div>' +
          '<div class="field"><label>Do you need to be seen without an appointment?</label>' +
            '<div class="radio-row">' + chip("walkin", "yes", "Yes, walk-in", p.needsWalkIn === true, "radio") + chip("walkin", "no", "No, scheduling ahead is fine", p.needsWalkIn === false, "radio") + '</div>' +
          '</div>' +
          '<div class="field"><label>Anything else that matters to your search?</label>' +
            '<div class="chip-grid">' +
              chip("extra", "undocumented", "Prefer a clinic that doesn't ask about immigration status", p.undocumented) +
              chip("extra", "lgbtq", "Prefer LGBTQ+ affirming care", p.lgbtq) +
            '</div>' +
          '</div>' +
          '<div class="form-actions">' +
            '<button type="button" class="btn-text" id="backStep1">← Back</button>' +
            '<button type="submit" class="btn btn-primary">Find my matches →</button>' +
          '</div>' +
        '</form>' +
      '</div>';
  }

  function renderResults() {
    var matches = state.lastMatches;
    var cards = matches.map(function (m) {
      var tier = tierFor(m.score);
      var c = m.clinic;
      return '' +
        '<div class="result-card">' +
          '<div class="result-top">' +
            '<div><h3>' + c.name + '</h3><div class="meta">' + c.neighborhood + (c.phone ? ' · ' + c.phone : '') + '</div></div>' +
            '<span class="badge ' + tier.cls + '">' + tier.label + '</span>' +
          '</div>' +
          '<ul class="reasons">' + m.reasons.map(function (r) { return "<li>" + r + "</li>"; }).join("") + '</ul>' +
          '<div class="result-actions">' + (c.phone ? '<a class="btn btn-ghost" href="tel:' + c.phone.replace(/[^0-9+]/g, '') + '">Call clinic</a>' : '') + (c.website ? '<a class="btn btn-ghost" href="' + c.website + '" target="_blank" rel="noopener">Visit website</a>' : '') + '</div>' +
        '</div>';
    }).join("");

    if (matches.length === 0) {
      cards = '<p class="empty-note">No clinics fit those specifics yet. As Marlo adds more clinics, check back — or call 211 for immediate help finding care.</p>';
    }

    return '' +
      '<div class="list-block">' +
        '<div class="results-head">' +
          '<h2 style="font-size:1.3rem;">Clinics that fit, ' + (state.patient.name || "there") + '</h2>' +
          '<p>Ranked by how well they match what you told us — not just distance.</p>' +
        '</div>' +
        cards +
        '<div><button class="btn-text" id="startOverBtn">Start a new search</button></div>' +
      '</div>';
  }

  function render() {
    var app = document.getElementById("app");
    var html = "";
    if (state.step === "loading") html = '<p class="loading-note">Loading nearby clinics…</p>';
    else if (state.step === "landing") html = renderLanding();
    else if (state.step === "step1") html = renderStep1();
    else if (state.step === "step2") html = renderStep2();
    else if (state.step === "results") html = renderResults();
    app.innerHTML = html;
    bind();
  }

  function bind() {
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
        state.step = "step2";
        render();
      };
    }
    if (state.step === "step2") {
      document.getElementById("backStep1").onclick = function () { state.step = "step1"; render(); };
      document.getElementById("step2Form").onsubmit = function (e) {
        e.preventDefault();
        var p = state.patient;
        p.language = document.getElementById("pLang").value;
        p.insurance = document.getElementById("pIns").value;
        var carEl = document.querySelector('input[name="car"]:checked');
        var walkEl = document.querySelector('input[name="walkin"]:checked');
        p.hasCar = carEl ? carEl.value === "yes" : null;
        p.needsWalkIn = walkEl ? walkEl.value === "yes" : null;
        p.undocumented = !!document.querySelector('input[value="undocumented"]:checked');
        p.lgbtq = !!document.querySelector('input[value="lgbtq"]:checked');
        state.lastMatches = matchClinics();
        state.step = "results";
        render();
        recordSubmission();
      };
    }
    if (state.step === "results") {
      var startOver = document.getElementById("startOverBtn");
      if (startOver) startOver.onclick = function () { state.step = "landing"; render(); };
    }
  }

  function recordSubmission() {
    if (!supabase) return;
    var p = state.patient;
    supabase.from("patient_submissions").insert({
      name: p.name, phone: p.phone, age: p.age ? Number(p.age) : null, zip_code: p.zip || null,
      language: p.language, insurance: p.insurance, has_car: p.hasCar, needs_walk_in: p.needsWalkIn,
      undocumented_pref: p.undocumented, lgbtq_pref: p.lgbtq,
      matched_clinic_ids: state.lastMatches.map(function (m) { return m.clinic.id; })
    }).then(function (res) {
      if (res.error) console.error("Could not record submission:", res.error.message);
    });
  }

  async function loadClinics() {
    if (!supabase) {
      document.getElementById("loadError").style.display = "flex";
      return;
    }
    var res = await supabase.from("clinics").select("*").eq("active", true).order("name");
    if (res.error) {
      console.error("Could not load clinics:", res.error.message);
      document.getElementById("loadError").style.display = "flex";
      state.step = "landing"; // show the page anyway with 0 clinics rather than stalling
      render();
      return;
    }
    state.clinics = res.data || [];
    state.step = "landing";
    render();
  }

  loadClinics();
})();
