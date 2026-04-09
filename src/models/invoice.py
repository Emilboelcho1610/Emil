"""Fælles faktura-model der bruges på tværs af alle connectors."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from enum import Enum
from typing import Optional


class InvoiceSource(Enum):
    META = "meta"
    SHOPIFY = "shopify"
    GOOGLE_ADS = "google_ads"


@dataclass
class Invoice:
    """Repræsenterer en faktura fra en ekstern platform."""

    source: InvoiceSource
    invoice_id: str
    invoice_date: date
    due_date: Optional[date]
    amount_excl_vat: float
    vat_amount: float
    amount_incl_vat: float
    currency: str
    description: str
    vendor_name: str
    pdf_url: Optional[str] = None
    pdf_bytes: Optional[bytes] = None
    line_items: list[LineItem] = field(default_factory=list)

    @property
    def total(self) -> float:
        return self.amount_incl_vat


@dataclass
class LineItem:
    description: str
    amount_excl_vat: float
    vat_amount: float
    account_number: Optional[int] = None


# Standard danske kontonumre (Dinero standardkontoplan)
ACCOUNT_MAP: dict[InvoiceSource, int] = {
    InvoiceSource.META: 2220,       # Reklameudgifter
    InvoiceSource.GOOGLE_ADS: 2220, # Reklameudgifter
    InvoiceSource.SHOPIFY: 2000,    # Vareforbrug / IT-udgifter
}

# Moms-konti
VAT_ACCOUNT_PURCHASE = 6872  # Indgående moms (købsmoms)
