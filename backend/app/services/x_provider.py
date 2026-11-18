"""Modular, authorised X data provider layer.

The X provider only uses official X API v2 credentials supplied through the
server environment. Nothing is ever sent to or stored in the browser.

Supported credentials (all optional, all server-side only):
  * X_BEARER_TOKEN     — pre-generated app-only bearer token
  * X_CONSUMER_KEY     — app consumer key, used to mint an app-only token
  * X_CONSUMER_SECRET  — app consumer secret, used to mint an app-only token

If only consumer credentials are present, an app-only token is minted via
OAuth 2.0 client credentials and cached in memory until it expires. If no
credentials are present, the app reports `available: false` and the frontend
falls back to labelled demo accounts or the manual quiz. We never scrape,
never bypass authentication, and never ask for passwords.
"""

from __future__ import annotations

import base64
import os
import time
from dataclasses import dataclass, field

import httpx

from app.data.demo_accounts import get_demo_account

X_API_BASE = "https://api.x.com/2"
TOKEN_URL = "https://api.x.com/oauth2/token"


@dataclass
class ProfileData:
    username: str
    display_name: str
    profile_image_url: str
    bio: str
    posts: list[str | dict] = field(default_factory=list)
    source: str = "x-api"
    available: bool = True
    notice: str | None = None
    demo: bool = False


class ProviderError(Exception):
    """Raised when a provider cannot return usable data."""


def _credits_error() -> str:
    return (
        "Your X API project has no remaining credits for this endpoint "
        "(X returned 'credits depleted'). Add credits in the X developer "
        "portal, or use demo mode / the manual quiz."
    )


class XApiProvider:
    """Official X API v2 provider with app-only token support."""

    def __init__(
        self,
        bearer_token: str = "",
        consumer_key: str = "",
        consumer_secret: str = "",
        max_posts: int = 120,
    ):
        self.static_token = bearer_token.strip()
        self.consumer_key = consumer_key.strip()
        self.consumer_secret = consumer_secret.strip()
        self.max_posts = max_posts
        self._token = self.static_token or None
        self._token_expires_at = 0.0

    async def _mint_token(self, client: httpx.AsyncClient) -> str:
        """Exchange consumer key/secret for an app-only bearer token."""
        if not (self.consumer_key and self.consumer_secret):
            raise ProviderError("X API credentials were rejected (invalid bearer token).")
        credentials = base64.b64encode(
            f"{self.consumer_key}:{self.consumer_secret}".encode()
        ).decode()
        try:
            response = await client.post(
                TOKEN_URL,
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                },
                content=b"grant_type=client_credentials",
            )
        except httpx.HTTPError as exc:
            raise ProviderError(f"Could not reach the X token endpoint: {exc.__class__.__name__}") from exc
        if response.status_code != 200:
            raise ProviderError(
                f"X API rejected the consumer credentials (status {response.status_code}). "
                "Check X_CONSUMER_KEY and X_CONSUMER_SECRET."
            )
        payload = response.json()
        self._token = payload["access_token"]
        self._token_expires_at = time.time() + max(60, int(payload.get("expires_in", 7200)) - 60)
        return self._token

    async def _ensure_token(self, client: httpx.AsyncClient) -> str:
        if self._token and time.time() < self._token_expires_at:
            return self._token
        if self.static_token and not self._token:
            self._token = self.static_token
            return self._token
        return await self._mint_token(client)

    @staticmethod
    def _friendly_lookup_error(status: int) -> str:
        if status == 400:
            return "X API rejected the lookup request (bad username or parameters)."
        if status == 401:
            return "X API credentials were rejected. Check the bearer token / consumer keys."
        if status == 402:
            return _credits_error()
        if status == 403:
            return "Your X API access level does not allow profile lookup. Use demo mode or the quiz."
        if status == 404:
            return "That X username was not found."
        if status == 429:
            return "X API rate limit reached. Try again later or use demo mode."
        return f"X API lookup failed with status {status}."

    async def fetch(self, username: str) -> ProfileData:
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                token = await self._ensure_token(client)
                headers = {"Authorization": f"Bearer {token}"}

                async def lookup() -> httpx.Response:
                    return await client.get(
                        f"{X_API_BASE}/users/by/username/{username}",
                        params={"user.fields": "profile_image_url,description,protected"},
                        headers=headers,
                    )

                response = await lookup()
                # A stale static token can be replaced by a freshly minted one.
                if response.status_code in (401, 403) and self.consumer_key and self.consumer_secret:
                    token = await self._mint_token(client)
                    headers = {"Authorization": f"Bearer {token}"}
                    response = await lookup()

                if response.status_code != 200:
                    raise ProviderError(self._friendly_lookup_error(response.status_code))

                user = response.json().get("data")
                if not user:
                    raise ProviderError(f"@{username} was not found on X.")
                if user.get("protected"):
                    raise ProviderError(
                        f"@{username} has a protected account. Only public data can be analysed."
                    )

                user_id = user["id"]
                posts_resp = await client.get(
                    f"{X_API_BASE}/users/{user_id}/tweets",
                    params={
                        "max_results": min(self.max_posts, 100),
                        "tweet.fields": "created_at",
                        "exclude": "retweets",
                    },
                    headers=headers,
                )
                posts: list[str | dict] = []
                notice = None
                if posts_resp.status_code == 200:
                    for tweet in posts_resp.json().get("data", []):
                        text = tweet.get("text", "")
                        reply = any(
                            ref.get("type") == "replied_to"
                            for ref in tweet.get("referenced_tweets", [])
                        )
                        if text:
                            posts.append({"text": text, "is_reply": reply})
                elif posts_resp.status_code == 402:
                    notice = _credits_error()
                elif posts_resp.status_code == 403:
                    notice = "Your X API access level does not allow reading posts. Use demo mode or the quiz."
                elif posts_resp.status_code == 429:
                    notice = "X API rate limit reached while reading posts. Try again later."
                else:
                    notice = "Public posts could not be retrieved with the current API access."

                image = (user.get("profile_image_url") or "").replace("_normal", "_400x400")
                return ProfileData(
                    username=user.get("username", username),
                    display_name=user.get("name", username),
                    profile_image_url=image,
                    bio=user.get("description", ""),
                    posts=posts,
                    notice=notice,
                    source="x-api",
                    available=True,
                )
        except httpx.HTTPError as exc:
            raise ProviderError(f"Could not reach the X API: {exc.__class__.__name__}") from exc


