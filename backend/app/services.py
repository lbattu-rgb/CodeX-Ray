from __future__ import annotations

import hashlib
from typing import Any

from app.engines.complexity import infer_complexity
from app.engines.dna import build_dna
from app.engines.explanation import build_explanations
from app.engines.hotspot import compute_hotspots
from app.engines.optimization import generate_suggestions
from app.engines.parser import parse_source
from app.engines.simulation import build_simulation
from app.engines.trace_engine import generate_trace


def build_analysis(source: str, entry_function: str | None, args: list[Any] | None = None, kwargs: dict[str, Any] | None = None) -> dict[str, Any]:
    args = args or []
    kwargs = kwargs or {}

    parsed = parse_source(source)
    complexity = infer_complexity(parsed)
    hotspots = compute_hotspots(parsed)
    suggestions = generate_suggestions(parsed)
    dna = build_dna(parsed, complexity)

    analysis = {
        "session_id": hashlib.sha1(source.encode("utf-8")).hexdigest()[:12],
        "language": "python",
        "entry_function": entry_function,
        "functions": parsed["functions"],
        "nodes": parsed["nodes"],
        "cfg": parsed["cfg"],
        "calls": parsed["calls"],
        "recursion_candidates": parsed["recursion_candidates"],
        "data_dependencies": parsed["data_dependencies"],
        "complexity": complexity,
        "hotspots": hotspots,
        "dna": dna,
        "suggestions": suggestions,
    }
    analysis["simulation"] = build_simulation(analysis)
    analysis["explanations"] = build_explanations(analysis)
    if entry_function:
        analysis["trace_preview"] = generate_trace(source, entry_function, args, kwargs)
    else:
        analysis["trace_preview"] = {"events": [], "result": None, "truncated": False}
    return analysis


def build_comparison(left: dict[str, Any], right: dict[str, Any]) -> dict[str, Any]:
    verdicts: list[str] = []

    left_time = left["complexity"]["time"]
    right_time = right["complexity"]["time"]
    left_confidence = left["complexity"]["confidence"]
    right_confidence = right["complexity"]["confidence"]

    if left_time != right_time:
        verdicts.append(f"Left implementation is predicted at {left_time}; right implementation is predicted at {right_time}.")
    else:
        verdicts.append(f"Both implementations are predicted at {left_time} time complexity.")

    if left["simulation"]["runtime_estimated_ms"][-1] < right["simulation"]["runtime_estimated_ms"][-1]:
        verdicts.append("Left implementation is projected to scale better at larger input sizes.")
    elif left["simulation"]["runtime_estimated_ms"][-1] > right["simulation"]["runtime_estimated_ms"][-1]:
        verdicts.append("Right implementation is projected to scale better at larger input sizes.")

    if left["complexity"]["space"] != right["complexity"]["space"]:
        verdicts.append(
            f"Space usage differs: left is {left['complexity']['space']} while right is {right['complexity']['space']}."
        )

    verdicts.append(
        f"Confidence scores are {int(left_confidence * 100)}% for left and {int(right_confidence * 100)}% for right."
    )

    return {
        "left": left,
        "right": right,
        "summary": " ".join(verdicts),
    }
