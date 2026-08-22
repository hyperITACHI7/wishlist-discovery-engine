"""JSONL read/write + dedup helpers shared by every collector."""

import json
from pathlib import Path
from typing import Iterable, Iterator


def append_jsonl(path: Path, records: Iterable[dict]) -> int:
    """Append records to a JSONL file, skipping ones whose source_url is
    already present. Returns the count actually written."""
    existing_urls = _existing_urls(path)
    written = 0
    with path.open("a", encoding="utf-8") as f:
        for record in records:
            url = record.get("source_url")
            if url and url in existing_urls:
                continue
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            if url:
                existing_urls.add(url)
            written += 1
    return written


def read_jsonl(path: Path) -> Iterator[dict]:
    if not path.exists():
        return
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                yield json.loads(line)


def _existing_urls(path: Path) -> set[str]:
    urls: set[str] = set()
    for record in read_jsonl(path):
        url = record.get("source_url")
        if url:
            urls.add(url)
    return urls


def count_jsonl(path: Path) -> int:
    return sum(1 for _ in read_jsonl(path))
