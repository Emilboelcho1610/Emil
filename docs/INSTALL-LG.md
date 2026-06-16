# Installer MyTV på LG TV (webOS)

Engangsopsætning. LG kræver **ikke** et betalt certifikat – det er lidt
nemmere end Samsung.

> Vigtigt: LG's Developer Mode kører i **sessioner på ~50 timer**. Når en
> session udløber, åbner du bare "Developer Mode"-appen på TV'et igen og
> trykker **"Extend"** (den fornyer sig selv). Appen forbliver installeret.

---

## Du skal bruge

- Dit LG TV og din computer **på samme netværk**
- En gratis **LG-udviklerkonto**: https://webostv.developer.lge.com (Sign up)
- **webOS CLI** på computeren (kommer via npm – kræver Node.js)

---

## 1. Slå Developer Mode til på TV'et

1. På TV'et: åbn **LG Content Store**, søg efter **"Developer Mode"** og installer appen.
2. Åbn **Developer Mode**-appen.
3. Log ind med din **LG-udviklerkonto**.
4. Sæt **Dev Mode Status** til **On** → TV'et genstarter.
5. Åbn Developer Mode-appen igen og notér:
   - **TV'ets IP-adresse**
   - **Passphrase** (en kode der vises i appen – bruges til at parre)

---

## 2. Installer webOS CLI på computeren

```bash
npm install -g @webosose/ares-cli
ares --version       # test at det virker
```

---

## 3. Par computeren med TV'et (engang)

```bash
ares-setup-device
```

Vælg **add**, og udfyld:
- **name:** fx `mintv`
- **host:** TV'ets IP (fra trin 1)
- **port:** `9922`
- **user:** `prisoner`
- **auth type:** `password` → indtast **passphrase** fra Developer Mode-appen

Tjek forbindelsen:
```bash
ares-device-info --device mintv
```

---

## 4. Byg og installer appen

Du har to muligheder:

### A) Hent den færdige .ipk fra GitHub (nemmest)
GitHub bygger automatisk en `.ipk` ved hvert push. Hent den under
**Actions → seneste kørsel → Artifacts → `mytv-webos-ipk`**, og pak zip'en ud.

### B) Byg selv lokalt
```bash
npm run build:webos      # laver dist/com.emil.mytv_0.1.0_all.ipk
```

### Installer på TV'et
```bash
ares-install --device mintv dist/com.emil.mytv_*.ipk
ares-launch  --device mintv com.emil.mytv
```

Appen ligger nu blandt dine apps. Åbn den, log ind med din udbyders
oplysninger, og du er i gang. 🎉

---

## Opdatere senere

Byg/hent en ny `.ipk` og kør `ares-install ...` igen.
Login og "fortsæt afspilning" bevares.

## Hyppige problemer

| Problem | Løsning |
|---|---|
| `ares-setup-device` kan ikke forbinde | Tjek IP og at passphrase er tastet rigtigt. TV og computer skal være på samme netværk. |
| "Developer mode expired" | Åbn Developer Mode-appen på TV'et → tryk **Extend**. |
| Installation fejler | Kør `ares-device-info --device mintv` for at bekræfte forbindelsen først. |
| Sort skærm ved afspilning | Prøv en anden kanal/film; enkelte streams kan være nede hos udbyderen. |
