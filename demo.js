/* Demo mode: this folder is a frozen copy of the Mingalaba Portal front end.
   Every page is plain HTML. Data comes from the sample files in /data and nothing is saved. */
(function () {
  var APIS = {"/api/search/index/": "data/api-search-index.json", "/api/notifications/": "data/api-notifications.json", "/music/tracks/": "data/music-tracks.json", "/api/jobs/": "data/api-jobs.json", "/api/announcements/": "data/api-announcements.json", "/api/my-store/": "data/api-my-store.json", "/api/tips/": "data/api-tips.json", "/api/aggregator-orders/": "data/api-aggregator-orders.json", "/api/spoilage/": "data/api-spoilage.json", "/api/uniforms/": "data/api-uniforms.json", "/api/lost-found/": "data/api-lost-found.json", "/api/lost-found/pending/": "data/api-lost-found-pending.json", "/api/pest-control/": "data/api-pest-control.json", "/api/shift-handover/": "data/api-shift-handover.json", "/api/banking-slips/": "data/api-banking-slips.json", "/api/outlets/detail/": "data/api-outlets-detail.json", "/api/outlets/detail/1001": "data/api-outlets-detail-1001.json", "/api/outlets/detail/1004": "data/api-outlets-detail-1004.json", "/api/outlets/detail/1005": "data/api-outlets-detail-1005.json", "/api/outlets/detail/1007": "data/api-outlets-detail-1007.json", "/api/outlets/detail/1010": "data/api-outlets-detail-1010.json", "/api/outlets/detail/1012": "data/api-outlets-detail-1012.json", "/api/outlets/detail/1020": "data/api-outlets-detail-1020.json"};
  var script = document.currentScript;
  var rootUrl = new URL('.', script.src);
  var base = rootUrl.pathname;
  function keyOf(u) {
    var x;
    try { x = new URL(u, location.href); } catch (e) { return null; }
    if (x.origin !== location.origin) return null;
    var p = x.pathname;
    if (base !== '/' && p.indexOf(base) === 0) p = '/' + p.slice(base.length);
    return { path: p, search: x.search };
  }
  function toast(msg) {
    var t = document.getElementById('demo-toast');
    if (!t) {
      t = document.createElement('div'); t.id = 'demo-toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#5b1614;color:#fff;padding:12px 20px;border-radius:999px;font:600 13px system-ui,sans-serif;z-index:99999;box-shadow:0 8px 24px #0004;opacity:0;transition:opacity .2s;max-width:90vw;text-align:center';
      document.body.appendChild(t);
    }
    t.textContent = msg; t.style.opacity = '1';
    clearTimeout(t._h); t._h = setTimeout(function () { t.style.opacity = '0'; }, 2800);
  }
  window.demoToast = toast;
  var realFetch = window.fetch.bind(window);
  function json(obj, status) {
    return Promise.resolve(new Response(JSON.stringify(obj), { status: status || 200, headers: { 'Content-Type': 'application/json' } }));
  }
  window.fetch = function (input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var method = ((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    var k = keyOf(url);
    if (!k) return realFetch(input, init);
    if (k.path.indexOf('/static/') === 0 || k.path.indexOf('/data/') === 0 || /\.(js|css|json|pdf|xlsx|html)$/.test(k.path)) {
      return realFetch(new URL(k.path.replace(/^\//, ''), rootUrl).href, init);
    }
    if (k.path === '/api/login/') return json({ success: true, redirect: 'dashboard.html' });
    if (method !== 'GET') { toast('Demo only: nothing is saved'); return json({ ok: true, success: true, demo: true }); }
    if (/\/export\/?$/.test(k.path) || k.path.indexOf('/download') >= 0) { toast('Downloads are switched off in the demo'); return json({ error: 'demo' }, 404); }
    if (k.path === '/api/outlets/detail/') {
      var code = new URLSearchParams(k.search).get('code');
      var f = APIS['/api/outlets/detail/' + code];
      if (f) return realFetch(new URL(f, rootUrl).href);
    }
    var file = APIS[k.path];
    if (file) return realFetch(new URL(file, rootUrl).href);
    return json({});
  };
  document.addEventListener('submit', function (e) {
    if (e.defaultPrevented) return;          // the page handles this form itself
    e.preventDefault(); toast('Demo only: nothing is saved');
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-demo-off]');
    if (a) { e.preventDefault(); toast('Not available in the demo'); }
  }, true);
  document.addEventListener('DOMContentLoaded', function () {
    var b = document.createElement('a');
    b.href = new URL('index.html', rootUrl).href;
    b.textContent = 'DEMO · sample data · all pages';
    b.style.cssText = 'position:fixed;left:12px;bottom:12px;background:#c2410c;color:#fff;padding:7px 14px;border-radius:999px;font:700 11px system-ui,sans-serif;z-index:99998;text-decoration:none;box-shadow:0 4px 14px #0003';
    document.body.appendChild(b);
  });
})();
