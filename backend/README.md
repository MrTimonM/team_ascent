# NoteKori — Backend

FastAPI service that reads a whiteboard photo with a vision model and returns a
validated study-workspace payload.

## Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # add GEMMA_API_KEY
uvicorn app.main:app --reload --port 8000
```

Interactive docs: <http://localhost:8000/docs>

## Configuration

All settings come from `.env` (see `.env.example`).

| Variable | Default | Purpose |
| --- | --- | --- |
| `GEMMA_API_KEY` | — | Google AI Studio key. Required. |
| `GEMMA_API_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta` | Provider endpoint. |
| `GEMMA_MODEL` | `gemma-3-27b-it` | Any vision-capable model the endpoint serves. |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | CORS allowlist, comma-separated. |
| `MAX_UPLOAD_SIZE_MB` | `10` | Rejected above this. |
| `MAX_IMAGE_DIMENSION` | `1600` | Longest edge after downscaling. |
| `REQUEST_TIMEOUT_SECONDS` | `180` | Model call timeout. |

`Settings.supports_json_mode` is derived, not configured: Gemma models on the Gemini
API reject `responseMimeType`, so JSON mode is enabled only for non-Gemma models.

## Endpoints

- `GET /api/v1/health` — status, model, and whether a key is configured.
- `POST /api/v1/analyze` — `multipart/form-data`, field `image`.
- `POST /api/v1/export/markdown` — `{ result, highlights }` → `.md` download.

## Error contract

Errors return a JSON `detail` string written for a student, not a stack trace.

| Status | Meaning |
| --- | --- |
| `422` | Bad upload — wrong type, empty, or too large. |
| `502` | Model failure — missing key, rejected model, rate limit, timeout, unusable JSON. |

## Design notes

**Preprocessing is intentionally light** (`services/image_service.py`): EXIF rotation,
downscale, mild contrast and sharpening. Heavier denoising or binarisation erases faint
chalk and pencil, which loses more accuracy than it recovers.

**JSON recovery** (`utils/json_parser.py`) tries progressively more aggressive repairs:
fence stripping, balanced-object extraction, trailing-comma removal, control-character
escaping, and closing delimiters left open by a truncated response. Only if all fail
does the service spend a second model call asking for a repair.

**Validation is forgiving by default.** Every list and string on `AnalysisResult`
defaults to empty, so a partial response still produces a usable workspace instead of a
500. `MindMap.pruned()` drops edges referencing unknown node ids, which would otherwise
crash the frontend graph renderer.
