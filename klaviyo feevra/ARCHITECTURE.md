# Arkitektur — det komplette setup

Dette dokument viser hvordan alle dine Claude-værktøjer arbejder sammen i ét økosystem.

## Det store billede

```
┌─────────────────────────────────────────────────────────────────┐
│                          DU                                      │
└──────┬──────────────────┬──────────────────┬───────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌──────────────┐
│  claude.ai  │    │ Claude Code │    │  Din egen    │
│  (browser)  │    │  (terminal) │    │  Shopify-app │
│             │    │             │    │              │
│ • Artifacts │    │ • Filer     │    │ • Custom UI  │
│ • Visuelt   │    │ • Git       │    │ • API-kald   │
│   design    │    │ • MCP       │    │              │
│ • Mockups   │    │ • Skills    │    │              │
└──────┬──────┘    └──────┬──────┘    └──────┬───────┘
       │                  │                  │
       │ kopiér HTML      │ MCP-protokol     │ Shopify Admin API
       │                  │                  │
       │           ┌──────┴──────┐           │
       │           │             │           │
       ▼           ▼             ▼           ▼
   ┌──────────────────┐   ┌──────────────────┐
   │  klaviyo feevra  │   │  Shopify theme   │
   │  (denne MCP)     │   │  (CLI access)    │
   │                  │   │                  │
   │  REST → Klaviyo  │   │  Liquid + assets │
   └────────┬─────────┘   └────────┬─────────┘
            │                      │
            ▼                      ▼
      ┌──────────┐           ┌──────────┐
      │ Klaviyo  │           │ Shopify  │
      └──────────┘           └──────────┘
```

## Hvilken Claude bruger man hvornår?

### claude.ai (browser) + Artifacts
**Brug til**: Visuelt arbejde hvor du skal SE resultatet med det samme.
- Email-templates (HTML rendres live)
- Landing page mockups
- Pop-up design
- React-komponenter med preview
- Dashboard-mockups før byg

**Output**: HTML/CSS/React-kode du kopierer videre.

### Claude Code (denne CLI) + MCP-servere
**Brug til**: Alt der skal lande i et faktisk system.
- Pushe templates ind i Klaviyo
- Redigere Shopify theme-filer
- Køre scripts, byggekommandoer, deploys
- Versionsstyring (git)
- Automatisering med hooks og skills

**Output**: Ændringer commited i git, oprettet i Klaviyo, deployed til Shopify.

### Din egen Shopify-app (Claude API)
**Brug til**: Hverdagsopgaver i Shopify som ikke-tekniske kollegaer skal kunne lave.
- Backend-redigering uden terminal
- Kollega-venlig UI
- Domænespecifik logik der gentages dagligt

## Workflowet end-to-end (eksempel: Black Friday)

```
Mandag morgen — kampagneplanlægning
─────────────────────────────────────
[claude.ai]
"Design 3 varianter af BF hero-email til mit brand"
  → 3 Artifacts, du vælger #2
"Lav også en abandoned-cart variant og en post-purchase upsell"
  → 2 nye Artifacts klar
  → Du eksporterer HTML for alle 3

Mandag eftermiddag — produktion
─────────────────────────────────────
[Claude Code i klaviyo-feevra repo]
"Tag disse 3 HTML-templates, opret dem som 'BF26-hero',
 'BF26-abandoned', 'BF26-postpurchase'.
 Byg flow-modifikationer:
   - Læg BF26-abandoned ind i Abandoned Cart flow som override fra 25-30 nov
   - Byg ny kampagne med BF26-hero til segment 'engaged-90d'
   - Tilføj BF26-postpurchase til Post Purchase flow
 Send test af alle 3 til mig."
  → MCP kalder Klaviyo
  → Du får 3 test-mails
  → Du godkender

[Samtidig — Claude Code i Shopify theme repo]
"Opdatér homepage hero med BF-banner, tilføj countdown-timer,
 byg ny BF-collection page med disse 8 produkter."
  → Theme-filer ændres + commited
  → Deploy til preview-tema → du tjekker → publish

Tirsdag — performance
─────────────────────────────────────
[Claude Code]
"Træk åbnings/klik for BF-kampagnen sidste 24t,
 sammenlign med sidste års BF.
 Hvilke segmenter performer dårligst?
 Foreslå et send-2-flow til ikke-åbnere."
  → MCP henter metrics
  → Analyse + anbefaling
  → "Ja, byg det" → flow oprettet
```

Hele uge-workflowet uden at logge ind i Klaviyo eller Shopify-admin én eneste gang.

## Når det giver mening at bygge endnu en MCP

Mønstret her (`klaviyo feevra`) kan kopieres til alle dine ecommerce-værktøjer:

| System | Værdi af MCP |
|--------|-------------|
| Klaviyo | Email/SMS automation (DENNE) |
| Google Analytics 4 | Trafik + konvertering pull |
| Meta Ads / Google Ads | Kampagne-styring + budget |
| Lager-system (fx Pickware) | Stock-niveauer + reorder |
| Regnskab (Dinero/e-conomic) | Faktura/regnskabs-data |
| Trustpilot/anmeldelser | Auto-svar, NPS-tracking |

Hver MCP = 1-2 dages arbejde for én vi har den slags som denne — så kom kun i gang når smerten er der.

## Skills vs MCP — hvad er forskellen?

- **MCP = nye tools/handlinger** ("Claude kan nu tale med Klaviyo")
- **Skill = en opskrift der bruger eksisterende tools** ("når jeg siger 'lav BF-kampagne', så følg disse 7 skridt")

Skills lægger sig oven på MCP'en. Når du har lavet samme arbejdsgang 3 gange, lav den om til en skill.
