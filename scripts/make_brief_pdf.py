#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genererer en projekt-overdragelses-PDF (dansk) uden eksterne biblioteker.
Bruger kun standardbiblioteket. Tekst kodes som WinAnsi/latin-1 (æøå virker)."""

PAGE_W, PAGE_H = 595, 842
LEFT, RIGHT, TOP, BOT = 56, 56, 800, 56
MAXW = PAGE_W - LEFT - RIGHT

# (font, størrelse, linjehøjde-faktor, mellemrum før, mellemrum efter, avg-bredde-faktor)
STYLES = {
    'h1':     ('F2', 22, 1.3, 14, 8, 0.55),
    'h2':     ('F2', 14, 1.35, 16, 5, 0.55),
    'body':   ('F1', 11, 1.45, 0, 6, 0.52),
    'lead':   ('F2', 11.5, 1.4, 2, 4, 0.55),
    'bullet': ('F1', 11, 1.4, 0, 4, 0.52),
    'code':   ('F3', 9.5, 1.35, 1, 1, 0.60),
    'small':  ('F1', 9, 1.4, 6, 4, 0.52),
}

def esc(s):
    return s.replace('\\', r'\\').replace('(', r'\(').replace(')', r'\)')

def wrap(text, size, factor, maxw):
    words = text.split(' ')
    lines, cur = [], ''
    for w in words:
        trial = w if not cur else cur + ' ' + w
        if not cur or len(trial) * size * factor <= maxw:
            cur = trial
        else:
            lines.append(cur); cur = w
    if cur or not lines:
        lines.append(cur)
    return lines

# Indhold: liste af (style, tekst)
CONTENT = [
 ('h1', 'MyTV - Projektoverdragelse til Claude'),
 ('small', 'Dato: 16. juni 2026  -  lavet sammen med Claude Code'),
 ('body', 'Dette dokument beskriver min app og hvad jeg gerne vil have bygget videre. '
          'Giv det til Claude pa min computer i morgen, sa kan arbejdet fortsaette praecis '
          'hvor vi slap.'),

 ('h2', '1. Kopier denne besked til Claude'),
 ('body', 'Start en ny session og indsaet teksten herunder:'),
 ('code', 'Hej Claude. Jeg har en egen IPTV-afspiller (MyTV) til mit Samsung-'),
 ('code', '(Tizen) og LG-TV (webOS). Foerste version er allerede bygget i en'),
 ('code', 'tidligere session og ligger i min GitHub-repo:'),
 ('code', '    Emilboelcho1610/Emil'),
 ('code', 'paa branchen:'),
 ('code', '    claude/custom-iptv-tv-player-0kqjen'),
 ('code', ''),
 ('code', 'Hent koden fra den branch og fortsaet derfra. Laes resten af dette'),
 ('code', 'dokument for praecis hvad jeg vil have tilfoejet og aendret.'),
 ('code', ''),
 ('code', 'Vigtigt: Laeg ALDRIG mine login-oplysninger i koden - de skal kun'),
 ('code', 'tastes ind paa TV-et. Og hjaelp mig med at holde min repo privat.'),

 ('h2', '2. Hvad er projektet'),
 ('body', 'En egen, gratis afspiller-app som alternativ til TiViMate / IBO Player. Den taler '
          'med en almindelig Xtream Codes-server (host + brugernavn + adgangskode) og viser '
          'Live TV, Film og Serier.'),
 ('body', 'Den skal koere paa baade Samsung (Tizen) og LG (webOS). Begge bruger web-teknologi '
          '(HTML/CSS/JS), saa een kodebase pakkes til begge: .wgt til Samsung og .ipk til LG.'),

 ('h2', '3. Hvad er allerede bygget (version 0.1.0)'),
 ('bullet', 'Login-skaerm - jeg taster selv host/brugernavn/kode ind; gemmes kun lokalt paa TV-et.'),
 ('bullet', 'Live TV med kategorier og "nu og naeste" programinfo (EPG).'),
 ('bullet', 'Film med plakater, beskrivelse og bedoemmelse.'),
 ('bullet', 'Serier med saesoner og afsnit.'),
 ('bullet', 'Fortsaet afspilning, favoritter og soegning.'),
 ('bullet', 'Fuld fjernbetjenings-navigation (piletaster, OK, tilbage).'),
 ('bullet', 'Native AVPlay-afspiller paa Samsung, HTML5 ellers.'),
 ('bullet', 'Dev-server til browser-test, build-scripts og GitHub Actions der bygger LG-pakken automatisk.'),
 ('body', 'Filstruktur: app/ (selve appen: index.html, css/, js/ med api, navigation, player og '
          'views), tizen/ og webos/ (manifest + ikon), scripts/ (build), docs/ (danske '
          'installationsguider).'),

 ('h2', '4. Det jeg gerne vil have tilfoejet og aendret'),

 ('lead', 'A) Velkomst-animation naar appen aabner'),
 ('bullet', 'Der skal sta WELCOME KING EMIL naar appen starter.'),
 ('bullet', 'Det skal se ud som et Apple-agtigt, blankt/glossy ikon: glas-effekt, blod skygge, fin glans/refleks.'),
 ('bullet', 'Teksten/ikonet skal fade blodt ud - ligesom Netflix-introen - og derefter glide over i appen.'),

 ('lead', 'B) Super moderne Apple-look i hele appen'),
 ('bullet', 'Hele interfacet skal have en ren, moderne Apple-vibe: masser af luft, blode runde hjorner, fine skygger, elegante overgange og animationer.'),
 ('bullet', 'Det skal vaere MEGET nemt at navigere i med fjernbetjeningen.'),
 ('bullet', 'Tydeligt, roligt og flot - ikke rodet eller gammeldags som de eksisterende apps.'),

 ('lead', 'C) Sla kategorier til og fra i Indstillinger'),
 ('bullet', 'I Indstillinger skal jeg kunne sla enkelte kategorier (og Live/Film/Serier) til og fra.'),
 ('bullet', 'De fravalgte kategorier skal skjules i menuen og pa forsiden.'),
 ('bullet', 'Indstillingen skal huskes (gemmes lokalt paa TV-et).'),

 ('h2', '5. Login og privatliv (vigtigt)'),
 ('bullet', 'Mine login-oplysninger ma ALDRIG ligge i koden eller pa GitHub - kun tastes ind pa TV-et.'),
 ('bullet', 'Min GitHub-repo skal vaere privat: Settings -> Danger Zone -> Change visibility -> Private.'),
 ('bullet', 'Jeg overvejer at fa min adgangskode nulstillet hos udbyderen for en sikkerheds skyld.'),

 ('h2', '6. Saadan bygges og installeres'),
 ('bullet', 'Test i browser: kor "npm run dev" og aabn http://localhost:5173/?proxy=1'),
 ('bullet', 'LG (.ipk): "npm run build:webos" - eller hent faerdig .ipk fra GitHub Actions. Se docs/INSTALL-LG.md.'),
 ('bullet', 'Samsung (.wgt): "npm run build:tizen" (kraever Tizen Studio + certifikat). Se docs/INSTALL-SAMSUNG.md.'),

 ('h2', '7. Teknisk note til Claude'),
 ('bullet', 'Serveren bruger Xtream Codes API: player_api.php?username=...&password=... med actions som get_live_categories, get_live_streams, get_vod_streams, get_series_info.'),
 ('bullet', 'Stream-URLs: /live/USER/PASS/ID.m3u8 (live), /movie/.../ID.ext, /series/.../ID.ext.'),
 ('bullet', 'Pa rigtige TV-er er der ingen CORS/mixed-content-problemer; dev-proxyen er kun til desktop-test.'),
 ('bullet', 'Behold den eksisterende spatial-navigation og afspiller-abstraktion; byg det nye Apple-design ovenpaa.'),

 ('body', 'Tak! - Emil'),
]

# --- Layout: byg liste af tekst-operationer pr. side ---
pages, ops = [], []
y = TOP

def newpage():
    global ops, y
    pages.append(ops); ops = []; y = TOP

for style, text in CONTENT:
    font, size, lh, before, after, fac = STYLES[style]
    y -= before
    bullet = style == 'bullet'
    x = LEFT + (18 if bullet else 0)
    avail = MAXW - (18 if bullet else 0)
    lines = wrap(text, size, fac, avail) if text else ['']
    for i, line in enumerate(lines):
        if y < BOT:
            newpage()
        if bullet and i == 0:
            ops.append((LEFT + 4, y, 'F1', size, '-'))
        ops.append((x, y, font, size, line))
        y -= size * lh
    y -= after

pages.append(ops)

# --- Skriv PDF ---
objs = []
def add(obj): objs.append(obj); return len(objs)

# Reserver: 1=catalog, 2=pages. Sider og streams tilfoejes derefter.
catalog_id, pages_id = 1, 2
objs = ['', '']  # pladsholdere

page_ids, content_ids = [], []
for ops_page in pages:
    # byg content stream
    parts = []
    for (x, yy, font, size, txt) in ops_page:
        parts.append(f"BT /{font} {size} Tf 1 0 0 1 {x:.1f} {yy:.1f} Tm ({esc(txt)}) Tj ET")
    stream = "\n".join(parts).encode('latin-1', 'replace')
    cid = add(b'STREAM' + stream)  # markeres; udfyldes senere
    content_ids.append(len(objs))
    pid = add(b'PAGE')
    page_ids.append(len(objs))

# Fonts
f1 = add('FONT Helvetica'); f1_id = len(objs)
f2 = add('FONT Helvetica-Bold'); f2_id = len(objs)
f3 = add('FONT Courier'); f3_id = len(objs)

# Nu hvor vi kender id'er, byg de rigtige objekt-strenge
def font_obj(base):
    return (f"<< /Type /Font /Subtype /Type1 /BaseFont /{base} "
            f"/Encoding /WinAnsiEncoding >>").encode('latin-1')

real = [None] * (len(objs) + 1)  # 1-indekseret
real[catalog_id] = f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode()
kids = " ".join(f"{pid} 0 R" for pid in page_ids)
real[pages_id] = (f"<< /Type /Pages /Count {len(page_ids)} /Kids [{kids}] >>").encode()

idx = 3
for n, ops_page in enumerate(pages):
    parts = []
    for (x, yy, font, size, txt) in ops_page:
        parts.append(f"BT /{font} {size} Tf 1 0 0 1 {x:.1f} {yy:.1f} Tm ({esc(txt)}) Tj ET")
    stream = ("\n".join(parts)).encode('latin-1', 'replace')
    cid = content_ids[n]; pid = page_ids[n]
    real[cid] = b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream"
    res = (f"<< /Font << /F1 {f1_id} 0 R /F2 {f2_id} 0 R /F3 {f3_id} 0 R >> >>")
    real[pid] = (f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] "
                 f"/Resources {res} /Contents {cid} 0 R >>").encode()

real[f1_id] = font_obj('Helvetica')
real[f2_id] = font_obj('Helvetica-Bold')
real[f3_id] = font_obj('Courier')

# Saml fil + xref
out = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
offsets = [0] * (len(real))
for i in range(1, len(real)):
    offsets[i] = len(out)
    out += f"{i} 0 obj\n".encode() + real[i] + b"\nendobj\n"

xref_pos = len(out)
n = len(real)
out += f"xref\n0 {n}\n".encode()
out += b"0000000000 65535 f \n"
for i in range(1, n):
    out += f"{offsets[i]:010d} 00000 n \n".encode()
out += (f"trailer\n<< /Size {n} /Root {catalog_id} 0 R >>\n"
        f"startxref\n{xref_pos}\n%%EOF").encode()

with open('MyTV-Claude-brief.pdf', 'wb') as f:
    f.write(out)
print('Skrev MyTV-Claude-brief.pdf -', len(pages), 'side(r),', len(out), 'bytes')
