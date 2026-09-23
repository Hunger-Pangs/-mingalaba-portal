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
 *   - Documents ............. the Company Information document tree
 *   - Restaurants & people .. the 23 restaurants and their general managers
 * Picking a result opens the right page and, where the page supports it, jumps to the item
 * (?ann=<id> opens the notice, #job-<id> selects the role, ?tool=<name> highlights the checklist,
 * ?q=<text> filters the restaurant list or the document tree).
 *
 * Keeping it current: the restaurant, document and tool lists below are copies of what is on those pages.
 * When a restaurant, document or checklist is added or renamed on its page, update the list here too.
 * Announcements and job openings are always read live from their own data files.
 *
 * USE_BACKEND_SEARCH = false -> checklist tools come from the built-in list below.
 * USE_BACKEND_SEARCH = true  -> checklist tools come from /api/checklist-icons/, so people only find the tools they
 *                               are allowed to see. Flip it together with USE_BACKEND_AUTH / USE_BACKEND_ICONS /
 *                               USE_BACKEND_JOBS / USE_BACKEND_ANNOUNCEMENTS when the backend is deployed.
 */
(function () {
  var USE_BACKEND_SEARCH = false;

  var input = document.getElementById('siteSearch');
  if (!input) return;

  /* ------------------------------------------------------------------ */
  /* Static content                                                      */
  /* ------------------------------------------------------------------ */
  // Dashboard icon order: Knowledge Center, Job Openings, Announcements, Sales, Quick Links, Log Book.
  var PAGES = [
    ['Dashboard', 'dashboard.html', 'Home', 'home overview shortcuts', 'dashboard'],
    ['Knowledge Center', 'knowledge-center.html', 'SOP/Policies, restaurants, menu, forms, music, compliance', 'hub sop policies restaurant menu forms music compliance knowledge base', 'hub'],
    ['SOP / Policies', 'sop-policies.html', 'Pick a department to open the repository', 'sop policies department operations store finance sales hr knowledge center', 'policy'],
    ['Statutory Documents', 'company-info-directory.html', 'Statutory documents and policies', 'company information statutory documents licences licenses repository files sops policies vault sop knowledge center', 'description'],
    // The other Knowledge Center tiles have no page of their own yet -- they just take you to the hub.
    ['Menu Items & Allergens', 'https://app.notion.com/p/Burma-Burma-Kitchen-Guide-3641c5ec80c98067ad66fe1323b5cc79', 'Opens in a new tab (Notion)', 'menu details items allergens ingredients kitchen guide notion knowledge center', 'restaurant_menu'],
    ['Forms', 'forms.html', 'Pick a department to open the forms library', 'forms department operations store finance sales hr knowledge center', 'assignment'],
    ['Company Forms', 'company-forms-directory.html', 'HR, operations, finance & store forms', 'company forms library hr operations finance store templates knowledge center', 'assignment'],
    ['Music', 'music-player.html', 'Play the restaurant ambience playlist', 'music player playlist ambience songs tracks knowledge center', 'music_note'],
    ['Compliance Dashboard', 'https://hungerpangs-hr-compliance.streamlit.app/', 'Opens in a new tab (Streamlit)', 'compliance dashboard hr streamlit knowledge center', 'verified'],
    ['Job Openings', 'job-openings.html', 'Open positions by department', 'jobs careers hiring vacancies recruitment positions apply', 'badge'],
    ['Announcements', 'announcements.html', 'Notice board', 'notices news updates circulars board', 'campaign'],
    ['Sales', 'sales.html', 'Store targets and the sales dashboard', 'sales dashboard revenue', 'monitoring'],
    ['Store Targets', 'sales.html#targets', 'Month-to-date sales against target', 'sales target achievement performance cities stores revenue', 'track_changes'],
    ['Log Book', 'task-checklist.html', 'Checklists for your department', 'tasks checklists registers daily opening closing hygiene task checklist', 'checklist'],
    // Not on the dashboard grid right now -- reached via the Knowledge Center hub instead -- but still reachable by name.
    ['Restaurant Details', 'restaurant-details-directory.html', 'All 23 restaurants', 'restaurants stores outlets directory locations managers addresses quick links', 'storefront']
  ];
  var MANAGE_PAGES = {
    jobs: ['Manage Job Postings', 'manage-job-postings.html', 'Add, edit or close job postings', 'post new job posting hiring hr manage vacancies', 'edit_note'],
    announcements: ['Manage Announcements', 'manage-announcements.html', 'Post or edit announcements', 'post new announcement notice publish pin archive manage', 'edit_note']
  };

  // [name, department]
  // The Log Book page now only shows the Store checklists (departments and
  // the rest of the icons were removed from task-checklist.html).
  var TOOLS = [
    ['Food Safety Temperature Log', 'Store'], ['Tips Register', 'Store'], ['Aggregators Order Register', 'Store'],
    ['Uniform Register', 'Store'], ['Spoilage Register', 'Store'], ['Lost and Found Register', 'Store'], ['Pest Control Register', 'Store'],
    ['Shift Handover Register', 'Store'], ['Banking Slip', 'Store']
  ];

  // [document, folder, sub-folder]
  var DOCS = [
    ['Certificate of Incorporation & CIN Master.pdf', '01 Corporate & Governance', '1.1 Incorporation & Charters'],
    ['Memorandum & Articles of Association.pdf', '01 Corporate & Governance', '1.1 Incorporation & Charters'],
    ['Registered Office Proof & Municipal Khata.pdf', '01 Corporate & Governance', '1.2 Proof of Office & Premises'],
    ['Board Resolution - Corporate Office.pdf', '01 Corporate & Governance', '1.2 Proof of Office & Premises'],
    ['FSSAI Central License 2024-2029.pdf', '02 Statutory Licenses & Food Safety', '2.1 FSSAI & Food Standards'],
    ['Fire Safety Compliance NOC Mum-HQ.pdf', '02 Statutory Licenses & Food Safety', '2.2 Safety & Fire Approvals'],
    ['State Excise FL-III Hospitality Permit.pdf', '02 Statutory Licenses & Food Safety', '2.3 Excise & Hospitality'],
    ['Staff Code of Conduct & POSH Policy.pdf', '03 HR & Workforce Policies', '3.1 Employee Handbooks & POSH'],
    ['Internal Complaints Committee Charter.docx', '03 HR & Workforce Policies', '3.1 Employee Handbooks & POSH'],
    ['Cloud Kitchen HACCP Sanitation SOP.pdf', '04 Operations & SOPs', '4.1 Kitchen & Hygiene SOPs'],
    ['Oil Recycling & Wet Waste Log 2024.pdf', '04 Operations & SOPs', '4.1 Kitchen & Hygiene SOPs'],
    ['GST Registration Certificate (REG-06).pdf', '05 Financial & Tax Filings', '5.1 GST & Annual MCA Filings']
  ];

  // [form, folder, sub-folder]
  var FORM_DOCS = [
    ['Leave Application Form.pdf', '01 HR & Workforce Forms', '1.1 Leave & Attendance'],
    ['Attendance Regularisation Form.docx', '01 HR & Workforce Forms', '1.1 Leave & Attendance'],
    ['New Joinee Information Form.pdf', '01 HR & Workforce Forms', '1.2 Onboarding & Exit'],
    ['Exit Clearance Form.pdf', '01 HR & Workforce Forms', '1.2 Onboarding & Exit'],
    ['Incident Report Form.pdf', '02 Operations & Store Forms', '2.1 Incident & Safety'],
    ['Maintenance Request Form.pdf', '02 Operations & Store Forms', '2.2 Maintenance & Facilities'],
    ['Equipment Breakdown Log.docx', '02 Operations & Store Forms', '2.2 Maintenance & Facilities'],
    ['Purchase Requisition Form.pdf', '03 Finance & Procurement Forms', '3.1 Purchase & Reimbursement'],
    ['Petty Cash Reimbursement Form.pdf', '03 Finance & Procurement Forms', '3.1 Purchase & Reimbursement'],
    ['Visitor Pass Request Form.pdf', '04 Administrative Forms', '4.1 Visitor & Asset Management'],
    ['Asset Issue & Return Form.pdf', '04 Administrative Forms', '4.1 Visitor & Asset Management']
  ];

  // [code, name, locality, city, general manager, phone, email]
  var STORES = [
    ['BB-MUM-001', 'Burma Burma Restaurant & Tea Room', 'Fort, Kala Ghoda', 'Mumbai', 'Rajesh Sharma', '+91 22 4003 6600', 'fort.mumbai@burmaburma.in'],
    ['BB-MUM-002', 'Burma Burma - Santacruz West', 'Santacruz West', 'Mumbai', 'Kunal Mehra', '+91 22 4003 7711', 'santacruz@burmaburma.in'],
    ['BB-MUM-003', 'Burma Burma - Palladium Mall', 'Lower Parel', 'Mumbai', 'Siddharth Nair', '+91 22 4003 8844', 'palladium.mum@burmaburma.in'],
    ['BB-MUM-004', 'Burma Burma - Inorbit Mall Malad', 'Malad West', 'Mumbai', 'Varun Shetty', '+91 22 4003 9922', 'malad.mum@burmaburma.in'],
    ['BB-MUM-005', 'Burma Burma - Oberoi Mall', 'Goregaon East', 'Mumbai', 'Rohit Sawant', '+91 22 4003 5511', 'goregaon@burmaburma.in'],
    ['BB-DEL-001', 'Burma Burma - Cyber Hub', 'DLF Cyber Hub', 'Delhi NCR', 'Amitava Roy', '+91 124 437 2999', 'cyberhub@burmaburma.in'],
    ['BB-DEL-002', 'Burma Burma - Select CITYWALK', 'Saket', 'Delhi NCR', 'Neha Kapoor', '+91 11 4914 5807', 'saket.del@burmaburma.in'],
    ['BB-DEL-003', 'Burma Burma - Mall of India', 'Sector 18', 'Delhi NCR', 'Prateek Mathur', '+91 120 622 9410', 'noida.del@burmaburma.in'],
    ['BB-DEL-004', 'Burma Burma - Khan Market', 'Khan Market', 'Delhi NCR', 'Raman Bhalla', '+91 11 4160 5514', 'khanmarket@burmaburma.in'],
    ['BB-BLR-001', 'Burma Burma - Indiranagar', '100 Feet Road', 'Bengaluru', 'Karthik R.', '+91 80 4300 8120', 'indiranagar@burmaburma.in'],
    ['BB-BLR-002', 'Burma Burma - Forum Rex Walk', 'Brigade Road', 'Bengaluru', 'Suresh Menon', '+91 80 4300 9500', 'rexwalk.blr@burmaburma.in'],
    ['BB-BLR-003', 'Burma Burma - Phoenix Mall of Asia', 'Hebbal', 'Bengaluru', 'Anand Swamy', '+91 80 4300 7811', 'mallofasia@burmaburma.in'],
    ['BB-BLR-004', 'Burma Burma - Whitefield', 'VR Bengaluru', 'Bengaluru', 'Deepak Gowda', '+91 80 4300 6622', 'whitefield@burmaburma.in'],
    ['BB-CCU-001', 'Burma Burma - Park Street', 'Park Street', 'Kolkata', 'Subhasish Das', '+91 33 4008 2001', 'parkstreet@burmaburma.in'],
    ['BB-CCU-002', 'Burma Burma - Quest Mall', 'Ballygunge', 'Kolkata', 'Debolina Sen', '+91 33 4008 3400', 'quest.ccu@burmaburma.in'],
    ['BB-CCU-003', 'Burma Burma - Salt Lake Sector V', 'Salt Lake', 'Kolkata', 'Arup Mukherjee', '+91 33 4008 5522', 'saltlake.ccu@burmaburma.in'],
    ['BB-HYD-001', 'Burma Burma - Knowledge City', 'Hitec City / Madhapur', 'Hyderabad', 'M. Venkat Reddy', '+91 40 4859 2200', 'knowledgecity@burmaburma.in'],
    ['BB-HYD-002', 'Burma Burma - Jubilee Hills', 'Road No. 36', 'Hyderabad', 'Gautam Rao', '+91 40 4859 4410', 'jubileehills@burmaburma.in'],
    ['BB-AMD-001', 'Burma Burma - Palladium Ahmedabad', 'Thaltej', 'Ahmedabad', 'Bhavin Patel', '+91 79 4912 6001', 'ahmedabad@burmaburma.in'],
    ['BB-PUN-001', 'Burma Burma - The Mills', 'Bund Garden Road', 'Pune', 'Sameer Joshi', '+91 20 4860 8820', 'pune@burmaburma.in'],
    ['BB-IXC-001', 'Burma Burma - Nexus Elante Mall', 'Industrial Area Phase I', 'Chandigarh', 'Harpreet Singh', '+91 172 405 7710', 'chandigarh@burmaburma.in'],
    ['BB-MAA-001', 'Burma Burma - Express Avenue', 'Royapettah', 'Chennai', 'R. Muralidharan', '+91 44 4801 3320', 'chennai@burmaburma.in'],
    ['BB-JAI-001', 'Burma Burma - C-Scheme', 'C-Scheme', 'Jaipur', 'Vikram Rathore', '+91 141 409 5500', 'jaipur@burmaburma.in'],
  ];

  /* ------------------------------------------------------------------ */
  /* Types                                                               */
  /* ------------------------------------------------------------------ */
  var TYPES = {
    page:         { label: 'Pages',                color: '#5b1614', order: 0 },
    announcement: { label: 'Announcements',        color: '#5B2C6F', order: 1 },
    job:          { label: 'Job openings',         color: '#B45309', order: 2 },
    tool:         { label: 'Tasks & checklists',   color: '#8E281F', order: 3 },
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
    PAGES.forEach(function (p) { add('page', p[0], p[2], p[1], p[4], p[3]); });
    if (!USE_BACKEND_SEARCH) {
      TOOLS.forEach(function (t) { add('tool', t[0], t[1] + ' · Log Book', 'task-checklist.html?tool=' + encodeURIComponent(t[0]), 'checklist', t[1]); });
    }
    DOCS.forEach(function (d) { add('doc', d[0], d[1] + ' › ' + d[2], 'company-info-directory.html?q=' + encodeURIComponent(d[0]), 'description', d[1] + ' ' + d[2]); });
    FORM_DOCS.forEach(function (d) { add('doc', d[0], d[1] + ' › ' + d[2], 'company-forms-directory.html?q=' + encodeURIComponent(d[0]), 'assignment', d[1] + ' ' + d[2]); });
    STORES.forEach(function (s) {
      add('store', s[1], s[0] + ' · ' + s[2] + ', ' + s[3], 'restaurant-details-directory.html?q=' + encodeURIComponent(s[0]), 'storefront', s[0] + ' ' + s[2] + ' ' + s[3] + ' ' + s[5] + ' ' + s[6]);
      add('person', s[4], 'General Manager · ' + s[1].replace(/^Burma Burma\s*[-–]?\s*/i, '') + ', ' + s[3], 'restaurant-details-directory.html?q=' + encodeURIComponent(s[4]), 'person', 'general manager gm ' + s[0] + ' ' + s[3] + ' ' + s[5] + ' ' + s[6]);
    });
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
      return (window.AnnouncementsStore ? Promise.resolve(true) : loadScript('announcements-data.js')).then(function (ok) {
        if (!ok || !window.AnnouncementsStore) return;
        return window.AnnouncementsStore.load().then(function (data) {
          manage.announcements = !!data.canManage;
          data.announcements.filter(window.AnnouncementsStore.isVisible).forEach(function (a) {
            add('announcement', a.title, a.category + ' · ' + a.audience + (a.date ? ' · ' + fmtDay(a.date) : ''),
              'announcements.html?ann=' + a.id, 'campaign', [a.category, a.audience, a.author, a.body, a.action].join(' '));
          });
        });
      }).catch(function () { /* announcements just won't be searchable */ });
    }
    function jobs() {
      return (window.JobsStore ? Promise.resolve(true) : loadScript('jobs-data.js')).then(function (ok) {
        if (!ok || !window.JobsStore) return;
        return window.JobsStore.load().then(function (data) {
          manage.jobs = !!data.canManage;
          data.jobs.filter(window.JobsStore.isLive).forEach(function (j) {
            add('job', j.title, j.department + ' · ' + j.city + (j.place ? ' · ' + j.place : '') + ' · ' + j.type, 'job-openings.html#job-' + j.id, 'badge',
              [j.department, j.city, j.place, j.type, j.experience, j.summary, j.requirements.join(' ')].join(' '));
          });
        });
      }).catch(function () { /* job openings just won't be searchable */ });
    }
    function tools() {
      if (!USE_BACKEND_SEARCH) return Promise.resolve();
      return fetch('/api/checklist-icons/', { credentials: 'include' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
        if (!data) return;
        data.icons.forEach(function (t) { add('tool', t.name, t.department + ' · Log Book', 'task-checklist.html?tool=' + encodeURIComponent(t.name), 'checklist', t.department); });
      }).catch(function () { /* tools just won't be searchable */ });
    }

    dynamicLoading = Promise.all([announcements(), jobs(), tools()]).then(function () {
      if (manage.jobs) add('page', MANAGE_PAGES.jobs[0], MANAGE_PAGES.jobs[2], MANAGE_PAGES.jobs[1], MANAGE_PAGES.jobs[4], MANAGE_PAGES.jobs[3]);
      if (manage.announcements) add('page', MANAGE_PAGES.announcements[0], MANAGE_PAGES.announcements[2], MANAGE_PAGES.announcements[1], MANAGE_PAGES.announcements[4], MANAGE_PAGES.announcements[3]);
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

  // Pages that intentionally open in their own tab even though they're part
  // of this site (e.g. a music player that should keep playing while you
  // browse elsewhere), same treatment as a true external link.
  var NEW_TAB_PAGES = ['music-player.html'];

  function go(e) {
    if (!e || !e.url) return;
    if (/^https?:\/\//i.test(e.url) || NEW_TAB_PAGES.indexOf(e.url) !== -1) window.open(e.url, '_blank', 'noopener');
    else window.location.href = e.url;
  }

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

  // "/" or Ctrl/Cmd+K jumps to the search box from anywhere.
  document.addEventListener('keydown', function (e) {
    var t = e.target, typingInField = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); input.focus(); input.select(); }
    else if (e.key === '/' && !typingInField && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); input.focus(); }
  });

  buildStatic();
})();
