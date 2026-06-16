#!/usr/bin/env node
/* Samler en byggeklar mappe for en platform:
 *   node scripts/assemble.js tizen   -> build/tizen/  (web-app + config.xml + icon)
 *   node scripts/assemble.js webos   -> build/webos/  (web-app + appinfo.json + icon)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const platform = process.argv[2];
if (!['tizen', 'webos'].includes(platform)) {
  console.error('Brug: node scripts/assemble.js <tizen|webos>');
  process.exit(1);
}

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const out = path.join(ROOT, 'build', platform);
fs.rmSync(out, { recursive: true, force: true });

// 1) Kopiér selve web-appen
copyDir(path.join(ROOT, 'app'), out);

// 2) Læg platform-manifestet + ikon oveni
if (platform === 'tizen') {
  fs.copyFileSync(path.join(ROOT, 'tizen', 'config.xml'), path.join(out, 'config.xml'));
  fs.copyFileSync(path.join(ROOT, 'tizen', 'icon.png'), path.join(out, 'icon.png'));
} else {
  fs.copyFileSync(path.join(ROOT, 'webos', 'appinfo.json'), path.join(out, 'appinfo.json'));
  fs.copyFileSync(path.join(ROOT, 'webos', 'icon.png'), path.join(out, 'icon.png'));
}

console.log('Samlet', platform, '->', path.relative(ROOT, out));
