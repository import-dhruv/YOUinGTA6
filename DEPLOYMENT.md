# Deployment

**Live instance:** frontend <https://youingta6.vercel.app> · backend <https://youingta6-backend.vercel.app>

The project is deployed as two independent applications:

- **frontend/** — Next.js 15 site
- **backend/** — FastAPI Python application (Vercel Python runtime / Docker)

---

## 1. Vercel (recommended)

### Backend

Vercel detects FastAPI automatically via `backend/pyproject.toml`:

```toml
[tool.vercel]
entrypoint = "app.main:app"
```

Steps:

```bash
cd backend
vercel                      # preview; add --prod for production
```

Then set environment variables on the backend project:

```bash
vercel env add ALLOWED_ORIGINS production
# value: https://<your-frontend-domain>.vercel.app

vercel env add X_BEARER_TOKEN production   # optional, X API v2 app-only token
```

Redeploy after changing environment variables:

```bash
vercel --prod
```

Interactive API docs live at `https://<backend-domain>/docs`.

### Frontend

```bash
cd frontend
vercel env add NEXT_PUBLIC_API_URL production
# value: https://<your-backend-domain>

vercel env add NEXT_PUBLIC_SITE_URL production
# value: https://<your-frontend-domain>

vercel --prod
```

`NEXT_PUBLIC_*` variables are baked in at build time, so **redeploy after setting them**.

### Vercel notes

- Python functions include project files reachable at build time, so `app/data/characters.json` is bundled automatically.
- Streaming (`/api/analyze/stream`) is supported by the Python runtime and is used for the live analysis stages.
- Demo mode works with no environment variables at all.

---

## 2. Docker Compose

From the repository root:

```bash
# optional: export an X token and the public origin
export X_BEARER_TOKEN="..."
export ALLOWED_ORIGINS="http://localhost:3000"
export NEXT_PUBLIC_API_URL="http://localhost:8000"
export NEXT_PUBLIC_SITE_URL="http://localhost:3000"

docker compose -f docker/docker-compose.yml up --build
```

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:8000/docs>

---

## 3. Manual / other hosts

- Backend: any ASGI host, e.g. `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
- Frontend: `npm run build && npm start` (Node 20+).
- Set `ALLOWED_ORIGINS` on the backend to the frontend's public origin.
- Set `NEXT_PUBLIC_API_URL` before the frontend build.

---

## Environment variable reference

### Backend (`backend/.env`)

| Variable | Required | Purpose |
|---|---|---|
| `X_BEARER_TOKEN` | No | X API v2 app-only token. Without it, live lookups report unavailable and demo/quiz modes are used. |
| `X_CONSUMER_KEY` | No | App consumer key. Used to mint an app-only token when no bearer token is set, or to refresh a rejected one. |
| `X_CONSUMER_SECRET` | No | App consumer secret. Store as a Vercel Secret; never commit or expose to the browser. |

> Live X lookups require an X API project with **available credits**. If X returns `402 credits depleted`,
> the app reports this clearly and offers demo/quiz mode. Add credits in the X developer portal to enable
> live profile and post retrieval — no code change is needed.
| `ALLOWED_ORIGINS` | Production yes | Comma-separated frontend origins allowed by CORS. |
| `SITE_URL` | No | Public site URL. |
| `PORT` | No | Local server port (default 8000). |

### Frontend (`frontend/.env.local`)

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base URL (no trailing slash). |
| `NEXT_PUBLIC_SITE_URL` | No | Public site URL for share links. |

---

## Replacing placeholder art

Character portraits are stylised SVG placeholders in `frontend/public/characters/`. To use authorised GTA VI promotional imagery:

1. Convert images to optimised WebP.
2. Keep the same filenames with `.webp` extensions.
3. Update the `image` fields in `backend/app/data/characters.json` and the character strip in `frontend/components/Landing.tsx`.

Ensure you have the right to use any replacement imagery.

Deployed on Vercel with Root Directory set to `frontend` (website) and `backend` (API).
