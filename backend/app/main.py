"""YOUinGTA6 API — zero-LLM personality matching engine.

Run locally:  uvicorn app.main:app --reload --port 8000
Docs:         http://localhost:8000/docs
"""

from __future__ import annotations

import asyncio
import json
import os
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from app.config import VERSION, demo_count
from app.data.demo_accounts import list_demo_accounts
from app.schemas.analysis import (
    AnalyzeRequest,
    AnalyzeResponse,
    CharacterSummary,
    DemoAccount,
    HealthResponse,
    MatchRequest,
)
from app.services import character_matcher, personality_engine
from app.services.x_provider import ProfileData, ProviderError, fetch_profile

app = FastAPI(
    title="YOUinGTA6 API",
    version=VERSION,
    description=(
        "Entertainment-only GTA VI character matcher. Uses transparent NLP and "
        "weighted cosine similarity. NO AI model, NO LLM, NO image generation."
    ),
)

allowed_origins = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    # Local development may run the frontend on any port; real deployments
    # must set ALLOWED_ORIGINS explicitly.
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def build_response(profile, personality: dict, ranking: list[dict]) -> AnalyzeResponse:
    primary = ranking[0]
    reasons = character_matcher.build_reasons(primary, personality["vector"])
    profile_info = {
        "username": profile.username,
        "display_name": profile.display_name,
        "profile_image_url": profile.profile_image_url,
        "bio": profile.bio,
        "post_count_analyzed": personality["posts_analyzed"],
        "source": profile.source,
        "available": profile.available,
        "notice": profile.notice,
        "demo": profile.demo,
    }
    return AnalyzeResponse(
        profile=profile_info,
        personality=personality,
        primary=character_matcher.public_match(primary),
        runners_up=character_matcher.top_runners_up(ranking),
        ranking=[character_matcher.public_match(r) for r in ranking],
        reasons=reasons,
        analysis_id=uuid.uuid4().hex[:12],
        generated_at=now_iso(),
    )


@app.get("/", tags=["meta"])
def root():
    return {
        "name": "YOUinGTA6 API",
        "version": VERSION,
        "docs": "/docs",
        "llm_used": False,
        "endpoints": [
            "/api/health", "/api/characters", "/api/demo/accounts",
            "/api/analyze", "/api/analyze/stream", "/api/match",
        ],
    }


@app.get("/api/health", response_model=HealthResponse, tags=["meta"])
def health():
    return HealthResponse(
        status="ok",
        version=VERSION,
        llm_used=False,
        demo_accounts=demo_count(),
    )


@app.get("/api/characters", response_model=list[CharacterSummary], tags=["data"])
def characters():
    return character_matcher.load_characters()


@app.get("/api/demo/accounts", response_model=list[DemoAccount], tags=["data"])
def demo_accounts():
    return list_demo_accounts()


@app.post("/api/analyze", response_model=AnalyzeResponse, tags=["analysis"])
async def analyze(request: AnalyzeRequest):
    try:
        profile = await fetch_profile(request.username, request.force_demo)
    except ProviderError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    if not profile.available or not profile.posts:
        # Honest handling: no posts means we cannot analyse personality.
        raise HTTPException(
            status_code=422,
            detail=profile.notice or "No public posts were available to analyse. Try demo mode or the quiz.",
        )

    personality = personality_engine.analyze_posts(profile.posts)
    if not personality["vector"]:
        raise HTTPException(status_code=422, detail="Not enough readable text to analyse.")
    ranking = character_matcher.match_characters(
        personality["vector"], personality["overall_confidence"]
    )
    return build_response(profile, personality, ranking)


@app.post("/api/match", response_model=AnalyzeResponse, tags=["analysis"])
async def match_vector(request: MatchRequest):
    """Match a vector produced by the offline quiz (no posts, no X API)."""
    personality = personality_engine.analyze_vector(
        request.vector, request.confidence, request.source
    )
    ranking = character_matcher.match_characters(
        request.vector, personality["overall_confidence"]
    )
    profile = ProfileData(
        username=request.username,
        display_name="You",
        profile_image_url="",
        bio="Manual personality quiz",
        posts=[],
        source=request.source,
        available=True,
        notice="Result based on your quiz answers, not on X data.",
        demo=False,
    )
    return build_response(profile, personality, ranking)


@app.post("/api/analyze/stream", tags=["analysis"])
async def analyze_stream(request: AnalyzeRequest):
    """Server-Sent Events stream whose stages map to real processing steps."""

    async def event(stage: str, progress: int, message: str) -> str:
        payload = json.dumps({"stage": stage, "progress": progress, "message": message})
        return f"data: {payload}\n\n"

    async def generator():
        try:
            yield await event("connecting", 8, "CONNECTING TO YOUR X PROFILE")
            profile = await fetch_profile(request.username, request.force_demo)
            yield await event("connected", 18, f"PROFILE FOUND: @{profile.username}")

            if not profile.available or not profile.posts:
                message = profile.notice or "No public posts were available to analyse."
                yield await event("error", 100, f"ERROR: {message}")
                return

            yield await event("posts", 32, "ANALYSING YOUR POSTS")
            yield await event("style", 48, "STUDYING YOUR WRITING STYLE")
            personality = personality_engine.analyze_posts(profile.posts)
            await asyncio.sleep(0)  # cooperative yield, no artificial delay

            if not personality["vector"]:
                yield await event("insufficient", 100, "NOT ENOUGH READABLE TEXT")
                return

            yield await event("patterns", 66, "DETECTING YOUR PERSONALITY PATTERNS")
            yield await event("identity", 80, "CALCULATING YOUR LEONIDA IDENTITY")
            yield await event("matching", 92, "MATCHING GTA VI CHARACTERS")
            ranking = character_matcher.match_characters(
                personality["vector"], personality["overall_confidence"]
            )
            response = build_response(profile, personality, ranking)
            yield await event("reveal", 100, "PREPARING YOUR CHARACTER REVEAL")
            yield await event("result", 100, response.model_dump_json())
        except ProviderError as exc:
            yield await event("error", 100, f"ERROR: {exc}")

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
