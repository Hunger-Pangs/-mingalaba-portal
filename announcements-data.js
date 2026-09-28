/*
 * Shared announcements data layer for announcements.html (the notice board) and
 * manage-announcements.html (where announcements are posted).
 *
 * USE_BACKEND_ANNOUNCEMENTS = false -> announcements live in this browser's localStorage, seeded with
 *                                      sample notices. Nothing is shared between people; standalone testing only.
 * USE_BACKEND_ANNOUNCEMENTS = true  -> announcements come from the Django API (/api/announcements/) with the
 *                                      login session, so everyone sees the same notices and only people with the
 *                                      "manage announcements" permission can post. Flip this to true together
 *                                      with USE_BACKEND_AUTH, USE_BACKEND_ICONS and USE_BACKEND_JOBS when the
 *                                      backend is deployed and the pages are served from the same origin as /api/.
 *
 * An announcement looks like:
 *   { id, title, category, body, audience, author, pinned, important,
 *     action (text, optional), dueDate ('YYYY-MM-DD' or ''),
 *     status ('draft' | 'published' | 'archived'), date (the day it was published, 'YYYY-MM-DD' or ''),
 *     expiresOn ('YYYY-MM-DD' or '' -- hidden from the board after this day) }
 */
(function () {
  var USE_BACKEND_ANNOUNCEMENTS = false;
  var API_URL = '/api/announcements/';
  var LS_KEY = 'mingalaba.announcements.v1';

  // color = pin / icon / label, paper = note background, fold = shade of the folded corner.
  var CATS = {
    'Operations':     { icon: 'storefront',      color: '#8E281F', paper: '#FCE9E5', fold: '#e8c4bd' },
    'Menu & Kitchen': { icon: 'restaurant_menu', color: '#A66E2E', paper: '#FBEFD0', fold: '#e6d19a' },
    'Compliance':     { icon: 'policy',          color: '#2D5A27', paper: '#E6F1E3', fold: '#bcd6b6' },
    'Finance':        { icon: 'payments',        color: '#7A4B3A', paper: '#F3E6DE', fold: '#d8bfb1' },
    'HR & People':    { icon: 'badge',           color: '#6B4B5A', paper: '#F1E8F7', fold: '#d4bfe2' }
  };

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function todayIso() { return iso(new Date()); }
  function shift(days) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + days); return iso(d); }

  /* ---- sample data (only used when USE_BACKEND_ANNOUNCEMENTS is false) ---- */
  function sampleAnnouncements() {
    // [title, category, pinned, important, postedDaysAgo, author, audience, body, action, dueInDays]
    var rows = [
      ['FSSAI licence renewal: submit documents this month', 'Compliance', true, true, 1, 'Compliance Team', 'All stores',
        'The central FSSAI licence is due for renewal. Every store manager needs to upload the current Form B licence copy, the last four quarters of hygiene audit reports and the water test certificate to the Company Information repository by the due date. Stores that miss the date will be flagged in the next compliance review.',
        'Upload the licence copy, four quarterly audit reports and the water test certificate.', 8],
      ['Public holiday: store timings and staffing', 'Operations', true, false, 0, 'Operations Head', 'All stores',
        'All stores stay open on the holiday with the standard holiday roster. Head Office is closed. Store managers should confirm their shift plan with the area manager and make sure at least one certified food-safety supervisor is on each shift.',
        'Confirm your shift plan with your area manager.', 3],
      ['Seasonal menu refresh goes live next week', 'Menu & Kitchen', false, true, 2, 'Culinary Team', 'All stores',
        'The refreshed seasonal menu, including the revised Khow Suey and two new tea-room desserts, launches next week. Recipe cards and plating guides are in the Menu section. Kitchen leads must complete the tasting session with their area chef before launch, and old menu inserts should be retired the evening before.',
        'Complete the tasting session with your area chef before launch.', 6],
      ['Q1 performance review cycle is open', 'HR & People', false, false, 3, 'People Team', 'All employees',
        'Self-assessments are open for two weeks. Managers then have another two weeks to finish reviews and hold one-to-one conversations. Ratings are entered in PMS, which you can reach from the Log Book page under People & HR.',
        'Submit your self-assessment in PMS.', 12],
      ['Petty cash audit checklist is now weekly', 'Finance', false, false, 12, 'Finance Team', 'Store managers',
        'From this week, the petty cash audit checklist must be completed every week instead of every month. Attach the banking slip photo and the closing balance. The Log Book page has the link under Finance & Sales.',
        'Start the weekly checklist this week.', null],
      ['Aggregator order register: new fields from next month', 'Operations', false, false, 14, 'Operations Team', 'Store managers',
        'The aggregator order register will ask for the platform order ID, packing time and any refund reason from the start of next month. This helps us match complaints and refunds to the right shift. Existing entries are not affected and no back-filling is needed.',
        'Review the new register fields before the change.', 16],
      ['Medical check-up mandatory for kitchen staff', 'HR & People', false, true, 20, 'People Team', 'Kitchen & service staff',
        'All kitchen and service staff need their annual medical check-up on file. Book a slot through your store manager. Reports are uploaded to the Medical Checkup Tracker. Staff without a valid report cannot be rostered for food-handling duties after the deadline.',
        'Book a check-up slot with your store manager.', 25],
      ['Tea Room: revised plating SOP', 'Menu & Kitchen', false, false, 25, 'Culinary Team', 'Mumbai and Delhi NCR stores',
        'The tea-room plating SOP has been updated with new garnish standards and portion weights. Photos of each plated item are in the SOP folder. Area chefs will spot-check plating during their next visit.',
        '', null]
    ];
    var list = rows.map(function (r, i) {
      return { id: i + 1, title: r[0], category: r[1], pinned: r[2], important: r[3], date: shift(-r[4]), author: r[5], audience: r[6],
        body: r[7], action: r[8], dueDate: r[9] === null ? '' : shift(r[9]), status: 'published', expiresOn: '' };
    });
    // A draft and an archived notice so the management page shows every state.
    list.push({ id: 9, title: 'Uniform change: new aprons from next quarter', category: 'Operations', pinned: false, important: false, date: '',
      author: 'Operations Team', audience: 'All stores', body: 'New aprons arrive next quarter. Details on sizes and ordering will follow.', action: '', dueDate: '', status: 'draft', expiresOn: '' });
    list.push({ id: 10, title: 'Festive gifting policy reminder', category: 'Finance', pinned: false, important: false, date: shift(-60),
      author: 'Finance Team', audience: 'Store managers', body: 'Gifts to vendors and guests need prior approval and an entry in the gifting register.', action: '', dueDate: '', status: 'archived', expiresOn: '' });
    return list;
  }

  /* ---- local (standalone) storage ---- */
  function readLocal() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) { var arr = JSON.parse(raw); if (Array.isArray(arr)) return arr; }
    } catch (e) { /* storage blocked or corrupt: fall through to sample data */ }
    var seed = sampleAnnouncements();
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

  /* ---- helpers ---- */
  function isVisible(a) {
    return a.status === 'published' && (!a.expiresOn || a.expiresOn >= todayIso());
  }
  function stateOf(a) {
    if (a.status === 'draft') return 'draft';
    if (a.status === 'archived') return 'archived';
    return isVisible(a) ? 'published' : 'expired';
  }
  function clean(a) {
    return {
      id: a.id || null,
      title: String(a.title || '').trim(),
      category: CATS[a.category] ? a.category : String(a.category || '').trim(),
      body: String(a.body || '').trim(),
      audience: String(a.audience || '').trim() || 'All employees',
      author: String(a.author || '').trim(),
      pinned: !!a.pinned,
      important: !!a.important,
      action: String(a.action || '').trim(),
      dueDate: a.dueDate || '',
      status: ['draft', 'published', 'archived'].indexOf(a.status) >= 0 ? a.status : 'draft',
      date: a.date || '',
      expiresOn: a.expiresOn || ''
    };
  }

  var AnnouncementsStore = {
    useBackend: USE_BACKEND_ANNOUNCEMENTS,
    CATS: CATS,
    isVisible: isVisible,
    stateOf: stateOf,
    todayIso: todayIso,

    /* Resolves { announcements, canManage }.
       Backend: employees get published, not-expired notices; managers get everything.
       Standalone: everything, canManage is true. */
    load: function () {
      if (USE_BACKEND_ANNOUNCEMENTS) {
        return request('GET', API_URL).then(function (data) {
          return { announcements: (data.announcements || []).map(clean), canManage: !!data.canManage };
        });
      }
      return Promise.resolve({ announcements: readLocal().map(clean), canManage: true });
    },

    /* Create (no id) or update (id). Resolves the saved announcement. Rejects with a readable message. */
    save: function (input) {
      var a = clean(input);
      if (USE_BACKEND_ANNOUNCEMENTS) {
        return a.id ? request('PUT', API_URL + a.id + '/', a).then(clean) : request('POST', API_URL, a).then(clean);
      }
      var all = readLocal();
      if (a.status === 'published' && !a.date) a.date = todayIso();
      if (a.id) {
        var i = all.findIndex(function (x) { return x.id === a.id; });
        if (i < 0) return Promise.reject(new Error('That announcement no longer exists.'));
        all[i] = a;
      } else {
        a.id = all.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1;
        all.push(a);
      }
      writeLocal(all);
      return Promise.resolve(clean(a));
    },

    remove: function (id) {
      if (USE_BACKEND_ANNOUNCEMENTS) return request('DELETE', API_URL + id + '/');
      writeLocal(readLocal().filter(function (x) { return x.id !== id; }));
      return Promise.resolve({ success: true });
    },

    /* Local-only helper for testing: put the sample announcements back. */
    resetSample: function () { writeLocal(sampleAnnouncements()); }
  };

  window.AnnouncementsStore = AnnouncementsStore;
})();
