"""Rule-based, explainable personality feature extraction.

NO machine-learning model and NO LLM are used here. Scores come from
transparent lexical/structural signals in a user's own posts. Every score is a
behavioural indicator of *language use*, not a psychological diagnosis.
"""

from __future__ import annotations

import math
from collections import Counter
from dataclasses import dataclass

from app.data.traits import TRAIT_EXPLANATIONS, TRAIT_LABELS, TRAITS
from app.services.text_preprocessor import WORD_RE, ProcessedPost

# --- Lexicons ---------------------------------------------------------------
# Words are matched against lemmatised tokens; phrases against the cleaned text.
# Each entry: (word_signals, phrase_signals, emoji_signals, saturation)

LEXICONS: dict[str, dict] = {
    "ambition": {
        "words": {
            "goal", "win", "build", "grind", "achieve", "success", "dream", "launch",
            "level", "progress", "hustle", "target", "climb", "ambition", "work",
            "effort", "finish", "plan", "future", "better", "rise", "complete",
        },
        "phrases": ["big move", "next level", "landed", "closed the deal", "back to work"],
        "emoji": set(),
        "sat": 0.85,
    },
    "confidence": {
        "words": {
            "confident", "sure", "definitely", "always", "never", "strong", "believe",
            "clearly", "trust", "certain", "capable", "solid", "prove",
        },
        "phrases": ["no doubt", "believe me", "i can", "i will", "i know", "watch me", "trust me"],
        "emoji": set(),
        "sat": 0.9,
    },
    "risk_appetite": {
        "words": {
            "risk", "gamble", "chance", "bold", "dare", "adventure", "wild", "jump",
            "crazy", "extreme", "bet", "leap", "fearless", "danger", "edge", "guts",
            "shot", "try", "new",
        },
        "phrases": ["let's go", "no plan", "all in", "go for it", "take the leap", "what could go wrong"],
        "emoji": {"🎲", "🔥", "🚀", "😎", "⚡"},
        "sat": 0.95,
    },
    "humor": {
        "words": {
            "lol", "lmao", "haha", "hehe", "funny", "joke", "meme", "hilarious",
            "laugh", "silly", "ridiculous", "chaos", "suspicious", "conspiracy", "weird",
        },
        "phrases": ["just saying", "hear me out", "i'm dead", "not me", "relatable", "actually"],
        "emoji": {"😂", "🤣", "😭", "😹", "🤪", "🙃", "👽"},
        "sat": 1.0,
    },
    "independence": {
        "words": {
            "independent", "solo", "alone", "myself", "own", "self", "freedom", "free",
            "nobody", "no one", "without", "rely", "individual", "single", "separate",
            "choice", "decide",
        },
        "phrases": ["my own", "on my own", "do it myself", "no handouts", "solo", "keep to myself", "by myself"],
        "emoji": set(),
        "sat": 0.9,
    },
    "rebelliousness": {
        "words": {
            "rule", "break", "rebel", "against", "system", "establishment", "government",
            "suspicious", "conspiracy", "fight", "defy", "anti", "illegal", "question",
            "different", "normal", "authority", "control", "freedom",
        },
        "phrases": ["no filter", "break the", "they don't want", "question everything", "say what i want", "not following"],
        "emoji": {"✊", "🤬", "👽"},
        "sat": 0.95,
    },
    "creativity": {
        "words": {
            "create", "art", "design", "write", "music", "idea", "imagine", "creative",
            "paint", "film", "style", "original", "craft", "story", "vision", "make",
            "song", "draw", "build", "brain",
        },
        "phrases": ["made this", "working on", "came up with", "in the works", "creative"],
        "emoji": {"🎨", "🎵", "🎬", "✍️", "💡"},
        "sat": 0.85,
    },
    "social_energy": {
        "words": {
            "we", "us", "together", "party", "friends", "connect", "people", "crew",
            "team", "everyone", "anyone", "party", "hang", "meet", "chat", "group",
            "family", "night", "event",
        },
        "phrases": ["who's around", "let's connect", "group chat", "meet up", "come through", "see you", "pull up"],
        "emoji": {"🎉", "🙌", "🥳", "👋", "💃"},
        "sat": 0.9,
    },
    "entrepreneurial": {
        "words": {
            "business", "money", "startup", "founder", "deal", "invest", "brand", "client",
            "profit", "sell", "market", "company", "launch", "hustle", "entrepreneur",
            "revenue", "funding", "trade", "customer", "product", "scale",
        },
        "phrases": ["new venture", "closed the deal", "start before", "build a brand", "working for myself", "my company"],
        "emoji": {"💰", "📈", "🚀", "💼", "🤑"},
        "sat": 0.95,
    },
    "strategic_thinking": {
        "words": {
            "plan", "strategy", "analyze", "think", "future", "step", "system", "review",
            "prepare", "research", "data", "calculated", "patience", "detail", "logic",
            "process", "structure", "measure", "ahead", "long", "focus",
        },
        "phrases": ["two steps ahead", "plan twice", "think it through", "long game", "measure twice", "stay focused"],
        "emoji": {"🧠", "📊", "🎯"},
        "sat": 0.9,
    },
    "loyalty": {
        "words": {
            "loyal", "loyalty", "team", "family", "brother", "sister", "friend", "support",
            "trust", "together", "ride", "crew", "people", "home", "care", "protect",
            "commitment",
        },
        "phrases": ["ride or die", "always there", "have your back", "my people", "ride for", "stand by"],
        "emoji": {"🤝", "❤️", "💪"},
        "sat": 0.9,
    },
    "adaptability": {
        "words": {
            "change", "adapt", "flexible", "open", "new", "different", "learn", "pivot",
            "adjust", "growth", "evolve", "whatever", "flow", "versatile", "shift",
            "figure", "adjust", "dynamic",
        },
        "phrases": ["figure it out", "go with the flow", "new chapter", "learn as i go", "adjust"],
        "emoji": {"🌊", "🔄", "🌱"},
        "sat": 0.85,
    },
    "impulsiveness": {
        "words": {
            "now", "immediately", "spontaneous", "impulse", "sudden", "quick", "fast",
            "instant", "bought", "went", "yolo", "later", "random", "rush",
            "suddenly", "just",
        },
        "phrases": ["let's go", "no plan", "did it anyway", "right now", "right away", "impulse buy", "why not"],
        "emoji": {"⚡", "🔥", "🏃", "🎢"},
        "sat": 1.0,
    },
    "expressiveness": {
        "words": set(),
        "phrases": [],
        "emoji": set(),
        "sat": 0.8,
    },
}


