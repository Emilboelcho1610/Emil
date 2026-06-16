/* Login-skærm. Brugeren taster selv host, brugernavn og adgangskode.
   Disse gemmes KUN lokalt på TV'et (localStorage) - aldrig i koden. */
window.LoginView = {
  render() {
    const c = Store.getCreds() || { host: '', username: '', password: '' };
    const root = U.el(`
      <div class="login">
        <div class="brand">My<span>TV</span></div>
        <div class="subtitle">Log ind med din udbyders oplysninger</div>
        <div class="form">
          <div class="field">
            <label>Server (host)</label>
            <input id="in-host" class="focusable" type="text" inputmode="url"
                   placeholder="http://eksempel.com:8080" value="${U.esc(c.host)}" />
          </div>
          <div class="field">
            <label>Brugernavn</label>
            <input id="in-user" class="focusable" type="text" value="${U.esc(c.username)}" />
          </div>
          <div class="field">
            <label>Adgangskode</label>
            <input id="in-pass" class="focusable" type="password" value="${U.esc(c.password)}" />
          </div>
          <button id="btn-login" class="btn focusable" data-default>Log ind</button>
          <div class="error" id="login-error"></div>
          <div class="hint">
            Dine oplysninger gemmes kun på dette TV.<br/>
            Tip: Du finder host/brugernavn/kode i den e-mail eller besked du fik fra din udbyder.
          </div>
        </div>
      </div>
    `);

    root.querySelector('#btn-login').addEventListener('click', () => this.submit(root));
    Nav.onBack(() => { /* ingen "tilbage" fra login */ });

    setTimeout(() => Nav.focusFirst(), 30);
    return root;
  },

  async submit(root) {
    const host = root.querySelector('#in-host').value.trim();
    const username = root.querySelector('#in-user').value.trim();
    const password = root.querySelector('#in-pass').value.trim();
    const err = root.querySelector('#login-error');
    err.textContent = '';

    if (!host || !username || !password) { err.textContent = 'Udfyld alle felter.'; return; }

    U.spinner(true);
    try {
      Api.configure({ host, username, password });
      await Api.authenticate();
      Store.saveCreds({ host, username, password });
      U.spinner(false);
      Router.go('home');
    } catch (e) {
      U.spinner(false);
      err.textContent = e.message === 'Forkert brugernavn eller adgangskode'
        ? e.message
        : 'Kunne ikke forbinde til serveren. Tjek host og netværk.';
      console.error(e);
    }
  },
};
