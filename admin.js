// Marlo — clinic admin logic (login + manage clinics + anonymous search insights).
(function () {
  "use strict";

  var LANGUAGES = ["English", "Spanish", "Cantonese", "Mandarin", "Vietnamese", "Tagalog", "Russian"];
  var INSURANCE = ["Uninsured / no coverage", "Medicaid (called Medi-Cal in California)", "Medicare"];
  var CARE_TYPES = ["Primary / general medical care", "Dental", "Vision / eye care", "Mental health / counseling", "Reproductive & sexual health", "Wound care", "Mobile clinic (comes to you)", "Pediatric care"];

  var supabase = null;
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Supabase client failed to initialize — check config.js", e);
  }

  var state = {
    screen: supabase ? "checking" : "configerror",
    tab: "clinics",
    clinics: [],
    editingId: null,
    error: "",
    insightSubmissions: [],
    insightClicks: [],
    insightsLoaded: false,
    insightsError: "",
    expandedClinics: {}
  };

  function chip(name, value, label, checked, type) {
    return '<label class="chip"><input type="' + (type || "checkbox") + '" name="' + name + '" value="' +
      value + '" ' + (checked ? "checked" : "") + '><span>' + label + '</span></label>';
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function linesToArray(text) {
    return String(text || "").split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function renderLogin() {
    return '' +
      '<div class="card center-card">' +
        '<h2 style="font-size:1.3rem;margin-bottom:6px;">Clinic admin sign in</h2>' +
        '<p style="margin-bottom:20px;">For Marlo staff only.</p>' +
        (state.error ? '<p class="error-note">' + esc(state.error) + '</p>' : '') +
        '<form id="loginForm">' +
          '<div class="field"><label for="email">Email</label><input type="email" id="email" required></div>' +
          '<div class="field"><label for="password">Password</label><input type="password" id="password" required></div>' +
          '<button type="submit" class="btn btn-primary" style="width:100%;">Sign in</button>' +
        '</form>' +
      '</div>';
  }

  function clinicFormHtml(c) {
    c = c || {};
    var languages = c.languages || [];
    var insurance = c.insurance || [];
    var careTypes = c.care_types || [];
    return '' +
      '<form id="clinicForm">' +
        '<div class="two-col">' +
          '<div class="field"><label for="cName">Clinic name</label><input type="text" id="cName" value="' + esc(c.name || "") + '" required></div>' +
          '<div class="field"><label for="cNeighborhood">Neighborhood</label><input type="text" id="cNeighborhood" value="' + esc(c.neighborhood || "") + '" required></div>' +
        '</div>' +
        '<div class="field"><label>Type(s) of care offered</label><div class="chip-grid">' +
          CARE_TYPES.map(function (ct) { return chip("cCare", ct, ct, careTypes.indexOf(ct) !== -1); }).join("") +
        '</div><p class="hint">Leave blank and it defaults to "Primary / general medical care."</p></div>' +
        '<div class="two-col">' +
          '<div class="field"><label for="cPhone">Phone</label><input type="tel" id="cPhone" value="' + esc(c.phone || "") + '"></div>' +
          '<div class="field"><label for="cWebsite">Website</label><input type="text" id="cWebsite" value="' + esc(c.website || "") + '" placeholder="https://"></div>' +
        '</div>' +
        '<div class="field"><label for="cAddress">Address (optional — leave blank for a mobile clinic with no fixed site, and describe its schedule/route under "Care provided" below)</label><input type="text" id="cAddress" value="' + esc(c.address || "") + '"></div>' +
        '<div class="field"><label>Languages spoken</label><div class="chip-grid">' +
          LANGUAGES.map(function (l) { return chip("cLang", l, l, languages.indexOf(l) !== -1); }).join("") +
        '</div></div>' +
        '<div class="field"><label>Insurance accepted</label><div class="chip-grid">' +
          INSURANCE.map(function (i) { return chip("cIns", i, i, insurance.indexOf(i) !== -1); }).join("") +
        '</div></div>' +
        '<div class="field"><label>Who does this clinic serve?</label><div class="radio-row">' +
          chip("cPop", "all", "All ages", (c.population || "all") === "all", "radio") +
          chip("cPop", "adult", "Adults (18+)", c.population === "adult", "radio") +
          chip("cPop", "pediatric", "Pediatric (0-17)", c.population === "pediatric", "radio") +
        '</div></div>' +
        '<div class="field"><label>Other details</label><div class="chip-grid">' +
          chip("cFlags", "sliding_scale", "Sliding-scale fees", c.sliding_scale) +
          chip("cFlags", "walk_in", "Accepts walk-ins", c.walk_in) +
          chip("cFlags", "near_transit", "Near public transit", c.near_transit) +
          chip("cFlags", "serves_undocumented", "Serves patients regardless of immigration status", c.serves_undocumented) +
          chip("cFlags", "lgbtq_affirming", "LGBTQ+ affirming care", c.lgbtq_affirming) +
          chip("cFlags", "hiv_care", "Offers HIV-related care", c.hiv_care) +
          chip("cFlags", "veteran_friendly", "Experienced with veteran care", c.veteran_friendly) +
          chip("cFlags", "active", "Visible on the public site", c.active !== false) +
        '</div></div>' +
        '<div class="two-col">' +
          '<div class="field"><label for="cDocsEn">What to bring (English) — one per line</label><textarea id="cDocsEn" placeholder="No ID required&#10;No proof of income required">' + esc((c.docs_en || []).join("\n")) + '</textarea></div>' +
          '<div class="field"><label for="cDocsEs">What to bring (Spanish) — one per line</label><textarea id="cDocsEs" placeholder="No se requiere identificación">' + esc((c.docs_es || []).join("\n")) + '</textarea></div>' +
        '</div>' +
        '<div class="two-col">' +
          '<div class="field"><label for="cServicesEn">Care provided (English) — one per line</label><textarea id="cServicesEn" placeholder="Primary care&#10;Vaccinations">' + esc((c.services_en || []).join("\n")) + '</textarea></div>' +
          '<div class="field"><label for="cServicesEs">Care provided (Spanish) — one per line</label><textarea id="cServicesEs" placeholder="Atención primaria">' + esc((c.services_es || []).join("\n")) + '</textarea></div>' +
        '</div>' +
        '<div class="form-actions">' +
          (state.editingId ? '<button type="button" class="btn-text" id="cancelEditBtn">Cancel edit</button>' : '<span></span>') +
          '<button type="submit" class="btn btn-primary">' + (state.editingId ? "Save changes" : "Add clinic") + '</button>' +
        '</div>' +
      '</form>';
  }

  function renderClinicsTab() {
    var editing = state.editingId ? state.clinics.find(function (c) { return c.id === state.editingId; }) : null;
    var rows = state.clinics.map(function (c) {
      var extra = [];
      if (c.hiv_care) extra.push("HIV care");
      if (c.veteran_friendly) extra.push("Veteran-friendly");
      var careTag = (c.care_types && c.care_types.length) ? c.care_types.join("/") : "Primary / general medical care";
      var tags = [c.neighborhood, careTag, c.walk_in ? "Walk-in" : "Appt only", (c.languages || []).join("/")].concat(extra).concat([c.active === false ? "HIDDEN" : "Visible"]).filter(Boolean).join(" · ");
      return '' +
        '<div class="admin-row">' +
          '<div><div class="name">' + esc(c.name) + '</div><div class="tags">' + esc(tags) + '</div></div>' +
          '<div class="row-actions">' +
            '<button class="btn-text" data-edit="' + c.id + '">Edit</button>' +
            '<button class="btn-text" data-delete="' + c.id + '">Delete</button>' +
          '</div>' +
        '</div>';
    }).join("") || '<p class="empty-note">No clinics yet — add your first one above.</p>';

    return '' +
      '<div class="card">' +
        '<h2 style="font-size:1.3rem;margin-bottom:4px;">' + (editing ? "Edit clinic" : "Add a clinic") + '</h2>' +
        '<p style="margin-bottom:18px;">Changes save straight to the live database — patients see updates immediately.</p>' +
        (state.error ? '<p class="error-note">' + esc(state.error) + '</p>' : '') +
        clinicFormHtml(editing) +
      '</div>' +
      '<div class="card" style="margin-top:16px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:12px;flex-wrap:wrap;">' +
          '<h2 style="font-size:1.1rem;">Current clinics (' + state.clinics.length + ')</h2>' +
          '<button class="btn-text" id="reloadClinicsBtn">Reload list</button>' +
        '</div>' +
        rows +
      '</div>';
  }

  // ---------- Insights ----------
  // "Matched" = this clinic showed up in a patient's top results. "Calls" /
  // "Website clicks" come from clinic_clicks, logged when a patient actually
  // taps to act on a match. Together these are the numbers Emma can show a
  // clinic to demonstrate real demand and follow-through.

  function statTile(value, label) {
    return '<div class="stat-tile"><div class="stat-value">' + esc(String(value)) + '</div><div class="stat-label">' + esc(label) + '</div></div>';
  }

  function buildOverview() {
    var totalSearches = state.insightSubmissions.length;
    var engagedIds = {};
    state.insightClicks.forEach(function (c) { if (c.submission_id) engagedIds[c.submission_id] = true; });
    var engaged = Object.keys(engagedIds).length;
    return {
      totalSearches: totalSearches,
      totalClicks: state.insightClicks.length,
      engagedRate: totalSearches ? Math.round((engaged / totalSearches) * 100) : 0
    };
  }

  function buildClinicStats() {
    var byClinic = {};
    state.clinics.forEach(function (c) { byClinic[c.id] = { name: c.name, matched: 0, calls: 0, website: 0 }; });
    state.insightSubmissions.forEach(function (s) {
      (s.matched_clinic_ids || []).forEach(function (cid) { if (byClinic[cid]) byClinic[cid].matched++; });
    });
    state.insightClicks.forEach(function (c) {
      if (!byClinic[c.clinic_id]) return;
      if (c.action === "call") byClinic[c.clinic_id].calls++;
      else if (c.action === "website") byClinic[c.clinic_id].website++;
    });
    return Object.keys(byClinic).map(function (id) {
      var v = byClinic[id];
      var total = v.calls + v.website;
      return { id: id, name: v.name, matched: v.matched, calls: v.calls, website: v.website, total: total, rate: v.matched ? Math.round((total / v.matched) * 100) : null };
    }).sort(function (a, b) { return b.matched - a.matched; });
  }

  // Per-clinic version of the same idea — "for THIS clinic's matched
  // searches, what did those patients look like?" This is the number Emma
  // asked for directly: "clinic XYZ matched in 20 searches, 15% Cantonese,
  // 40% needed transportation."
  function buildClinicProfile(clinicId) {
    var subs = state.insightSubmissions.filter(function (s) { return (s.matched_clinic_ids || []).indexOf(clinicId) !== -1; });
    var total = subs.length;
    function pct(count) { return total ? Math.round((count / total) * 100) : 0; }
    function distribution(field) {
      var counts = {};
      subs.forEach(function (s) {
        var key = s[field] || "Not specified";
        counts[key] = (counts[key] || 0) + 1;
      });
      return Object.keys(counts).map(function (k) {
        return { label: k, count: counts[k], pct: pct(counts[k]) };
      }).sort(function (a, b) { return b.count - a.count; });
    }
    function flagPct(field, test) {
      var count = subs.filter(function (s) { return test ? test(s[field]) : !!s[field]; }).length;
      return { count: count, pct: pct(count) };
    }
    var zipCounts = {};
    subs.forEach(function (s) { if (s.zip_code) zipCounts[s.zip_code] = (zipCounts[s.zip_code] || 0) + 1; });
    var topZips = Object.keys(zipCounts).map(function (z) { return { zip: z, count: zipCounts[z] }; })
      .sort(function (a, b) { return b.count - a.count; }).slice(0, 5);

    return {
      total: total,
      language: distribution("language"),
      insurance: distribution("insurance"),
      // "has_car" is a legacy field name — it's set to false specifically
      // when the patient turned on the "Need transportation" filter, and
      // left null when they didn't touch that filter at all.
      transportation: flagPct("has_car", function (v) { return v === false; }),
      interpreter: flagPct("needs_interpreter"),
      walkIn: flagPct("needs_walk_in"),
      undocumented: flagPct("undocumented_pref"),
      lgbtq: flagPct("lgbtq_pref"),
      hiv: flagPct("hiv_pref"),
      veteran: flagPct("veteran_pref"),
      topZips: topZips
    };
  }

  function clinicDetailPanel(clinicId) {
    var p = buildClinicProfile(clinicId);
    if (!p.total) return '<p class="empty-note">No matched searches yet.</p>';

    function distRows(rows) {
      return rows.map(function (r) {
        return '<div class="admin-row" style="padding:6px 0;"><div class="name" style="font-weight:600;font-size:0.92rem;">' + esc(r.label) + '</div><span class="status-pill">' + r.pct + '% (' + r.count + ')</span></div>';
      }).join("");
    }
    function flagRow(label, flag) {
      return '<div class="admin-row" style="padding:6px 0;"><div class="name" style="font-weight:600;font-size:0.92rem;">' + esc(label) + '</div><span class="status-pill">' + flag.pct + '% (' + flag.count + ')</span></div>';
    }
    function section(title, body) {
      return '<div><div class="detail-label">' + esc(title) + '</div>' + body + '</div>';
    }

    return '' +
      '<div class="detail-panel">' +
        section("Language (of " + p.total + " matched searches)", distRows(p.language)) +
        section("Insurance status", distRows(p.insurance)) +
        section("Needs & preferences", '' +
          flagRow("Needed an interpreter", p.interpreter) +
          flagRow("Needed transportation help", p.transportation) +
          flagRow("Wanted walk-in / no appointment", p.walkIn) +
          flagRow("Asked about immigration-status safety", p.undocumented) +
          flagRow("Asked for LGBTQ+ affirming care", p.lgbtq) +
          flagRow("Asked about HIV-related care", p.hiv) +
          flagRow("Asked about veteran care", p.veteran)
        ) +
        (p.topZips.length ? section("Top zip codes", p.topZips.map(function (z) {
          return '<div class="admin-row" style="padding:6px 0;"><div class="name" style="font-weight:600;font-size:0.92rem;">' + esc(z.zip) + '</div><span class="status-pill">' + z.count + '</span></div>';
        }).join("")) : "") +
      '</div>';
  }

  function buildBreakdown(field) {
    var counts = {};
    state.insightSubmissions.forEach(function (s) {
      var key = s[field] || "Not specified";
      if (!counts[key]) counts[key] = { searches: 0, clicks: 0 };
      counts[key].searches++;
    });
    state.insightClicks.forEach(function (c) {
      var key = c[field] || "Not specified";
      if (!counts[key]) counts[key] = { searches: 0, clicks: 0 };
      counts[key].clicks++;
    });
    return Object.keys(counts).map(function (k) {
      var v = counts[k];
      return { label: k, searches: v.searches, clicks: v.clicks };
    }).sort(function (a, b) { return b.searches - a.searches; });
  }

  function breakdownCard(title, rows) {
    if (!rows.length) return "";
    var body = rows.map(function (r) {
      return '<div class="admin-row"><div><div class="name">' + esc(r.label) + '</div><div class="tags">' +
        r.searches + " search" + (r.searches === 1 ? "" : "es") + " · " + r.clicks + " click" + (r.clicks === 1 ? "" : "s") +
        '</div></div></div>';
    }).join("");
    return '<div class="card" style="margin-top:16px;"><h2 style="font-size:1.05rem;margin-bottom:8px;">' + title + '</h2>' + body + '</div>';
  }

  function renderInsightsTab() {
    if (state.insightsError) {
      return '<div class="card"><p class="error-note">' + esc(state.insightsError) + '</p><button class="btn-text" id="reloadInsightsBtn">Try again</button></div>';
    }
    if (!state.insightsLoaded) {
      return '<div class="card"><p class="loading-note">Loading…</p></div>';
    }
    if (!state.insightSubmissions.length) {
      return '<div class="card"><p class="empty-note">No searches recorded yet — insights fill in once patients start using Marlo.</p></div>';
    }
    var ov = buildOverview();
    var clinicRows = buildClinicStats().filter(function (c) { return c.matched > 0 || c.total > 0; }).map(function (c) {
      var expanded = !!state.expandedClinics[c.id];
      return '' +
        '<div class="admin-row" style="flex-direction:column;align-items:stretch;">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;">' +
            '<div><div class="name">' + esc(c.name) + '</div><div class="tags">' + c.matched + ' matched · ' + c.calls + ' calls · ' + c.website + ' website clicks</div></div>' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<span class="status-pill' + (c.rate !== null && c.rate >= 30 ? " completed" : "") + '">' + (c.rate === null ? "—" : c.rate + "% followed through") + '</span>' +
              '<button type="button" class="btn-text" data-clinic-detail="' + c.id + '">' + (expanded ? "Hide profile" : "See profile") + '</button>' +
            '</div>' +
          '</div>' +
          (expanded ? clinicDetailPanel(c.id) : "") +
        '</div>';
    }).join("") || '<p class="empty-note">No clinic matches recorded yet.</p>';

    return '' +
      '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;gap:12px;flex-wrap:wrap;">' +
          '<h2 style="font-size:1.3rem;">Insights</h2>' +
          '<button class="btn-text" id="reloadInsightsBtn">Reload</button>' +
        '</div>' +
        '<p style="margin-bottom:18px;">Based on the last ' + state.insightSubmissions.length + ' searches. This is the data you can eventually share with a clinic to show them real demand and follow-through — nothing here is shared automatically.</p>' +
        '<div class="stat-grid">' +
          statTile(ov.totalSearches, "Searches") +
          statTile(ov.totalClicks, "Clinic clicks (call + website)") +
          statTile(ov.engagedRate + "%", "Searches that led to a click") +
        '</div>' +
      '</div>' +
      '<div class="card" style="margin-top:16px;">' +
        '<h2 style="font-size:1.1rem;margin-bottom:4px;">By clinic</h2>' +
        '<p style="margin-bottom:14px;">How often each clinic was matched, and how often that turned into a call or website visit.</p>' +
        clinicRows +
      '</div>' +
      breakdownCard("By type of care searched", buildBreakdown("care_type")) +
      breakdownCard("By insurance status", buildBreakdown("insurance")) +
      breakdownCard("By language", buildBreakdown("language"));
  }

  function renderDashboard() {
    return '' +
      '<div class="admin-tabs">' +
        '<button data-tab="clinics" class="' + (state.tab === "clinics" ? "active" : "") + '">Clinics</button>' +
        '<button data-tab="insights" class="' + (state.tab === "insights" ? "active" : "") + '">Insights</button>' +
      '</div>' +
      (state.tab === "clinics" ? renderClinicsTab() : renderInsightsTab());
  }

  function render() {
    document.getElementById("signOutBtn").style.display = state.screen === "dashboard" ? "inline" : "none";
    var app = document.getElementById("app");
    var diag = document.getElementById("diagLine");
    if (diag) {
      try {
        diag.textContent = state.screen === "dashboard" ? "Connected to " + new URL(SUPABASE_URL).host : "";
      } catch (e) { diag.textContent = ""; }
    }
    if (state.screen === "configerror") {
      app.innerHTML = '<div class="banner error-banner"><span style="font-size:1.1rem">⚠️</span><div><strong>Not connected to a database yet.</strong><p>config.js still has placeholder values — paste in your real Supabase Project URL and anon key (Project Settings → API), then reload this page.</p></div></div>';
      return;
    }
    if (state.screen === "checking") app.innerHTML = '<p class="loading-note">Checking sign-in…</p>';
    else if (state.screen === "login") app.innerHTML = renderLogin();
    else if (state.screen === "dashboard") app.innerHTML = renderDashboard();
    bind();
  }

  function bind() {
    document.getElementById("signOutBtn").onclick = async function () {
      await supabase.auth.signOut();
      state.screen = "login";
      render();
    };

    if (state.screen === "login") {
      document.getElementById("loginForm").onsubmit = async function (e) {
        e.preventDefault();
        var email = document.getElementById("email").value.trim();
        var password = document.getElementById("password").value;
        var res = await supabase.auth.signInWithPassword({ email: email, password: password });
        if (res.error) {
          console.error("Sign-in failed:", res.error);
          state.error = "Couldn't sign in — check your email and password.";
          render();
          return;
        }
        state.error = "";
        await loadClinics();
      };
    }

    if (state.screen === "dashboard") {
      document.querySelectorAll(".admin-tabs [data-tab]").forEach(function (btn) {
        btn.onclick = function () {
          state.tab = btn.dataset.tab;
          if (state.tab === "insights" && !state.insightsLoaded) {
            loadInsights();
          } else {
            render();
          }
        };
      });

      if (state.tab === "clinics") bindClinicsTab();
      else bindInsightsTab();
    }
  }

  function bindClinicsTab() {
    var reloadBtn = document.getElementById("reloadClinicsBtn");
    if (reloadBtn) reloadBtn.onclick = function () { loadClinics(); };

    document.querySelectorAll("[data-edit]").forEach(function (btn) {
      btn.onclick = function () { state.editingId = btn.dataset.edit; render(); window.scrollTo({ top: 0, behavior: "smooth" }); };
    });
    document.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.onclick = async function () {
        if (!confirm("Delete this clinic permanently? This can't be undone.")) return;
        var res = await supabase.from("clinics").delete().eq("id", btn.dataset.delete);
        if (res.error) { console.error("Delete failed:", res.error); state.error = "Couldn't delete: " + res.error.message; render(); return; }
        await loadClinics();
      };
    });
    var cancelBtn = document.getElementById("cancelEditBtn");
    if (cancelBtn) cancelBtn.onclick = function () { state.editingId = null; render(); };

    var form = document.getElementById("clinicForm");
    if (form) {
      form.onsubmit = async function (e) {
        e.preventDefault();
        var flags = Array.from(document.querySelectorAll('input[name="cFlags"]:checked')).map(function (i) { return i.value; });
        var record = {
          name: document.getElementById("cName").value.trim(),
          neighborhood: document.getElementById("cNeighborhood").value.trim(),
          phone: document.getElementById("cPhone").value.trim() || null,
          website: document.getElementById("cWebsite").value.trim() || null,
          address: document.getElementById("cAddress").value.trim() || null,
          languages: Array.from(document.querySelectorAll('input[name="cLang"]:checked')).map(function (i) { return i.value; }),
          insurance: Array.from(document.querySelectorAll('input[name="cIns"]:checked')).map(function (i) { return i.value; }),
          care_types: Array.from(document.querySelectorAll('input[name="cCare"]:checked')).map(function (i) { return i.value; }),
          population: document.querySelector('input[name="cPop"]:checked').value,
          sliding_scale: flags.indexOf("sliding_scale") !== -1,
          walk_in: flags.indexOf("walk_in") !== -1,
          near_transit: flags.indexOf("near_transit") !== -1,
          serves_undocumented: flags.indexOf("serves_undocumented") !== -1,
          lgbtq_affirming: flags.indexOf("lgbtq_affirming") !== -1,
          hiv_care: flags.indexOf("hiv_care") !== -1,
          veteran_friendly: flags.indexOf("veteran_friendly") !== -1,
          active: flags.indexOf("active") !== -1,
          docs_en: linesToArray(document.getElementById("cDocsEn").value),
          docs_es: linesToArray(document.getElementById("cDocsEs").value),
          services_en: linesToArray(document.getElementById("cServicesEn").value),
          services_es: linesToArray(document.getElementById("cServicesEs").value)
        };

        var res;
        if (state.editingId) res = await supabase.from("clinics").update(record).eq("id", state.editingId);
        else res = await supabase.from("clinics").insert(record);

        if (res.error) {
          console.error("Save failed:", res.error, "record:", record);
          state.error = "Couldn't save: " + res.error.message + (res.error.hint ? " (" + res.error.hint + ")" : "");
          render();
          return;
        }
        state.editingId = null;
        state.error = "";
        await loadClinics();
      };
    }
  }

  function bindInsightsTab() {
    var reloadBtn = document.getElementById("reloadInsightsBtn");
    if (reloadBtn) reloadBtn.onclick = function () { loadInsights(); };

    document.querySelectorAll("[data-clinic-detail]").forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.dataset.clinicDetail;
        state.expandedClinics[id] = !state.expandedClinics[id];
        render();
      };
    });
  }

  async function loadClinics() {
    try {
      var res = await supabase.from("clinics").select("*").order("name");
      if (res.error) {
        console.error("Couldn't load clinics:", res.error);
        state.error = "Couldn't load clinics: " + res.error.message + (res.error.hint ? " (" + res.error.hint + ")" : "");
        state.screen = "dashboard";
        state.clinics = [];
        render();
        return;
      }
      state.clinics = res.data || [];
      state.screen = "dashboard";
      state.tab = "clinics";
      state.error = "";
      render();
    } catch (e) {
      console.error("Unexpected error loading clinics:", e);
      state.error = "Unexpected error loading clinics — see browser console for details (F12).";
      state.screen = "dashboard";
      state.clinics = [];
      render();
    }
  }

  async function loadInsights() {
    try {
      var subsRes = await supabase.from("patient_submissions")
        .select("id, age, zip_code, care_type, insurance, language, has_car, needs_walk_in, needs_interpreter, undocumented_pref, lgbtq_pref, hiv_pref, veteran_pref, matched_clinic_ids, created_at")
        .order("created_at", { ascending: false }).limit(1000);
      if (subsRes.error) throw subsRes.error;
      var clicksRes = await supabase.from("clinic_clicks")
        .select("clinic_id, submission_id, action, care_type, insurance, language, created_at")
        .order("created_at", { ascending: false }).limit(2000);
      if (clicksRes.error) throw clicksRes.error;
      state.insightSubmissions = subsRes.data || [];
      state.insightClicks = clicksRes.data || [];
      state.insightsLoaded = true;
      state.insightsError = "";
      state.tab = "insights";
      render();
    } catch (e) {
      console.error("Couldn't load insights:", e);
      state.insightsError = "Couldn't load insights: " + (e && e.message ? e.message : "unexpected error") + " — see browser console for details (F12).";
      state.tab = "insights";
      render();
    }
  }

  async function init() {
    if (!supabase) { render(); return; }
    try {
      var session = await supabase.auth.getSession();
      if (session.data.session) await loadClinics();
      else { state.screen = "login"; render(); }
    } catch (e) {
      console.error("Unexpected error checking sign-in:", e);
      state.screen = "login";
      state.error = "Something went wrong checking your sign-in — try signing in again.";
      render();
    }
  }

  init();
})();
