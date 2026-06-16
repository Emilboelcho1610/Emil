/* Forside: hurtig adgang, "fortsæt afspilning", favoritter og nyeste indhold. */
window.HomeView = {
  async render(content) {
    content.innerHTML = '';
    content.appendChild(U.el(`<div class="page-title">Velkommen</div>`));
    content.appendChild(U.el(`<div class="page-sub">Hvad vil du se i dag?</div>`));

    // Hurtig adgang
    const quick = U.el(`<div class="row"><div class="row-track" id="quick"></div></div>`);
    content.appendChild(quick);
    const q = quick.querySelector('#quick');
    [['live','📺','Live TV'],['movies','🎬','Film'],['series','📚','Serier']].forEach(([route, icon, label]) => {
      const card = U.el(`<div class="card focusable" data-route="${route}" style="width:260px">
        <div class="poster" style="height:150px;font-size:64px">${icon}</div>
        <div class="meta"><div class="name">${label}</div></div></div>`);
      card.addEventListener('click', () => Router.go(route));
      q.appendChild(card);
    });

    // Fortsæt afspilning
    const resume = Store.recentResume(15);
    if (resume.length) {
      const row = this.row('Fortsæt afspilning');
      content.appendChild(row.wrap);
      resume.forEach(r => {
        const m = r.meta || {};
        const card = this.poster(m.name || 'Uden titel', m.icon, () => {
          if (m.type === 'series') Router.go(`details|series|${m.seriesId || r.id}`);
          else this.playMovie(r.id, m);
        }, U.time(r.position) + (r.duration ? ' / ' + U.time(r.duration) : ''));
        row.track.appendChild(card);
      });
    }

    // Favoritter
    const favs = Store.getFavorites();
    if (favs.length) {
      const row = this.row('Favoritter');
      content.appendChild(row.wrap);
      favs.forEach(f => {
        const card = this.poster(f.name, f.icon, () => {
          if (f.type === 'series') Router.go(`details|series|${f.id}`);
          else if (f.type === 'vod') Router.go(`details|vod|${f.id}`);
          else if (f.type === 'live') Player.open({ url: Api.liveUrl(f.id), title: f.name, live: true, id: f.id, type: 'live' });
        });
        row.track.appendChild(card);
      });
    }

    // Nyeste film
    this.loadNewest(content, 'vod', 'Nyeste film');
    this.loadNewest(content, 'series', 'Nyeste serier');

    setTimeout(() => Nav.focusFirst(), 40);
  },

  row(title) {
    const wrap = U.el(`<div class="row"><div class="row-title">${U.esc(title)}</div><div class="row-track"></div></div>`);
    return { wrap, track: wrap.querySelector('.row-track') };
  },

  poster(name, icon, onClick, sub) {
    const card = U.el(`<div class="card focusable">
      <div class="poster" style="${U.bg(icon)}">${icon ? '' : '<span class="ph">🎬</span>'}</div>
      <div class="meta"><div class="name">${U.esc(name)}</div>${sub ? `<div class="sub">${U.esc(sub)}</div>` : ''}</div>
    </div>`);
    card.addEventListener('click', onClick);
    return card;
  },

  async loadNewest(content, type, title) {
    try {
      const data = type === 'vod' ? await Api.vodStreams() : await Api.seriesList();
      if (!Array.isArray(data) || !data.length) return;
      const sorted = data.slice().sort((a, b) =>
        (parseInt(b.added || b.last_modified || 0) || 0) - (parseInt(a.added || a.last_modified || 0) || 0)).slice(0, 18);
      const row = this.row(title);
      content.appendChild(row.wrap);
      sorted.forEach(it => {
        const id = type === 'vod' ? it.stream_id : it.series_id;
        const icon = it.stream_icon || it.cover;
        const card = this.poster(it.name, icon, () =>
          Router.go(`details|${type === 'vod' ? 'vod' : 'series'}|${id}`));
        row.track.appendChild(card);
      });
    } catch (e) { console.warn('loadNewest', type, e); }
  },

  playMovie(id, meta) {
    Player.open({
      url: Api.movieUrl(id, meta.ext), title: meta.name, live: false,
      id, type: 'vod', meta,
    });
  },
};
