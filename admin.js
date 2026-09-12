// Marlo — clinic admin logic (login + manage clinics).
(function () {
  "use strict";

  var LANGUAGES = ["English", "Spanish", "Cantonese", "Mandarin", "Vietnamese", "Tagalog", "Russian"];
  var INSURANCE = ["Uninsured / no insurance", "Medi-Cal", "Medicare", "Private insurance / Covered CA"];

  var supabase = null;
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Supabase client failed to initialize — check config.js", e);
  }

  var state = { screen: supabase ? "checking" : "configerror", clinics: [], editingId: null, error: "" };

  function chip(name, value, label, checked, type) {
    return '<label class="chip"><input type="' + (type || "checkbox") + '" name="' + name + '" value="' +
      value + '" ' + (checked ? "checked" : "") + '><span>' + label + '</span></label>';
  }

  function renderLogin() {
    return '' +
      '<div class="card center-card">' +
        '<h2 style="font-size:1.3rem;margin-bottom:6px;">Clinic admin sign in</h2>' +
        '<p style="margin-bottom:20px;">For Marlo staff only.</p>' +
        (state.error ? '<p class="error-note">' + state.error + '</p>' : '') +
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
          '<div class="field"><label for="cName">Clinic name</label><input type="text" id="cName" value="' + (c.name || "") + '" required></div>' +
          '<div class="field"><label for="cNeighborhood">Neighborhood</label><input type="text" id="cNeighborhood" value="' + (c.neighborhood || "") + '" required></div>' +
        '</div>' +
        '<div class="two-col">' +
          '<div class="field"><label for="cPhone">Phone</label><input type="tel" id="cPhone" value="' + (c.phone || "") + '"></div>' +
          '<div class="field"><label for="cWebsite">Website</label><input type="text" id="cWebsite" value="' + (c.website || "") + '" placeholder="https://"></div>' +
        '</div>' +
        '<div class="field"><label for="cAddress">Address (optional)</label><input type="text" id="cAddress" value="' + (c.address || "") + '"></div>' +
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
          chip("cFlags", "active", "Visible on the public site", c.active !== false) +
        '</div></div>' +
        '<div class="form-actions">' +
          (state.editingId ? '<button type="button" class="btn-text" id="cancelEditBtn">Cancel edit</button>' : '<span></span>') +
          '<button type="submit" class="btn btn-primary">' + (state.editingId ? "Save changes" : "Add clinic") + '</button>' +
        '</div>' +
      '</form>';
  }

  function renderDashboard() {
    var editing = state.editingId ? state.clinics.find(function (c) { return c.id === state.editingId; }) : null;
    var rows = state.clinics.map(function (c) {
      var tags = [c.neighborhood, c.walk_in ? "Walk-in" : "Appt only", (c.languages || []).join("/"), c.active === false ? "HIDDEN" : "Visible"].filter(Boolean).join(" · ");
      return '' +
        '<div class="admin-row">' +
          '<div><div class="name">' + c.name + '</div><div class="tags">' + tags + '</div></div>' +
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
        (state.error ? '<p class="error-note">' + state.error + '</p>' : '') +
        clinicFormHtml(editing) +
      '</div>' +
      '<div class="card" style="margin-top:16px;">' +
        '<h2 style="font-size:1.1rem;margin-bottom:8px;">Current clinics (' + state.clinics.length + ')</h2>' +
        rows +
      '</div>';
  }

  function render() {
    document.getElementById("signOutBtn").style.display = state.screen === "dashboard" ? "inline" : "none";
    var app = document.getElementById("app");
    if (state.screen === "configerror") {
      app.innerHTML = '<div class="banner"><span style="font-size:1.1rem">⚠️</span><div><strong>Not connected to a database yet.</strong><p>config.js still has placeholder values — paste in your real Supabase Project URL and anon key (Project Settings → API), then reload this page.</p></div></div>';
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
          state.error = "Couldn't sign in — check your email and password.";
          render();
          return;
        }
        state.error = "";
        await loadDashboard();
      };
    }

    if (state.screen === "dashboard") {
      document.querySelectorAll("[data-edit]").forEach(function (btn) {
        btn.onclick = function () { state.editingId = btn.dataset.edit; render(); window.scrollTo({ top: 0, behavior: "smooth" }); };
      });
      document.querySelectorAll("[data-delete]").forEach(function (btn) {
        btn.onclick = async function () {
          if (!confirm("Delete this clinic permanently? This can't be undone.")) return;
          var res = await supabase.from("clinics").delete().eq("id", btn.dataset.delete);
          if (res.error) { state.error = "Couldn't delete: " + res.error.message; render(); return; }
          await loadDashboard();
        };
      });
      var cancelBtn = document.getElementById("cancelEditBtn");
      if (cancelBtn) cancelBtn.onclick = function () { state.editingId = null; render(); };

      document.getElementById("clinicForm").onsubmit = async function (e) {
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
          active: flags.indexOf("active") !== -1
        };

        var res;
        if (state.editingId) res = await supabase.from("clinics").update(record).eq("id", state.editingId);
        else res = await supabase.from("clinics").insert(record);

        if (res.error) { state.error = "Couldn't save: " + res.error.message; render(); return; }
        state.editingId = null;
        state.error = "";
        await loadDashboard();
      };
    }
  }

  async function loadDashboard() {
    var res = await supabase.from("clinics").select("*").order("name");
    if (res.error) { state.error = "Couldn't load clinics: " + res.error.message; state.screen = "dashboard"; state.clinics = []; render(); return; }
    state.clinics = res.data || [];
    state.screen = "dashboard";
    render();
  }

  async function init() {
    if (!supabase) { render(); return; }
    var session = await supabase.auth.getSession();
    if (session.data.session) await loadDashboard();
    else { state.screen = "login"; render(); }
  }

  init();
})();
