/*
 * Site-wide search for the search box in the shared header (id="siteSearch").
 * Every page that carries the header loads this file, so the search works the same everywhere.
 *
 * What it searches
 *   - Pages ................. the portal's pages
 *   - Announcements ......... from announcements-data.js (published notices only)
 *   - Job openings .......... from jobs-data.js (open, not-expired roles only)
 *   - Tasks & checklists .... the checklist tools (built-in list, or your own list from /api/checklist-icons/ when
 *                             USE_BACKEND_SEARCH is true)
 *   - Documents ............. files in the SOP / Policies and Forms libraries
 *   - Restaurants & people .. the 23 restaurants and their general managers
 * Picking a result opens the right page and, where the page supports it, jumps to the item
 * (?ann=<id> opens the notice, #job-<id> selects the role, ?tool=<name> highlights the checklist,
 * ?q=<text> filters the restaurant list or the document tree).
 *
 * Mingalaba Portal (Django) version:
 *   - Restaurants, managers and documents are LIVE: they come from the portal's search index
 *     (PORTAL_URLS.searchIndex -> the outlets table and the company documents folder), so nothing
 *     here needs updating when a restaurant or document is added.
 *   - Page addresses come from window.PORTAL_URLS, set by the shared header template.
 *   - Announcements and job openings are read from their own data files (sample data for now).
 *
 * USE_BACKEND_SEARCH = false -> checklist tools come from the built-in list below.
 * USE_BACKEND_SEARCH = true  -> checklist tools come from /api/checklist-icons/, so people only find the tools they
 *                               are allowed to see. Flip it together with USE_BACKEND_AUTH / USE_BACKEND_ICONS /
 *                               USE_BACKEND_JOBS / USE_BACKEND_ANNOUNCEMENTS when the backend is deployed.
 */
