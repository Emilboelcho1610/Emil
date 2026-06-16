/* -----------------------------------------------------------------
   Xtream Codes API-klient.
   Al kommunikation med IPTV-serveren går igennem her.
   Login-oplysninger tastes ind af brugeren og gemmes lokalt -
   de er ALDRIG en del af kildekoden.
   ----------------------------------------------------------------- */
window.Api = (function () {
  let base = '';      // fx http://host:8080
  let user = '';
  let pass = '';

  // Simpel hukommelses-cache så vi ikke spammer serveren
  const cache = new Map();
  const TTL = 5 * 60 * 1000;

  // Dev-proxy: kun aktiv i desktop-test med ?proxy=1 (se scripts/dev-server.js).
  // På rigtige TV'er er den slået fra og kald går direkte til serveren.
  const DEV_PROXY = (typeof location !== 'undefined' &&
    /[?&]proxy=1/.test(location.search)) ? '/__proxy?url=' : '';
  function px(url) { return DEV_PROXY ? DEV_PROXY + encodeURIComponent(url) : url; }

  function configure(creds) {
    base = String(creds.host || '').replace(/\/+$/, '');
    // Tillad at brugeren skriver host uden protokol
    if (base && !/^https?:\/\//i.test(base)) base = 'http://' + base;
    user = creds.username || '';
    pass = creds.password || '';
  }

  function apiUrl(params) {
    const q = new URLSearchParams({ username: user, password: pass, ...params });
    return `${base}/player_api.php?${q.toString()}`;
  }

  async function call(params, useCache) {
    const url = apiUrl(params);
    if (useCache && cache.has(url)) {
      const c = cache.get(url);
      if (Date.now() - c.t < TTL) return c.v;
    }
    const res = await fetch(px(url), { method: 'GET' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (useCache) cache.set(url, { t: Date.now(), v: data });
    return data;
  }

  return {
    configure,

    // Tjek login og hent server-info
    async authenticate() {
      const data = await call({}, false);
      if (!data || !data.user_info || data.user_info.auth === 0) {
        throw new Error('Forkert brugernavn eller adgangskode');
      }
      return data; // { user_info, server_info }
    },

    // --- Live ---
    liveCategories() { return call({ action: 'get_live_categories' }, true); },
    liveStreams(catId) {
      return call(catId ? { action: 'get_live_streams', category_id: catId }
                        : { action: 'get_live_streams' }, true);
    },
    shortEpg(streamId, limit) {
      return call({ action: 'get_short_epg', stream_id: streamId, limit: limit || 4 }, false)
        .then(d => (d && d.epg_listings) || []);
    },

    // --- Film (VOD) ---
    vodCategories() { return call({ action: 'get_vod_categories' }, true); },
    vodStreams(catId) {
      return call(catId ? { action: 'get_vod_streams', category_id: catId }
                        : { action: 'get_vod_streams' }, true);
    },
    vodInfo(vodId) { return call({ action: 'get_vod_info', vod_id: vodId }, true); },

    // --- Serier ---
    seriesCategories() { return call({ action: 'get_series_categories' }, true); },
    seriesList(catId) {
      return call(catId ? { action: 'get_series', category_id: catId }
                        : { action: 'get_series' }, true);
    },
    seriesInfo(seriesId) { return call({ action: 'get_series_info', series_id: seriesId }, true); },

    // --- Stream-URLs ---
    // Live afspilles helst som HLS (.m3u8) for bedst browser/webOS-kompatibilitet,
    // men AVPlay (Tizen) håndterer også .ts fint.
    liveUrl(streamId, ext) {
      return px(`${base}/live/${user}/${pass}/${streamId}.${ext || 'm3u8'}`);
    },
    liveUrlTs(streamId) {
      return px(`${base}/live/${user}/${pass}/${streamId}.ts`);
    },
    movieUrl(streamId, ext) {
      return px(`${base}/movie/${user}/${pass}/${streamId}.${ext || 'mp4'}`);
    },
    seriesUrl(episodeId, ext) {
      return px(`${base}/series/${user}/${pass}/${episodeId}.${ext || 'mp4'}`);
    },

    info() { return { base, user }; },
  };
})();
