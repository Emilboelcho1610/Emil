/* Global app-konfiguration og konstanter */
window.APP = {
  name: 'MyTV',
  version: '0.1.0',

  // Fjernbetjenings-/tastatur-koder. Dækker desktop, Tizen og webOS.
  KEYS: {
    LEFT:  [37],
    UP:    [38],
    RIGHT: [39],
    DOWN:  [40],
    ENTER: [13],
    BACK:  [8, 27, 10009, 461], // Backspace, Esc, Tizen-Back, webOS-Back
    PLAY:  [415, 19, 463],
    PAUSE: [19, 415, 463],
    STOP:  [413],
    FWD:   [417, 228],
    REW:   [412, 227],
    RED:   [403],
  },

  // Standard-billede når et kort mangler plakat
  PLACEHOLDER: '📺',
};
