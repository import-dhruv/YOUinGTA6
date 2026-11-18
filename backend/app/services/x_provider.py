"""Modular, authorised X data provider layer.

The X provider only uses an official X API v2 Bearer token supplied through the
environment. Without a token it reports `available: false` and the frontend
falls back to labelled demo accounts or the manual quiz. We never scrape, never
bypass authentication and never ask for passwords.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field

import httpx

from app.data.demo_accounts import get_demo_account

X_API_BASE = "https://api.x.com/2"


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


class XApiProvider:
    """Official X API v2 app-only (Bearer token) provider."""

    def __init__(self, bearer_token: str, max_posts: int = 120):
        self.bearer_token = bearer_token
        self.max_posts = max_posts

    async def fetch(self, username: str) -> ProfileData:
        headers = {"Authorization": f"Bearer {self.bearer_token}"}
        try:
            async with httpx.AsyncClient(timeout=12.0, headers=headers) as client:
                lookup = await client.get(
                    f"{X_API_BASE}/users/by/username/{username}",
                    params={"user.fields": "profile_image_url,description,protected,public_metrics"},
                )
                if lookup.status_code in (401, 403):
                    raise ProviderError("X API credentials were rejected (check X_BEARER_TOKEN).")
                if lookup.status_code == 429:
                    raise ProviderError("X API rate limit reached. Try again later or use demo mode.")
                if lookup.status_code == 404:
                    raise ProviderError(f"@{username} was not found on X.")
                if lookup.status_code != 200:
                    raise ProviderError(f"X API lookup failed with status {lookup.status_code}.")

                user = lookup.json().get("data")
                if not user:
                    raise ProviderError(f"@{username} was not found on X.")
                if user.get("protected"):
                    raise ProviderError(f"@{username} has a protected account. Only public data can be analysed.")

                user_id = user["id"]
                posts_resp = await client.get(
                    f"{X_API_BASE}/users/{user_id}/tweets",
                    params={
                        "max_results": min(self.max_posts, 100),
                        "tweet.fields": "created_at,public_metrics",
                        "exclude": "retweets",
                    },
                )
                posts: list[str | dict] = []
                notice = None
                if posts_resp.status_code == 200:
                    for tweet in posts_resp.json().get("data", []):
                        text = tweet.get("text", "")
                        reply = False
                        referenced = tweet.get("referenced_tweets", [])
                        if any(r.get("type") == "replied_to" for r in referenced):
                            reply = True
                        if text:
                            posts.append({"text": text, "is_reply": reply})
                elif posts_resp.status_code == 403:
                    notice = "Your API tier does not allow reading posts. Profile-only analysis will be used."
                elif posts_resp.status_code == 429:
                    notice = "X API rate limit reached while reading posts. Profile-only analysis will be used."
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


def get_provider(force_demo: bool = False):
    """Select a provider without ever exposing credentials to the browser."""
    if force_demo:
        return DemoProvider()
    token = os.getenv("X_BEARER_TOKEN", "").strip()
    if token:
        return XApiProvider(token)
    return UnavailableProvider()


async def fetch_profile(username: str, force_demo: bool = False) -> ProfileData:
    provider = get_provider(force_demo)
    return await provider.fetch(username)
