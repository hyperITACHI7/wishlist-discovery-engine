"""Shared parser for the synthesis LLM's phrase_ids field.

Used by both extraction/synthesize.py (progress reporting) and
extraction/score.py (matching phrases back to themes). The prompt asks for
a comma-separated string (e.g. "1, 4, 9") rather than a JSON array,
specifically because JSON arrays of bare numbers proved unreliable in
practice (confirmed 2026-08-19: the model ran digits together with no
separators, producing a single mangled number/string instead of a valid
array). This still handles a real list defensively in case the model
ignores the instruction.
"""


def parse_phrase_ids(raw) -> list[int]:
    if raw is None:
        return []
    if isinstance(raw, list):
        out = []
        for item in raw:
            try:
                out.append(int(item))
            except (TypeError, ValueError):
                continue
        return out
    if isinstance(raw, (int, float)):
        return [int(raw)]
    if isinstance(raw, str):
        import re

        parts = re.split(r"[,\s]+", raw.strip())
        return [int(part) for part in parts if part.isdigit()]
    return []
