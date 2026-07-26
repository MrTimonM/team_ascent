import base64
import logging

import httpx
from pydantic import ValidationError

from app.config import get_settings
from app.prompts.analysis_prompt import ANALYSIS_PROMPT, REPAIR_PROMPT
from app.schemas.analysis import AnalysisResult
from app.utils.json_parser import JSONRecoveryError, parse_model_json

logger = logging.getLogger(__name__)


class GemmaServiceError(RuntimeError):
    """Any failure while talking to the model provider."""


def _generation_config() -> dict:
    settings = get_settings()
    config: dict = {
        "temperature": 0.35,
        "topP": 0.95,
        "maxOutputTokens": settings.max_output_tokens,
    }
    # Gemma models served on the Gemini API reject responseMimeType.
    if settings.supports_json_mode:
        config["responseMimeType"] = "application/json"
    return config


def _extract_text(payload: dict) -> str:
    candidates = payload.get("candidates") or []
    if not candidates:
        feedback = payload.get("promptFeedback", {})
        blocked = feedback.get("blockReason")
        if blocked:
            raise GemmaServiceError(f"The model blocked this image ({blocked}).")
        raise GemmaServiceError("The model returned no candidates.")

    parts = candidates[0].get("content", {}).get("parts") or []

    # Thinking models (gemma-4-*) return their reasoning as a separate part
    # flagged `thought`. Including it would put prose — and stray braces — ahead
    # of the real answer, so the JSON parser would latch onto the wrong object.
    answer_parts = [part for part in parts if not part.get("thought")]
    text = "".join(part.get("text", "") for part in answer_parts)

    if not text.strip():
        finish = candidates[0].get("finishReason", "unknown")
        if finish == "MAX_TOKENS":
            raise GemmaServiceError(
                "The model used its whole output budget on reasoning and returned no "
                "answer. Raise MAX_OUTPUT_TOKENS in backend/.env or use a smaller image."
            )
        raise GemmaServiceError(f"The model returned empty content (finishReason={finish}).")
    return text


async def _generate(client: httpx.AsyncClient, parts: list[dict]) -> str:
    settings = get_settings()
    url = f"{settings.gemma_api_base_url.rstrip('/')}/models/{settings.gemma_model}:generateContent"

    # The key goes in a header, never the query string: httpx puts the full URL
    # into exception messages, which would leak the key into API responses and logs.
    response = await client.post(
        url,
        headers={"x-goog-api-key": settings.gemma_api_key},
        json={
            "contents": [{"role": "user", "parts": parts}],
            "generationConfig": _generation_config(),
        },
    )

    if response.status_code == 404:
        raise GemmaServiceError(
            f"The provider has no model named '{settings.gemma_model}' available to "
            "this key. Check GEMMA_MODEL in backend/.env."
        )

    if response.status_code == 400:
        raise GemmaServiceError(
            f"The provider rejected the request. Check that '{settings.gemma_model}' "
            f"exists and supports image input. Provider said: {response.text[:300]}"
        )
    if response.status_code in (401, 403):
        raise GemmaServiceError("The API key was rejected. Check GEMMA_API_KEY in backend/.env.")
    if response.status_code == 429:
        raise GemmaServiceError("Rate limit reached for this API key. Wait a moment and retry.")
    if response.status_code >= 500:
        raise GemmaServiceError("The model provider is currently unavailable.")
    response.raise_for_status()

    return _extract_text(response.json())


async def analyze_image(image_bytes: bytes, mime_type: str) -> AnalysisResult:
    """Send the image to the model and coerce the reply into an AnalysisResult.

    One repair round-trip is attempted when the first response is not valid
    JSON, which is the single most common failure in practice.
    """
    settings = get_settings()
    if not settings.gemma_api_key:
        raise GemmaServiceError(
            "No API key configured. Add GEMMA_API_KEY to backend/.env and restart the server."
        )

    encoded = base64.b64encode(image_bytes).decode("ascii")
    parts = [
        {"text": ANALYSIS_PROMPT},
        {"inlineData": {"mimeType": mime_type, "data": encoded}},
    ]

    timeout = httpx.Timeout(settings.request_timeout_seconds, connect=15.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            raw = await _generate(client, parts)
        except httpx.TimeoutException as exc:
            raise GemmaServiceError(
                "The model took too long to respond. Try a smaller or clearer image."
            ) from exc
        except httpx.HTTPError as exc:
            raise GemmaServiceError(f"Could not reach the model provider: {exc}") from exc

        try:
            payload = parse_model_json(raw)
        except JSONRecoveryError:
            logger.warning("First response was not valid JSON; attempting one repair pass.")
            repaired = await _generate(client, [{"text": REPAIR_PROMPT + raw[:20000]}])
            try:
                payload = parse_model_json(repaired)
            except JSONRecoveryError as exc:
                raise GemmaServiceError(
                    "The model did not return usable JSON, even after a repair attempt."
                ) from exc

    try:
        result = AnalysisResult.model_validate(payload)
    except ValidationError as exc:
        logger.warning("Schema validation failed: %s", exc)
        raise GemmaServiceError(
            "The model response did not match the expected structure."
        ) from exc

    result.mindmap = result.mindmap.pruned()
    return _backfill(result)


def _backfill(result: AnalysisResult) -> AnalysisResult:
    """Fill gaps the model left so every panel has something to render."""
    for index, card in enumerate(result.flashcards, start=1):
        if not card.id:
            card.id = f"card-{index}"

    if not result.mermaid and result.mindmap.nodes:
        result.mermaid = _mermaid_from_mindmap(result)

    if not result.clean_notes and result.extracted_text:
        result.clean_notes = f"# {result.title}\n\n{result.extracted_text}"

    return result


def _sanitize_label(label: str) -> str:
    return label.replace('"', "'").replace("[", "(").replace("]", ")")


def _mermaid_from_mindmap(result: AnalysisResult) -> str:
    lines = ["graph TD"]
    labels = {node.id: _sanitize_label(node.label) for node in result.mindmap.nodes}

    for edge in result.mindmap.edges:
        source = labels.get(edge.source, edge.source)
        target = labels.get(edge.target, edge.target)
        lines.append(f'    {edge.source}["{source}"] --> {edge.target}["{target}"]')

    connected = {e.source for e in result.mindmap.edges} | {
        e.target for e in result.mindmap.edges
    }
    for node in result.mindmap.nodes:
        if node.id not in connected:
            lines.append(f'    {node.id}["{labels[node.id]}"]')

    return "\n".join(lines)
