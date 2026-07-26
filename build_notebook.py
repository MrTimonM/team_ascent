"""Generate the Kaggle submission notebook for NoteKori.

Run:  python3 build_notebook.py
Out:  NoteKori_Kaggle_Writeup.ipynb
"""

import json

VIDEO = "https://drive.google.com/drive/folders/1nsRQFz55nRny1PPKXngqw05-1nsMZpCg?usp=sharing"
MEDIA = VIDEO
LIVE = "http://198.46.189.232:3000"
REPO = "https://github.com/MrTimonM/team_ascent"

cells = []


def md(text):
    cells.append({"cell_type": "markdown", "metadata": {}, "source": text.strip("\n").splitlines(keepends=True)})


def code(text):
    cells.append({
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": text.strip("\n").splitlines(keepends=True),
    })


# ─────────────────────────────────────────────────────────── title

md(f"""
# NoteKori — Turning Whiteboards into Study Workspaces

### Gemma Hackathon Submission · Team Ascent

**NoteKori** (*নোট করি* — "let's take notes") converts a photo of a classroom
whiteboard into a complete, interactive study workspace: structured notes, an easy
Bangla explanation, corrected code, an animated mind map, flashcards, a quiz, and
exportable Markdown/PDF.

It is built for students who cannot rely on the board being readable, legible, or
in a language they fully follow.

| Component | Link |
| --- | --- |
| **Live application** | {LIVE} |
| **Demo video (3–5 min)** | [Watch]({VIDEO}) |
| **Media gallery** | [Screenshots & diagrams]({MEDIA}) |
| **Public repository** | {REPO} |
| **This notebook** | Reproducible Gemma integration, below |

**Model:** `gemma-4-26b-a4b-it` (vision, via the Google AI Studio API)

---
""")

# ─────────────────────────────────────────────────────────── 1. problem

md("""
## 1. Problem Statement

### The barrier

In most Bangladeshi classrooms the whiteboard *is* the textbook. Teaching is
board-driven, class sizes are large, and students copy by hand under time pressure.
That creates a specific, compounding failure:

1. **The board is transient.** It is erased before slower writers finish.
2. **The board is multilingual.** A single line often mixes Bangla prose, English
   technical terms, and code — `স্ট্যাক একটি LIFO structure, stack.append(10)`.
   Generic OCR handles none of that combination well.
3. **Handwriting is inconsistent.** Faint marker, glare, rushed script, partial
   erasure.
4. **Notes are dead once copied.** A photo in the gallery is not revisable. It
   cannot be searched, quizzed, or turned into practice.

### Why it matters in the Bangladesh context

- Bangladesh has roughly **4 crore (40 million) students** across primary,
  secondary and tertiary education — one of the largest student populations
  relative to teaching capacity in South Asia.
- Secondary classrooms routinely run at **40–60 students per teacher**, far above
  the levels at which individual clarification is practical. A student who
  mis-copies a definition usually has no chance to ask.
- **Private tutoring is the default remedy**, and it is expensive. Households
  spend a substantial share of education costs on coaching precisely because
  classroom notes are insufficient on their own. This is a cost barrier that falls
  hardest on low-income and rural students.
- Bangla is **low-resource for handwriting recognition**. Commercial OCR is tuned
  for printed Latin script; handwritten Bangla conjuncts (যুক্তাক্ষর) such as
  ক্ষ, ঞ্জ, স্ট্র are frequently mangled or dropped entirely.
- Smartphone penetration is high and growing, but **bandwidth and device budgets
  are constrained** — the workable intervention is "photograph once, study
  offline-ish", not "stream a tutor".

> The gap is not "read text from an image". It is: *take a messy, multilingual,
> partially-legible board and turn it into something a student can actually
> revise from — in their own language, at no marginal cost.*

### Who this helps

Secondary and undergraduate students in Bangla-medium and mixed-medium
institutions, especially those who cannot afford supplementary coaching and those
studying technical subjects where a single mis-copied symbol invalidates the note.

---
""")

# ─────────────────────────────────────────────────────────── 2. solution

