"""Unit + integration tests for the zero-LLM personality engine."""

from __future__ import annotations

import numpy as np
import pytest

from app.data.traits import TRAITS
from app.services import character_matcher, feature_extractor, personality_engine
from app.services.text_preprocessor import lemmatize, preprocess


def test_preprocess_cleans_and_deduplicates():
    posts = preprocess([
        "I am building my own lane https://t.co/x",
        "I am building my own lane https://t.co/x",  # duplicate
        "",
        "hi",  # too short
    ])
    assert len(posts) == 1
    assert "http" not in posts[0].clean
    assert posts[0].hashtags == []


def test_lemmatizer_basic():
    assert lemmatize("running") == "run"
    assert lemmatize("boxes") == "box"
    assert lemmatize("went") == "go"
    assert lemmatize("happily") == "happi"


def test_feature_extraction_produces_full_vector():
    posts = preprocess([
        "Building my own business, took a big risk, no handouts, doing it solo.",
        "I plan every detail, calculated and patient. Long game strategy.",
        "This is hilarious lol 😂 what a ridiculous situation, pure chaos.",
        "We did it together with the team, grateful for my crew and family.",
    ] * 3)
    features = feature_extractor.extract_features(posts)
    assert set(features) == set(TRAITS)
    vector = feature_extractor.vector_from_features(features)
    assert all(0 <= v <= 100 for v in vector.values())
    assert vector["humor"] > 20
    assert vector["strategic_thinking"] > 20


def test_low_post_count_triggers_warning():
    result = personality_engine.analyze_posts(["just one post about building"])
    assert result["low_confidence"] is True
    assert result["warning"] is not None
    assert result["posts_analyzed"] <= 1


def test_matching_ranks_nine_characters():
    vector = {t: 50.0 for t in TRAITS}
    vector["independence"] = 90
    vector["risk_appetite"] = 85
    vector["strategic_thinking"] = 80
    ranking = character_matcher.match_characters(vector, confidence=0.9)
    assert len(ranking) == 9
    assert ranking[0]["match_score"] >= ranking[-1]["match_score"]
    assert ranking[0]["name"]


def test_cosine_is_in_range():
    a = np.array([70, 30, 90], dtype=float)
    b = np.array([80, 40, 60], dtype=float)
    w = np.array([1, 1, 1], dtype=float)
    value = character_matcher.weighted_cosine(a, b, w)
    assert -1.0 <= value <= 1.0


def test_demo_accounts_available():
    from app.data.demo_accounts import DEMO_ACCOUNTS

    assert len(DEMO_ACCOUNTS) >= 5
    for account in DEMO_ACCOUNTS.values():
        assert len(account["posts"]) >= 5
        assert account["handle"].startswith(account["handle"].lower())


@pytest.mark.asyncio
async def test_demo_provider_returns_posts():
    from app.services.x_provider import DemoProvider

    data = await DemoProvider().fetch("vicecityvince")
    assert data.available and data.demo
    assert len(data.posts) >= 5
