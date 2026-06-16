/* Live TV: kategorier til venstre, kanaler til højre med EPG. */
window.LiveView = {
  async render(content) {
    content.innerHTML = '';
    content.appendChild(U.el(`<div class="page-title">Live TV</div>`));

    const layout = U.el(`<div class="live-layout">
      <div class="live-cats" id="live-cats"></div>
      <div class="live-channels"><div class="chan-list" id="live-channels"></div></div>
    </div>`);
    content.appendChild(layout);
    const catsEl = layout.querySelector('#live-cats');
    const chanEl = layout.querySelector('#live-channels');

    U.spinner(true);
    let cats = [];
    try { cats = await Api.liveCategories(); } catch (e) { U.toast('Kunne ikke hente kanaler'); }
    U.spinner(false);

    const selectCat = async (catId, el) => {
      catsEl.querySelectorAll('.cat').forEach(c => c.classList.remove('active'));
      el.classList.add('active');
      chanEl.innerHTML = '';
      U.spinner(true);
      let chans = [];
      try { chans = await Api.liveStreams(catId === '0' ? null : catId); } catch (e) {}
      U.spinner(false);
      (chans || []).forEach(ch => chanEl.appendChild(this.channelRow(ch)));
      if (!chans || !chans.length) chanEl.appendChild(U.el(`<div class="page-sub">Ingen kanaler her.</div>`));
    };

    // "Alle"
    const all = U.el(`<div class="cat focusable active" data-default>Alle kanaler</div>`);
    all.addEventListener('click', () => selectCat('0', all));
    catsEl.appendChild(all);

    (cats || []).forEach(c => {
      const el = U.el(`<div class="cat focusable">${U.esc(c.category_name)}</div>`);
      el.addEventListener('click', () => selectCat(c.category_id, el));
      catsEl.appendChild(el);
    });

    await selectCat('0', all);
    setTimeout(() => Nav.focusFirst(), 30);
  },

  channelRow(ch) {
    const row = U.el(`<div class="chan focusable">
      <div class="logo" style="${U.bg(ch.stream_icon)}"></div>
      <div class="info">
        <div class="t">${U.esc(ch.name)}</div>
        <div class="epg" data-epg="${U.esc(ch.stream_id)}">…</div>
      </div>
      <div class="num">${U.esc(ch.num || '')}</div>
    </div>`);
    row.addEventListener('click', () => {
      Player.open({
        url: Api.liveUrl(ch.stream_id), title: ch.name, live: true,
        id: String(ch.stream_id), type: 'live',
        meta: { name: ch.name, icon: ch.stream_icon, type: 'live' },
      });
    });
    // Hent "nu og næste" EPG dovent
    this.loadEpg(ch.stream_id, row.querySelector('.epg'));
    return row;
  },

  async loadEpg(streamId, el) {
    try {
      const epg = await Api.shortEpg(streamId, 1);
      if (epg && epg.length) {
        const now = epg[0];
        const title = now.title ? this.b64(now.title) : '';
        el.textContent = title || 'Ingen programinfo';
      } else { el.textContent = ''; }
    } catch (e) { el.textContent = ''; }
  },

  // Xtream returnerer EPG-titler base64-kodet
  b64(s) {
    try { return decodeURIComponent(escape(atob(s))); } catch (e) { return s; }
  },
};