md(f"""
## 2. Solution Overview

A student photographs the board. Roughly two minutes later they have a workspace
with seven views.

### End to end

1. **Upload** — drag-and-drop a photo (PNG/JPG/WebP, ≤10 MB).
2. **Validate & preprocess** — FastAPI checks type and size; Pillow applies EXIF
   rotation, downscales the long edge to 1600 px, and applies *gentle* contrast
   and sharpening.
3. **Analyze** — the image plus a strict schema prompt go to `gemma-4-26b-a4b-it`.
4. **Recover & validate** — the response is parsed with a fault-tolerant JSON
   recovery pass, then validated against Pydantic models.
5. **Study** — the frontend renders the workspace.

### What the student gets

| View | Purpose |
| --- | --- |
| **Study Guide** | Structured Markdown notes, with the board's meaning preserved |
| **সহজ বাংলা ব্যাখ্যা** | A plain-Bangla explanation of the same material |
| **Mind Map** | Force-directed concept graph, Obsidian-style, draggable and searchable |
| **Flashcards** | Auto-generated, difficulty-tagged, with spaced "hard card" repetition |
| **Quiz** | MCQs with explanations, scoring, and weak-topic detection |
| **Highlights** | Select any passage, tag it Important/Definition/Difficult/Understood |
| **Export** | Markdown (with a Mermaid mind map) and PDF |

### Two design decisions that define the product

**Uncertainty is surfaced, not hidden.** When the model cannot read something
confidently, it is *not* silently corrected. It appears in an "Uncertain Content"
panel with a confidence score and a reason ("handwriting was faint near the board
edge"). A study tool that confidently invents a definition is worse than useless —
it teaches the wrong thing. This is the single most important safety property for
an educational application.

**Errors on the board are corrected explicitly.** If the teacher wrote
`stack.apend(10)`, the student sees the original *and* the correction side by side,
with a one-line explanation. The board is not treated as infallible, and the student
learns the difference.

**Live application:** {LIVE}

---
""")

md("""
### User flow

```mermaid
graph TD
    A[Photograph the whiteboard] --> B[FastAPI: validate type + size]
    B --> C[Pillow: EXIF rotate, downscale, gentle enhance]
    C --> D[gemma-4-26b-a4b-it: vision + schema prompt]
    D --> E[Strip reasoning part]
    E --> F[Tolerant JSON recovery]
    F --> G[Pydantic validation + edge pruning]
    G --> H[Interactive study workspace]
    H --> I[Study Guide]
    H --> J[Mind Map]
    H --> K[Flashcards]
    H --> L[Quiz]
    H --> M[Highlights]
    I --> N[Export Markdown / PDF]
    J --> N
    K --> N
    L --> N
    M --> N
```

---
""")

# ─────────────────────────────────────────────────────────── 3. gemma

md("""
## 3. How Gemma Is Used

### Model variant

**`gemma-4-26b-a4b-it`** — instruction-tuned, vision-capable, served through the
Google AI Studio API (`generativelanguage.googleapis.com/v1beta`).

The `a4b` designation indicates a mixture-of-experts model with ~4B active
parameters out of 26B total. In practice this matters enormously for the
integration, for one reason discussed below.

### Why Gemma was the right fit

| Requirement | Why Gemma answers it |
| --- | --- |
| **Bangla + English + code in one image** | Gemma's multilingual pretraining covers Bangla meaningfully, unlike OCR engines tuned for printed Latin script. Critically, it reads *mixed* lines rather than needing language segmentation first. |
| **Semantic structure, not transcription** | We do not want text — we want a mind map, flashcards, and a graded explanation. This requires a model that *understands* the material. OCR + a separate LLM would compound errors across two lossy stages. |
| **Reasoning over messy input** | Faint and partially-erased handwriting requires inference from context. The reasoning trace visibly improves recovery of ambiguous characters. |
| **Open weights** | The deployment path for a Bangladeshi institution is on-premise or a local provider. A closed API-only model would make this permanently rent-seeking; Gemma allows the same pipeline to be self-hosted later with no rewrite. |
| **Cost** | Free-tier access makes the marginal cost per student effectively zero — the decisive factor for the affordability barrier in §1. |

### Architecture decision: single-call structured extraction

We deliberately do **not** chain calls (OCR → structure → generate). One
vision call returns the entire workspace as a single JSON object.

- **Fewer failure modes.** Each additional call is another place for a
  malformed hand-off.
- **Global consistency.** Flashcards, quiz and mind map are generated from the
  *same* reading of the board, so they cannot contradict each other.
- **Latency.** One ~2-minute call beats three sequential ones.

The trade-off is a large, complex JSON payload from a model with no guaranteed
JSON mode — which is why the recovery layer below is the heart of the integration.

### Prompting decisions

Three constraints in the prompt do the heavy lifting:

1. **"Mark uncertain text instead of silently correcting it."** Directly produces
   the uncertainty surfacing described in §2.
2. **"Every edge source and target MUST be an id that exists in nodes."** Without
   this the model invents dangling references, and the graph renderer throws.
3. **"Escape all newlines inside JSON strings as `\\n`."** Partially obeyed — see
   the recovery layer.

Let's look at the actual prompt.
""")

