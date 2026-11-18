"""Weighted cosine-similarity character matching.

Similarities are computed on vectors centred around a neutral 50 midpoint so
that two merely "positive" profiles are not automatically a perfect match.

IMPORTANT: the resulting percentages are relative entertainment scores derived
from lexical signals. They are NOT probabilities and NOT psychological facts.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from app.data.traits import NEUTRAL, TRAIT_LABELS, TRAIT_WEIGHTS, TRAITS

CHARACTERS_PATH = Path(__file__).resolve().parents[1] / "data" / "characters.json"


def _resolve_characters_path() -> Path:
    """Find the character database in local, Docker and Vercel layouts."""
    candidates = [
        CHARACTERS_PATH,
        Path.cwd() / "app" / "data" / "characters.json",
        Path.cwd() / "data" / "characters.json",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return CHARACTERS_PATH


def load_characters() -> list[dict]:
    with _resolve_characters_path().open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    return data["characters"]


def character_vector(character: dict) -> np.ndarray:
    return np.array([float(character["traits"][trait]) for trait in TRAITS], dtype=float)


def weighted_cosine(a: np.ndarray, b: np.ndarray, weights: np.ndarray) -> float:
    """Weighted cosine similarity with a magnitude-calibration term.

    Pure cosine rewards two vectors pointing in the same direction even when
    their intensities differ substantially. We blend in a normalised distance
    term so that a reserved user is not declared identical to an extreme
    character merely because both vectors lean the same way. Still centred on
    the neutral 50 midpoint.
    """
    # Mean-centre each vector first. Cosine similarity of mean-centred vectors
    # is Pearson correlation: it compares the *shape* of the profile, so a
    # quiet user is not punished for having a lower overall baseline.
    mean_a = float(np.average(a, weights=weights))
    mean_b = float(np.average(b, weights=weights))
    wa = (a - mean_a) * weights
    wb = (b - mean_b) * weights
    denom = float(np.linalg.norm(wa) * np.linalg.norm(wb))
    cosine = float(np.clip(np.dot(wa, wb) / denom, -1.0, 1.0)) if denom >= 1e-9 else 0.0

    # Small intensity term: profiles with very different overall energy should
    # score slightly lower even when their shapes agree.
    intensity_gap = abs(mean_a - mean_b) / 100.0
    proximity = float(np.clip(1.0 - intensity_gap, 0.0, 1.0))
    return float(np.clip(0.85 * cosine + 0.15 * (2 * proximity - 1), -1.0, 1.0))


def score_to_percentage(cosine: float, confidence: float) -> int:
    """Map cosine similarity to a calm, honest 0-100 display score.

    Low confidence compresses scores toward 50 so the UI never overclaims.
    """
    raw = 50.0 + 48.0 * cosine
    raw = 50.0 + (raw - 50.0) * (0.45 + 0.55 * confidence)
    return int(round(max(4, min(96, raw))))


def _trait_comparisons(user: dict[str, float], character: dict) -> list[dict]:
    comparisons = []
    for trait in TRAITS:
        u = float(user.get(trait, NEUTRAL))
        c = float(character["traits"][trait])
        comparisons.append({
            "trait": trait,
            "label": TRAIT_LABELS[trait],
            "user_score": round(u, 1),
            "character_score": round(c, 1),
            "difference": round(abs(u - c), 1),
            "shared_strength": round(min(u, c) - abs(u - c) * 0.5, 1),
        })
    return comparisons


def match_characters(
    vector: dict[str, float],
    confidence: float = 0.7,
    characters: list[dict] | None = None,
) -> list[dict]:
    """Rank all characters and return enriched match dictionaries."""
    chars = characters if characters is not None else load_characters()
    weights = np.array([TRAIT_WEIGHTS[t] for t in TRAITS], dtype=float)
    user_arr = np.array([float(vector.get(t, NEUTRAL)) for t in TRAITS], dtype=float)

    ranked: list[dict] = []
    for char in chars:
        cosine = weighted_cosine(user_arr, character_vector(char), weights)
        comparisons = _trait_comparisons(vector, char)
        strongest = sorted(comparisons, key=lambda c: (-c["shared_strength"], c["difference"]))[:3]
        biggest_diff = max(comparisons, key=lambda c: c["difference"])
        ranked.append({
            "character_id": char["character_id"],
            "name": char["name"],
            "image": char["image"],
            "accent": char["accent"],
            "tagline": char["tagline"],
            "canonical_bio": char["canonical_bio"],
            "interpretation_note": char["interpretation_note"],
            "match_score": score_to_percentage(cosine, confidence),
            "cosine_similarity": round(cosine, 4),
            "matching_traits": strongest,
            "biggest_difference": biggest_diff,
            "_traits": char["traits"],
        })

    ranked.sort(key=lambda item: (-item["match_score"], -item["cosine_similarity"]))
    return ranked


def build_reasons(primary: dict, user: dict[str, float]) -> list[str]:
    """Human-readable reasons grounded in computed comparisons and canonical info."""
    reasons: list[str] = []
    aligned = sorted(
        primary["matching_traits"],
        key=lambda c: (-c["shared_strength"], c["difference"]),
    )
    strong = [c for c in aligned if min(c["user_score"], c["character_score"]) >= 45]
    for item in strong[:2]:
        reasons.append(
            f"Your {item['label'].lower()} signal ({item['user_score']:.0f}) lines up with "
            f"{primary['name']}'s profile ({item['character_score']:.0f}) — this is the "
            "strongest shared pattern the algorithm found."
        )

    if primary.get("canonical_bio"):
        first_sentence = primary["canonical_bio"].split(".")[0].strip()
        reasons.append(
            f"{primary['name']} is described as someone who {first_sentence.lower()}. "
            "That narrative lines up with the themes in your writing."
        )

    top_signal = max(user.items(), key=lambda kv: kv[1]) if user else None
    if top_signal:
        reasons.append(
            f"Your strongest measured signal overall is {TRAIT_LABELS.get(top_signal[0], top_signal[0]).lower()} "
            f"({top_signal[1]:.0f}), a defining trait of this character."
        )

    diff = primary["biggest_difference"]
    if diff and diff["difference"] >= 25:
        reasons.append(
            f"The clearest gap is {diff['label'].lower()} "
            f"(you {diff['user_score']:.0f}, {primary['name']} {diff['character_score']:.0f}) — "
            f"a real difference, not a hidden match."
        )
    return reasons[:5]


def top_runners_up(ranking: list[dict], count: int = 2) -> list[dict]:
    """Return second and third place without their internal trait payload."""
    result = []
    for item in ranking[1:1 + count]:
        clean = {k: v for k, v in item.items() if not k.startswith("_")}
        result.append(clean)
    return result


def public_match(item: dict) -> dict:
    return {k: v for k, v in item.items() if not k.startswith("_")}
