"""Orchestrates preprocessing -> feature extraction -> scoring."""

from __future__ import annotations

from app.data.traits import (
    MAX_ANALYZED_POSTS,
    MIN_CONFIDENT_POSTS,
    MIN_USABLE_POSTS,
)
from app.services import character_matcher, feature_extractor, text_preprocessor


def sample_posts(posts: list, limit: int = MAX_ANALYZED_POSTS) -> list:
    """Sample evenly so users with thousands of posts don't dominate."""
    if len(posts) <= limit:
        return posts
    step = len(posts) / limit
    return [posts[int(i * step)] for i in range(limit)]


def analyze_posts(posts: list[str | dict]) -> dict:
    """Return a personality result dict from raw posts."""
    sampled = sample_posts(posts)
    processed = text_preprocessor.preprocess(sampled)
    posts_analyzed = len(processed)

    if posts_analyzed == 0:
        return {
            "vector": {},
            "features": {},
            "overall_confidence": 0.0,
            "low_confidence": True,
            "warning": "No readable public posts were available to analyse.",
            "posts_analyzed": 0,
            "data_source": "posts",
        }

    features = feature_extractor.extract_features(processed)
    vector = feature_extractor.vector_from_features(features)

    post_factor = min(1.0, posts_analyzed / MIN_CONFIDENT_POSTS)
    feature_confidence = sum(f["confidence"] for f in features.values()) / len(features)
    confidence = round(0.5 * post_factor + 0.5 * feature_confidence, 3)

    low_confidence = posts_analyzed < MIN_CONFIDENT_POSTS
    warning = None
    if posts_analyzed < MIN_USABLE_POSTS:
        warning = (
            f"Only {posts_analyzed} usable post(s) were found. This result is highly "
            "speculative — try the manual quiz for a more reliable match."
        )
        confidence = min(confidence, 0.25)
    elif low_confidence:
        warning = (
            f"Only {posts_analyzed} usable posts were analysed. Treat this as a rough "
            "first impression rather than a reliable read."
        )

    return {
        "vector": vector,
        "features": features,
        "overall_confidence": confidence,
        "low_confidence": low_confidence,
        "warning": warning,
        "posts_analyzed": posts_analyzed,
        "data_source": "posts",
    }


def analyze_vector(vector: dict[str, float], confidence: float = 0.6, source: str = "quiz") -> dict:
    """Build a personality result directly from an offline quiz vector."""
    return {
        "vector": vector,
        "features": {},
        "overall_confidence": confidence,
        "low_confidence": confidence < 0.6,
        "warning": None if confidence >= 0.6 else "Quiz answers were sparse; result is approximate.",
        "posts_analyzed": 0,
        "data_source": source,
    }


def full_analysis(posts: list[str | dict]) -> dict:
    """Analyse posts and rank all characters in one call."""
    personality = analyze_posts(posts)
    if not personality["vector"]:
        return {"personality": personality, "ranking": [], "primary": None}
    ranking = character_matcher.match_characters(
        personality["vector"], personality["overall_confidence"]
    )
    return {
        "personality": personality,
        "ranking": ranking,
        "primary": ranking[0] if ranking else None,
    }