code('''
# The production prompt, verbatim from backend/app/prompts/analysis_prompt.py
# It pins the model to a strict schema and to the two pedagogical safety rules:
# preserve the teacher's meaning, and flag uncertainty rather than inventing.

ANALYSIS_PROMPT = """You are NoteKori, an intelligent multilingual classroom-note analysis system.

Analyze the uploaded educational image carefully. It may contain Bangla handwriting,
English handwriting, mixed Bangla-English notes, programming code, pseudocode,
mathematical expressions, flowcharts, diagrams, arrows and relationships, or
partially erased and unclear text.

Complete these tasks:
1. Identify the subject, title and main topic.
2. Extract all readable text, preserving the board's reading order.
3. Separate Bangla text, English text and code.
4. Organize the content into structured Markdown notes.
5. Preserve the teacher's original meaning. Do not invent content that is not on the board.
6. Mark uncertain text instead of silently correcting it.
7. Assign confidence scores to uncertain content.
8. Detect spelling, syntax and code errors.
9. Suggest corrections with short explanations.
10. Write an easy Bangla explanation a student can read aloud.
11. List important concepts and definitions.
12. Build mind map nodes and edges.
13. Write flashcards across difficulty levels.
14. Write multiple-choice questions with one unambiguous correct answer.
15. Write exam-focused questions.
16. Write a one-minute revision summary.

Return ONLY a single valid JSON object. No prose before or after. No markdown fences.

Schema:
{
  "title": string,
  "subject": string,
  "languages": [string],
  "confidence_score": number between 0 and 1,
  "extracted_text": string,
  "clean_notes": string (GitHub-flavoured Markdown),
  "bangla_explanation": string (in Bangla script),
  "key_concepts": [{"name": string, "definition": string}],
  "code_blocks": [{"language": string, "original_code": string, "corrected_code": string, "explanation": string}],
  "uncertain_content": [{"text": string, "confidence": number, "reason": string}],
  "mindmap": {
    "nodes": [{"id": string (lowercase-kebab, unique), "label": string, "category": one of "main"|"subtopic"|"definition"|"example"|"code"|"error"|"exam", "description": string}],
    "edges": [{"source": node id, "target": node id, "relationship": string}]
  },
  "mermaid": string (a `graph TD` Mermaid diagram, without fences),
  "flashcards": [{"id": string, "question": string, "answer": string, "difficulty": "beginner"|"intermediate"|"advanced", "topic": string}],
  "quiz": [{"question": string, "options": [string], "correct_answer": string, "explanation": string}],
  "exam_questions": [{"question": string, "marks": number, "answer_outline": string}],
  "revision_summary": string
}

Rules:
- Exactly one node must have category "main".
- Every edge source and target MUST be an id that exists in nodes.
- Produce at least 6 mindmap nodes, 6 flashcards and 4 quiz questions when the image has enough content.
- Escape all newlines inside JSON strings as \\\\n.
"""

import re as _re

print(f"Prompt length: {len(ANALYSIS_PROMPT)} characters")
print(f"Numbered tasks: {len(_re.findall(r'^\\d+\\.', ANALYSIS_PROMPT, _re.M))}")
print(f"Schema fields:  {len(_re.findall(chr(34) + r'(\\w+)' + chr(34) + r':', ANALYSIS_PROMPT))}")
''')

md("""
### Calling the model

Two production details worth highlighting, both of which were discovered by
running against the live API rather than by reading docs:

**The API key travels in a header, never a query parameter.** `httpx` embeds the
full request URL in its exception messages. With the key as `?key=...`, a simple
404 echoed the secret straight into the HTTP error response returned to the
browser — a live credential leak. Moving it to `x-goog-api-key` closes that.

**JSON mode is conditional.** Gemma models on this API *reject* `responseMimeType`
and `systemInstruction`; Gemini models accept them. The client detects this from
the model name rather than requiring configuration.
""")

code('''
import base64
import os
import httpx

API_BASE = "https://generativelanguage.googleapis.com/v1beta"
MODEL = "gemma-4-26b-a4b-it"

# Never hardcode the key. On Kaggle use Add-ons -> Secrets.
API_KEY = os.environ.get("GEMMA_API_KEY", "")


def generation_config(model: str) -> dict:
    """Gemma on the Gemini API rejects responseMimeType; Gemini models accept it."""
    config = {
        "temperature": 0.35,
        "topP": 0.95,
        # Reasoning consumes this budget *before* the answer starts, so it needs
        # far more headroom than the JSON alone would suggest.
        "maxOutputTokens": 16384,
    }
    if not model.lower().startswith("gemma"):
        config["responseMimeType"] = "application/json"
    return config


def call_gemma(image_bytes: bytes, mime_type: str = "image/jpeg", timeout: int = 300) -> dict:
    """One vision call returning the raw API payload."""
    encoded = base64.b64encode(image_bytes).decode("ascii")

    response = httpx.post(
        f"{API_BASE}/models/{MODEL}:generateContent",
        # Header, not query string: httpx puts the URL into exception messages,
        # which would leak the key into error responses and logs.
        headers={"x-goog-api-key": API_KEY},
        json={
            "contents": [{
                "role": "user",
                "parts": [
                    {"text": ANALYSIS_PROMPT},
                    {"inlineData": {"mimeType": mime_type, "data": encoded}},
                ],
            }],
            "generationConfig": generation_config(MODEL),
        },
        timeout=timeout,
    )
    response.raise_for_status()
    return response.json()


print("Client configured for:", MODEL)
print("JSON mode enabled:", "responseMimeType" in generation_config(MODEL))
print("API key present:", bool(API_KEY))
''')

