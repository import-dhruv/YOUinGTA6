"""Shared trait definitions and matching weights.

These constants are the single source of truth for the personality engine.
Every trait is scored on a 0-100 scale where 50 is a neutral midpoint.
"""

TRAITS: list[str] = [
    "ambition",
    "confidence",
    "risk_appetite",
    "humor",
    "independence",
    "rebelliousness",
    "creativity",
    "social_energy",
    "entrepreneurial",
    "strategic_thinking",
    "loyalty",
    "adaptability",
    "impulsiveness",
    "expressiveness",
]

# Relative importance of each trait when comparing two vectors.
# Weights are configurable assumptions, not measured facts.
TRAIT_WEIGHTS: dict[str, float] = {
    "ambition": 1.0,
    "confidence": 1.0,
    "risk_appetite": 1.1,
    "humor": 0.9,
    "independence": 1.1,
    "rebelliousness": 1.0,
    "creativity": 0.9,
    "social_energy": 0.9,
    "entrepreneurial": 1.0,
    "strategic_thinking": 1.1,
    "loyalty": 0.8,
    "adaptability": 0.8,
    "impulsiveness": 1.0,
    "expressiveness": 0.7,
}

# Human-friendly labels used in the UI and explanations.
TRAIT_LABELS: dict[str, str] = {
    "ambition": "Ambition",
    "confidence": "Confidence",
    "risk_appetite": "Risk appetite",
    "humor": "Humor",
    "independence": "Independence",
    "rebelliousness": "Rebelliousness",
    "creativity": "Creativity",
    "social_energy": "Social energy",
    "entrepreneurial": "Entrepreneurial mindset",
    "strategic_thinking": "Strategic thinking",
    "loyalty": "Loyalty expression",
    "adaptability": "Adaptability",
    "impulsiveness": "Impulsiveness",
    "expressiveness": "Expressiveness",
}

# Short explanation of how each score is estimated (shown in the dashboard).
TRAIT_EXPLANATIONS: dict[str, str] = {
    "ambition": "Goal and achievement vocabulary (e.g. goals, build, win, grind) plus references to plans and progress.",
    "confidence": "Assertive, decisive phrasing and first-person certainty markers.",
    "risk_appetite": "Adventure, gamble and risk-related vocabulary plus bold, decisive language.",
    "humor": "Laughter markers, jokes, memes and playful punctuation patterns.",
    "independence": "Autonomy and self-reliance vocabulary such as solo, own, myself and independence.",
    "rebelliousness": "Anti-establishment and rule-breaking expressions and oppositional language.",
    "creativity": "Vocabulary diversity plus creative and artistic vocabulary.",
    "social_energy": "Interaction markers (replies, mentions, questions) and social vocabulary.",
    "entrepreneurial": "Business, money and startup-related vocabulary and hustle language.",
    "strategic_thinking": "Planning, analysis and long-term vocabulary plus deliberate structure.",
    "loyalty": "Expressions of loyalty, support and commitment to people or teams.",
    "adaptability": "Topic diversity and openness/change vocabulary.",
    "impulsiveness": "Urgency, spontaneity and spontaneous-action vocabulary plus rapid-fire punctuation.",
    "expressiveness": "Overall expressiveness: caps, exclamation marks, emoji and descriptive language.",
}

NEUTRAL = 50.0
MIN_USABLE_POSTS = 3
MIN_CONFIDENT_POSTS = 12
MAX_ANALYZED_POSTS = 400
