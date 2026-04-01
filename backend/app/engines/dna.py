from __future__ import annotations

from typing import Any


def _level(value: float) -> str:
    if value < 0.34:
        return "low"
    if value < 0.67:
        return "medium"
    return "high"


def build_dna(parsed: dict[str, Any], complexity: dict[str, Any]) -> dict[str, str]:
    loops = [node for node in parsed["nodes"] if node["type"] == "loop"]
    recursion = parsed["recursion_candidates"]
    calls = parsed["calls"]

    iteration_score = min(1.0, 0.2 + 0.25 * len(loops))
    branching_score = min(1.0, 0.2 + 0.15 * len([node for node in parsed["nodes"] if node["type"] == "branch"]))
    recursion_score = min(1.0, 0.3 * len(recursion))
    allocation_score = min(1.0, 0.2 + 0.15 * len([call for call in calls if call["function"] in {"append", "extend", "dict", "set"}]))
    lookup_score = 0.75 if any(call["function"] in {"dict", "set"} for call in calls) else 0.3
    parallel_score = 0.35 if recursion else 0.7 if len(loops) <= 1 else 0.45
    memory_score = 0.7 if complexity["space"] in {"O(n)", "O(n^2)"} else 0.25
    mutation_score = min(1.0, 0.15 * len([node for node in parsed["nodes"] if "assignment" in node["type"]]))
    sensitivity_score = 0.8 if complexity["time"] in {"O(n^2)", "O(2^n)"} else 0.45

    return {
        "iteration_intensity": _level(iteration_score),
        "recursion_depth_tendency": _level(recursion_score),
        "branching_factor": _level(branching_score),
        "memory_growth_pattern": _level(memory_score),
        "lookup_efficiency": _level(lookup_score),
        "allocation_frequency": _level(allocation_score),
        "mutation_intensity": _level(mutation_score),
        "parallelization_potential": _level(parallel_score),
        "input_sensitivity": _level(sensitivity_score),
    }