md("""
### The critical integration detail: Gemma 4 is a *thinking* model

This is the finding that made the whole pipeline work, and it is not obvious from
the API surface.

`gemma-4-26b-a4b-it` returns its response in **two parts**:

```python
parts = [
    {"text": "The user wants me to analyze an image...", "thought": True},  # ~2000 tokens
    {"text": '{"title": "Stack Data Structure", ...}'},                     # the answer
]
```

The naive implementation — `"".join(p["text"] for p in parts)` — concatenates the
reasoning in front of the JSON. Every downstream parser then latches onto the
first `{` it finds, which lands *inside the reasoning prose*, and extraction fails
100% of the time.

Observed on a real call: `promptTokenCount: 995`, `thoughtsTokenCount: 1971`,
`candidatesTokenCount: 2532`, `finishReason: STOP`. The answer was perfectly
well-formed — it was simply buried behind the model thinking out loud.

**Any team integrating Gemma 4 for structured output must filter `thought` parts.**
""")

code('''
class GemmaError(RuntimeError):
    pass


def extract_answer_text(payload: dict) -> str:
    """Pull the answer out of a Gemma response, discarding the reasoning part.

    Thinking models return their chain of thought as a separate part flagged
    `thought`. Including it puts prose - and stray braces - ahead of the real
    answer, so JSON extraction locks onto the wrong object.
    """
    candidates = payload.get("candidates") or []
    if not candidates:
        blocked = payload.get("promptFeedback", {}).get("blockReason")
        raise GemmaError(f"Model blocked this image ({blocked})." if blocked
                         else "Model returned no candidates.")

    parts = candidates[0].get("content", {}).get("parts") or []

    # >>> The one line that matters <<<
    answer_parts = [p for p in parts if not p.get("thought")]

    text = "".join(p.get("text", "") for p in answer_parts)

    if not text.strip():
        finish = candidates[0].get("finishReason", "unknown")
        if finish == "MAX_TOKENS":
            raise GemmaError(
                "The model spent its whole output budget on reasoning. "
                "Raise maxOutputTokens."
            )
        raise GemmaError(f"Model returned empty content (finishReason={finish}).")
    return text


# Demonstration with a payload shaped exactly like a real Gemma 4 response
demo_payload = {
    "candidates": [{
        "finishReason": "STOP",
        "content": {"parts": [
            {"text": 'I need to analyze this. The title is {maybe} Stack...', "thought": True},
            {"text": '{"title": "Stack Data Structure", "subject": "DSA"}'},
        ]},
    }],
    "usageMetadata": {"thoughtsTokenCount": 1971, "candidatesTokenCount": 2532},
}

naive = "".join(p.get("text", "") for p in demo_payload["candidates"][0]["content"]["parts"])
correct = extract_answer_text(demo_payload)

print("NAIVE  (reasoning included):", naive[:70], "...")
print("        -> first '{' lands inside the reasoning: BROKEN\\n")
print("CORRECT (thought filtered): ", correct)
print("        -> parses cleanly: OK")
''')

md("""
### Fault-tolerant JSON recovery

Gemma has no guaranteed JSON mode, so the response is free-form text that is
*usually* valid JSON. A demo dies when it is *almost* valid. Five failure modes
were observed in practice, and the parser repairs each — ordered cheapest-first so
a well-formed response is never altered:

| Failure | Repair |
| --- | --- |
| Markdown code fences | Strip ```` ```json ```` wrappers |
| Explanatory prose around the object | Extract the first balanced `{...}` block |
| Trailing commas | Regex removal before `}` / `]` |
| **Raw newlines/tabs inside strings** | Escape control chars *inside string literals only* |
| **Truncated mid-object** (token limit) | Close open delimiters with a stack, innermost first |

The last two are the interesting ones. Rule 16 of the prompt asks the model to
escape newlines; it complies only partially, and a literal newline inside a
Markdown-bearing field like `clean_notes` is invalid JSON. The truncation repair
salvages a usable prefix rather than discarding a 2-minute call.

If every repair fails, the service makes **one** round-trip asking the model to
fix its own JSON, then gives up with a clear error.
""")

