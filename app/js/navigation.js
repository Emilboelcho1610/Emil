/* -----------------------------------------------------------------
   Spatial navigation til fjernbetjening.
   Håndterer fokus mellem .focusable-elementer ud fra deres position
   på skærmen (op/ned/venstre/højre), Enter for at aktivere, og Back.
   ----------------------------------------------------------------- */
window.Nav = (function () {
  let current = null;
  let handlers = { back: null, key: null };

  function focusables() {
    return Array.from(document.querySelectorAll('.focusable'))
      .filter(el => el.offsetParent !== null); // kun synlige
  }

  function setFocus(el) {
    if (!el) return;
    if (current) current.classList.remove('focused');
    current = el;
    el.classList.add('focused');
    // Hold elementet synligt ved scroll
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    if (el.dataset.onfocus && handlers.onfocus) handlers.onfocus(el);
  }

  function focusFirst() {
    const list = focusables();
    // Foretræk et element markeret som standard
    const def = list.find(e => e.dataset.default !== undefined);
    setFocus(def || list[0]);
  }

  function rect(el) { const r = el.getBoundingClientRect(); return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, ...r }; }

  // Find nærmeste fokuserbare element i en given retning
  function nearest(dir) {
    if (!current) { focusFirst(); return; }
    const from = rect(current);
    let best = null, bestScore = Infinity;

    for (const el of focusables()) {
      if (el === current) continue;
      const to = rect(el);
      const dx = to.cx - from.cx;
      const dy = to.cy - from.cy;

      let primary, secondary, valid;
      if (dir === 'right') { valid = dx > 4;  primary = dx;  secondary = Math.abs(dy); }
      if (dir === 'left')  { valid = dx < -4; primary = -dx; secondary = Math.abs(dy); }
      if (dir === 'down')  { valid = dy > 4;  primary = dy;  secondary = Math.abs(dx); }
      if (dir === 'up')    { valid = dy < -4; primary = -dy; secondary = Math.abs(dx); }
      if (!valid) continue;

      // Vægt: foretræk samme akse (lille sekundær afvigelse)
      const score = primary + secondary * 2;
      if (score < bestScore) { bestScore = score; best = el; }
    }
    if (best) setFocus(best);
  }

  function activate() {
    if (current && handlers.key) {
      // Lad view håndtere 'enter' hvis det vil
    }
    if (current) {
      if (current.dataset.href) { Router.go(current.dataset.href); return; }
      current.click();
    }
  }

  function onKey(e) {
    const code = e.keyCode || e.which;
    const K = APP.KEYS;
    const match = arr => arr.indexOf(code) >= 0;

    // Lad afspilleren stjæle tasterne når den er aktiv
    if (Player.isActive()) { Player.handleKey(code, e); e.preventDefault(); return; }

    // Login-felter skal kunne modtage tekst frit
    const typing = document.activeElement &&
      (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA');

    if (match(K.BACK)) { e.preventDefault(); if (handlers.back) handlers.back(); return; }

    if (typing && !match(K.UP) && !match(K.DOWN) && !match(K.ENTER)) return;

    if (match(K.LEFT))  { e.preventDefault(); nearest('left'); }
    else if (match(K.RIGHT)) { e.preventDefault(); nearest('right'); }
    else if (match(K.UP))    { e.preventDefault(); nearest('up'); }
    else if (match(K.DOWN))  { e.preventDefault(); nearest('down'); }
    else if (match(K.ENTER)) { e.preventDefault(); activate(); }
    else if (handlers.key)   { handlers.key(code, e); }
  }

  function init() {
    document.addEventListener('keydown', onKey);
    // Muse-/touch-fokus til desktop-test
    document.addEventListener('mouseover', e => {
      const f = e.target.closest && e.target.closest('.focusable');
      if (f) setFocus(f);
    });
  }

  return {
    init,
    setFocus, focusFirst, nearest,
    get current() { return current; },
    onBack(fn) { handlers.back = fn; },
    onKey(fn) { handlers.key = fn; },
    onFocus(fn) { handlers.onfocus = fn; },
    reset() { current = null; },
  };
})();