class DemoProvider:
    """Fictional sample accounts for fully local, credential-free testing."""

    async def fetch(self, username: str) -> ProfileData:
        account = get_demo_account(username)
        if not account:
            raise ProviderError("Unknown demo account.")
        return ProfileData(
            username=account["handle"],
            display_name=account["display_name"],
            profile_image_url=account["profile_image"],
            bio=account["bio"],
            posts=list(account["posts"]),
            source="demo",
            demo=True,
            available=True,
            notice="DEMO MODE — this is a fictional account with invented posts.",
        )


class UnavailableProvider:
    """Returned when no X credentials are configured and demo is not requested."""

    async def fetch(self, username: str) -> ProfileData:
        return ProfileData(
            username=username,
            display_name=f"@{username}",
            profile_image_url="",
            bio="",
            posts=[],
            source="none",
            available=False,
            notice=(
                "No X API credentials are configured on this server. Public posts cannot "
                "be retrieved. Choose a labelled demo account or take the manual quiz."
            ),
        )


def has_x_credentials() -> bool:
    return bool(
        os.getenv("X_BEARER_TOKEN", "").strip()
        or (
            os.getenv("X_CONSUMER_KEY", "").strip()
            and os.getenv("X_CONSUMER_SECRET", "").strip()
        )
    )


def get_provider(force_demo: bool = False):
    """Select a provider without ever exposing credentials to the browser."""
    if force_demo:
        return DemoProvider()
    if has_x_credentials():
        return XApiProvider(
            bearer_token=os.getenv("X_BEARER_TOKEN", ""),
            consumer_key=os.getenv("X_CONSUMER_KEY", ""),
            consumer_secret=os.getenv("X_CONSUMER_SECRET", ""),
        )
    return UnavailableProvider()


async def fetch_profile(username: str, force_demo: bool = False) -> ProfileData:
    return await get_provider(force_demo).fetch(username)