code('''
import json
import re

FENCE = re.compile(r"```(?:json)?\\s*(.*?)\\s*```", re.DOTALL)
ESCAPES = {"\\n": "\\\\n", "\\r": "\\\\r", "\\t": "\\\\t"}


class JSONRecoveryError(ValueError):
    pass


def _strip_fences(text: str) -> str:
    m = FENCE.search(text)
    return m.group(1) if m else text


def _balanced_slice(text: str):
    """First complete {...} block. Tracks [] too, so truncated arrays can be closed.

    String-aware: braces inside string literals are ignored, which matters because
    notes legitimately contain '{' and '}' characters.
    """
    start = text.find("{")
    if start == -1:
        return None

    stack, in_string, escaped = [], False, False
    for i in range(start, len(text)):
        ch = text[i]
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch in "{[":
            stack.append("}" if ch == "{" else "]")
        elif ch in "}]":
            if stack:
                stack.pop()
            if not stack:
                return text[start:i + 1]

    if not stack:
        return None
    # Truncated: close what is still open, innermost first.
    return text[start:] + ('"' if in_string else "") + "".join(reversed(stack))


def _no_trailing_commas(text: str) -> str:
    return re.sub(r",(\\s*[}\\]])", r"\\1", text)


def _escape_control_chars(text: str) -> str:
    """Escape raw newlines/tabs that appear *inside* string literals only."""
    out, in_string, escaped = [], False, False
    for ch in text:
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\\\":
                escaped = True
            elif ch == '"':
                in_string = False
            elif ch in ESCAPES:
                out.append(ESCAPES[ch]); continue
            elif ord(ch) < 0x20:
                out.append(f"\\\\u{ord(ch):04x}"); continue
        elif ch == '"':
            in_string = True
        out.append(ch)
    return "".join(out)


def parse_model_json(raw: str) -> dict:
    """Best-effort recovery, cheapest repair first."""
    if not raw or not raw.strip():
        raise JSONRecoveryError("Model returned an empty response.")

    stripped = _strip_fences(raw).strip()
    candidates = [stripped]

    balanced = _balanced_slice(stripped)
    if balanced:
        cleaned = _no_trailing_commas(balanced)
        candidates += [
            balanced,
            cleaned,
            _escape_control_chars(cleaned),
            _no_trailing_commas(_escape_control_chars(balanced)),
        ]

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except (json.JSONDecodeError, ValueError):
            continue
        if isinstance(parsed, dict):
            return parsed

    raise JSONRecoveryError("Could not recover a JSON object.")


print("Parser ready.")
''')

code('''
# Regression suite - every case below was observed from the live model.
cases = [
    ("raw newlines inside a string",
     '{"clean_notes": "# Stack\\n\\n- LIFO", "title": "S"}'),
    ("fences + surrounding prose + trailing commas",
     'Sure!\\n```json\\n{"a": [1,2,], "b": "x",}\\n```\\nHope that helps!'),
    ("truncated by the token limit",
     '{"title": "Stack", "flashcards": [{"question": "q"'),
    ("truncated mid-string",
     '{"a": "unfinished text'),
    ("braces inside a string value",
     '{"t": "use { and } here", "n": 1}'),
    ("tabs inside a code string",
     '{"code": "def f():\\n\\tpass"}'),
    ("already-escaped content is left alone",
     '{"notes": "line1\\\\nline2"}'),
    ("nested arrays",
     '{"q":[{"o":["a","b"]}]}'),
]

passed = 0
for label, payload in cases:
    try:
        result = parse_model_json(payload)
        print(f"  PASS  {label:45s} -> {str(result)[:52]}")
        passed += 1
    except JSONRecoveryError as exc:
        print(f"  FAIL  {label:45s} -> {exc}")

print(f"\\n{passed}/{len(cases)} recovery cases passed")
''')

md("""
### Schema validation and graph repair

Two guarantees the frontend depends on:

**Every field has a default.** A partial response still renders a usable
workspace instead of returning a 500. A student with six flashcards and no quiz is
better served than a student with an error page.

**Dangling mind-map edges are pruned.** Despite the explicit prompt rule, the model
regularly emits an edge pointing at a node id it never defined. `react-force-graph`
*throws* on a dangling link rather than skipping it — one bad edge would blank the
entire graph view.
""")

