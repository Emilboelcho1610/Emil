#!/usr/bin/env python3
"""Automatisk bogføring — henter fakturaer fra Meta, Shopify og Google Ads og bogfører i Dinero.

Brug:
    python main.py                          # Bogfør for indeværende måned
    python main.py --from 2024-01-01        # Bogfør fra en bestemt dato
    python main.py --from 2024-01-01 --to 2024-03-31  # Specifik periode
    python main.py --auto-book              # Bogfør automatisk (gør bilag endelige)
    python main.py --dry-run                # Vis hvad der ville blive bogført
"""

from __future__ import annotations

import argparse
import logging
import sys
from datetime import date, timedelta

from src.bookkeeper import Bookkeeper
from src.config import (
    load_dinero_config,
    load_google_ads_config,
    load_meta_config,
    load_shopify_config,
)
from src.connectors.google_ads import GoogleAdsConnector
from src.connectors.meta_ads import MetaAdsConnector
from src.connectors.shopify import ShopifyConnector
from src.dinero.client import DineroClient

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


def main() -> None:
    parser = argparse.ArgumentParser(description="Automatisk bogføring i Dinero")
    parser.add_argument("--from", dest="from_date", help="Startdato (YYYY-MM-DD)")
    parser.add_argument("--to", dest="to_date", help="Slutdato (YYYY-MM-DD)")
    parser.add_argument("--auto-book", action="store_true", help="Bogfør bilag automatisk")
    parser.add_argument("--dry-run", action="store_true", help="Vis hvad der ville blive bogført")
    args = parser.parse_args()

    # Datoer
    if args.from_date:
        from_date = date.fromisoformat(args.from_date)
    else:
        from_date = date.today().replace(day=1)  # Første dag i måneden

    to_date = date.fromisoformat(args.to_date) if args.to_date else date.today()

    logger.info("Bogfører periode: %s til %s", from_date, to_date)

    # Opsæt Dinero
    dinero_cfg = load_dinero_config()
    dinero = DineroClient(
        client_id=dinero_cfg.client_id,
        client_secret=dinero_cfg.client_secret,
        api_key=dinero_cfg.api_key,
        org_id=dinero_cfg.org_id,
    )

    # Opsæt connectors (kun dem der er konfigureret)
    meta = None
    meta_cfg = load_meta_config()
    if meta_cfg:
        meta = MetaAdsConnector(
            access_token=meta_cfg.access_token,
            ad_account_id=meta_cfg.ad_account_id,
        )
        logger.info("Meta Ads connector aktiveret")

    shopify = None
    shopify_cfg = load_shopify_config()
    if shopify_cfg:
        shopify = ShopifyConnector(
            shop_name=shopify_cfg.shop_name,
            access_token=shopify_cfg.access_token,
        )
        logger.info("Shopify connector aktiveret")

    google_ads = None
    gads_cfg = load_google_ads_config()
    if gads_cfg:
        google_ads = GoogleAdsConnector(
            developer_token=gads_cfg.developer_token,
            client_id=gads_cfg.client_id,
            client_secret=gads_cfg.client_secret,
            refresh_token=gads_cfg.refresh_token,
            customer_id=gads_cfg.customer_id,
        )
        logger.info("Google Ads connector aktiveret")

    if not any([meta, shopify, google_ads]):
        logger.error("Ingen connectors er konfigureret. Tilføj API-nøgler i .env filen.")
        sys.exit(1)

    # Dry run — vis kun fakturaer uden at bogføre
    if args.dry_run:
        logger.info("=== DRY RUN — ingen ændringer i Dinero ===")
        if meta:
            invoices = meta.fetch_invoices(from_date, to_date)
            for inv in invoices:
                print(f"  [META] {inv.invoice_date} | {inv.amount_excl_vat:.2f} {inv.currency} | {inv.description}")
        if shopify:
            invoices = shopify.fetch_invoices(from_date, to_date)
            for inv in invoices:
                print(f"  [SHOPIFY] {inv.invoice_date} | {inv.amount_excl_vat:.2f} {inv.currency} | {inv.description}")
        if google_ads:
            invoices = google_ads.fetch_invoices(from_date, to_date)
            for inv in invoices:
                print(f"  [GOOGLE] {inv.invoice_date} | {inv.amount_excl_vat:.2f} {inv.currency} | {inv.description}")
        return

    # Kør bogføring
    bookkeeper = Bookkeeper(
        dinero=dinero,
        meta=meta,
        shopify=shopify,
        google_ads=google_ads,
        auto_book=args.auto_book,
    )

    stats = bookkeeper.run(from_date, to_date)

    print(f"\n{'='*50}")
    print(f"Bogføring afsluttet!")
    print(f"  Fakturaer fundet:    {stats['total']}")
    print(f"  Bilag oprettet:      {stats['created']}")
    print(f"  Allerede bogført:    {stats['skipped']}")
    print(f"  Fejl:                {stats['errors']}")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