(function () {
  var USE_BACKEND_SEARCH = false;
  var URLS = window.PORTAL_URLS || {};
  function U(key) { return URLS[key] || '#'; }
  // A page entry is either a key in PORTAL_URLS or a full https:// address.
  function pageUrl(entry) { return /^https?:\/\//.test(entry) ? entry : U(entry); }

  var input = document.getElementById('siteSearch');
  if (!input) return;

  /* ------------------------------------------------------------------ */
  /* Static content                                                      */
  /* ------------------------------------------------------------------ */
  // [title, page, subtitle, keywords, icon, suffix]
  // [title, page key in PORTAL_URLS (or a full https:// address), subtitle, keywords, icon, suffix]
  var PAGES = [
    ['Dashboard', 'dashboard', 'Home', 'home overview shortcuts tiles', 'dashboard', ''],
    ['Knowledge Center', 'knowledgeCenter', 'SOP/Policies, restaurants, menu, forms, music, compliance', 'hub knowledge base sop policies restaurants menu forms music compliance org chart', 'hub', ''],
    ['SOP / Policies', 'sopPolicies', 'Pick a department to open the repository', 'sop policies department operations store finance sales hr knowledge center', 'menu_book', ''],
    ['Forms', 'forms', 'Pick a department to open the forms library', 'forms department operations store finance sales hr knowledge center', 'description', ''],
    ['Company Forms', 'companyForms', 'HR, operations, finance & store forms', 'company forms library hr operations finance store templates', 'folder_open', ''],
    ['Restaurant Details', 'restaurants', 'All restaurants', 'restaurants stores outlets directory locations managers addresses knowledge center', 'storefront', ''],
    ['Menu Items & Allergens', 'menuGuide', 'Opens in a new tab (Notion)', 'menu details items allergens ingredients kitchen guide notion knowledge center', 'restaurant_menu', ''],
    ['Org Chart', 'orgChart', 'Opens in a new tab', 'org chart organisation organization hierarchy reporting knowledge center', 'account_tree', ''],
    ['Music', 'music', 'Play the restaurant ambience playlist', 'music player playlist ambience songs tracks knowledge center', 'music_note', ''],
    ['Compliance Dashboard', 'compliance', 'Licenses Compliance & HR Compliance', 'compliance dashboard licenses hr knowledge center', 'verified', ''],
    ['Licenses Compliance', '#', 'Opens in a new tab (Google Apps Script)', 'licenses compliance fssai permits knowledge center', 'gavel', ''],
    ['HR Compliance', 'hrCompliance', 'Opens in a new tab', 'hr compliance people statutory knowledge center', 'badge', ''],
    ['Job Openings', 'jobs', 'Open positions by department', 'jobs careers hiring vacancies recruitment positions apply', 'badge', ''],
    ['Announcements', 'announcements', 'Notice board', 'notices news updates circulars board', 'campaign', ''],
    ['Sales', 'sales', 'Store targets and the sales dashboard', 'sales dashboard revenue power bi targets', 'monitoring', ''],
    ['Store Targets', 'sales', 'Month-to-date sales against target', 'sales target achievement performance cities stores revenue', 'track_changes', '#targets'],
    ['Quick Links', 'quickLinks', 'Peak Scale, Frontlyne, Spine, POSIST, Omni Cards, PMS', 'quick links tools peak scale frontlyne spine posist omni cards pms performance management', 'link', ''],
    ['Peak Scale', 'quickLinks', 'Quick Links', 'peak scale quick links', 'monitor_weight', ''],
    ['Frontlyne', 'https://bbacademy.gofrontlyne.com/my-learning', 'Opens in a new tab (BB Academy)', 'frontlyne bb academy learning training quick links', 'support_agent', ''],
    ['Spine', 'spine', 'Opens in a new tab (Spine HRMS)', 'spine hrms payroll attendance quick links', 'account_balance', ''],
    ['POSIST', 'posist', 'Opens in a new tab', 'posist pos restroworks billing quick links', 'point_of_sale', ''],
    ['Omni Cards', 'quickLinks', 'Quick Links', 'omni cards gift vouchers quick links', 'credit_card', ''],
    ['Performance Management System (PMS)', 'quickLinks', 'Quick Links - coming soon', 'pms performance management system appraisal review quick links', 'insights', ''],
    ['Log Book', 'logBook', 'Checklists for the store', 'tasks checklists registers daily opening closing hygiene log book', 'checklist', '']
  ];
  var MANAGE_PAGES = {
    jobs: ['Manage Job Postings', 'manageJobs', 'Add, edit or close job postings', 'post new job posting hiring hr manage vacancies', 'edit_note'],
    announcements: ['Manage Announcements', 'manageAnnouncements', 'Post or edit announcements', 'post new announcement notice publish pin archive manage', 'edit_note']
  };

  // [name, department] -- the Log Book now shows the Store checklists only.
  var TOOLS = [
    ['Food Safety Temperature Log', 'Store'], ['Tips Register', 'Store'], ['Aggregators Order Register', 'Store'],
    ['Uniform Register', 'Store'], ['Spoilage Register', 'Store'], ['Lost and Found Register', 'Store'],
    ['Pest Control Register', 'Store'], ['Shift Handover Register', 'Store'], ['Banking Slip', 'Store']
  ];

  /* ------------------------------------------------------------------ */
  /* Types                                                               */
  /* ------------------------------------------------------------------ */
  var TYPES = {
    page:         { label: 'Pages',                color: '#5b1614', order: 0 },
    announcement: { label: 'Announcements',        color: '#5B2C6F', order: 1 },
    job:          { label: 'Job openings',         color: '#B45309', order: 2 },
    tool:         { label: 'Log Book',              color: '#8E281F', order: 3 },
    doc:          { label: 'Documents',            color: '#2D5A27', order: 4 },
    store:        { label: 'Restaurants',          color: '#A66E2E', order: 5 },
    person:       { label: 'People',               color: '#6B4B5A', order: 6 }
  };
  var MAX_PER_GROUP = 5, MAX_TOTAL = 18;

  var entries = [], dynamicLoaded = false, dynamicLoading = null;

  function add(type, title, sub, url, icon, keywords) {
    entries.push({ type: type, title: title, sub: sub || '', url: url, icon: icon, kw: (keywords || '').toLowerCase(), t: title.toLowerCase() });
  }

  function buildStatic() {
    entries = [];
    PAGES.forEach(function (p) { add('page', p[0], p[2], pageUrl(p[1]) + p[5], p[4], p[3]); });
    if (!USE_BACKEND_SEARCH) {
      TOOLS.forEach(function (t) { add('tool', t[0], t[1] + ' · Log Book', U('logBook') + '?tool=' + encodeURIComponent(t[0]), 'checklist', t[1]); });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Live content (announcements, jobs, allowed checklist tools)          */
  /* ------------------------------------------------------------------ */
  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src; s.onload = function () { resolve(true); }; s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
  }
  function fmtDay(iso) { return iso ? new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''; }

  function loadDynamic() {
    if (dynamicLoaded) return Promise.resolve();
    if (dynamicLoading) return dynamicLoading;
    var manage = { jobs: false, announcements: false };

    function announcements() {
      return (window.AnnouncementsStore ? Promise.resolve(true) : loadScript(U('annJs'))).then(function (ok) {
        if (!ok || !window.AnnouncementsStore) return;
        return window.AnnouncementsStore.load().then(function (data) {
          manage.announcements = !!data.canManage;
          data.announcements.filter(window.AnnouncementsStore.isVisible).forEach(function (a) {
            add('announcement', a.title, a.category + ' · ' + a.audience + (a.date ? ' · ' + fmtDay(a.date) : ''),
              U('announcements') + '?ann=' + a.id, 'campaign', [a.category, a.audience, a.author, a.body, a.action].join(' '));
          });
        });
      }).catch(function () { /* announcements just won't be searchable */ });
    }
    function jobs() {
      return (window.JobsStore ? Promise.resolve(true) : loadScript(U('jobsJs'))).then(function (ok) {
        if (!ok || !window.JobsStore) return;
        return window.JobsStore.load().then(function (data) {
          manage.jobs = !!data.canManage;
          data.jobs.filter(window.JobsStore.isLive).forEach(function (j) {
            add('job', j.title, j.department + ' · ' + j.city + (j.place ? ' · ' + j.place : '') + ' · ' + j.type, U('jobs') + '#job-' + j.id, 'badge',
              [j.department, j.city, j.place, j.type, j.experience, j.summary, j.requirements.join(' ')].join(' '));
          });
        });
      }).catch(function () { /* job openings just won't be searchable */ });
    }
    function tools() {
      if (!USE_BACKEND_SEARCH) return Promise.resolve();
      return fetch('/api/checklist-icons/', { credentials: 'include' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
        if (!data) return;
        data.icons.forEach(function (t) { add('tool', t.name, t.department + ' · Log Book', U('logBook') + '?tool=' + encodeURIComponent(t.name), 'checklist', t.department); });
      }).catch(function () { /* tools just won't be searchable */ });
    }

    // Live documents, restaurants and people from the portal (only what this employee can see).
    function portalIndex() {
      if (!URLS.searchIndex) return Promise.resolve();
      return fetch(URLS.searchIndex, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (!data) return;
          (data.docs || []).forEach(function (d) { add('doc', d.title, d.sub, d.url, 'description', d.kw); });
          (data.stores || []).forEach(function (d) { add('store', d.title, d.sub, d.url, 'storefront', d.kw); });
          (data.people || []).forEach(function (d) { add('person', d.title, d.sub, d.url, 'person', d.kw); });
        }).catch(function () { /* documents and restaurants just won't be searchable */ });
    }

    dynamicLoading = Promise.all([announcements(), jobs(), tools(), portalIndex()]).then(function () {
      if (manage.jobs) add('page', MANAGE_PAGES.jobs[0], MANAGE_PAGES.jobs[2], U(MANAGE_PAGES.jobs[1]), MANAGE_PAGES.jobs[4], MANAGE_PAGES.jobs[3]);
      if (manage.announcements) add('page', MANAGE_PAGES.announcements[0], MANAGE_PAGES.announcements[2], U(MANAGE_PAGES.announcements[1]), MANAGE_PAGES.announcements[4], MANAGE_PAGES.announcements[3]);
      dynamicLoaded = true;
      dynamicLoading = null;
    });
    return dynamicLoading;
  }

  /* ------------------------------------------------------------------ */
  /* Matching                                                            */
  /* ------------------------------------------------------------------ */
  function norm(s) { return String(s).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9+@.\s-]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function tokens(q) { return norm(q).split(' ').filter(Boolean); }

  function search(q) {
    var toks = tokens(q);
    if (!toks.length) return [];
    var out = [], partial = [];
    entries.forEach(function (e) {
      // Words in the title can match anywhere; words in the details (place, text, keywords) must match the start of a word,
      // so "tea" finds "Tea Room" but not "team" or "instead".
      var title = norm(e.t), rest = ' ' + norm(e.sub + ' ' + e.kw) + ' ', score = 0, matched = 0;
      toks.forEach(function (t) {
        var short = t.length <= 3;   // very short words must be whole words: "tea" should not match "team"
        if (title.indexOf(t) === 0 && (!short || title.length === t.length || title.charAt(t.length) === ' ')) { score += 40; matched++; }
        else if (title.indexOf(' ' + t + (short ? ' ' : '')) >= 0 || (short && title.slice(-t.length - 1) === ' ' + t)) { score += 30; matched++; }
        else if (!short && title.indexOf(t) >= 0) { score += 18; matched++; }
        else if (rest.indexOf(' ' + t + (short ? ' ' : '')) >= 0) { score += 7; matched++; }
      });
      if (matched === toks.length) {
        if (title === norm(q)) score += 50;
        out.push({ e: e, score: score });
      } else if (matched > 0) {
        partial.push({ e: e, score: score });
      }
    });
    // A query like "mumbai jobs" may not match every word in any one item; fall back to the best partial matches.
    if (!out.length && toks.length > 1) out = partial;
    out.sort(function (a, b) { return (b.score - a.score) || (TYPES[a.e.type].order - TYPES[b.e.type].order) || a.e.title.localeCompare(b.e.title); });
    // Group in type order, capping each group and the total.
    var groups = {}, result = [];
    out.forEach(function (r) { (groups[r.e.type] = groups[r.e.type] || []).push(r.e); });
    Object.keys(TYPES).sort(function (a, b) { return TYPES[a].order - TYPES[b].order; }).forEach(function (type) {
      (groups[type] || []).slice(0, MAX_PER_GROUP).forEach(function (e) { if (result.length < MAX_TOTAL) result.push(e); });
    });
    return result;
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // Bold the parts of `text` that match the search words.
  function highlight(text, toks) {
    var lower = text.toLowerCase(), marks = [];
    toks.forEach(function (t) {
      var raw = t.replace(/^and$/, '&');
      var i = lower.indexOf(t);
      if (i < 0 && raw !== t) i = lower.indexOf(raw);
      if (i >= 0) marks.push([i, i + (lower.indexOf(t) >= 0 ? t.length : raw.length)]);
    });
    if (!marks.length) return esc(text);
    marks.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [marks[0]];
    for (var k = 1; k < marks.length; k++) {
      var last = merged[merged.length - 1];
      if (marks[k][0] <= last[1]) last[1] = Math.max(last[1], marks[k][1]); else merged.push(marks[k]);
    }
    var html = '', pos = 0;
    merged.forEach(function (m) { html += esc(text.slice(pos, m[0])) + '<mark>' + esc(text.slice(m[0], m[1])) + '</mark>'; pos = m[1]; });
    return html + esc(text.slice(pos));
  }

  /* ------------------------------------------------------------------ */
  /* Panel                                                               */
  /* ------------------------------------------------------------------ */
  var style = document.createElement('style');
  style.textContent =
    '.ss-panel{position:fixed;z-index:60;background:#fff;border:1px solid #E8DFD3;border-radius:18px;box-shadow:0 18px 44px rgba(62,1,4,.18);max-height:min(70vh,520px);overflow-y:auto;padding:6px 0 0;font-family:"Plus Jakarta Sans",system-ui,sans-serif}' +
    '.ss-panel[hidden]{display:none}' +
    '.ss-group{padding:10px 16px 4px;font-size:10.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8c7b75}' +
    '.ss-item{display:flex;align-items:center;gap:12px;padding:8px 16px;cursor:pointer;color:#231917;text-decoration:none}' +
    '.ss-item:hover,.ss-item.on{background:#FBF3EE}' +
    '.ss-item.on{box-shadow:inset 3px 0 0 #5b1614}' +
    '.ss-ic{width:32px;height:32px;border-radius:50%;flex:none;display:flex;align-items:center;justify-content:center;color:#fff}' +
    '.ss-ic .material-symbols-outlined{font-size:18px}' +
    '.ss-tx{min-width:0;flex:1}' +
    '.ss-t{font-size:13.5px;font-weight:600;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.ss-s{font-size:11.5px;color:#635654;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.ss-t mark,.ss-s mark{background:#FFE9A8;color:inherit;border-radius:3px;padding:0 1px}' +
    '.ss-go{font-size:16px!important;color:#b8a99f;flex:none}' +
    '.ss-empty{padding:22px 18px;text-align:center;font-size:13px;color:#635654}' +
    '.ss-empty b{display:block;color:#231917;margin-bottom:2px;font-size:13.5px}' +
    '.ss-foot{position:sticky;bottom:0;background:#FCFAF6;border-top:1px solid #F0EBE0;padding:7px 16px;font-size:11px;color:#8c7b75;display:flex;gap:14px;flex-wrap:wrap}' +
    '.ss-foot kbd{font:inherit;font-weight:700;background:#fff;border:1px solid #E8DFD3;border-radius:5px;padding:0 5px}' +
    '@media (max-width:640px){.ss-foot{display:none}}';
  document.head.appendChild(style);

  var panel = document.createElement('div');
  panel.id = 'siteSearchPanel';
  panel.className = 'ss-panel';
  panel.setAttribute('role', 'listbox');
  panel.setAttribute('aria-label', 'Search results');
  panel.hidden = true;
  document.body.appendChild(panel);

  input.setAttribute('autocomplete', 'off');
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  input.setAttribute('aria-controls', 'siteSearchPanel');
  input.setAttribute('aria-label', 'Search the portal');

  var shown = [], active = -1;

  function place() {
    var r = input.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    var width = Math.min(Math.max(r.width, 440), vw - 24);
    var left = Math.min(Math.max(12, r.left), vw - width - 12);
    panel.style.left = left + 'px';
    panel.style.top = (r.bottom + 8) + 'px';
    panel.style.width = width + 'px';
  }
  function open() { place(); panel.hidden = false; input.setAttribute('aria-expanded', 'true'); }
  function close() { panel.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; }

  function setActive(i) {
    var items = panel.querySelectorAll('.ss-item');
    if (!items.length) return;
    active = (i + items.length) % items.length;
    [].forEach.call(items, function (el, n) { el.classList.toggle('on', n === active); el.setAttribute('aria-selected', n === active ? 'true' : 'false'); });
    input.setAttribute('aria-activedescendant', items[active].id);
    items[active].scrollIntoView({ block: 'nearest' });
  }

  function itemHtml(e, idx, toks) {
    var ty = TYPES[e.type];
    return '<a class="ss-item" role="option" id="ss-opt-' + idx + '" aria-selected="false" data-idx="' + idx + '" href="' + esc(e.url) + '">' +
      '<span class="ss-ic" style="background:' + ty.color + '"><span class="material-symbols-outlined">' + e.icon + '</span></span>' +
      '<span class="ss-tx"><div class="ss-t">' + highlight(e.title, toks) + '</div><div class="ss-s">' + highlight(e.sub, toks) + '</div></span>' +
      '<span class="material-symbols-outlined ss-go">arrow_forward</span></a>';
  }

  function render() {
    var q = input.value, toks = tokens(q), html = '';
    if (!toks.length) {
      // Nothing typed yet: offer the pages as quick links.
      shown = entries.filter(function (e) { return e.type === 'page'; });
      html = '<div class="ss-group">Quick links</div>' + shown.map(function (e, i) { return itemHtml(e, i, []); }).join('');
    } else {
      shown = search(q);
      if (!shown.length) {
        html = '<div class="ss-empty"><b>No results for “' + esc(q.trim()) + '”</b>Try a restaurant, a checklist, a document, a person or a job title.</div>';
      } else {
        var lastType = '';
        shown.forEach(function (e, i) {
          if (e.type !== lastType) { html += '<div class="ss-group">' + TYPES[e.type].label + '</div>'; lastType = e.type; }
          html += itemHtml(e, i, toks);
        });
      }
    }
    html += '<div class="ss-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span><span><kbd>Esc</kbd> to close</span></div>';
    panel.innerHTML = html;
    open();
    if (shown.length && toks.length) setActive(0);
    else active = -1;
  }

  function go(e) { if (e && e.url) window.location.href = e.url; }

  var typing = null;
  function refresh() {
    render();
    // Announcements, jobs and allowed tools load the first time; update the list once they arrive.
    if (!dynamicLoaded) loadDynamic().then(function () { if (document.activeElement === input || !panel.hidden) render(); });
  }

  input.addEventListener('focus', function () { if (!entries.length) buildStatic(); refresh(); });
  input.addEventListener('click', function () { if (panel.hidden) refresh(); });
  input.addEventListener('input', function () { if (!entries.length) buildStatic(); clearTimeout(typing); typing = setTimeout(render, 60); if (!dynamicLoaded) loadDynamic().then(render); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); if (panel.hidden) refresh(); else setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (!panel.hidden) setActive(active - 1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      var pick = active >= 0 ? shown[active] : shown[0];
      if (pick) go(pick);
    } else if (e.key === 'Escape') {
      if (!panel.hidden) { e.preventDefault(); close(); } else input.blur();
    }
  });
  panel.addEventListener('mousemove', function (e) {
    var it = e.target.closest('.ss-item');
    if (it) { var n = +it.getAttribute('data-idx'); if (n !== active) setActive(n); }
  });
  panel.addEventListener('mousedown', function (e) { e.preventDefault(); /* keep focus in the box until the click lands */ });
  panel.addEventListener('click', function (e) {
    var it = e.target.closest('.ss-item');
    if (!it) return;
    e.preventDefault();
    go(shown[+it.getAttribute('data-idx')]);
  });
  document.addEventListener('mousedown', function (e) { if (!panel.hidden && e.target !== input && !panel.contains(e.target)) close(); });
  window.addEventListener('resize', function () { if (!panel.hidden) place(); });
  window.addEventListener('scroll', function () { if (!panel.hidden) place(); }, { passive: true });

  // "dashboard.html" or Ctrl/Cmd+K jumps to the search box from anywhere.
  document.addEventListener('keydown', function (e) {
    var t = e.target, typingInField = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); input.focus(); input.select(); }
    else if (e.key === 'dashboard.html' && !typingInField && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); input.focus(); }
  });

  buildStatic();
})();