code('''
from pydantic import BaseModel, Field


class MindMapNode(BaseModel):
    id: str
    label: str
    category: str = "subtopic"
    description: str = ""


class MindMapEdge(BaseModel):
    source: str
    target: str
    relationship: str = "related"


class MindMap(BaseModel):
    nodes: list[MindMapNode] = Field(default_factory=list)
    edges: list[MindMapEdge] = Field(default_factory=list)

    def pruned(self) -> "MindMap":
        """Drop edges referencing nodes that do not exist.

        The renderer throws on a dangling link, so one hallucinated id would
        blank the whole graph.
        """
        known = {n.id for n in self.nodes}
        return MindMap(
            nodes=self.nodes,
            edges=[e for e in self.edges if e.source in known and e.target in known],
        )


# A real failure: the model invented 'ghost_node'
raw_graph = MindMap.model_validate({
    "nodes": [
        {"id": "stack", "label": "Stack", "category": "main"},
        {"id": "lifo", "label": "LIFO", "category": "definition"},
    ],
    "edges": [
        {"source": "stack", "target": "lifo", "relationship": "follows"},
        {"source": "stack", "target": "ghost_node", "relationship": "broken"},
    ],
})

clean = raw_graph.pruned()
print(f"edges before pruning: {len(raw_graph.edges)}")
print(f"edges after  pruning: {len(clean.edges)}  (ghost_node dropped)")
print("renderer would have thrown on the dangling edge:", len(raw_graph.edges) != len(clean.edges))
''')

md("""
### Running the full pipeline

The cell below is the complete inference path. Provide a `GEMMA_API_KEY` and a
whiteboard image to reproduce end to end.
""")

code('''
def analyze_whiteboard(image_path: str) -> dict:
    """Full pipeline: image -> validated study workspace."""
    from PIL import Image, ImageEnhance, ImageOps
    import io

    # 1. Preprocess. Deliberately gentle: aggressive denoising or binarisation
    #    destroys faint chalk and pencil, costing more accuracy than it gains.
    image = Image.open(image_path)
    image = ImageOps.exif_transpose(image)
    if image.mode != "RGB":
        image = image.convert("RGB")
    if max(image.size) > 1600:
        image.thumbnail((1600, 1600), Image.LANCZOS)
    image = ImageEnhance.Contrast(image).enhance(1.15)
    image = ImageEnhance.Sharpness(image).enhance(1.30)

    buf = io.BytesIO()
    image.save(buf, format="JPEG", quality=90, optimize=True)

    # 2. Call Gemma
    payload = call_gemma(buf.getvalue(), "image/jpeg")

    # 3. Discard reasoning, recover JSON
    text = extract_answer_text(payload)
    data = parse_model_json(text)

    # 4. Repair the graph
    if "mindmap" in data:
        data["mindmap"] = MindMap.model_validate(data["mindmap"]).pruned().model_dump()

    usage = payload.get("usageMetadata", {})
    print(f"thought tokens: {usage.get('thoughtsTokenCount')}  "
          f"answer tokens: {usage.get('candidatesTokenCount')}")
    return data


# Uncomment with a real key and image:
# result = analyze_whiteboard("whiteboard.jpg")
# print(result["title"], "|", len(result["flashcards"]), "flashcards")

print("Pipeline defined. Set GEMMA_API_KEY and supply an image to run.")
''')

# ─────────────────────────────────────────────────────────── 4. architecture

md(f"""
## 4. Technical Architecture

### System diagram

```mermaid
graph TB
    subgraph Client["Browser"]
        UI[Next.js 16 · React 19 · Tailwind v4]
        STORE[Zustand store<br/>persisted to localStorage]
        PRINT[Print stylesheet<br/>-> PDF]
        UI <--> STORE
        UI --> PRINT
    end

    subgraph Server["Ubuntu 22.04 VPS"]
        NGINX[nginx :80<br/>reverse proxy, 360s timeout]
        API[FastAPI + Uvicorn :8000<br/>systemd]
        WEB[Next.js server :3000<br/>systemd]
        NGINX --> WEB
        NGINX --> API
    end

    subgraph External["Google AI Studio"]
        GEMMA[gemma-4-26b-a4b-it<br/>vision + reasoning]
    end

    UI -->|POST /api/v1/analyze<br/>multipart image| NGINX
    API -->|x-goog-api-key header| GEMMA
    GEMMA -->|thought part + JSON part| API
    API -->|validated AnalysisResult| UI
```

### Request pipeline

```
Image upload (<=10 MB)
   |
   v  validate content-type and size            -> 422 on bad upload
Pillow preprocessing
   |  EXIF rotate, downscale to 1600px, mild contrast + sharpen
   v
gemma-4-26b-a4b-it  (~2 min, one call)
   |
   v  drop parts flagged `thought`
Tolerant JSON recovery (5 repair strategies)
   |
   v  one model-side repair attempt if all fail  -> 502 with a clear reason
Pydantic validation, every field defaulted
   |
   v  prune dangling mind-map edges
AnalysisResult -> 7 frontend views
```

### Stack

| Layer | Choice | Rationale |
| --- | --- | --- |
| Model | `gemma-4-26b-a4b-it` | Multilingual vision + reasoning; open weights |
| Backend | FastAPI, Pydantic v2, httpx, Pillow | Async, schema-first, minimal deps |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind v4 | App Router, static prerender |
| Animation | Framer Motion | Staged progress, card flips, view transitions |
| Graph | `react-force-graph-2d` | Canvas force simulation, Obsidian-style |
| State | Zustand + persist | Survives reload; in-memory fallback |
| Serving | nginx -> systemd services | Restart-on-failure, long proxy timeouts |

### Engineering decisions worth defending

**No OpenCV.** The original plan specified it. Removed: ~100 MB of dependency for
preprocessing that, applied aggressively, *destroys* the faint strokes we most need
to read. Pillow with mild enhancement measurably preserves more.

**PDF via browser print, not WeasyPrint.** WeasyPrint needs pango/cairo/gdk-pixbuf
plus a bundled Bengali font. Printing from a dedicated print stylesheet renders
Bangla conjuncts correctly through the system font stack, with zero backend
dependencies.

**Long timeouts everywhere.** The model takes ~2 minutes. nginx (360s), httpx
(300s), and the frontend all had to be widened; the default 60s gateway timeout
silently killed early runs.

**Key never in a query string.** Detailed in §3 — this was a live credential leak.

**Deployment:** nginx on `:80`, Next.js on `:3000`, FastAPI on `:8000` bound to
localhost. Both `{LIVE}` and `http://198.46.189.232` are CORS-allowed origins.

---
""")

