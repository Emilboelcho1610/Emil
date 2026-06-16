/* -----------------------------------------------------------------
   Afspiller-abstraktion.
   - På Samsung (Tizen) bruges den native AVPlay-API som understøtter
     .ts/.m3u8/.mkv/.mp4 med hardware-acceleration.
   - Ellers (LG webOS + desktop) bruges HTML5 <video>.
   Samme interface udadtil: open(), close(), togglePause(), seek().
   ----------------------------------------------------------------- */
window.Player = (function () {
  const layer = () => document.getElementById('player-layer');
  const osd   = () => document.getElementById('player-osd');
  const video = () => document.getElementById('video');

  let active = false;
  let mode = 'html5';          // 'html5' | 'avplay'
  let isLive = false;
  let current = null;          // { id, type, title, ext }
  let osdTimer = null;
  let saveTimer = null;
  let avplayUrl = null;

  const hasAvplay = () => typeof webapis !== 'undefined' && webapis.avplay;

  /* ---------------- OSD ---------------- */
  function showOsd(autohide) {
    osd().classList.add('show');
    document.getElementById('osd-progress').classList.toggle('hidden', isLive);
    clearTimeout(osdTimer);
    if (autohide !== false) osdTimer = setTimeout(() => osd().classList.remove('show'), 4000);
  }
  function hideOsd() { osd().classList.remove('show'); }
  function setStatus(txt) { document.getElementById('osd-status').textContent = txt || ''; }

  function updateProgress(cur, dur) {
    if (isLive) return;
    document.getElementById('osd-time-current').textContent = U.time(cur);
    document.getElementById('osd-time-total').textContent = U.time(dur);
    const pct = dur ? (cur / dur) * 100 : 0;
    document.getElementById('osd-bar-fill').style.width = pct + '%';
  }

  /* ---------------- AVPlay (Tizen) ---------------- */
  function avInit(url) {
    const v = video();
    v.style.display = 'none';
    const obj = document.getElementById('av-object') || (() => {
      const o = document.createElement('object');
      o.id = 'av-object'; o.type = 'application/avplayer';
      o.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;background:#000;';
      layer().insertBefore(o, osd());
      return o;
    })();
    obj.style.display = 'block';
    avplayUrl = url;
    webapis.avplay.open(url);
    webapis.avplay.setDisplayRect(0, 0, 1920, 1080);
    webapis.avplay.setListener({
      onbufferingstart: () => setStatus('Buffrer…'),
      onbufferingcomplete: () => setStatus(''),
      onstreamcompleted: () => close(),
      onerror: (e) => { U.toast('Afspilningsfejl'); setStatus('Fejl: ' + (e && e.name || '')); },
      oncurrentplaytime: (ms) => {
        if (!isLive) {
          const dur = webapis.avplay.getDuration() / 1000;
          updateProgress(ms / 1000, dur);
        }
      },
    });
    webapis.avplay.prepareAsync(
      () => { webapis.avplay.play(); restoreResume(); },
      (e) => { U.toast('Kunne ikke starte stream'); console.error(e); }
    );
  }
  function avClose() {
    try { webapis.avplay.stop(); webapis.avplay.close(); } catch (e) {}
    const obj = document.getElementById('av-object');
    if (obj) obj.style.display = 'none';
    video().style.display = '';
  }

  /* ---------------- HTML5 ---------------- */
  function htmlInit(url) {
    const v = video();
    v.style.display = '';
    v.src = url;
    v.onloadedmetadata = restoreResume;
    v.ontimeupdate = () => updateProgress(v.currentTime, v.duration);
    v.onwaiting = () => setStatus('Buffrer…');
    v.onplaying = () => setStatus('');
    v.onended = () => close();
    v.onerror = () => { U.toast('Kunne ikke afspille (format ikke understøttet?)'); };
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  }

  /* ---------------- Resume ---------------- */
  function restoreResume() {
    if (isLive || !current) return;
    const r = Store.getResume(current.id);
    if (r && r.position > 10) {
      U.toast('Fortsætter fra ' + U.time(r.position));
      seekTo(r.position);
    }
  }
  function startSaveTimer() {
    clearInterval(saveTimer);
    if (isLive || !current) return;
    saveTimer = setInterval(() => {
      const { cur, dur } = position();
      if (cur > 0) Store.setResume(current.id, cur, dur, current.meta);
    }, 5000);
  }
  function position() {
    if (mode === 'avplay' && hasAvplay()) {
      try { return { cur: webapis.avplay.getCurrentTime() / 1000, dur: webapis.avplay.getDuration() / 1000 }; }
      catch (e) { return { cur: 0, dur: 0 }; }
    }
    const v = video();
    return { cur: v.currentTime || 0, dur: v.duration || 0 };
  }

  /* ---------------- Offentligt API ---------------- */
  function open(opts) {
    // opts: { url, title, live, id, type, meta }
    active = true;
    isLive = !!opts.live;
    current = { id: opts.id, type: opts.type, title: opts.title, meta: opts.meta };
    layer().classList.remove('hidden');
    document.getElementById('osd-title').textContent = opts.title || '';
    setStatus('Indlæser…');
    showOsd();

    mode = hasAvplay() ? 'avplay' : 'html5';
    if (mode === 'avplay') avInit(opts.url); else htmlInit(opts.url);
    startSaveTimer();
  }

  function close() {
    if (!active) return;
    // Gem position inden vi lukker
    if (!isLive && current) {
      const { cur, dur } = position();
      if (cur > 0) Store.setResume(current.id, cur, dur, current.meta);
    }
    clearInterval(saveTimer);
    if (mode === 'avplay') avClose();
    else { const v = video(); v.pause(); v.removeAttribute('src'); v.load(); }
    layer().classList.add('hidden');
    active = false; current = null;
    if (typeof Router !== 'undefined') Router.onPlayerClosed();
  }

  function togglePause() {
    if (mode === 'avplay') {
      try {
        const st = webapis.avplay.getState();
        if (st === 'PLAYING') { webapis.avplay.pause(); setStatus('⏸ Pause'); }
        else { webapis.avplay.play(); setStatus(''); }
      } catch (e) {}
    } else {
      const v = video();
      if (v.paused) { v.play(); setStatus(''); } else { v.pause(); setStatus('⏸ Pause'); }
    }
    showOsd();
  }

  function seekTo(sec) {
    if (mode === 'avplay') { try { webapis.avplay.seekTo(Math.max(0, sec) * 1000); } catch (e) {} }
    else { video().currentTime = Math.max(0, sec); }
  }
  function seekBy(delta) {
    if (isLive) return;
    const { cur, dur } = position();
    seekTo(Math.min(dur ? dur - 1 : cur + delta, cur + delta));
    showOsd();
  }

  function handleKey(code, e) {
    const K = APP.KEYS;
    const m = arr => arr.indexOf(code) >= 0;
    if (m(K.BACK) || m(K.STOP)) { close(); }
    else if (m(K.ENTER) || m(K.PLAY) || m(K.PAUSE)) { togglePause(); }
    else if (m(K.RIGHT) || m(K.FWD)) { seekBy(30); }
    else if (m(K.LEFT) || m(K.REW)) { seekBy(-15); }
    else if (m(K.UP) || m(K.DOWN)) { showOsd(); }
    else { showOsd(); }
  }

  return {
    open, close, togglePause, seekBy,
    isActive: () => active,
    handleKey,
  };
})();
