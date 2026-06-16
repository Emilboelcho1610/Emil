/* -----------------------------------------------------------------
   App-bootstrap + Router + app-skal (sidebar).
   ----------------------------------------------------------------- */
window.Router = (function () {
  const app = () => document.getElementById('app');
  let history = [];
  let currentRoute = null;

  const SECTIONS = [
    { id: 'home',   icon: '🏠', label: 'Forside' },
    { id: 'live',   icon: '📺', label: 'Live TV' },
    { id: 'movies', icon: '🎬', label: 'Film' },
    { id: 'series', icon: '📚', label: 'Serier' },
    { id: 'search', icon: '🔍', label: 'Søg' },
    { id: 'settings', icon: '⚙️', label: 'Indstillinger' },
  ];

  // Bygger sidebar + tomt indholdsområde. Returnerer { shell, content }.
  function shell(active) {
    const shellEl = U.el('<div class="shell"></div>');
    const side = U.el('<div class="sidebar"></div>');
    side.appendChild(U.el(`<div class="logo">▶</div>`));
    SECTIONS.forEach(s => {
      const item = U.el(`<div class="nav-item focusable ${s.id === active ? 'active' : ''}" data-route="${s.id}">
        <span class="icon">${s.icon}</span><span class="label">${s.label}</span></div>`);
      item.addEventListener('click', () => go(s.id));
      item.addEventListener('mouseenter', () => side.classList.add('expanded'));
      side.appendChild(item);
    });
    // Udvid sidebar når et nav-element får fokus
    side.addEventListener('focusin', () => side.classList.add('expanded'));

    const content = U.el('<div class="content"><div class="content-inner" id="content-inner"></div></div>');
    shellEl.appendChild(side);
    shellEl.appendChild(content);
    return { shell: shellEl, content: content.querySelector('#content-inner') };
  }

  // Hjælper til sidebar-adfærd: vis labels når man er i menuen, skjul i indhold
  function wireSidebar(shellEl) {
    const side = shellEl.querySelector('.sidebar');
    Nav.onFocus((el) => {
      if (side.contains(el)) side.classList.add('expanded');
      else side.classList.remove('expanded');
    });
  }

  const ROUTES = {
    home:    (s) => HomeView.render(s),
    live:    (s) => LiveView.render(s),
    movies:  (s) => CategoryView.render(s, 'vod'),
    series:  (s) => CategoryView.render(s, 'series'),
    search:  (s) => CategoryView.renderSearch(s),
    settings:(s) => renderSettings(s),
  };

  function parseRoute(route) {
    const [name, ...args] = route.split('|');
    return { name, args };
  }

  async function render(route) {
    const { name, args } = parseRoute(route);

    // Detalje- og liste-views håndteres separat (beholder sidebar)
    if (name === 'list')    { return renderInShell(route, 'list', () => ListView.render(window.__content, args[0], args[1], decodeURIComponent(args[2] || ''))); }
    if (name === 'details') { return renderInShell(route, args[0] === 'series' ? 'series' : 'movies', () => DetailsView.render(window.__content, args[0], args[1])); }

    const builder = ROUTES[name];
    if (!builder) { go('home'); return; }

    const { shell: shellEl, content } = shell(name);
    app().innerHTML = '';
    app().appendChild(shellEl);
    window.__content = content;
    window.__shell = shellEl;
    wireSidebar(shellEl);
    Nav.reset();
    await builder(content);
  }

  // Genbrug eksisterende shell hvis muligt, ellers byg ny med given aktiv sektion
  async function renderInShell(route, activeSection, fill) {
    if (!window.__shell || !document.body.contains(window.__shell)) {
      const { shell: shellEl, content } = shell(activeSection);
      app().innerHTML = '';
      app().appendChild(shellEl);
      window.__content = content;
      window.__shell = shellEl;
      wireSidebar(shellEl);
    } else {
      // marker aktiv sektion
      window.__shell.querySelectorAll('.nav-item').forEach(n =>
        n.classList.toggle('active', n.dataset.route === activeSection));
      window.__content = window.__shell.querySelector('#content-inner');
      window.__content.innerHTML = '';
    }
    Nav.reset();
    await fill();
  }

  function go(route, opts) {
    opts = opts || {};
    if (!opts.replace && currentRoute) history.push(currentRoute);
    currentRoute = route;
    setupBack();
    render(route).catch(e => { console.error(e); U.toast('Der opstod en fejl'); });
  }

  function back() {
    if (history.length > 0) {
      const prev = history.pop();
      currentRoute = prev;
      setupBack();
      render(prev);
    } else {
      // På forsiden: gør ingenting (TV'et lukker selv appen via system-Back)
    }
  }

  function setupBack() {
    Nav.onBack(() => back());
  }

  function onPlayerClosed() {
    // Sæt fokus tilbage i den nuværende side
    setTimeout(() => { if (!Nav.current) Nav.focusFirst(); }, 50);
  }

  function renderSettings(content) {
    const info = Api.info();
    content.innerHTML = '';
    content.appendChild(U.el(`<div class="page-title">Indstillinger</div>`));
    content.appendChild(U.el(`<div class="page-sub">Server: ${U.esc(info.base)} · Bruger: ${U.esc(info.user)}</div>`));
    const logout = U.el(`<button class="btn danger focusable" style="width:auto;padding:16px 34px;background:var(--danger)">Log ud</button>`);
    logout.addEventListener('click', () => {
      Store.clearCreds();
      history = []; currentRoute = null;
      boot();
    });
    content.appendChild(logout);
    setTimeout(() => Nav.focusFirst(), 30);
  }

  return { go, back, onPlayerClosed, get current() { return currentRoute; } };
})();

/* ---------------- Bootstrap ---------------- */
function boot() {
  const creds = Store.getCreds();
  if (creds && creds.host) {
    Api.configure(creds);
    // Vis forsiden med det samme; auth tjekkes når data hentes
    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(LoginView.render());
    // Prøv auto-login
    Api.authenticate()
      .then(() => Router.go('home'))
      .catch(() => { U.toast('Log ind igen'); });
  } else {
    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(LoginView.render());
  }
}

window.addEventListener('load', () => {
  Nav.init();
  // Tizen: tilmeld hardware-tilbage-knap
  try {
    if (window.tizen && tizen.tvinputdevice) {
      ['ColorF0Red','MediaPlay','MediaPause','MediaStop','MediaFastForward','MediaRewind','MediaPlayPause'].forEach(k => {
        try { tizen.tvinputdevice.registerKey(k); } catch (e) {}
      });
    }
  } catch (e) {}
  boot();
});
