from __future__ import annotations

from typing import Any


def _complexity_rank(symbol: str) -> int:
    order = {
        "O(1)": 0,
        "O(log n)": 1,
        "O(n)": 2,
        "O(n log n)": 3,
        "O(n^2)": 4,
        "O(2^n)": 5,
    }
    return order.get(symbol, 2)


def infer_complexity(parsed: dict[str, Any]) -> dict[str, Any]:
    loops = [node for node in parsed["nodes"] if node["type"] == "loop"]
    calls = parsed["calls"]
    recursion = parsed["recursion_candidates"]
    explanations: list[str] = []
    evidence_lines: list[int] = []
    confidence = 0.72
    time_complexity = "O(1)"
    space_complexity = "O(1)"

    nested_loops = [loop for loop in loops if loop.get("nested")]
    if loops:
        time_complexity = "O(n)"
        confidence += 0.08
        evidence_lines.extend(loop["line"] for loop in loops if loop.get("line"))
        explanations.append("Linear iteration detected.")
    if nested_loops:
        time_complexity = "O(n^2)"
        confidence += 0.08
        explanations.append("Nested iteration detected, increasing growth quadratically.")
    if any(call["function"] == "sorted" for call in calls):
        time_complexity = "O(n log n)" if _complexity_rank(time_complexity) < _complexity_rank("O(n log n)") else time_complexity
        explanations.append("Sorting call detected, implying n log n behavior.")
    if recursion:
        evidence_lines.extend(candidate["line"] for candidate in recursion if candidate.get("line"))
        if len(recursion) > 1:
            time_complexity = "O(2^n)"
            space_complexity = "O(n)"
            explanations.append("Branching recursion suggests exponential growth.")
            confidence += 0.05
        else:
            if _complexity_rank(time_complexity) < _complexity_rank("O(n)"):
                time_complexity = "O(n)"
            space_complexity = "O(n)"
            explanations.append("Recursion requires stack space proportional to depth.")

    if any(call["function"] in {"append", "extend"} and call["in_loop"] for call in calls):
        if space_complexity == "O(1)":
            space_complexity = "O(n)"
        explanations.append("Collection growth inside iteration suggests linear space usage.")
    if any(call["function"] in {"set", "dict"} for call in calls):
        explanations.append("Hash-backed structures detected, improving lookup efficiency in some paths.")

    confidence = max(0.2, min(0.97, confidence))
    evidence_lines = sorted({line for line in evidence_lines if isinstance(line, int)})

    return {
        "time": time_complexity,
        "space": space_complexity,
        "confidence": round(confidence, 2),
        "evidence_lines": evidence_lines,
        "explanation": " ".join(explanations) or "No dominant growth pattern detected; defaulting to constant-time estimate.",
    }
