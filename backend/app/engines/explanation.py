from __future__ import annotations

from typing import Any


def build_explanations(analysis: dict[str, Any]) -> dict[str, str]:
    complexity = analysis["complexity"]
    top_hotspot = analysis["hotspots"][0] if analysis["hotspots"] else None
    suggestions = analysis["suggestions"]

    concise = [
        f"This code is predicted to run in {complexity['time']} time and {complexity['space']} space.",
        f"Confidence is {int(complexity['confidence'] * 100)}% based on visible structure.",
    ]
    if top_hotspot:
        concise.append(f"Line {top_hotspot['line']} is the main hotspot because of {top_hotspot['reason'].lower()}.")
    if suggestions:
        concise.append(f"Top optimization opportunity: {suggestions[0]['title'].lower()}.")

    teaching = [
        "AlgoScope reads the program structure first, then estimates how much work grows as the input grows.",
        complexity["explanation"],
    ]
    if top_hotspot:
        teaching.append(
            f"The strongest bottleneck appears around line {top_hotspot['line']}, where the engine detected {top_hotspot['reason'].lower()}."
        )
    if suggestions:
        teaching.append(
            f"A meaningful improvement would be to {suggestions[0]['title'].lower()}, which matters because {suggestions[0]['why'].lower()}"
        )

    return {
        "concise": " ".join(concise),
        "teaching": " ".join(teaching),
    }
