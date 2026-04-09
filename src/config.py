"""Konfiguration — indlæser miljøvariabler fra .env fil."""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

from dotenv import load_dotenv

load_dotenv()


@dataclass
class DineroConfig:
    api_key: str
    org_id: str
    client_id: str
    client_secret: str


@dataclass
class MetaConfig:
    app_id: str
    app_secret: str
    access_token: str
    ad_account_id: str


@dataclass
class ShopifyConfig:
    shop_name: str
    access_token: str


@dataclass
class GoogleAdsConfig:
    developer_token: str
    client_id: str
    client_secret: str
    refresh_token: str
    customer_id: str


def load_dinero_config() -> DineroConfig:
    return DineroConfig(
        api_key=os.environ["DINERO_API_KEY"],
        org_id=os.environ["DINERO_ORG_ID"],
        client_id=os.environ["DINERO_CLIENT_ID"],
        client_secret=os.environ["DINERO_CLIENT_SECRET"],
    )


def load_meta_config() -> Optional[MetaConfig]:
    token = os.environ.get("META_ACCESS_TOKEN")
    if not token:
        return None
    return MetaConfig(
        app_id=os.environ.get("META_APP_ID", ""),
        app_secret=os.environ.get("META_APP_SECRET", ""),
        access_token=token,
        ad_account_id=os.environ["META_AD_ACCOUNT_ID"],
    )


def load_shopify_config() -> Optional[ShopifyConfig]:
    token = os.environ.get("SHOPIFY_ACCESS_TOKEN")
    if not token:
        return None
    return ShopifyConfig(
        shop_name=os.environ["SHOPIFY_SHOP_NAME"],
        access_token=token,
    )


def load_google_ads_config() -> Optional[GoogleAdsConfig]:
    token = os.environ.get("GOOGLE_ADS_DEVELOPER_TOKEN")
    if not token:
        return None
    return GoogleAdsConfig(
        developer_token=token,
        client_id=os.environ["GOOGLE_ADS_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_ADS_CLIENT_SECRET"],
        refresh_token=os.environ["GOOGLE_ADS_REFRESH_TOKEN"],
        customer_id=os.environ["GOOGLE_ADS_CUSTOMER_ID"],
    )
