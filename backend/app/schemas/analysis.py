"""Pydantic models shared across the API layer."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator

from app.data.traits import TRAITS


class AnalyzeRequest(BaseModel):
    username: str = Field(..., max_length=30, description="X handle with or without @")
    force_demo: bool = Field(
        default=False,
        description="Use the labelled fictional demo account with this handle, if it exists.",
    )

    @field_validator("username")
    @classmethod
    def clean_username(cls, value: str) -> str:
        handle = value.strip().lstrip("@").lower()
        if not handle:
            raise ValueError("Username cannot be empty")
        if not all(c.isalnum() or c == "_" for c in handle):
            raise ValueError("Username may only contain letters, numbers and underscores")
        return handle


class MatchRequest(BaseModel):
    """Match a vector produced by an offline/manual quiz flow."""

    vector: dict[str, float] = Field(..., description="Trait -> 0-100 score")
    confidence: float = Field(default=0.6, ge=0.0, le=1.0)
    source: str = Field(default="quiz", description="Origin of the vector")
    username: str = Field(default="you", max_length=30)

    @field_validator("vector")
    @classmethod
    def validate_vector(cls, value: dict[str, float]) -> dict[str, float]:
        cleaned: dict[str, float] = {}
        for trait in TRAITS:
            raw = value.get(trait, 50.0)
            try:
                cleaned[trait] = max(0.0, min(100.0, float(raw)))
            except (TypeError, ValueError):
                cleaned[trait] = 50.0
        return cleaned


class EvidenceItem(BaseModel):
    text: str
    matched_terms: list[str] = Field(default_factory=list)


class FeatureResult(BaseModel):
    trait: str
    label: str
    raw_count: float
    normalized_score: float
    posts_contributing: int
    confidence: float
    explanation: str
    evidence: list[EvidenceItem] = Field(default_factory=list)


class TraitMatch(BaseModel):
    trait: str
    label: str
    user_score: float
    character_score: float
    difference: float
    shared_strength: float


class CharacterMatch(BaseModel):
    character_id: str
    name: str
    image: str
    accent: str
    tagline: str
    canonical_bio: str
    interpretation_note: str
    match_score: int
    cosine_similarity: float
    matching_traits: list[TraitMatch] = Field(default_factory=list)
    biggest_difference: TraitMatch | None = None


class ProfileInfo(BaseModel):
    username: str
    display_name: str
    profile_image_url: str
    bio: str
    post_count_analyzed: int
    source: str
    available: bool
    notice: str | None = None
    demo: bool = False


class PersonalityResult(BaseModel):
    vector: dict[str, float]
    features: dict[str, FeatureResult]
    overall_confidence: float
    low_confidence: bool
    warning: str | None = None
    posts_analyzed: int
    data_source: str


class AnalyzeResponse(BaseModel):
    profile: ProfileInfo
    personality: PersonalityResult
    primary: CharacterMatch
    runners_up: list[CharacterMatch]
    ranking: list[CharacterMatch]
    reasons: list[str]
    analysis_id: str
    generated_at: str


class DemoAccount(BaseModel):
    handle: str
    display_name: str
    description: str
    archetype: str
    profile_image: str


class CharacterSummary(BaseModel):
    character_id: str
    name: str
    image: str
    accent: str
    tagline: str
    canonical_bio: str
    interpretation_note: str
    traits: dict[str, float]


class HealthResponse(BaseModel):
    status: str
    version: str
    llm_used: bool = False
    demo_accounts: int
