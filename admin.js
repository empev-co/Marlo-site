// Marlo — clinic admin logic (login + manage clinics + patient follow-ups).
(function () {
  "use strict";

  var LANGUAGES = ["English", "Spanish", "Cantonese", "Mandarin", "Vietnamese", "Tagalog", "Russian"];
  var INSURANCE = ["Uninsured / no insurance", "Medi-Cal", "Medicare", "Private insurance / Covered CA"];
  var FOLLOWUP_STATUSES = [
    { value: "new", label: "New — not yet contacted" },
    { value: "contacted", label: "Contacted" },
    { value: "appointment_scheduled", label: "Appointment scheduled" },
    { value: "completed", label: "Completed" },
    { value: "no_response", label: "No response" }
  ];

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
    submissions: [],
    editingId: null,
    error: "",
    submissionsLoaded: false,
    submissionsError: ""
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
    return '' +
      '<form id="clinicForm">' +
        '<div class="two-col">' +
          '<div class="field"><label for="cName">Clinic name</label><input type="text" id="cName" value="' + esc(c.name || "") + '" required></div>' +
          '<div class="field"><label for="cNeighborhood">Neighborhood</label><input type="text" id="cNeighborhood" value="' + esc(c.neighborhood || "") + '" required></div>' +
        '</div>' +
        '<div class="two-col">' +
          '<div class="field"><label for="cPhone">Phone</label><input type="tel" id="cPhone" value="' + esc(c.phone || "") + '"></div>' +
          '<div class="field"><label for="cWebsite">Website</label><input type="text" id="cWebsite" value="' + esc(c.website || "") + '" placeholder="https://"></div>' +
        '</div>' +
        '<div class="field"><label for="cAddress">Address (optional)</label><input type="text" id="cAddress" value="' + esc(c.address || "") + '"></div>' +
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
      var tags = [c.neighborhood, c.walk_in ? "Walk-in" : "Appt only", (c.languages || []).join("/")].concat(extra).concat([c.active === false ? "HIDDEN" : "Visible"]).filter(Boolean).join(" · ");
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

  function summarizePrefs(s) {
    var bits = [];
    if (s.needs_interpreter) bits.push("Interpreter (" + (s.interpreter_language || "?") + ")");
    if (s.needs_walk_in) bits.push("Walk-in");
    if (s.undocumented_pref) bits.push("Immigration-status-safe");
    if (s.lgbtq_pref) bits.push("LGBTQ+ affirming");
    if (s.hiv_pref) bits.push("HIV care");
    if (s.veteran_pref) bits.push("Veteran care");
    return bits.join(" · ");
  }

  function renderFollowupsTab() {
    if (state.submissionsError) {
      return '<div class="card"><p class="error-note">' + esc(state.submissionsError) + '</p><button class="btn-text" id="reloadSubmissionsBtn">Try again</button></div>';
    }
    if (!state.submissions.length) {
      return '<div class="card"><p class="empty-note">No patient searches recorded yet.</p></div>';
    }
    var rows = state.submissions.map(function (s) {
      var when = s.created_at ? new Date(s.created_at).toLocaleString() : "";
      var prefs = summarizePrefs(s);
      var statusOptions = FOLLOWUP_STATUSES.map(function (o) {
        return '<option value="' + o.value + '"' + (o.value === (s.followup_status || "new") ? " selected" : "") + '>' + o.label + '</option>';
      }).join("");
      return '' +
        '<div class="admin-row" style="flex-direction:column;align-items:stretch;">' +
          '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">' +
            '<div>' +
              '<div class="name">' + esc(s.name || "(no name)") + (s.phone ? ' · <a href="tel:' + esc(s.phone.replace(/[^0-9+]/g, "")) + '">' + esc(s.phone) + '</a>' : '') + '</div>' +
              '<div class="tags">' + [s.age ? "Age " + s.age : "", s.zip_code || "", s.language || "", s.insurance || ""].filter(Boolean).join(" · ") + '</div>' +
              (prefs ? '<div class="tags">' + esc(prefs) + '</div>' : "") +
              '<div class="tags">' + esc(when) + '</div>' +
            '</div>' +
            '<span class="status-pill ' + esc(s.followup_status || "new") + '">' + esc((FOLLOWUP_STATUSES.filter(function (o) { return o.value === (s.followup_status || "new"); })[0] || {}).label || s.followup_status) + '</span>' +
          '</div>' +
          '<form class="followup-form" data-submission="' + s.id + '" style="margin-top:10px;display:flex;flex-direction:column;gap:10px;">' +
            '<div class="two-col">' +
              '<div class="field" style="margin-bottom:0;"><label>Status</label><select class="fuStatus">' + statusOptions + '</select></div>' +
              '<div class="field" style="margin-bottom:0;"><label>Notes (how did it go?)</label><input type="text" class="fuNotes" value="' + esc(s.followup_notes || "") + '" placeholder="e.g. Got an appointment for 9/20"></div>' +
            '</div>' +
            '<div><button type="submit" class="btn-text">Save</button></div>' +
          '</form>' +
        '</div>';
    }).join("");

    return '' +
      '<div class="card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:12px;flex-wrap:wrap;">' +
          '<h2 style="font-size:1.3rem;">Patient follow-ups (' + state.submissions.length + ')</h2>' +
          '<button class="btn-text" id="reloadSubmissionsBtn">Reload list</button>' +
        '</div>' +
        '<p style="margin-bottom:12px;">Every search a patient runs, most recent first. Update the status once you\'ve followed up.</p>' +
        rows +
      '</div>';
  }

  function renderDashboard() {
    return '' +
      '<div class="admin-tabs">' +
        '<button data-tab="clinics" class="' + (state.tab === "clinics" ? "active" : "") + '">Clinics</button>' +
        '<button data-tab="followups" class="' + (state.tab === "followups" ? "active" : "") + '">Patient follow-ups</button>' +
      '</div>' +
      (state.tab === "clinics" ? renderClinicsTab() : renderFollowupsTab());
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
          if (state.tab === "followups" && !state.submissionsLoaded) {
            loadSubmissions();
          } else {
            render();
          }
        };
      });

      if (state.tab === "clinics") bindClinicsTab();
      else bindFollowupsTab();
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

  function bindFollowupsTab() {
    var reloadBtn = document.getElementById("reloadSubmissionsBtn");
    if (reloadBtn) reloadBtn.onclick = function () { loadSubmissions(); };

    document.querySelectorAll(".followup-form").forEach(function (form) {
      form.onsubmit = async function (e) {
        e.preventDefault();
        var id = form.dataset.submission;
        var status = form.querySelector(".fuStatus").value;
        var notes = form.querySelector(".fuNotes").value.trim();
        var saveBtn = form.querySelector('button[type="submit"]');
        var originalText = saveBtn.textContent;
        saveBtn.textContent = "Saving…";
        saveBtn.disabled = true;
        var res = await supabase.from("patient_submissions").update({ followup_status: status, followup_notes: notes || null }).eq("id", id);
        if (res.error) {
          console.error("Couldn't save follow-up:", res.error);
          alert("Couldn't save: " + res.error.message);
          saveBtn.textContent = originalText;
          saveBtn.disabled = false;
          return;
        }
        await loadSubmissions();
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

  async function loadSubmissions() {
    try {
      var res = await supabase.from("patient_submissions").select("*").order("created_at", { ascending: false }).limit(200);
      if (res.error) {
        console.error("Couldn't load patient follow-ups:", res.error);
        state.submissionsError = "Couldn't load patient follow-ups: " + res.error.message;
        state.tab = "followups";
        render();
        return;
      }
      state.submissions = res.data || [];
      state.submissionsLoaded = true;
      state.submissionsError = "";
      state.tab = "followups";
      render();
    } catch (e) {
      console.error("Unexpected error loading patient follow-ups:", e);
      state.submissionsError = "Unexpected error — see browser console for details (F12).";
      state.tab = "followups";
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
