# YOUinGTA6

> **Your tweets. Your mindset. Your identity in Leonida.**

Discover which *Grand Theft Auto VI* character you resemble based on your public X (Twitter) personality — using **traditional NLP and mathematics only**. No LLM, no AI inference API, no image-generation service.

This is an unofficial, non-commercial fan project. It is not affiliated with or endorsed by Rockstar Games.

## Live deployment

- **Website:** <https://youingta6.vercel.app>
- **API docs:** <https://youingta6-backend.vercel.app/docs>
- **Source:** <https://github.com/import-dhruv/YOUinGTA6>

---

## What it does

1. You enter an X username (or pick a clearly labelled **fictional demo account**, or take the **offline quiz**).
2. The FastAPI backend fetches the public profile and available posts through an **authorised X API v2 Bearer token** (optional). Without credentials it says so honestly — it never fabricates tweets.
3. A pure-Python NLP pipeline cleans the text and extracts 14 transparent behavioural signals.
4. A **weighted, mean-centred cosine similarity** algorithm compares your vector against nine predefined character profiles.
5. The result screen shows your match, reasons grounded in your own posts, a radar dashboard, top-three comparison, and a downloadable 4:5 identity poster rendered in the browser with `html-to-image`.

---

## Zero-LLM guarantee

The repository contains **no** calls to OpenAI, Gemini, Claude, Anthropic, Hugging Face inference, Replicate, fal.ai, or any image-generation API. Analysis is regex/lexicon-based feature extraction plus NumPy vector maths. The poster is a screenshot of HTML/CSS. Placeholder character art is hand-written SVG stored locally.

---

## Project structure

```
YOUinGTA6/
├── frontend/                 # Next.js 15 + TypeScript + Tailwind
│   ├── app/                  # /, /analysis, /result, /api/proxy-image
│   ├── components/           # landing, analysis, reveal, dashboard, comparison, poster
│   ├── lib/                  # api client, types, ambient audio hook
│   └── public/               # local fonts, SVG character art, demo avatars
├── backend/                  # FastAPI
│   ├── app/
│   │   ├── api/              # (reserved for future routers)
│   │   ├── data/             # characters.json, trait weights, fictional demo accounts
│   │   ├── schemas/          # Pydantic models
│   │   ├── services/         # x_provider, text_preprocessor, feature_extractor,
│   │   │                     # personality_engine, character_matcher
│   │   └── tests/            # 18 unit + integration tests
│   ├── pyproject.toml        # includes [tool.vercel] entrypoint = "app.main:app"
│   └── requirements.txt
├── docker/                   # Dockerfiles + docker-compose.yml
└── DEPLOYMENT.md
```

---

## Quick start (local)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # optional: add X_BEARER_TOKEN
uvicorn app.main:app --reload --port 8000
```

API docs: <http://localhost:8000/docs> · Health: <http://localhost:8000/api/health>

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Open <http://localhost:3000>. `NEXT_PUBLIC_API_URL` must point at the backend.

### Demo without any credentials

On the landing page, click a `@demo` chip (e.g. `@conspiracycal`) or **Take the quiz**. Demo accounts are entirely fictional and live in `backend/app/data/demo_accounts.py`.

---

## API overview

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health + version + `llm_used: false` |
| GET | `/api/characters` | Nine character profiles with trait vectors |
| GET | `/api/demo/accounts` | Fictional demo accounts |
| POST | `/api/analyze` | `{username, force_demo}` → full result JSON |
| POST | `/api/analyze/stream` | Same, as SSE with genuine processing stages |
| POST | `/api/match` | Match a quiz-produced vector directly |

Full interactive documentation is served by FastAPI at `/docs` and `/redoc`.

---

## Character data & honesty notes

- `backend/app/data/characters.json` stores all nine characters with canonical bios (paraphrased from Rockstar's public promotional material), image paths, taglines, trait vectors, and an explicit `interpretation_note`.
- Trait numbers are **configurable assumptions**, not scientific measurements.
- Match percentages are **relative entertainment scores**, never probabilities or diagnoses.
- Evidence quotes shown in the UI are real lines from the analysed posts. Nothing is invented.
- Protected accounts, missing posts, rate limits and API errors produce explicit messages and a quiz fallback.

---

## Tests

```bash
cd backend
pip install -r requirements.txt
pytest app/tests -q          # 18 tests: preprocessing, scoring, matching, API, SSE, validation
```

Frontend checks:

```bash
cd frontend
npm run typecheck
npm run build
```

---

## Privacy & security

- Public data only; no passwords are ever requested.
- API keys stay server-side (`X_BEARER_TOKEN`), never in the browser.
- Raw post text is used in-memory for analysis; only derived scores and the short evidence excerpts are returned to the client.
- Results are stored only in the browser session (`sessionStorage`).
- The image proxy at `/api/proxy-image` has a strict host allowlist to prevent SSRF.
- No sensitive personal attributes are inferred. Entertainment use only.

---

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for Vercel (frontend + FastAPI backend), Docker Compose, and environment variables.
