# Klaviyo Feevra

Komplet setup der giver Claude direkte adgang til din Klaviyo-konto via Model Context Protocol (MCP).

Sammen med din eksisterende Shopify-backend-app betyder det at Claude kan:

- Designe email-templates visuelt i claude.ai (Artifacts) og pushe dem ind i Klaviyo automatisk
- Oprette/opdatere flows, segmenter, lister og kampagner direkte fra en samtale
- Trække performance-data ud, analysere og foreslå optimering — uden du logger ind i Klaviyo

## Arkitektur (kort version)

```
[claude.ai + Artifacts]   designer HTML-template visuelt
            │
            ▼  HTML
[Claude Code (denne CLI)] kalder Klaviyo MCP
            │
            ▼  MCP-tools
[klaviyo-feevra MCP]      taler med Klaviyo REST API
            │
            ▼  HTTPS
[din Klaviyo-konto]
```

Se `ARCHITECTURE.md` for det fulde billede inkl. hvordan Shopify-appen, Artifacts og MCP'en spiller sammen.

## Hurtig opsætning (5 min)

### 1. Hent en Klaviyo Private API-nøgle
- Klaviyo → Account → Settings → API Keys → Create Private API Key
- Giv den scopes: `Templates: Full`, `Flows: Full`, `Campaigns: Full`, `Lists: Full`, `Segments: Full`, `Profiles: Full`, `Metrics: Read`
- Kopiér nøglen (starter med `pk_`)

### 2. Installér
```bash
npm install
cp .env.example .env
# læg din pk_... ind i .env
```

### 3. Test at den taler med Klaviyo
```bash
npm run smoke
```
Forventet output: liste over dine eksisterende templates.

### 4. Aktivér i Claude Code
`.claude/settings.json` i repo-roden er allerede konfigureret. Næste gang du starter Claude Code i denne mappe, er MCP'en aktiv. Verificér:

```
> /mcp
```

Du bør se `klaviyo-feevra` med status `connected`.

## Hvad MCP'en kan (tools)

| Tool | Hvad den gør |
|------|-------------|
| `list_templates` | Lister alle email-templates |
| `get_template` | Henter én template (HTML + metadata) |
| `create_template` | Opretter ny template fra HTML |
| `update_template` | Opdaterer eksisterende template |
| `render_template` | Render preview med test-context |
| `list_flows` | Lister flows + status |
| `get_flow` | Henter flow-konfiguration |
| `list_campaigns` | Lister kampagner |
| `create_campaign` | Opretter ny kampagne |
| `send_campaign_test` | Sender test-mail til dig |
| `list_segments` | Lister segmenter |
| `create_segment` | Opretter segment med conditions |
| `list_lists` | Lister abonnementslister |
| `get_metric_aggregate` | Trækker analytics (åbnings-rate, klik osv.) |
| `search_profiles` | Slår profiler op |

## Typisk workflow

**Opret BF-kampagne fra bunden:**

1. I claude.ai: "Design en Black Friday hero-email til mit brand, dark mode, countdown, 3 produkter" → Artifact rendres → du itererer
2. Eksportér HTML fra Artifact
3. I Claude Code (her): "Brug HTML'en herunder, opret template 'BF-2026-hero', byg en kampagne målrettet segment 'engaged-90d', schedulér til 27. november 06:00, send test til mig først"
4. Claude kalder MCP'en: `create_template` → `create_campaign` → `send_campaign_test`
5. Du tjekker test-mailen, godkender, og siger "send live"

## Skills

Færdige workflows ligger i `skills/`. Pt:
- `new-campaign/` — opret kampagne fra brief til schedulér

Udvid selv ved at lægge en ny mappe med `SKILL.md` ind.

## Sikkerhed

- `.env` er gitignored — push ALDRIG din API-nøgle
- Roter nøglen i Klaviyo hvis du tror den er lækket
- MCP'en kører 100% lokalt på din maskine — kalder kun ud til Klaviyo
