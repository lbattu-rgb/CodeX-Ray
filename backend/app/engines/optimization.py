from __future__ import annotations

from typing import Any


def generate_suggestions(parsed: dict[str, Any]) -> list[dict[str, Any]]:
    suggestions: list[dict[str, Any]] = []

    for call in parsed["calls"]:
        if call["function"] == "sorted" and call["in_loop"]:
            suggestions.append(
                {
                    "title": "Move sorting out of the loop",
                    "line": call["line"],
                    "why": "Sorting repeatedly inside iteration can dominate runtime.",
                    "impact": "May reduce repeated O(n log n) work.",
                    "rewrite_hint": "Sort once before the loop or keep data ordered incrementally.",
                }
            )

    for node in parsed["nodes"]:
        if node["type"] == "loop" and node.get("nested"):
            suggestions.append(
                {
                    "title": "Reduce nested loop pressure",
                    "line": node["line"],
                    "why": "Nested iteration often causes quadratic growth.",
                    "impact": "Large inputs may slow down dramatically.",
                    "rewrite_hint": "Consider hashing, precomputation, or divide-and-conquer strategies.",
                }
            )

    list_membership_lines = {
        call["line"]
        for call in parsed["calls"]
        if call["function"] in {"list", "in"} and call["in_loop"]
    }
    for line in sorted(list_membership_lines):
        suggestions.append(
            {
                "title": "Use hash-based membership checks",
                "line": line,
                "why": "Repeated list membership checks can be linear each time.",
                "impact": "Replacing with a set or dict may lower repeated lookup cost.",
                "rewrite_hint": "Convert the collection to a set before the loop when possible.",
            }
        )

    unique: list[dict[str, Any]] = []
    seen: set[tuple[str, int]] = set()
    for suggestion in suggestions:
        key = (suggestion["title"], suggestion["line"])
        if key not in seen:
            seen.add(key)
            unique.append(suggestion)
    return unique[:6]
