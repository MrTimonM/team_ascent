import json
import re

FENCE_PATTERN = re.compile(r"```(?:json)?\s*(.*?)\s*```", re.DOTALL)


class JSONRecoveryError(ValueError):
    """Raised when no JSON object could be recovered from a model response."""


def _strip_fences(text: str) -> str:
    match = FENCE_PATTERN.search(text)
    return match.group(1) if match else text


def _balanced_slice(text: str) -> str | None:
    """Return the first complete top-level {...} block, ignoring braces in strings."""
    start = text.find("{")
    if start == -1:
        return None

    stack: list[str] = []
    in_string = False
    escaped = False

    for index in range(start, len(text)):
        char = text[index]

        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char in "{[":
            stack.append("}" if char == "{" else "]")
        elif char in "}]":
            if stack:
                stack.pop()
            if not stack:
                return text[start : index + 1]

    if not stack:
        return None

    # Truncated response (usually the token limit). Close what is still open,
    # innermost first, so the salvageable prefix still parses.
    tail = '"' if in_string else ""
    return text[start:] + tail + "".join(reversed(stack))


def _remove_trailing_commas(text: str) -> str:
    return re.sub(r",(\s*[}\]])", r"\1", text)


ESCAPES = {"\n": "\\n", "\r": "\\r", "\t": "\\t"}


def _escape_control_chars(text: str) -> str:
    """Escape raw newlines and tabs that appear inside JSON string literals.

    Models routinely emit a literal newline inside a Markdown-bearing field
    such as `clean_notes`, which is invalid JSON. Control characters outside
    strings are untouched so formatting is preserved.
    """
    out: list[str] = []
    in_string = False
    escaped = False

    for char in text:
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            elif char in ESCAPES:
                out.append(ESCAPES[char])
                continue
            elif ord(char) < 0x20:
                out.append(f"\\u{ord(char):04x}")
                continue
        elif char == '"':
            in_string = True

        out.append(char)

    return "".join(out)


def parse_model_json(raw: str) -> dict:
    """Best-effort extraction of a JSON object from a model response.

    Handles the three failure modes Gemma actually produces: markdown fences,
    chatty text around the object, and trailing commas.
    """
    if not raw or not raw.strip():
        raise JSONRecoveryError("Model returned an empty response.")

    stripped = _strip_fences(raw).strip()
    candidates: list[str] = [stripped]

    balanced = _balanced_slice(stripped)
    if balanced:
        # Ordered cheapest-repair first, so a well-formed response is never
        # altered unnecessarily.
        cleaned = _remove_trailing_commas(balanced)
        candidates += [
            balanced,
            cleaned,
            _escape_control_chars(cleaned),
            _remove_trailing_commas(_escape_control_chars(balanced)),
        ]

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
        except (json.JSONDecodeError, ValueError):
            continue
        if isinstance(parsed, dict):
            return parsed

    raise JSONRecoveryError("Could not recover a JSON object from the model response.")
