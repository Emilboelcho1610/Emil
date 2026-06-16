# MyTV 📺

Min egen IPTV-afspiller til **Samsung (Tizen)** og **LG (webOS)** Smart TV.

Et moderne, hurtigt alternativ til TiViMate / IBO Player. Appen taler med en
almindelig **Xtream Codes**-server (det format de fleste IPTV-udbydere bruger)
og viser Live TV, Film og Serier i et interface lavet til fjernbetjening.

> **Bemærk:** Appen indeholder *ingen* kanaler, film eller login-oplysninger.
> Den er kun en afspiller til **dit eget, lovlige abonnement**. Du taster selv
> server, brugernavn og adgangskode ind på TV'et første gang – og det gemmes
> kun lokalt på TV'et.

---

## Funktioner

- 🔐 Login med din udbyders host + brugernavn + kode (gemmes kun lokalt)
- 📺 **Live TV** med kategorier og "nu og næste" programinfo (EPG)
- 🎬 **Film** med plakater, beskrivelse og bedømmelse
- 📚 **Serier** med sæsoner og afsnit
- ▶️ **Fortsæt afspilning** – husker hvor du kom til i film/afsnit
- ⭐ **Favoritter**
- 🔍 **Søgning** på tværs af film og serier
- 🎮 Fuld fjernbetjenings-navigation (pil-taster, OK, tilbage, medietaster)
- ⚡ Native afspiller på Samsung (AVPlay) for bedst format-understøttelse

---

## Sådan kommer den på dit TV

Vælg din platform:

- **Samsung TV** → se [`docs/INSTALL-SAMSUNG.md`](docs/INSTALL-SAMSUNG.md)
- **LG TV** → se [`docs/INSTALL-LG.md`](docs/INSTALL-LG.md)

Kort fortalt skal du én gang:
1. Slå **Developer Mode** til på TV'et.
2. Bygge appen til en pakke (`.wgt` til Samsung, `.ipk` til LG).
3. Sende pakken til TV'et over dit hjemmenetværk.

GitHub bygger automatisk en færdig **LG `.ipk`** ved hvert push – du kan hente
den under fanen **Actions → seneste kørsel → Artifacts** (`mytv-webos-ipk`).

---

## Test på en computer først (valgfrit)

Du kan se interfacet i en almindelig browser uden et TV:

```bash
npm run dev
# åbn http://localhost:5173/?proxy=1
```

`?proxy=1` får testserveren til at hente data for dig, så browseren ikke
blokerer for forbindelsen til din IPTV-server (det problem findes ikke på et
rigtigt TV).

---

## Projektstruktur

```
app/                Selve web-appen (HTML/CSS/JS) – delt af begge platforme
  index.html
  css/style.css
  js/                Logik: api, navigation, afspiller, views
tizen/config.xml     Samsung-manifest
webos/appinfo.json   LG-manifest
scripts/             Bygge- og hjælpescripts
docs/                Installationsguider (dansk)
.github/workflows/   Automatisk build
```

## Byg lokalt

```bash
# LG webOS (.ipk)  – kræver:  npm i -g @webosose/ares-cli
npm run build:webos

# Samsung Tizen (.wgt) – kræver Tizen Studio CLI + certifikat
npm run build:tizen
```

Pakkerne lægges i `dist/`.

---

*Lavet med hjælp fra Claude. Til privat brug af eget abonnement.*
