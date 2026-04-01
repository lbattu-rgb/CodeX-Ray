from __future__ import annotations

import math
from typing import Any


def _growth_value(n: int, complexity: str) -> float:
    if complexity == "O(1)":
        return 1
    if complexity == "O(log n)":
        return math.log2(max(n, 2))
    if complexity == "O(n)":
        return n
    if complexity == "O(n log n)":
        return n * math.log2(max(n, 2))
    if complexity == "O(n^2)":
        return n * n
    if complexity == "O(2^n)":
        # Clamp for display sanity.
        return min(2 ** min(n, 20), 2 ** 20)
    return n


def build_simulation(analysis: dict[str, Any], min_n: int = 10, max_n: int = 10000, points: int = 6) -> dict[str, Any]:
    if points < 2:
        points = 2
    if min_n < 1:
        min_n = 1
    if max_n <= min_n:
        max_n = min_n * 10

    ratio = (max_n / min_n) ** (1 / (points - 1))
    n_values = []
    current = float(min_n)
    for _ in range(points):
        n_values.append(max(1, int(round(current))))
        current *= ratio
    n_values = sorted(set(n_values))

    time_complexity = analysis["complexity"]["time"]
    space_complexity = analysis["complexity"]["space"]
    hotspot_bias = 1 + sum(item["score"] for item in analysis.get("hotspots", [])[:3])

    runtime_series = []
    memory_series = []
    for n in n_values:
        runtime_units = _growth_value(n, time_complexity) * hotspot_bias
        memory_units = _growth_value(n, space_complexity) * 0.2
        runtime_series.append(round(runtime_units / 100, 3))
        memory_series.append(round(memory_units / 10, 3))

    return {
        "n_values": n_values,
        "runtime_estimated_ms": runtime_series,
        "memory_estimated_kb": memory_series,
        "classification": "estimated",
    }
