"""Text preprocessing for short-form social posts.

Pure Python + standard library, no LLM and no heavyweight NLP corpora required.
The transformations are intentionally transparent and explainable.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field

URL_RE = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
MENTION_RE = re.compile(r"@\w+")
HASHTAG_RE = re.compile(r"#(\w+)")
WORD_RE = re.compile(r"[a-zA-Z][a-zA-Z'\-]{1,}")
EMOJI_RE = re.compile(
    "[\U0001F300-\U0001FAFF\U00002600-\U000027BF\U0001F1E6-\U0001F1FF]"
)

STOPWORDS: set[str] = {
    "a", "about", "above", "after", "again", "against", "all", "also", "am", "an",
    "and", "any", "are", "as", "at", "be", "because", "been", "before", "being",
    "below", "between", "both", "but", "by", "can", "cannot", "could", "did", "do",
    "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had",
    "has", "have", "having", "he", "her", "here", "hers", "herself", "him", "himself",
    "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "just", "me",
    "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on",
    "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own",
    "s", "same", "she", "should", "so", "some", "such", "t", "than", "that", "the",
    "their", "theirs", "them", "themselves", "then", "there", "these", "they", "this",
    "those", "through", "to", "too", "under", "until", "up", "very", "was", "we",
    "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will",
    "with", "you", "your", "yours", "yourself", "yourselves", "im", "ive", "dont",
    "doesnt", "didnt", "isnt", "arent", "wont", "cant", "thats", "get", "got", "go",
    "going", "one", "like", "know", "think", "really", "much", "would", "there", "yeah",
}

IRREGULAR: dict[str, str] = {
    "went": "go", "gone": "go", "does": "do", "did": "do", "done": "do",
    "had": "have", "has": "have", "was": "be", "were": "be", "been": "be",
    "am": "be", "is": "be", "are": "be", "better": "good", "best": "good",
    "worse": "bad", "worst": "bad", "more": "more", "less": "less",
    "children": "child", "men": "man", "women": "woman", "feet": "foot",
    "built": "build", "made": "make", "took": "take", "taken": "take",
    "gave": "give", "given": "give", "saw": "see", "seen": "see",
    "won": "win", "lost": "lose", "kept": "keep", "felt": "feel", "held": "hold",
    "left": "leave", "grew": "grow", "grown": "grow", "bought": "buy", "paid": "pay",
}


@dataclass
class ProcessedPost:
    original: str
    clean: str
    tokens: list[str] = field(default_factory=list)
    hashtags: list[str] = field(default_factory=list)
    emojis: list[str] = field(default_factory=list)
    exclamations: int = 0
    questions: int = 0
    caps_ratio: float = 0.0
    is_reply: bool = False
    has_mention: bool = False
    length: int = 0


def normalize_text(text: str) -> str:
    """Unicode-normalise and collapse whitespace without changing meaning."""
    text = unicodedata.normalize("NFKC", text)
    text = text.replace("\u200b", " ")
    return re.sub(r"\s+", " ", text).strip()


def clean_post(text: str) -> str:
    """Remove URLs and mentions, keep hashtags and the natural writing."""
    text = normalize_text(text)
    text = URL_RE.sub(" ", text)
    text = MENTION_RE.sub(" ", text)
    return re.sub(r"\s+", " ", text).strip()


def lemmatize(word: str) -> str:
    """Small deterministic lemmatizer: irregulars + conservative suffix rules."""
    w = word.lower()
    if w in IRREGULAR:
        return IRREGULAR[w]
    if len(w) > 5 and w.endswith("ies"):
        return w[:-3] + "y"
    if len(w) > 5 and w.endswith("ing"):
        stem = w[:-3]
        if len(stem) > 2 and stem[-1] == stem[-2] and stem[-1] not in "aeiou":
            stem = stem[:-1]
        return stem
    if len(w) > 4 and w.endswith("ed"):
        stem = w[:-2]
        if len(stem) > 2 and stem[-1] == stem[-2] and stem[-1] not in "aeiou":
            stem = stem[:-1]
        return stem
    if len(w) > 4 and w.endswith("es") and not w.endswith(("ses", "zes", "ches", "shes")):
        return w[:-2]
    if len(w) > 3 and w.endswith("s") and not w.endswith(("ss", "us", "is")):
        return w[:-1]
    if len(w) > 4 and w.endswith("ly"):
        return w[:-2]
    return w


def process_post(text: str | dict) -> ProcessedPost | None:
    """Turn one raw post (str or dict with 'text'/'is_reply') into features."""
    if isinstance(text, dict):
        raw = str(text.get("text", ""))
        is_reply = bool(text.get("is_reply", False))
    else:
        raw = str(text)
        is_reply = False

    raw = normalize_text(raw)
    if len(raw) < 2:
        return None

    clean = clean_post(raw)
    hashtags = [h.lower() for h in HASHTAG_RE.findall(clean)]
    emojis = EMOJI_RE.findall(raw)
    words = [w.lower() for w in WORD_RE.findall(clean)]
    tokens = []
    for word in words:
        if word in STOPWORDS or len(word) < 2:
            continue
        lemma = lemmatize(word)
        if lemma not in STOPWORDS and len(lemma) >= 2:
            tokens.append(lemma)

    letters = [c for c in clean if c.isalpha()]
    caps_ratio = (sum(1 for c in letters if c.isupper()) / len(letters)) if letters else 0.0

    return ProcessedPost(
        original=raw,
        clean=clean,
        tokens=tokens,
        hashtags=hashtags,
        emojis=emojis,
        exclamations=min(clean.count("!"), 12),
        questions=min(clean.count("?"), 12),
        caps_ratio=caps_ratio,
        is_reply=is_reply,
        has_mention=bool(MENTION_RE.search(raw)) or raw.strip().startswith("@"),
        length=len(clean),
    )


def preprocess(posts: list[str | dict]) -> list[ProcessedPost]:
    """Clean, deduplicate and drop spam/empty posts."""
    seen: set[str] = set()
    result: list[ProcessedPost] = []
    for raw in posts:
        processed = process_post(raw)
        if not processed:
            continue
        dedupe_key = processed.clean.lower()
        if dedupe_key in seen:
            continue
        if len(processed.tokens) < 2 and not processed.hashtags and not processed.emojis:
            continue
        # Skip obvious link-only / spam rows.
        if processed.length < 8 and not processed.emojis:
            continue
        seen.add(dedupe_key)
        result.append(processed)
    return result


def repeated_phrases(posts: list[ProcessedPost], min_len: int = 2) -> list[str]:
    """Detect repeated bigrams/trigrams across the corpus."""
    from collections import Counter

    counts: Counter[str] = Counter()
    for post in posts:
        toks = post.tokens
        for n in (2, 3):
            for i in range(len(toks) - n + 1):
                if n >= min_len:
                    counts[" ".join(toks[i:i + n])] += 1
    return [phrase for phrase, count in counts.most_common(8) if count >= 3]
