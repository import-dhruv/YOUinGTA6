"""Server configuration loaded from environment variables."""

from __future__ import annotations

import os

VERSION = "1.0.0"
SITE_URL = os.getenv("SITE_URL", "http://localhost:3000")


def demo_count() -> int:
    from app.data.demo_accounts import DEMO_ACCOUNTS

    return len(DEMO_ACCOUNTS)