@dataclass
class PostSignal:
    index: int
    score: float
    matched_terms: list[str]


def _term_matches(post: ProcessedPost, lexicon: dict) -> list[str]:
    """Return the list of signals present in one post."""
    matched: list[str] = []
    # Match both lemmatised tokens and the original surface words so that
    # inflections such as "calculated" still register against "calculated".
    tokens = set(post.tokens) | {w.lower() for w in WORD_RE.findall(post.clean)}
    lowered = post.clean.lower()

    for word in lexicon["words"]:
        word = word.strip()
        if word and word in tokens:
            matched.append(word)
    for phrase in lexicon["phrases"]:
        if phrase and phrase in lowered:
            matched.append(phrase)
    for emoji in lexicon["emoji"]:
        if emoji in post.emojis:
            matched.append(emoji)

    if lexicon is LEXICONS["humor"]:
        if post.exclamations >= 2:
            matched.append("multiple !")
    if lexicon is LEXICONS["expressiveness"]:
        if post.caps_ratio >= 0.25:
            matched.append("caps")
        if post.exclamations:
            matched.append("exclamation")
        if post.emojis:
            matched.append("emoji")
        if post.questions:
            matched.append("question")
    if lexicon is LEXICONS["social_energy"]:
        if post.is_reply:
            matched.append("reply")
        if post.has_mention:
            matched.append("mention")
        if post.questions:
            matched.append("question")
    if lexicon is LEXICONS["creativity"]:
        if len(set(post.tokens)) / max(1, len(post.tokens)) > 0.85 and len(post.tokens) > 6:
            matched.append("vocabulary diversity")
    if lexicon is LEXICONS["impulsiveness"]:
        if post.exclamations >= 2 and post.length < 90:
            matched.append("rapid punctuation")
    return matched


def saturation(density: float, k: float) -> float:
    """Map an unbounded density to a 0-100 score with diminishing returns."""
    return round(100.0 * (1.0 - math.exp(-k * density)), 1)


def extract_features(posts: list[ProcessedPost]) -> dict[str, dict]:
    """Compute a FeatureResult-compatible dict for every trait."""
    total = len(posts)
    per_trait: dict[str, dict] = {}

    for trait in TRAITS:
        lexicon = LEXICONS[trait]
        signals: list[PostSignal] = []
        for i, post in enumerate(posts):
            matched = _term_matches(post, lexicon)
            if matched:
                signals.append(PostSignal(i, float(len(matched)), matched))

        raw_count = round(sum(s.score for s in signals), 2)
        density = raw_count / max(1, total)
        score = saturation(density, lexicon["sat"] * 3.4)
        contributing = len(signals)
        post_confidence = contributing / max(1, total)
        confidence = round(min(1.0, total / 18) * (0.55 + 0.45 * post_confidence), 3)

        evidence = []
        for signal in sorted(signals, key=lambda s: (-s.score, s.index))[:3]:
            text = posts[signal.index].clean
            evidence.append({
                "text": text[:220] + ("…" if len(text) > 220 else ""),
                "matched_terms": signal.matched_terms[:6],
            })

        per_trait[trait] = {
            "trait": trait,
            "label": TRAIT_LABELS[trait],
            "raw_count": raw_count,
            "normalized_score": score,
            "posts_contributing": contributing,
            "confidence": confidence,
            "explanation": TRAIT_EXPLANATIONS[trait],
            "evidence": evidence,
        }

    return per_trait


def vector_from_features(features: dict[str, dict]) -> dict[str, float]:
    return {trait: float(features[trait]["normalized_score"]) for trait in TRAITS}


def lexicon_summary() -> dict[str, int]:
    """Small helper used in tests to assert lexicon coverage."""
    return {
        trait: len(LEXICONS[trait]["words"]) + len(LEXICONS[trait]["phrases"]) + len(LEXICONS[trait]["emoji"])
        for trait in TRAITS
    }