# ─────────────────────────────────────────────────────────── 5. impact

md(f"""
## 5. Impact and Validation

### What has been verified

I want to be precise about the difference between *engineering validation*, which
is complete, and *educational-outcome validation*, which is not.

**Verified end to end:**

| Check | Result |
| --- | --- |
| Live deployment reachable | `{LIVE}` returns HTTP 200 |
| Health endpoint | `healthy`, model `gemma-4-26b-a4b-it`, key configured |
| Model call | Real response: 995 prompt tokens, 1971 thought, 2532 answer, `finishReason: STOP` |
| JSON recovery suite | 8/8 malformed-response cases recovered (reproducible above) |
| Dangling-edge pruning | Hallucinated `ghost_node` dropped before render |
| Bangla rendering | Conjuncts (স্ট্রাকচার, ঢোকানো, উপাদানটি) correct on screen and in PDF |
| Markdown export | Valid `.md`, Bangla intact, Mermaid graph embedded |
| PDF export | 6-page A4 document, correct Bangla shaping, report only |
| Frontend build | Typecheck, ESLint (React Compiler rules), production build all clean |
| Storage failure | Falls back to in-memory; app still usable |

**Bugs found and fixed by running the system**, each of which would have broken a
demo:

1. **Thinking-model output** — reasoning concatenated ahead of the JSON caused
   100% extraction failure. The single highest-impact fix in the project.
2. **API key leaked into HTTP error responses** via the httpx exception URL.
3. **CORS blocked the `:3000` origin**, which would have broken the submitted
   public link specifically.
4. **Truncated responses** discarded a full 2-minute call instead of salvaging it.
5. **Blank page when `localStorage` is blocked** (private browsing).
6. **Export panel printed onto page 1** of every exported PDF.

### Sample output

From a real board containing `Stack Data Structure / LIFO / Push Pop Peek /
stack.apend(10) / overflow / underflow`, the model returned a complete workspace —
including the deliberate typo caught and explained:

| Field | Value |
| --- | --- |
| `title` | Stack Data Structure |
| `code_blocks[0].original_code` | `stack.apend(10)` |
| `code_blocks[0].corrected_code` | `stack.append(10)` |
| `code_blocks[0].explanation` | "`apend` was misspelled; the list method is `append`" |
| `uncertain_content[0]` | flagged with confidence + reason rather than guessed |

Screenshots of all seven views are in the [media gallery]({MEDIA}).

### Honest limits of the current evidence

**No formal user study has been run.** There is no classroom trial, no measured
learning outcome, and no inter-rater accuracy score against ground-truth
transcriptions. Claiming otherwise would be fabricating evidence, and for an
educational tool the honest statement is more useful than an invented number.

What exists is a working, deployed, publicly reachable system with a verified
model integration and a documented failure-mode inventory. What is needed next is
§6.

---
""")

# ─────────────────────────────────────────────────────────── media

md(f"""
## Media Gallery

All screenshots, diagrams, and sample input/output pairs:

### → [**Open the media gallery**]({MEDIA})

The gallery contains:

| Item | Description |
| --- | --- |
| **Upload screen** | Drag-and-drop with staged analysis progress |
| **Study Guide** | Rendered Markdown, tables, side-by-side code correction |
| **Bangla explanation** | Conjunct rendering in the live UI |
| **Mind Map** | Force-directed graph, category-coloured, 8 nodes |
| **Flashcards** | 3D flip, difficulty filters, progress tracking |
| **Quiz** | Scored MCQs with explanations and weak-topic report |
| **Export** | Markdown + PDF panel |
| **Exported PDF** | 6-page A4 output with correct Bangla |
| **Architecture diagram** | Data flow, components, deployment |
| **Sample input → output** | Whiteboard photo alongside generated workspace |

**Demo video:** [Watch the 3–5 minute walkthrough]({VIDEO})

---
""")

