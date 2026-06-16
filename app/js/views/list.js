/* Liste over film/serier i en valgt kategori. */
window.ListView = {
  async render(content, type, catId, catName) {
    content.innerHTML = '';
    content.appendChild(U.el(`<div class="page-title">${U.esc(catName || '')}</div>`));
    const sub = U.el(`<div class="page-sub"></div>`);
    content.appendChild(sub);

    U.spinner(true);
    try {
      const useCat = catId && catId !== '0' ? catId : null;
      const data = type === 'vod' ? await Api.vodStreams(useCat) : await Api.seriesList(useCat);
      U.spinner(false);
      const items = Array.isArray(data) ? data : [];
      sub.textContent = items.length + ' titler';

      const grid = U.el('<div class="grid"></div>');
      content.appendChild(grid);

      items.forEach(it => {
        const id = type === 'vod' ? it.stream_id : it.series_id;
        const icon = it.stream_icon || it.cover;
        const rating = it.rating ? '★ ' + it.rating : '';
        const card = U.el(`<div class="card focusable">
          <div class="poster" style="${U.bg(icon)}">${icon ? '' : '<span class="ph">🎬</span>'}</div>
          <div class="meta"><div class="name">${U.esc(it.name)}</div>
          ${rating ? `<div class="sub">${U.esc(rating)}</div>` : ''}</div></div>`);
        card.addEventListener('click', () => Router.go(`details|${type === 'vod' ? 'vod' : 'series'}|${id}`));
        grid.appendChild(card);
      });

      if (!items.length) content.appendChild(U.el(`<div class="page-sub">Ingen titler i denne kategori.</div>`));
      setTimeout(() => Nav.focusFirst(), 30);
    } catch (e) {
      U.spinner(false);
      content.appendChild(U.el(`<div class="page-sub" style="color:var(--danger)">Fejl: ${U.esc(e.message)}</div>`));
    }
  },
};
