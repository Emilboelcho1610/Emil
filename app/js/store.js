/* Lokal lagring: login-oplysninger, "fortsæt afspilning", cache.
   Bruger localStorage som findes på både Tizen og webOS. */
window.Store = (function () {
  const K_CREDS = 'mytv.creds';
  const K_RESUME = 'mytv.resume';
  const K_FAV = 'mytv.favorites';

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  return {
    // --- Login ---
    getCreds() { return read(K_CREDS, null); },
    saveCreds(creds) { write(K_CREDS, creds); },
    clearCreds() { try { localStorage.removeItem(K_CREDS); } catch (e) {} },

    // --- Fortsæt afspilning (vod/serie) ---
    getResume(id) { const r = read(K_RESUME, {}); return r[id] || null; },
    setResume(id, position, duration, meta) {
      const r = read(K_RESUME, {});
      if (position > 0 && (!duration || position < duration - 30)) {
        r[id] = { position, duration: duration || 0, meta: meta || {}, ts: Date.now() };
      } else {
        delete r[id]; // færdigset → fjern
      }
      write(K_RESUME, r);
    },
    recentResume(limit) {
      const r = read(K_RESUME, {});
      return Object.entries(r)
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => b.ts - a.ts)
        .slice(0, limit || 20);
    },

    // --- Favoritter ---
    getFavorites() { return read(K_FAV, []); },
    toggleFavorite(item) {
      const f = read(K_FAV, []);
      const i = f.findIndex(x => x.id === item.id && x.type === item.type);
      if (i >= 0) f.splice(i, 1); else f.unshift(item);
      write(K_FAV, f);
      return i < 0; // true hvis tilføjet
    },
    isFavorite(id, type) {
      return read(K_FAV, []).some(x => x.id === id && x.type === type);
    },
  };
})();
