"""Integration tests for the HTTP API."""

from __future__ import annotations

import json
import os
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["llm_used"] is False


def test_characters_endpoint_returns_nine():
    res = client.get("/api/characters")
    assert res.status_code == 200
    chars = res.json()
    assert len(chars) == 9
    assert {c["name"] for c in chars} >= {"Jason Duval", "Lucia Caminos", "Roxy"}


def test_demo_accounts_endpoint():
    res = client.get("/api/demo/accounts")
    assert res.status_code == 200
    assert len(res.json()) >= 5


def test_analyze_demo_account():
    res = client.post("/api/analyze", json={"username": "vicecityvince", "force_demo": True})
    assert res.status_code == 200
    body = res.json()
    assert body["primary"]["name"] == "Jason Duval"
    assert len(body["ranking"]) == 9
    assert body["profile"]["demo"] is True
    assert body["personality"]["posts_analyzed"] > 0


def test_analyze_unavailable_profile_is_honest():
    """Without credentials and without demo mode, we must not fabricate data."""
    with patch.dict(os.environ, {"X_BEARER_TOKEN": ""}):
        res = client.post("/api/analyze", json={"username": "realperson"})
    assert res.status_code == 422
    assert isinstance(res.json()["detail"], str)


def test_match_quiz_vector():
    vector = {t: 50 for t in [
        "ambition", "confidence", "risk_appetite", "humor", "independence",
        "rebelliousness", "creativity", "social_energy", "entrepreneurial",
        "strategic_thinking", "loyalty", "adaptability", "impulsiveness", "expressiveness",
    ]}
    vector["humor"] = 95
    vector["impulsiveness"] = 90
    res = client.post("/api/match", json={"vector": vector, "confidence": 0.8})
    assert res.status_code == 200
    assert res.json()["personality"]["data_source"] == "quiz"


def test_validation_rejects_bad_handle():
    res = client.post("/api/analyze", json={"username": "bad handle!"})
    assert res.status_code == 422


@pytest.mark.parametrize("handle", ["vicecityvince", "conspiracycal", "diamondraul"])
def test_stream_emits_real_stages_and_result(handle):
    with client.stream("POST", "/api/analyze/stream", json={"username": handle, "force_demo": True}) as res:
        assert res.status_code == 200
        payloads = []
        for line in res.iter_lines():
            if line.startswith("data: "):
                payloads.append(json.loads(line[6:]))
    stages = [p["stage"] for p in payloads]
    assert "connecting" in stages
    assert "posts" in stages
    assert "matching" in stages
    assert "result" in stages
    final = json.loads([p for p in payloads if p["stage"] == "result"][-1]["message"])
    assert final["primary"]["name"]
