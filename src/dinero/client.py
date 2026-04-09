"""Dinero API-klient til bogføring, bilag og filupload.

Dinero API docs: https://api.dinero.dk/docs
Autentificering via OAuth2 client credentials → bearer token.
"""

from __future__ import annotations

import logging
from datetime import date, datetime
from typing import Any, Optional

import requests

logger = logging.getLogger(__name__)

BASE_URL = "https://api.dinero.dk"
AUTH_URL = "https://authz.dinero.dk/dineroapi/oauth/token"


class DineroAuthError(Exception):
    pass


class DineroAPIError(Exception):
    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        super().__init__(f"Dinero API fejl {status_code}: {detail}")


class DineroClient:
    """Klient til Dinero's REST API."""

    def __init__(
        self,
        client_id: str,
        client_secret: str,
        api_key: str,
        org_id: str,
    ):
        self.client_id = client_id
        self.client_secret = client_secret
        self.api_key = api_key
        self.org_id = org_id
        self._token: Optional[str] = None
        self._token_expires: Optional[datetime] = None
        self._session = requests.Session()

    # ── Auth ─────────────────────────────────────────────────────────

    def _ensure_token(self) -> None:
        """Hent eller forny OAuth2 bearer token."""
        if self._token and self._token_expires and datetime.now() < self._token_expires:
            return

        resp = self._session.post(
            AUTH_URL,
            data={
                "grant_type": "password",
                "username": self.api_key,
                "password": self.api_key,
            },
            auth=(self.client_id, self.client_secret),
        )
        if resp.status_code != 200:
            raise DineroAuthError(f"Kunne ikke logge ind: {resp.status_code} {resp.text}")

        data = resp.json()
        self._token = data["access_token"]
        expires_in = data.get("expires_in", 3600)
        from datetime import timedelta
        self._token_expires = datetime.now() + timedelta(seconds=expires_in - 60)
        logger.info("Dinero token fornyet, udløber om %d sekunder", expires_in)

    def _headers(self) -> dict[str, str]:
        self._ensure_token()
        return {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
        }

    def _request(self, method: str, path: str, **kwargs: Any) -> Any:
        url = f"{BASE_URL}/v1/{self.org_id}/{path}"
        resp = self._session.request(method, url, headers=self._headers(), **kwargs)
        if resp.status_code >= 400:
            raise DineroAPIError(resp.status_code, resp.text)
        if resp.status_code == 204:
            return None
        return resp.json()

    # ── Kontoplan ────────────────────────────────────────────────────

    def get_accounts(self) -> list[dict]:
        """Hent kontoplan."""
        return self._request("GET", "accounts")

    # ── Kontakter ────────────────────────────────────────────────────

    def find_or_create_contact(self, name: str) -> str:
        """Find eksisterende kontakt eller opret ny. Returnerer contact GUID."""
        contacts = self._request("GET", "contacts", params={"queryFilter": name})
        items = contacts.get("Collection", [])
        for c in items:
            if c["Name"].lower() == name.lower():
                return c["ContactGuid"]

        # Opret ny kontakt
        new = self._request("POST", "contacts", json={
            "Name": name,
            "CountryKey": "DK",
        })
        logger.info("Oprettet kontakt: %s", name)
        return new["ContactGuid"]

    # ── Bilag (purchase vouchers) ────────────────────────────────────

    def create_purchase_voucher(
        self,
        contact_guid: str,
        voucher_date: date,
        description: str,
        lines: list[dict],
        due_date: Optional[date] = None,
        external_reference: Optional[str] = None,
        currency: str = "DKK",
    ) -> dict:
        """Opret et købsbilag (purchase voucher) i Dinero.

        lines: liste af dicts med:
            - AccountNumber (int): kontonummer
            - Amount (float): beløb ekskl. moms
            - VatCode (str): f.eks. "I25" for 25% indgående moms, "IREV" for reverse charge
        """
        payload: dict[str, Any] = {
            "VoucherDate": voucher_date.isoformat(),
            "PaymentDate": (due_date or voucher_date).isoformat(),
            "ContactGuid": contact_guid,
            "Currency": currency,
            "Description": description,
            "Lines": lines,
        }
        if external_reference:
            payload["ExternalReference"] = external_reference

        result = self._request("POST", "purchase-vouchers", json=payload)
        logger.info("Bilag oprettet: %s (ref: %s)", result.get("VoucherNumber"), external_reference)
        return result

    # ── Filupload (vedhæft faktura-PDF til bilag) ────────────────────

    def upload_file_to_voucher(
        self,
        voucher_guid: str,
        filename: str,
        file_bytes: bytes,
        content_type: str = "application/pdf",
    ) -> dict:
        """Upload en fil (PDF/billede) og vedhæft til et bilag."""
        url = f"{BASE_URL}/v1/{self.org_id}/purchase-vouchers/{voucher_guid}/files"
        self._ensure_token()
        resp = self._session.post(
            url,
            headers={"Authorization": f"Bearer {self._token}"},
            files={"file": (filename, file_bytes, content_type)},
        )
        if resp.status_code >= 400:
            raise DineroAPIError(resp.status_code, resp.text)
        logger.info("Fil uploadet til bilag %s: %s", voucher_guid, filename)
        return resp.json()

    # ── Bogfør bilag ─────────────────────────────────────────────────

    def book_voucher(self, voucher_guid: str) -> dict:
        """Bogfør et bilag (gør det endeligt)."""
        return self._request("POST", f"purchase-vouchers/{voucher_guid}/book")
