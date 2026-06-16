/* Kategori-oversigt for Film og Serier + søgning. */
window.CategoryView = {
  async render(content, type) {
    const title = type === 'vod' ? 'Film' : 'Serier';
    content.innerHTML = '';
    content.appendChild(U.el(`<div class="page-title">${title}</div>`));
    content.appendChild(U.el(`<div class="page-sub">Vælg en kategori</div>`));

    U.spinner(true);
    try {
      const cats = type === 'vod' ? await Api.vodCategories() : await Api.seriesCategories();
      U.spinner(false);
      const grid = U.el('<div class="grid"></div>');
      content.appendChild(grid);

      // "Alle"-genvej
      grid.appendChild(this.catCard('Alle ' + title.toLowerCase(), () =>
        Router.go(`list|${type}|0|${encodeURIComponent('Alle ' + title.toLowerCase())}`)));

      (cats || []).forEach(c => {
        grid.appendChild(this.catCard(c.category_name, () =>
          Router.go(`list|${type}|${c.category_id}|${encodeURIComponent(c.category_name)}`)));
      });
      setTimeout(() => Nav.focusFirst(), 30);
    } catch (e) {
      U.spinner(false);
      content.appendChild(U.el(`<div class="page-sub" style="color:var(--danger)">Kunne ikke hente kategorier. ${U.esc(e.message)}</div>`));
    }
  },

  catCard(name, onClick) {
    const card = U.el(`<div class="card focusable" style="width:300px">
      <div class="poster" style="height:120px;font-size:40px;background:var(--surface-2)">📁</div>
      <div class="meta"><div class="name">${U.esc(name)}</div></div></div>`);
    card.addEventListener('click', onClick);
    return card;
  },

  async renderSearch(content) {
    content.innerHTML = '';
    content.appendChild(U.el(`<div class="page-title">Søg</div>`));
    const box = U.el(`<div class="field" style="max-width:700px">
      <input id="search-input" class="focusable" type="text" placeholder="Søg i film og serier…" data-default />
    </div>`);
    content.appendChild(box);
    const results = U.el('<div class="grid" id="search-results"></div>');
    content.appendChild(results);

    let allVod = null, allSeries = null;
    const input = box.querySelector('#search-input');
    let timer = null;

    async function ensureData() {
      if (allVod && allSeries) return;
      U.spinner(true);
      try {
        [allVod, allSeries] = await Promise.all([Api.vodStreams(), Api.seriesList()]);
      } catch (e) { allVod = allVod || []; allSeries = allSeries || []; }
      U.spinner(false);
    }

    async function doSearch() {
      const term = input.value.trim().toLowerCase();
      results.innerHTML = '';
      if (term.length < 2) return;
      await ensureData();
      const hits = [];
      (allVod || []).forEach(v => { if ((v.name || '').toLowerCase().includes(term))
        hits.push({ type: 'vod', id: v.stream_id, name: v.name, icon: v.stream_icon }); });
      (allSeries || []).forEach(s => { if ((s.name || '').toLowerCase().includes(term))
        hits.push({ type: 'series', id: s.series_id, name: s.name, icon: s.cover }); });

      hits.slice(0, 60).forEach(h => {
        const card = U.el(`<div class="card focusable">
          <div class="poster" style="${U.bg(h.icon)}">${h.icon ? '' : '<span class="ph">🎬</span>'}</div>
          <div class="meta"><div class="name">${U.esc(h.name)}</div>
          <div class="sub">${h.type === 'vod' ? 'Film' : 'Serie'}</div></div></div>`);
        card.addEventListener('click', () => Router.go(`details|${h.type}|${h.id}`));
        results.appendChild(card);
      });
      if (!hits.length) results.appendChild(U.el(`<div class="page-sub">Ingen resultater for "${U.esc(term)}"</div>`));
    }

    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(doSearch, 350); });
    setTimeout(() => { input.focus(); Nav.setFocus(input); }, 40);
  },
};
