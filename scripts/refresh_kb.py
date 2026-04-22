#!/usr/bin/env python3
"""Refresh local clinic knowledge data from https://easymycareclinic.com/."""

from __future__ import annotations

import json
import re
import urllib.request
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
KB_PATH = REPO_ROOT / "data" / "clinic_knowledge.json"
SOURCE_URL = "https://easymycareclinic.com/"


def fetch_html(url: str) -> str:
    with urllib.request.urlopen(url, timeout=20) as response:
        return response.read().decode("utf-8", errors="ignore")


def refresh_metadata() -> None:
    data = json.loads(KB_PATH.read_text(encoding="utf-8"))

    html = fetch_html(SOURCE_URL)
    text = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).lower()

    service_terms = [
        "hypertension",
        "diabetes",
        "weight",
        "heart",
        "ecg",
        "tmt",
        "pft",
        "abpm",
        "lab",
        "pharmacy",
    ]

    detected_terms = [term for term in service_terms if term in text]
    data["source"]["updated_at"] = str(date.today())
    data["source"]["notes_en"] = (
        "Refreshed from website. Detected service terms: "
        + ", ".join(detected_terms or ["none detected - review manually"])
    )
    data["source"]["notes_hi"] = "वेबसाइट से रिफ्रेश किया गया; कृपया सेवाओं की मैन्युअल पुष्टि भी करें।"

    KB_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    refresh_metadata()
    print(f"Knowledge base refreshed: {KB_PATH}")
