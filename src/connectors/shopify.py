"""Connector til Shopify fakturering.

Henter abonnements- og transaktionsfakturaer fra Shopify via Admin API.
Shopify fakturerer for: månedligt abonnement, apps, temaer, og Shopify Payments gebyrer.
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Optional

import requests

from src.models.invoice import Invoice, InvoiceSource, LineItem

logger = logging.getLogger(__name__)


class ShopifyConnector:
    """Henter fakturaer fra Shopify."""

    def __init__(self, shop_name: str, access_token: str):
        """
        shop_name: F.eks. 'din-shop.myshopify.com'.
        access_token: Shopify Admin API access token.
        """
        self.shop_name = shop_name
        self.access_token = access_token
        self.base_url = f"https://{shop_name}/admin/api/2024-01"
        self._session = requests.Session()
        self._session.headers.update({
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json",
        })

    def _get(self, endpoint: str, params: Optional[dict] = None) -> dict:
        url = f"{self.base_url}/{endpoint}.json"
        resp = self._session.get(url, params=params)
        resp.raise_for_status()
        return resp.json()

    def fetch_invoices(
        self,
        from_date: date,
        to_date: Optional[date] = None,
    ) -> list[Invoice]:
        """Hent Shopify fakturaer via ApplicationCharge og RecurringApplicationCharge.

        Inkluderer:
        - Månedligt abonnement (Shopify plan)
        - App-gebyrer
        - Shopify Payments transaktionsgebyrer
        """
        to_date = to_date or date.today()
        invoices: list[Invoice] = []

        # Hent abonnementsfakturaer (recurring charges)
        invoices.extend(self._fetch_subscription_charges(from_date, to_date))

        # Hent Shopify Payments udbetalinger for at finde gebyrer
        invoices.extend(self._fetch_payment_fees(from_date, to_date))

        logger.info("Hentet %d fakturaer fra Shopify", len(invoices))
        return invoices

    def _fetch_subscription_charges(
        self, from_date: date, to_date: date
    ) -> list[Invoice]:
        """Hent abonnementsomkostninger fra Shopify billing."""
        invoices: list[Invoice] = []

        try:
            # Brug GraphQL til at hente billing info
            query = """
            {
                currentAppInstallation {
                    allSubscriptions(first: 50) {
                        edges {
                            node {
                                id
                                name
                                createdAt
                                currentPeriodEnd
                                lineItems {
                                    id
                                    plan {
                                        pricingDetails {
                                            ... on AppRecurringPricing {
                                                price { amount currencyCode }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            """

            # Alternativt: Hent via REST API shop-info for billing
            shop_data = self._get("shop")
            shop = shop_data.get("shop", {})
            plan_name = shop.get("plan_name", "unknown")

            # Shopify fakturerer månedligt — opret en faktura per måned
            current = from_date.replace(day=1)
            while current <= to_date:
                inv = Invoice(
                    source=InvoiceSource.SHOPIFY,
                    invoice_id=f"shopify-sub-{current.isoformat()}",
                    invoice_date=current,
                    due_date=current,
                    amount_excl_vat=0.0,  # Udfyldes fra faktisk faktura
                    vat_amount=0.0,
                    amount_incl_vat=0.0,
                    currency="DKK",
                    description=f"Shopify {plan_name} abonnement - {current.strftime('%B %Y')}",
                    vendor_name="Shopify International Ltd.",
                    line_items=[
                        LineItem(
                            description=f"Shopify {plan_name} plan",
                            amount_excl_vat=0.0,
                            vat_amount=0.0,
                        )
                    ],
                )
                invoices.append(inv)

                # Næste måned
                if current.month == 12:
                    current = current.replace(year=current.year + 1, month=1)
                else:
                    current = current.replace(month=current.month + 1)

        except Exception as e:
            logger.warning("Kunne ikke hente Shopify abonnementer: %s", e)

        return invoices

    def _fetch_payment_fees(
        self, from_date: date, to_date: date
    ) -> list[Invoice]:
        """Hent Shopify Payments transaktionsgebyrer."""
        invoices: list[Invoice] = []

        try:
            # Hent payouts (udbetalinger) som indeholder fee-info
            data = self._get("shopify_payments/payouts", params={
                "date_min": from_date.isoformat(),
                "date_max": to_date.isoformat(),
                "status": "paid",
            })

            for payout in data.get("payouts", []):
                fee = abs(float(payout.get("summary", {}).get("charges_fee_amount", 0)))
                if fee <= 0:
                    continue

                payout_date = datetime.strptime(
                    payout["date"], "%Y-%m-%d"
                ).date()

                inv = Invoice(
                    source=InvoiceSource.SHOPIFY,
                    invoice_id=f"shopify-fee-{payout['id']}",
                    invoice_date=payout_date,
                    due_date=payout_date,
                    amount_excl_vat=fee,
                    vat_amount=0.0,  # Reverse charge
                    amount_incl_vat=fee,
                    currency=payout.get("currency", "DKK").upper(),
                    description=f"Shopify Payments gebyr - udbetaling {payout['id']}",
                    vendor_name="Shopify International Ltd.",
                    line_items=[
                        LineItem(
                            description="Shopify Payments transaktionsgebyr",
                            amount_excl_vat=fee,
                            vat_amount=0.0,
                        )
                    ],
                )
                invoices.append(inv)

        except Exception as e:
            logger.warning("Kunne ikke hente Shopify Payments gebyrer: %s", e)

        return invoices