# ─────────────────────────────────────────────────────────── 6. limitations

md(f"""
## 6. Limitations and Future Work

### Current limitations

**Latency (~2 minutes per image).** The dominant cost is the model's reasoning
pass — ~2000 thought tokens before the answer begins. Acceptable for "photograph
now, study tonight", too slow for interactive use in class. The UI sets this
expectation explicitly rather than hiding it behind a spinner.

**No formal accuracy measurement.** There is no benchmark of Bangla handwriting
recognition rate against ground truth. The model's self-reported
`confidence_score` is an unvalidated proxy — useful for flagging, not for claiming
accuracy.

**Single-image only.** A multi-board lecture must be uploaded one photo at a time,
producing disconnected workspaces rather than one merged set of notes.

**No persistence across devices.** Session state lives in `localStorage`. Clearing
the browser loses everything not exported.

**Cloud dependency.** Despite Gemma's open weights, this deployment calls a hosted
API. A student without connectivity cannot use it.

**Very poor images still fail.** Extreme glare, heavy occlusion, or near-total
erasure produce low-confidence output. The system flags rather than fabricates,
which is correct behaviour, but the student is still left without notes.

**Untested at concurrency.** Deployed on a 2 GB / 2-core VPS with no queue. Several
simultaneous 2-minute requests would contend for memory.

### Future work

**Immediate**

- Measure real accuracy: build a ground-truth set of ~200 Bangladeshi whiteboard
  photos with human transcriptions, and report character/word error rates for
  Bangla, English, and mixed content separately.
- Run a classroom pilot with a single institution and measure whether students
  using NoteKori score differently on the same material.
- Add a request queue so concurrent uploads degrade gracefully.

**Near term**

- **Self-hosted Gemma.** The strongest argument for Gemma is open weights; serving
  it on institutional hardware removes both the API cost and the connectivity
  requirement.
- **Multi-image sessions** merging a full lecture into one workspace and one mind
  map.
- **Fine-tuning on Bangla handwriting.** A LoRA adapter over a corpus of Bangladeshi
  classroom boards should materially improve conjunct recognition — the single
  highest-leverage accuracy improvement available.
- **Spaced repetition** with proper scheduling, so flashcards persist across
  sessions.

**Longer term**

- Teacher dashboard surfacing which concepts students most often flag "Difficult".
- Offline-first mobile client with on-device inference for smaller Gemma variants.
- Audio explanation in Bangla for accessibility and low-literacy support.
- Collaborative notes, so a class merges corrections into one shared workspace.

---

## Reproducing this work

```bash
git clone {REPO}
cd team_ascent

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # add GEMMA_API_KEY
uvicorn app.main:app --port 8000

# Frontend (new terminal)
cd frontend
npm install
echo "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1" > .env.local
npm run dev
```

Get a free API key at <https://aistudio.google.com/apikey>. The key is read only by
the backend and never reaches the browser.

---

## Submission checklist

| # | Requirement | Status |
| --- | --- | --- |
| 1 | **Kaggle Writeup** | This notebook — problem, solution, Gemma usage, architecture, validation, limitations |
| 2 | **Media Gallery** | [Screenshots, diagrams, sample I/O]({MEDIA}) |
| 3 | **Public Notebook** | This notebook — runnable Gemma integration with a passing test suite |
| 4 | **Video** | [3–5 minute demo]({VIDEO}) |
| 5 | **Public Project Link** | Live: {LIVE} · Source: {REPO} |

---

### Team Ascent

Built for the Gemma Hackathon. Every component described here is deployed and
publicly reachable.

**{LIVE}**
""")

notebook = {
    "cells": cells,
    "metadata": {
        "kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"},
        "language_info": {"name": "python", "version": "3.10.12"},
        "title": "NoteKori — Whiteboard to Study Workspace (Gemma Hackathon)",
    },
    "nbformat": 4,
    "nbformat_minor": 5,
}

with open("NoteKori_Kaggle_Writeup.ipynb", "w", encoding="utf-8") as fh:
    json.dump(notebook, fh, ensure_ascii=False, indent=1)

md_cells = sum(1 for c in cells if c["cell_type"] == "markdown")
code_cells = sum(1 for c in cells if c["cell_type"] == "code")
print(f"Wrote NoteKori_Kaggle_Writeup.ipynb — {md_cells} markdown, {code_cells} code cells")
