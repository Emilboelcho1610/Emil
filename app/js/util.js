/* Små hjælpefunktioner brugt på tværs af appen */
window.U = {
  // Sikker HTML (undgå at brugerdata/server-data brækker layoutet)
  esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  // Byg et DOM-element fra en HTML-streng
  el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  },

  // Sekunder -> mm:ss eller hh:mm:ss
  time(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    const pad = n => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  },

  toast(msg, ms) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.add('hidden'), ms || 2500);
  },

  spinner(on) {
    document.getElementById('spinner').classList.toggle('hidden', !on);
  },

  // Baggrundsbillede-style med fallback-placeholder
  bg(url) {
    return url ? `background-image:url('${url.replace(/'/g, "%27")}')` : '';
  },
};
