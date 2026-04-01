from __future__ import annotations

from collections import defaultdict
from typing import Any


def compute_hotspots(parsed: dict[str, Any]) -> list[dict[str, Any]]:
    scores: dict[int, float] = defaultdict(float)
    reasons: dict[int, list[str]] = defaultdict(list)

    for node in parsed["nodes"]:
        line = node.get("line")
        if not line:
            continue
        if node["type"] == "loop":
            scores[line] += 0.35 + (0.2 if node.get("nested") else 0.0)
            reasons[line].append("Loop iteration cost")
        elif node["type"] == "call":
            scores[line] += 0.12 + (0.12 if node.get("in_loop") else 0.0)
            reasons[line].append("Function call overhead")
        elif node["type"] == "assignment":
            scores[line] += 0.05
        elif node["type"] == "branch":
            scores[line] += 0.08
            reasons[line].append("Branch decision")

    for call in parsed["calls"]:
        line = call.get("line")
        if not line:
            continue
        if call["function"] in {"sorted", "sort"}:
            scores[line] += 0.3
            reasons[line].append("Sorting operation")
        if call["function"] in {"append", "extend"} and call["in_loop"]:
            scores[line] += 0.1
            reasons[line].append("Repeated allocation")

    hotspots = [
        {
            "line": line,
            "score": round(min(score, 1.0), 2),
            "reason": ", ".join(sorted(set(reasons[line]))) or "General execution cost",
        }
        for line, score in scores.items()
    ]
    hotspots.sort(key=lambda item: item["score"], reverse=True)
    return hotspots[:8]
