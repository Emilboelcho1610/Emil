# Installer MyTV på Samsung TV (Tizen)

Det her er en engangsopsætning. Når den er lavet, kan du bygge og sende nye
versioner til TV'et på få sekunder.

> Samsung kræver desværre at egne apps **signeres** med et certifikat knyttet
> til din Samsung-konto. Det lyder vildt, men Tizen Studio gør det meste for dig.

---

## Du skal bruge

- Din Samsung TV og din computer **på samme WiFi/netværk**
- En gratis **Samsung-konto** (https://account.samsung.com)
- **Tizen Studio** på din computer (Windows/macOS/Linux)

---

## 1. Slå Developer Mode til på TV'et

1. Åbn **Apps**-skærmen (Smart Hub).
2. Tast hurtigt **1 2 3 4 5** på fjernbetjeningen med tal-tasterne.
3. Et vindue "Developer mode" dukker op → sæt den til **On**.
4. Skriv **din computers IP-adresse** i feltet "Host PC IP".
   (Find den fx i din computers netværksindstillinger.)
5. Tryk **OK** og **genstart** TV'et.

> Find TV'ets egen IP under *Indstillinger → Generelt → Netværk → Netværksstatus → IP-indstillinger*. Den skal du bruge i trin 4.

---

## 2. Installer Tizen Studio

1. Hent **Tizen Studio** (med "TV extensions"): https://developer.tizen.org/development/tizen-studio/download
2. Installer det, og åbn **Package Manager** → installer:
   - *Tizen SDK Tools*
   - *TV Extensions* (Samsung Certificate Extension følger med)
3. Tilføj CLI'en til din PATH, så `tizen` og `sdb` virker i terminalen:
   - Stien er typisk `.../tizen-studio/tools/ide/bin` og `.../tizen-studio/tools`.

Test i en terminal:
```bash
tizen version
```

---

## 3. Lav et certifikat (engang)

1. Åbn **Certificate Manager** (følger med Tizen Studio).
2. Vælg **Samsung** → **Create** → **TV**.
3. Log ind med din Samsung-konto.
4. Lav et **Author certificate** (vælg et navn, fx `MyTVProfile`, og et kodeord).
5. Til **Distributor certificate** skal du angive TV'ets **DUID**:
   - DUID'en kan ses i Device Manager når TV'et er forbundet (næste trin),
     eller i Developer-mode-vinduet på TV'et.
6. Gem profilen. Husk profilnavnet – det bruges når vi signerer.

---

## 4. Forbind computeren til TV'et

```bash
sdb connect <TV-IP>           # fx: sdb connect 192.168.1.50
sdb devices                   # TV'et skal nu stå på listen
```

---

## 5. Byg og installer appen

I projektmappen:

```bash
# Byg + signér .wgt med din certifikat-profil:
./scripts/build-tizen.sh MyTVProfile

# Find device-id:
sdb devices

# Installer på TV'et:
tizen install -n dist/MyTV.wgt -t <device-id>
```

Appen ligger nu under **Apps** på TV'et. Åbn den, log ind med din udbyders
oplysninger, og du er i gang. 🎉

---

## Opdatere senere

Kør bare `./scripts/build-tizen.sh MyTVProfile` igen og `tizen install ...`.
Dine login-oplysninger og "fortsæt afspilning" bevares.

## Hyppige problemer

| Problem | Løsning |
|---|---|
| `sdb connect` timer ud | Tjek at Developer Mode er On, og at host-IP'en på TV'et er din computers IP. Genstart TV'et. |
| Installation afvist (certifikat) | DUID i distributor-certifikatet skal matche TV'et. Lav profilen om i Certificate Manager. |
| Appen lukker straks | Tjek netværk – TV og server skal kunne nå hinanden. |
| Sort skærm ved afspilning | Prøv en anden kanal/film; nogle streams er ude hos udbyderen. |
