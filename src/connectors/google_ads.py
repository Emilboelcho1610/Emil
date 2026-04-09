"""Connector til Google Ads fakturering.

Henter fakturaer fra Google Ads via Google Ads API.
Google fakturerer fra Irland — reverse charge for dansk moms.
"""

from __future__ import annotations

import logging
from datetime import date
from typing import Optional

import requests

from src.models.invoice import Invoice, InvoiceSource, LineItem

logger = logging.getLogger(__name__)


class GoogleAdsConnector:
    """Henter fakturaer fra Google Ads."""

    def __init__(
        self,
        developer_token: str,
        client_id: str,
        client_secret: str,
        refresh_token: str,
        customer_id: str,
    ):
        self.developer_token = developer_token
        self.client_id = client_id
        self.client_secret = client_secret
        self.refresh_token = refresh_token
        self.customer_id = customer_id.replace("-", "")
        self._access_token: Optional[str] = None
        self._session = requests.Session()

    def _ensure_access_token(self) -> None:
        """Hent OAuth2 access token via refresh token."""
        if self._access_token:
            return

        resp = self._session.post(
            "https://oauth2.googleapis.com/token",
            data={
                "grant_type": "refresh_token",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "refresh_token": self.refresh_token,
            },
        )
        resp.raise_for_status()
        self._access_token = resp.json()["access_token"]

    def _search(self, query: str) -> list[dict]:
        """Kør en Google Ads Query Language (GAQL) forespørgsel."""
        self._ensure_access_token()
        url = f"https://googleads.googleapis.com/v16/customers/{self.customer_id}/googleAds:searchStream"
        resp = self._session.post(
            url,
            headers={
                "Authorization": f"Bearer {self._access_token}",
                "developer-token": self.developer_token,
            },
            json={"query": query},
        )
        resp.raise_for_status()

        results = []
        for batch in resp.json():
            results.extend(batch.get("results", []))
        return results

    def fetch_invoices(
        self,
        from_date: date,
        to_date: Optional[date] = None,
    ) -> list[Invoice]:
        """Hent Google Ads fakturaer via account budget og billing setup.

        Bruger invoice-endpointet til at hente faktiske fakturaer.
        """
        to_date = to_date or date.today()
        invoices: list[Invoice] = []

        # Hent fakturaer via Invoices endpoint
        invoices.extend(self._fetch_invoices_api(from_date, to_date))

        # Fallback: Hent forbrug per måned via GAQL
        if not invoices:
            invoices.extend(self._fetch_monthly_spend(from_date, to_date))

        logger.info("Hentet %d fakturaer fra Google Ads", len(invoices))
        return invoices

    def _fetch_invoices_api(self, from_date: date, to_date: date) -> list[Invoice]:
        """Hent fakturaer via Google Ads Invoices REST endpoint."""
        invoices: list[Invoice] = []

        try:
            self._ensure_access_token()
            url = (
                f"https://googleads.googleapis.com/v16/customers/"
                f"{self.customer_id}/invoices"
            )
            # Google Ads invoices er grupperet per billing setup
            resp = self._session.get(
                url,
                headers={
                    "Authorization": f"Bearer {self._access_token}",
                    "developer-token": self.developer_token,
                },
                params={
                    "issueYear": str(from_date.year),
                    "issueMonth": from_date.strftime("%B").upper(),
                },
            )
            if resp.status_code != 200:
                return []

            for inv_data in resp.json().get("invoices", []):
                amount_micros = int(inv_data.get("subtotalAmountMicros", 0))
                amount = amount_micros / 1_000_000
                tax_micros = int(inv_data.get("taxAmountMicros", 0))
                tax = tax_micros / 1_000_000

                issue_date = self._parse_date(inv_data.get("issueDate", ""))
                due_date = self._parse_date(inv_data.get("dueDate", ""))

                inv = Invoice(
                    source=InvoiceSource.GOOGLE_ADS,
                    invoice_id=inv_data.get("id", ""),
                    invoice_date=issue_date or from_date,
                    due_date=due_date,
                    amount_excl_vat=amount,
                    vat_amount=tax,
                    amount_incl_vat=amount + tax,
                    currency=inv_data.get("currencyCode", "DKK"),
                    description=f"Google Ads - {inv_data.get('id', 'N/A')}",
                    vendor_name="Google Ireland Ltd.",
                    pdf_url=inv_data.get("pdfUrl"),
                    line_items=[
                        LineItem(
                            description="Google Ads annoncering",
                            amount_excl_vat=amount,
                            vat_amount=tax,
                        )
                    ],
                )
                invoices.append(inv)

        except Exception as e:
            logger.warning("Kunne ikke hente Google Ads fakturaer via API: %s", e)

        return invoices

    def _fetch_monthly_spend(self, from_date: date, to_date: date) -> list[Invoice]:
        """Fallback: Hent månedligt forbrug via GAQL og opret faktura-estimater."""
        invoices: list[Invoice] = []

        try:
            query = f"""
                SELECT
                    metrics.cost_micros,
                    segments.month
                FROM customer
                WHERE segments.date BETWEEN '{from_date.isoformat()}' AND '{to_date.isoformat()}'
            """
            results = self._search(query)

            for row in results:
                cost_micros = int(row.get("metrics", {}).get("costMicros", 0))
                if cost_micros <= 0:
                    continue

                amount = cost_micros / 1_000_000
                month_str = row.get("segments", {}).get("month", "")
                invoice_date = self._parse_date(month_str) or from_date

                inv = Invoice(
                    source=InvoiceSource.GOOGLE_ADS,
                    invoice_id=f"gads-{self.customer_id}-{month_str}",
                    invoice_date=invoice_date,
                    due_date=None,
                    amount_excl_vat=amount,
                    vat_amount=0.0,  # Reverse charge
                    amount_incl_vat=amount,
                    currency="DKK",
                    description=f"Google Ads forbrug - {month_str}",
                    vendor_name="Google Ireland Ltd.",
                    line_items=[
                        LineItem(
                            description="Google Ads annoncering",
                            amount_excl_vat=amount,
                            vat_amount=0.0,
                        )
                    ],
                )
                invoices.append(inv)

        except Exception as e:
            logger.warning("Kunne ikke hente Google Ads månedsforbrug: %s", e)

        return invoices

    def fetch_invoice_pdf(self, pdf_url: str) -> Optional[bytes]:
        """Download faktura-PDF fra Google Ads."""
        try:
            self._ensure_access_token()
            resp = self._session.get(
                pdf_url,
                headers={"Authorization": f"Bearer {self._access_token}"},
            )
            resp.raise_for_status()
            return resp.content
        except Exception:
            logger.warning("Kunne ikke hente Google Ads PDF: %s", pdf_url)
        return None

    @staticmethod
    def _parse_date(date_str: str) -> Optional[date]:
        """Parse diverse datoformater fra Google Ads API."""
        if not date_str:
            return None
        for fmt in ("%Y-%m-%d", "%Y%m%d", "%B %Y"):
            try:
                from datetime import datetime
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        return None
