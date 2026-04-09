"""Automatisk bogfører — henter fakturaer fra alle platforme og bogfører i Dinero.

Flow:
1. Hent fakturaer fra Meta Ads, Shopify og Google Ads
2. For hver faktura:
   a. Find/opret kontakt i Dinero
   b. Opret købsbilag med korrekte konti og momskoder
   c. Upload faktura-PDF hvis tilgængelig
   d. (Valgfrit) Bogfør bilaget
"""

from __future__ import annotations

import json
import logging
from datetime import date
from pathlib import Path
from typing import Optional

from src.connectors.google_ads import GoogleAdsConnector
from src.connectors.meta_ads import MetaAdsConnector
from src.connectors.shopify import ShopifyConnector
from src.dinero.client import DineroClient
from src.models.invoice import ACCOUNT_MAP, Invoice, InvoiceSource

logger = logging.getLogger(__name__)

# Fil der holder styr på allerede bogførte fakturaer (undgår dubletter)
LEDGER_FILE = Path("data/processed_invoices.json")


class Bookkeeper:
    """Hovedorkestrering af automatisk bogføring."""

    def __init__(
        self,
        dinero: DineroClient,
        meta: Optional[MetaAdsConnector] = None,
        shopify: Optional[ShopifyConnector] = None,
        google_ads: Optional[GoogleAdsConnector] = None,
        auto_book: bool = False,
    ):
        self.dinero = dinero
        self.meta = meta
        self.shopify = shopify
        self.google_ads = google_ads
        self.auto_book = auto_book
        self._processed = self._load_processed()

    # ── Hovedfunktion ────────────────────────────────────────────────

    def run(self, from_date: date, to_date: Optional[date] = None) -> dict:
        """Kør fuld bogføring for en given periode.

        Returns:
            dict med statistik: {"total": int, "created": int, "skipped": int, "errors": int}
        """
        to_date = to_date or date.today()
        stats = {"total": 0, "created": 0, "skipped": 0, "errors": 0}

        # Hent fakturaer fra alle tilsluttede platforme
        all_invoices = self._fetch_all_invoices(from_date, to_date)
        stats["total"] = len(all_invoices)
        logger.info("Fandt %d fakturaer i alt", len(all_invoices))

        for invoice in all_invoices:
            # Spring over allerede bogførte
            if invoice.invoice_id in self._processed:
                logger.info("Springer over (allerede bogført): %s", invoice.invoice_id)
                stats["skipped"] += 1
                continue

            try:
                self._process_invoice(invoice)
                stats["created"] += 1
                self._mark_processed(invoice)
            except Exception as e:
                logger.error("Fejl ved bogføring af %s: %s", invoice.invoice_id, e)
                stats["errors"] += 1

        logger.info(
            "Bogføring afsluttet: %d oprettet, %d sprunget over, %d fejl",
            stats["created"], stats["skipped"], stats["errors"],
        )
        return stats

    # ── Intern logik ─────────────────────────────────────────────────

    def _fetch_all_invoices(self, from_date: date, to_date: date) -> list[Invoice]:
        """Hent fakturaer fra alle aktive connectors."""
        invoices: list[Invoice] = []

        if self.meta:
            try:
                invoices.extend(self.meta.fetch_invoices(from_date, to_date))
            except Exception as e:
                logger.error("Fejl ved hentning fra Meta Ads: %s", e)

        if self.shopify:
            try:
                invoices.extend(self.shopify.fetch_invoices(from_date, to_date))
            except Exception as e:
                logger.error("Fejl ved hentning fra Shopify: %s", e)

        if self.google_ads:
            try:
                invoices.extend(self.google_ads.fetch_invoices(from_date, to_date))
            except Exception as e:
                logger.error("Fejl ved hentning fra Google Ads: %s", e)

        return invoices

    def _process_invoice(self, invoice: Invoice) -> None:
        """Behandl én faktura: opret kontakt, bilag, upload PDF."""

        # 1. Find/opret kontakt
        contact_guid = self.dinero.find_or_create_contact(invoice.vendor_name)

        # 2. Bestem kontonummer og momskode
        account_number = ACCOUNT_MAP.get(invoice.source, 2220)
        vat_code = self._determine_vat_code(invoice)

        # 3. Byg bilagslinjer
        lines = []
        if invoice.line_items:
            for item in invoice.line_items:
                lines.append({
                    "AccountNumber": item.account_number or account_number,
                    "Amount": item.amount_excl_vat,
                    "VatCode": vat_code,
                    "Description": item.description,
                })
        else:
            lines.append({
                "AccountNumber": account_number,
                "Amount": invoice.amount_excl_vat,
                "VatCode": vat_code,
                "Description": invoice.description,
            })

        # 4. Opret bilag i Dinero
        voucher = self.dinero.create_purchase_voucher(
            contact_guid=contact_guid,
            voucher_date=invoice.invoice_date,
            description=invoice.description,
            lines=lines,
            due_date=invoice.due_date,
            external_reference=invoice.invoice_id,
            currency=invoice.currency,
        )

        voucher_guid = voucher.get("VoucherGuid", voucher.get("Guid"))

        # 5. Upload PDF hvis tilgængelig
        if invoice.pdf_bytes and voucher_guid:
            self.dinero.upload_file_to_voucher(
                voucher_guid=voucher_guid,
                filename=f"{invoice.source.value}_{invoice.invoice_id}.pdf",
                file_bytes=invoice.pdf_bytes,
            )
        elif invoice.pdf_url and voucher_guid:
            self._download_and_attach_pdf(invoice, voucher_guid)

        # 6. Bogfør hvis auto_book er slået til
        if self.auto_book and voucher_guid:
            self.dinero.book_voucher(voucher_guid)
            logger.info("Bilag bogført: %s", voucher_guid)

    def _download_and_attach_pdf(self, invoice: Invoice, voucher_guid: str) -> None:
        """Download og vedhæft faktura-PDF baseret på kilde."""
        pdf_bytes = None

        if invoice.source == InvoiceSource.META and self.meta:
            pdf_bytes = self.meta.fetch_invoice_pdf(invoice.invoice_id)
        elif invoice.source == InvoiceSource.GOOGLE_ADS and self.google_ads and invoice.pdf_url:
            pdf_bytes = self.google_ads.fetch_invoice_pdf(invoice.pdf_url)

        if pdf_bytes:
            self.dinero.upload_file_to_voucher(
                voucher_guid=voucher_guid,
                filename=f"{invoice.source.value}_{invoice.invoice_id}.pdf",
                file_bytes=pdf_bytes,
            )

    @staticmethod
    def _determine_vat_code(invoice: Invoice) -> str:
        """Bestem momskode baseret på leverandør og kilde.

        Danske momskoder i Dinero:
        - "I25": 25% indgående moms (dansk leverandør)
        - "IREV": Reverse charge / EU-køb (Meta, Google, Shopify)
        - "I0": Momsfrit køb
        """
        # Meta, Google og Shopify fakturerer fra Irland → reverse charge
        if invoice.source in (InvoiceSource.META, InvoiceSource.GOOGLE_ADS, InvoiceSource.SHOPIFY):
            return "IREV"  # EU reverse charge

        # Dansk leverandør med moms
        if invoice.vat_amount > 0:
            return "I25"

        return "I0"

    # ── Dubletbeskyttelse ────────────────────────────────────────────

    def _load_processed(self) -> set[str]:
        """Indlæs liste over allerede bogførte faktura-ID'er."""
        if LEDGER_FILE.exists():
            data = json.loads(LEDGER_FILE.read_text())
            return set(data)
        return set()

    def _mark_processed(self, invoice: Invoice) -> None:
        """Marker en faktura som bogført."""
        self._processed.add(invoice.invoice_id)
        LEDGER_FILE.parent.mkdir(parents=True, exist_ok=True)
        LEDGER_FILE.write_text(json.dumps(sorted(self._processed), indent=2))
