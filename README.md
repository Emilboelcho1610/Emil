# Emil

Min Claude-arbejdsbænk for ecommerce. Indeholder MCP-servere, skills og kode der lader Claude operere direkte i mine værktøjer.

## Indhold

- **`klaviyo feevra/`** — MCP-server der giver Claude direkte adgang til Klaviyo (templates, flows, kampagner, segmenter, metrics). Se mappens `README.md` for opsætning.

## Kom i gang

1. Klon dette repo til din maskine (fx på LaCie):
   ```bash
   cd /Volumes/LaCie/<din-mappe>
   git clone <repo-url> Emil
   cd Emil
   ```
2. Sæt Klaviyo-MCP'en op — se `klaviyo feevra/README.md`
3. Start Claude Code i repo-roden — `.claude/settings.json` aktiverer MCP'en automatisk

## Roadmap (forslag)

- `shopify-admin/` — flytte din eksisterende Shopify-app ind som MCP for genbrug
- `ga4/` — Google Analytics 4 MCP til performance-pull
- `meta-ads/` — Meta-ads MCP til kampagne-styring
- `skills/` på rod-niveau — gentagne workflows på tværs af systemer
