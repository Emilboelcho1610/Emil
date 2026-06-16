/* Detalje-side for en film eller en serie. */
window.DetailsView = {
  async render(content, type, id) {
    content.innerHTML = '';
    U.spinner(true);
    try {
      if (type === 'vod') await this.renderMovie(content, id);
      else await this.renderSeries(content, id);
    } catch (e) {
      content.appendChild(U.el(`<div class="page-sub" style="color:var(--danger)">Kunne ikke hente detaljer: ${U.esc(e.message)}</div>`));
    } finally {
      U.spinner(false);
      setTimeout(() => Nav.focusFirst(), 30);
    }
  },

  /* ---------------- Film ---------------- */
  async renderMovie(content, id) {
    const data = await Api.vodInfo(id);
    const info = (data && data.info) || {};
    const md = (data && data.movie_data) || {};
    const name = info.name || md.name || 'Film';
    const ext = md.container_extension || 'mp4';
    const meta = { name, icon: info.movie_image || info.cover_big, ext, type: 'vod' };

    const wrap = U.el(`<div class="details">
      <div class="poster-lg" style="${U.bg(info.movie_image || info.cover_big)}"></div>
      <div class="info">
        <h1>${U.esc(name)}</h1>
        <div class="tags">${this.tags([info.releasedate, info.genre, info.duration, info.rating ? '★ ' + info.rating : ''])}</div>
        <div class="plot">${U.esc(info.plot || info.description || 'Ingen beskrivelse.')}</div>
        <div class="actions"></div>
      </div></div>`);
    content.appendChild(wrap);

    const actions = wrap.querySelector('.actions');
    const resume = Store.getResume(String(id));
    if (resume && resume.position > 10) {
      const btn = U.el(`<button class="btn focusable" data-default>▶ Fortsæt (${U.time(resume.position)})</button>`);
      btn.addEventListener('click', () => this.play(id, meta));
      actions.appendChild(btn);
      const restart = U.el(`<button class="btn secondary focusable">Start forfra</button>`);
      restart.addEventListener('click', () => { Store.setResume(String(id), 0); this.play(id, meta); });
      actions.appendChild(restart);
    } else {
      const btn = U.el(`<button class="btn focusable" data-default>▶ Afspil</button>`);
      btn.addEventListener('click', () => this.play(id, meta));
      actions.appendChild(btn);
    }
    actions.appendChild(this.favBtn(id, 'vod', name, meta.icon));
  },

  play(id, meta) {
    Player.open({ url: Api.movieUrl(id, meta.ext), title: meta.name, live: false, id: String(id), type: 'vod', meta });
  },

  /* ---------------- Serie ---------------- */
  async renderSeries(content, id) {
    const data = await Api.seriesInfo(id);
    const info = (data && data.info) || {};
    const episodes = (data && data.episodes) || {};
    const seasons = Object.keys(episodes).sort((a, b) => parseInt(a) - parseInt(b));
    const name = info.name || 'Serie';

    const wrap = U.el(`<div class="details">
      <div class="poster-lg" style="${U.bg(info.cover)}"></div>
      <div class="info">
        <h1>${U.esc(name)}</h1>
        <div class="tags">${this.tags([info.releaseDate || info.releasedate, info.genre, info.rating ? '★ ' + info.rating : ''])}</div>
        <div class="plot">${U.esc(info.plot || 'Ingen beskrivelse.')}</div>
        <div class="actions"></div>
      </div></div>`);
    content.appendChild(wrap);
    wrap.querySelector('.actions').appendChild(this.favBtn(id, 'series', name, info.cover));

    const epWrap = U.el(`<div class="episodes"><div class="season-tabs"></div><div class="episode-list"></div></div>`);
    content.appendChild(epWrap);
    const tabs = epWrap.querySelector('.season-tabs');
    const list = epWrap.querySelector('.episode-list');

    const showSeason = (s) => {
      tabs.querySelectorAll('.season-tab').forEach(t => t.classList.toggle('active', t.dataset.s === s));
      list.innerHTML = '';
      (episodes[s] || []).forEach(ep => {
        const epExt = ep.container_extension || 'mp4';
        const epName = ep.title || ('Afsnit ' + ep.episode_num);
        const row = U.el(`<div class="episode focusable">
          <div class="ep-num">${U.esc(ep.episode_num)}</div>
          <div class="ep-title">${U.esc(epName)}</div></div>`);
        row.addEventListener('click', () => {
          Player.open({
            url: Api.seriesUrl(ep.id, epExt), title: name + ' · ' + epName, live: false,
            id: 'series_ep_' + ep.id, type: 'series',
            meta: { name: name + ' · ' + epName, icon: info.cover, type: 'series', seriesId: id, ext: epExt },
          });
        });
        list.appendChild(row);
      });
      setTimeout(() => Nav.focusFirst(), 20);
    };

    seasons.forEach((s, i) => {
      const tab = U.el(`<div class="season-tab focusable ${i === 0 ? 'active' : ''}" data-s="${U.esc(s)}" ${i === 0 ? 'data-default' : ''}>Sæson ${U.esc(s)}</div>`);
      tab.addEventListener('click', () => showSeason(s));
      tab.addEventListener('mouseenter', () => {});
      tabs.appendChild(tab);
    });
    if (seasons.length) showSeason(seasons[0]);
  },

  /* ---------------- Hjælpere ---------------- */
  tags(arr) {
    return arr.filter(Boolean).map(U.esc).join(' &nbsp;·&nbsp; ');
  },

  favBtn(id, type, name, icon) {
    const on = Store.isFavorite(String(id), type);
    const btn = U.el(`<button class="btn secondary focusable">${on ? '★ Fjern favorit' : '☆ Favorit'}</button>`);
    btn.addEventListener('click', () => {
      const added = Store.toggleFavorite({ id: String(id), type, name, icon });
      btn.textContent = added ? '★ Fjern favorit' : '☆ Favorit';
      U.toast(added ? 'Tilføjet til favoritter' : 'Fjernet fra favoritter');
    });
    return btn;
  },
};
