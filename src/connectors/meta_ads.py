"""Connector til Meta / Facebook Ads fakturering.

Henter faktura-data via Facebook Marketing API.
Meta fakturerer typisk for annonceforbrug og trækker moms (reverse charge for DK).
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Optional

import requests

from src.models.invoice import Invoice, InvoiceSource, LineItem

logger = logging.getLogger(__name__)

GRAPH_API_BASE = "https://graph.facebook.com/v19.0"


class MetaAdsConnector:
    """Henter fakturaer fra Meta/Facebook Ads."""

    def __init__(self, access_token: str, ad_account_id: str):
        """
        access_token: Langtids-brugertoken med ads_read rettighed.
        ad_account_id: F.eks. 'act_123456789'.
        """
        self.access_token = access_token
        self.ad_account_id = ad_account_id
        self._session = requests.Session()

    def _get(self, endpoint: str, params: Optional[dict] = None) -> dict:
        params = params or {}
        params["access_token"] = self.access_token
        url = f"{GRAPH_API_BASE}/{endpoint}"
        resp = self._session.get(url, params=params)
        resp.raise_for_status()
        return resp.json()

    def fetch_invoices(
        self,
        from_date: date,
        to_date: Optional[date] = None,
    ) -> list[Invoice]:
        """Hent alle fakturaer fra Meta Ads i en given periode.

        Bruger /{ad_account_id}/invoices endpointet.
        """
        to_date = to_date or date.today()

        data = self._get(
            f"{self.ad_account_id}/invoices",
            params={
                "fields": "id,billing_period,amount,currency,entity_name,payment_term",
                "time_range": f'{{"since":"{from_date.isoformat()}","until":"{to_date.isoformat()}"}}',
            },
        )

        invoices: list[Invoice] = []
        for entry in data.get("data", []):
            invoice_date = self._parse_billing_period(entry.get("billing_period", ""))

            # Meta fakturerer fra Irland — reverse charge for dansk moms
            amount = float(entry.get("amount", 0)) / 100  # Meta returnerer i cents
            currency = entry.get("currency", "DKK")

            inv = Invoice(
                source=InvoiceSource.META,
                invoice_id=entry["id"],
                invoice_date=invoice_date,
                due_date=None,
                amount_excl_vat=amount,
                vat_amount=0.0,  # Reverse charge — ingen moms på faktura
                amount_incl_vat=amount,
                currency=currency,
                description=f"Meta Ads - {entry.get('billing_period', 'N/A')}",
                vendor_name="Meta Platforms Ireland Ltd.",
                line_items=[
                    LineItem(
                        description="Facebook/Instagram annoncering",
                        amount_excl_vat=amount,
                        vat_amount=0.0,
                    )
                ],
            )
            invoices.append(inv)

        logger.info("Hentet %d fakturaer fra Meta Ads", len(invoices))
        return invoices

    def fetch_invoice_pdf(self, invoice_id: str) -> Optional[bytes]:
        """Hent faktura som PDF fra Meta."""
        try:
            data = self._get(f"{invoice_id}", params={"fields": "invoice_pdf"})
            pdf_url = data.get("invoice_pdf")
            if pdf_url:
                resp = self._session.get(pdf_url)
                resp.raise_for_status()
                return resp.content
        except Exception:
            logger.warning("Kunne ikke hente PDF for Meta faktura %s", invoice_id)
        return None

    @staticmethod
    def _parse_billing_period(period_str: str) -> date:
        """Parse billing period string til en dato."""
        try:
            # Format: "2024-01-01 - 2024-01-31"
            end_date_str = period_str.split(" - ")[-1].strip()
            return datetime.strptime(end_date_str, "%Y-%m-%d").date()
        except (ValueError, IndexError):
            return date.today()
