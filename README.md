# Emil — Automatisk Bogføring i Dinero

Automatiseret bogføringssystem der henter fakturaer fra Meta Ads, Shopify og Google Ads og bogfører dem i Dinero.

## Platforme

| Platform | Hvad der hentes | Momskode |
|----------|----------------|----------|
| **Meta Ads** | Annoncefakturaer (Facebook/Instagram) | IREV (reverse charge) |
| **Shopify** | Abonnement + Payments-gebyrer | IREV (reverse charge) |
| **Google Ads** | Annoncefakturaer | IREV (reverse charge) |

## Opsætning

### 1. Installer dependencies

```bash
pip install -r requirements.txt
```

### 2. Konfigurer API-nøgler

Kopier `.env.example` til `.env` og udfyld dine API-nøgler:

```bash
cp .env.example .env
```

### 3. Kør bogføring

```bash
# Bogfør for indeværende måned
python main.py

# Bogfør for en specifik periode
python main.py --from 2024-01-01 --to 2024-03-31

# Dry run — se hvad der ville blive bogført uden at ændre noget
python main.py --dry-run

# Automatisk bogføring (gør bilag endelige i Dinero)
python main.py --auto-book
```

## Sådan får du API-adgang

### Dinero
1. Log ind på [dinero.dk](https://dinero.dk)
2. Gå til **Indstillinger > Integrationer > API**
3. Opret en API-nøgle og noter organisation-ID

### Meta Ads
1. Gå til [developers.facebook.com](https://developers.facebook.com)
2. Opret en app med `ads_read` rettighed
3. Generer et langtids-brugertoken
4. Find dit Ad Account ID (starter med `act_`)

### Shopify
1. Gå til din Shopify Admin > **Apps > Udvikl apps**
2. Opret en privat app med `read_shopify_payments_payouts` og `read_orders` scopes
3. Kopier Access Token

### Google Ads
1. Ansøg om Developer Token via [Google Ads API Center](https://ads.google.com/aw/apicenter)
2. Opret OAuth2 credentials i Google Cloud Console
3. Generer et refresh token via OAuth2 flow

## Arkitektur

```
src/
  config.py              # Miljøvariabel-indlæsning
  bookkeeper.py          # Hovedorkestrering
  dinero/
    client.py            # Dinero API-klient
  connectors/
    meta_ads.py          # Meta/Facebook Ads connector
    shopify.py           # Shopify connector
    google_ads.py        # Google Ads connector
  models/
    invoice.py           # Fælles faktura-datamodel
```

## Kontoplan

Standard-mapping (kan tilpasses i `src/models/invoice.py`):

- **2220** — Reklameudgifter (Meta Ads, Google Ads)
- **2000** — IT-udgifter / Vareforbrug (Shopify)
- **6872** — Indgående moms (købsmoms)
