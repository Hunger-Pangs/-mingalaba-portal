/*
 * Shared job-postings data layer for job-openings.html and manage-job-postings.html.
 *
 * USE_BACKEND_JOBS = false  ->  postings live in this browser's localStorage, seeded with sample
 *                               roles. Nothing is shared between people; it is for standalone testing.
 * USE_BACKEND_JOBS = true   ->  postings come from the Django API (/api/jobs/) with the login session,
 *                               so everyone sees the same data and only people with the "manage jobs"
 *                               permission can add or change postings. Flip this to true together with
 *                               USE_BACKEND_AUTH and USE_BACKEND_ICONS when the backend is deployed and the
 *                               pages are served from the same origin as /api/.
 *
 * A posting looks like:
 *   { id, title, department, city, place, type, experience, openings, closingDate ('YYYY-MM-DD' or ''),
 *     summary, requirements: [string], applyTo (email or link), urgent (bool),
 *     status ('draft' | 'open' | 'closed'), postedAt ('YYYY-MM-DD' or '') }
 */
(function () {
  var USE_BACKEND_JOBS = false;
  var API_URL = '/api/jobs/';
  var LS_KEY = 'mingalaba.jobs.v1';

  // Department look (matches the rest of the portal). Unknown departments fall back to DEFAULT_DEPT.
  var DEPTS = {
    'Operations':      { icon: 'storefront',      color: '#8E281F', tint: '#FDF2F0', line: '#F4C5C0' },
    'Store':           { icon: 'restaurant_menu', color: '#A66E2E', tint: '#FEF8EB', line: '#F0DDB8' },
    'Finance & Sales': { icon: 'payments',        color: '#7A4B3A', tint: '#F6EEEA', line: '#E3CFC6' },
    'People & HR':     { icon: 'diversity_3',     color: '#6B4B5A', tint: '#F7F2FA', line: '#E2D5F0' }
  };
  var DEFAULT_DEPT = { icon: 'work', color: '#5B2C6F', tint: '#F7F2FA', line: '#E2D5F0' };
  var TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayIso() { return iso(new Date()); }
  function shift(days) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return iso(d); }

  /* ---- sample data (only used when USE_BACKEND_JOBS is false) ---- */
  function sampleJobs() {
    var A = 'careers@hungerpangs.example';
    // [title, dept, city, place, type, exp, openings, postedDaysAgo, closesInDays, urgent, summary, requirements]
    var rows = [
      ['Store Manager', 'Operations', 'Mumbai', 'Palladium Mall', 'Full-time', '5–8 yrs', 1, 2, 23, true,
        'Run daily operations of a flagship mall store: service quality, team, costs and compliance.',
        ['5+ years in restaurant or retail operations', 'Has led a team of 25 or more', 'Strong with P&L and audits']],
      ['Assistant Store Manager', 'Operations', 'Delhi NCR', 'Cyber Hub', 'Full-time', '3–5 yrs', 2, 6, 28, false,
        'Support the store manager on shifts, rosters, stock and guest complaints.',
        ['3+ years in a similar role', 'Comfortable with POS and inventory', 'Weekend availability']],
      ['Area Manager', 'Operations', 'Bengaluru', 'Four stores', 'Full-time', '8–10 yrs', 1, 12, 38, false,
        'Own results across four Bengaluru stores and coach the store managers.',
        ['8+ years, 3 in multi-store management', 'Track record of improving sales and audit scores', 'Willing to travel between stores']],
      ['Operations Analyst', 'Operations', 'Mumbai', 'Head Office', 'Full-time', '2–4 yrs', 1, 4, 26, false,
        'Turn store data into weekly reports and spot problems before they grow.',
        ['Strong Excel and reporting skills', 'SQL is a plus', 'Clear written communication']],
      ['Sous Chef', 'Store', 'Mumbai', 'Kala Ghoda', 'Full-time', '5–7 yrs', 1, 1, 18, true,
        'Second in command in the flagship kitchen. Guard recipe standards and kitchen hygiene.',
        ['5+ years in a fine-dining or Burmese kitchen', 'FSSAI hygiene certified', 'Can train commis chefs']],
      ['Commis Chef', 'Store', 'Multiple', 'Mumbai, Delhi NCR, Bengaluru', 'Full-time', '1–3 yrs', 6, 8, 39, false,
        'Prep, cook and plate to recipe cards under the sous chef. Learn the full Mingalaba menu.',
        ['Culinary diploma or 1+ year in a kitchen', 'Quick and tidy on the line', 'Open to rotating shifts']],
      ['Tea Room Host', 'Store', 'Mumbai', 'Kala Ghoda', 'Full-time', '1–2 yrs', 2, 3, 20, false,
        'Welcome guests to the Tea Room and guide them through the tea and dessert menu.',
        ['Warm, polished communication', 'Interest in tea and food', 'Fluent in English and Hindi']],
      ['Restaurant Captain', 'Store', 'Bengaluru', 'Indiranagar', 'Full-time', '3–4 yrs', 1, 9, 33, false,
        'Lead the floor during service, brief the team and handle guest feedback on the spot.',
        ['3+ years as captain or senior steward', 'Calm under pressure', 'Knows upselling and tea or wine service']],
      ['Weekend Service Associate', 'Store', 'Hyderabad', 'Knowledge City', 'Part-time', '0–1 yr', 4, 5, 24, false,
        'Serve tables on Saturdays and Sundays. A good first job for students and freshers.',
        ['No experience needed', 'Available Saturday and Sunday', 'Friendly and reliable']],
      ['Accounts Executive', 'Finance & Sales', 'Mumbai', 'Head Office', 'Full-time', '2–4 yrs', 1, 7, 30, false,
        'Handle store payables, petty cash reconciliation and month-end closing support.',
        ['B.Com or M.Com', 'Tally or similar', 'Attention to detail']],
      ['Regional Sales Analyst', 'Finance & Sales', 'Delhi NCR', 'Regional Office', 'Full-time', '3–5 yrs', 1, 14, 36, false,
        'Track sales against target for each store and suggest actions to the regional head.',
        ['Strong with dashboards and Excel', 'Understands retail or restaurant sales', 'Can present to leadership']],
      ['Procurement Executive', 'Finance & Sales', 'Mumbai', 'Head Office', 'Full-time', '3–5 yrs', 1, 10, 34, false,
        'Source ingredients and supplies, negotiate rates and keep every store stocked.',
        ['Food or FMCG procurement background', 'Good negotiator', 'Knows vendor compliance']],
      ['HR Business Partner', 'People & HR', 'Mumbai', 'Head Office', 'Full-time', '6–8 yrs', 1, 3, 28, false,
        'Be the HR point of contact for operations leaders across stores. Cover hiring, retention and employee relations.',
        ['6+ years in HR, ideally hospitality', 'Confident with labour law', 'Strong coaching skills']],
      ['Talent Acquisition Executive', 'People & HR', 'Mumbai', 'Head Office', 'Contract', '2–3 yrs', 2, 11, 38, false,
        'Run high-volume hiring for stores: sourcing, screening and scheduling interviews.',
        ['2+ years in volume hiring', 'Comfortable with job portals', 'Fast and organised']],
      ['Training Manager', 'People & HR', 'Kolkata', 'Regional Office', 'Full-time', '5–7 yrs', 1, 15, 41, false,
        'Build and run onboarding and skills training for store and kitchen teams.',
        ['5+ years in hospitality training', 'Experience creating modules', 'Willing to travel']]
    ];
    var jobs = rows.map(function (r, i) {
      return { id: i + 1, title: r[0], department: r[1], city: r[2], place: r[3], type: r[4], experience: r[5], openings: r[6],
        postedAt: shift(-r[7]), closingDate: shift(r[8]), urgent: r[9], summary: r[10], requirements: r[11], applyTo: A, status: 'open' };
    });
    // One draft and one closed posting so the management page shows every state.
    jobs.push({ id: 16, title: 'Pastry Chef', department: 'Store', city: 'Mumbai', place: 'Kala Ghoda', type: 'Full-time', experience: '4–6 yrs', openings: 1,
      postedAt: '', closingDate: shift(45), urgent: false, summary: 'Lead desserts for the Tea Room and seasonal menus.',
      requirements: ['4+ years in a pastry kitchen', 'Comfortable developing new recipes'], applyTo: A, status: 'draft' });
    jobs.push({ id: 17, title: 'Delivery Coordinator', department: 'Operations', city: 'Mumbai', place: 'Head Office', type: 'Contract', experience: '1–2 yrs', openings: 1,
      postedAt: shift(-30), closingDate: shift(-2), urgent: false, summary: 'Coordinate aggregator orders and rider handovers across stores.',
      requirements: ['1+ year in food delivery operations', 'Good with spreadsheets'], applyTo: A, status: 'closed' });
    return jobs;
  }

  /* ---- local (standalone) storage ---- */
  function readLocal() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) { var arr = JSON.parse(raw); if (Array.isArray(arr)) return arr; }
    } catch (e) { /* storage blocked or corrupt: fall through to sample data */ }
    var seed = sampleJobs();
    writeLocal(seed);
    return seed;
  }
  function writeLocal(arr) { try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch (e) { /* not persisted */ } }

  /* ---- backend ---- */
  function csrfToken() {
    var m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
  }
  function request(method, url, body) {
    var opts = { method: method, credentials: 'include', headers: { 'Accept': 'application/json' } };
    if (method !== 'GET') { opts.headers['Content-Type'] = 'application/json'; opts.headers['X-CSRFToken'] = csrfToken(); }
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(url, opts).then(function (res) {
      if (res.status === 401) { window.location.href = 'index.html'; return Promise.reject(new Error('Not signed in')); }
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) { var err = new Error(data.error || 'Request failed (' + res.status + ').'); err.status = res.status; err.fields = data.fields; throw err; }
        return data;
      });
    });
  }

  /* ---- public helpers ---- */
  function isLive(job) {
    return job.status === 'open' && (!job.closingDate || job.closingDate >= todayIso());
  }
  function stateOf(job) {
    if (job.status === 'draft') return 'draft';
    if (job.status === 'closed') return 'closed';
    return isLive(job) ? 'open' : 'expired';
  }
  function daysSince(isoDate) {
    if (!isoDate) return null;
    var a = new Date(isoDate + 'T00:00:00'), b = new Date(); b.setHours(0, 0, 0, 0);
    return Math.round((b - a) / 86400000);
  }
  function clean(job) {
    var reqs = job.requirements;
    if (typeof reqs === 'string') reqs = reqs.split(/\r?\n/);
    reqs = (reqs || []).map(function (s) { return String(s).trim(); }).filter(Boolean);
    return {
      id: job.id || null,
      title: String(job.title || '').trim(),
      department: String(job.department || '').trim(),
      city: String(job.city || '').trim(),
      place: String(job.place || '').trim(),
      type: String(job.type || 'Full-time'),
      experience: String(job.experience || '').trim(),
      openings: Math.max(1, parseInt(job.openings, 10) || 1),
      closingDate: job.closingDate || '',
      summary: String(job.summary || '').trim(),
      requirements: reqs,
      applyTo: String(job.applyTo || '').trim(),
      urgent: !!job.urgent,
      status: ['draft', 'open', 'closed'].indexOf(job.status) >= 0 ? job.status : 'draft',
      postedAt: job.postedAt || ''
    };
  }

  var JobsStore = {
    useBackend: USE_BACKEND_JOBS,
    DEPTS: DEPTS,
    TYPES: TYPES,
    deptStyle: function (name) { return DEPTS[name] || DEFAULT_DEPT; },
    isLive: isLive,
    stateOf: stateOf,
    daysSince: daysSince,
    todayIso: todayIso,

    /* Resolves { jobs, canManage, departments }.
       Backend: employees get open postings only; managers get everything. Standalone: everything, canManage is true. */
    load: function () {
      if (USE_BACKEND_JOBS) {
        return request('GET', API_URL).then(function (data) {
          return { jobs: (data.jobs || []).map(clean), canManage: !!data.canManage, departments: data.departments || Object.keys(DEPTS) };
        });
      }
      return Promise.resolve({ jobs: readLocal().map(clean), canManage: true, departments: Object.keys(DEPTS) });
    },

    /* Create (no id) or update (id). Resolves the saved posting. Rejects with a readable message. */
    save: function (input) {
      var job = clean(input);
      if (USE_BACKEND_JOBS) {
        return job.id ? request('PUT', API_URL + job.id + '/', job).then(clean) : request('POST', API_URL, job).then(clean);
      }
      var all = readLocal();
      if (job.status === 'open' && !job.postedAt) job.postedAt = todayIso();
      if (job.id) {
        var i = all.findIndex(function (j) { return j.id === job.id; });
        if (i < 0) return Promise.reject(new Error('That posting no longer exists.'));
        all[i] = job;
      } else {
        job.id = all.reduce(function (m, j) { return Math.max(m, j.id); }, 0) + 1;
        all.push(job);
      }
      writeLocal(all);
      return Promise.resolve(clean(job));
    },

    remove: function (id) {
      if (USE_BACKEND_JOBS) return request('DELETE', API_URL + id + '/');
      writeLocal(readLocal().filter(function (j) { return j.id !== id; }));
      return Promise.resolve({ success: true });
    },

    /* Local-only helper for testing: put the sample postings back. */
    resetSample: function () { writeLocal(sampleJobs()); }
  };

  window.JobsStore = JobsStore;
})();
